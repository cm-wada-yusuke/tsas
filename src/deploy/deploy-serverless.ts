import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import * as childProcess from 'child_process';
import * as logging from '../logging';
import { S3Power } from '../infrastructures/aws/s3-power';
import * as fs from 'fs';
import { CfnPower } from '../infrastructures/aws/cfn-power';
import { SsmPower } from '../infrastructures/aws/ssm-power';
import { ParameterUtils } from '../param/util';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';
import { DeployUtils } from './deploy-utils';
import colors = require('colors/safe');
import archiver = require('archiver');
import fsExtra = require('fs-extra');
import crypto = require('crypto');
import { StsPower } from '../infrastructures/aws/sts-power';

export class DeployServerless {

    settings: ISettings;
    option: IOption;
    awsHanger: AwsHangar;
    deployName: string = 'lambda';


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
    }

    public async execute() {

        const cfnPower = new CfnPower(this.awsHanger.cloudFormation());
        const s3Power = new S3Power(this.awsHanger.s3());
        const ssmPower = new SsmPower(this.awsHanger.ssm());
        const stsPower = new StsPower(this.awsHanger.sts());

        const deployBucketName = await DeployUtils.getDeployBukcetName(this.settings, this.option, stsPower);
        logging.print(colors.green(`Checking deploy bucket... ${deployBucketName}`));
        await s3Power.createDeployBucketIfNotExists(deployBucketName);


        logging.print(colors.green('1. Install package.json'));
        const npmInstallResult = await DeployServerlessUseCase.npmInstall();
        logging.print(colors.green(npmInstallResult));

        logging.print(colors.green('\n\n\n2. Build lambda functions.'));
        const buildResult = await DeployServerlessUseCase.build();
        logging.print(colors.green(buildResult));

        logging.print(colors.green('\n\n\n3. Bundle functions.'));
        // zip dist files.
        const output = await DeployServerlessUseCase.bundle();

        // generate cfn templates. search from
        const parameterSearchBasePath = ParameterUtils.basePath(this.settings, this.option.env);
        const parameterYaml: string = await ssmPower.generateCfnParameterSectionYaml(parameterSearchBasePath);
        DeployUtils.collectTemplates();
        await DeployUtils.mergeParametersToTemplates(parameterYaml);
        logging.print(colors.green('Bundle completed.'));

        logging.print(colors.green('\n\n\n4. Upload functions and templates.'));
        const hash = await DeployServerlessUseCase.hash(output);
        await DeployServerlessUseCase.uploadLambda(s3Power, deployBucketName, hash);
        await DeployUtils.uploadTemplates(s3Power, deployBucketName, hash);
        logging.print(colors.green('Upload completed.'));

        logging.print(colors.green('\n\n\n5. Deploy functions.'));
        const parameters = CfnPower.generateCfnParameter(this.settings, this.option, hash, deployBucketName);
        await DeployUtils.deploy(cfnPower, deployBucketName, this.option.env, this.settings.appName, this.deployName, hash, parameters);


        logging.print(colors.green('\n\n\nCleaning up...'));
        await DeployUtils.cleanup();
        logging.print(colors.green('\n\n\n✅ All done.'));


    }

}

class DeployServerlessUseCase {

    public static async npmInstall(): Promise<string> {
        return new Promise<string>((ok, fail) => {
            const p = childProcess.spawn('npm', ['install'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                detached: false.valueOf(),
                shell: true,
                env: {
                    ...process.env
                }
            });
            p.on('error', fail);
            p.on('exit', code => {
                if (code === 0) {
                    return ok('Install completed.');
                } else {
                    return fail(new Error(`Exit with error ${code}`))
                }
            });
        });
    }

    public static build(): Promise<string> {
        return new Promise<string>((ok, fail) => {
            const p = childProcess.spawn('npm', ['run', 'build'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                detached: false.valueOf(),
                shell: true,
                env: {
                    ...process.env
                }
            });
            p.on('error', fail);
            p.on('exit', code => {
                if (code === 0) {
                    return ok('Build completed.');
                } else {
                    return fail(new Error(`Exit with error ${code}`))
                }
            });
        });
    }

    public static bundle(): Promise<string> {
        return new Promise((resolve, reject) => {
            logging.print(colors.white('create zip...'));
            const deploy = './deploy';
            const dist = 'dist';
            fsExtra.mkdirsSync(deploy);
            const outPath = `./${deploy}/dist.zip`;
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', {zlib: {level: 9}});
            archive.pipe(output);
            archive.directory(dist, false);
            archive.finalize();

            output.on('close', () => resolve(outPath));
            archive.on('error', (err) => reject(err));
        });
    }

    public static hash(zipFilePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            logging.print(colors.white('calculate zip hash...'));
            const sha256 = crypto.createHash('sha256');
            const stream = fs.createReadStream(zipFilePath);
            stream.on('data', chunk => sha256.update(chunk));
            stream.on('close', () => resolve(sha256.digest('hex')));
            stream.on('error', (err) => reject(err));
        });

    }

    public static uploadLambda(s3Power: S3Power, bucketName: string, hash: string): Promise<any> {
        const lambda = './deploy/dist.zip';
        const key = `${hash}/dist.zip`;
        return s3Power.putFile(bucketName, lambda, key);
    }

}
