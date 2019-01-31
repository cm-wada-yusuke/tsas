import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import * as childProcess from 'child_process';
import * as logging from '../logging';
import { S3Power } from './s3-power';
import * as fs from 'fs';
import { CfnPower } from './cfn/cfn-power';
import colors = require('colors/safe');
import archiver = require('archiver');
import fsExtra = require('fs-extra');

export class DeployServerless {

    settings: ISettings;
    option: IOption;
    deployBucketName: string;

    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.deployBucketName = `${settings.nameSpace}-${option.env}-${settings.appName}-deploy`;
    }

    public async execute() {
        // logging.print(colors.green('Check deploy bucket.'));
        // await deployPower.createDeployBucketIfNotExists();
        //
        //
        // logging.print(colors.green('1. Install package.json'));
        // const npmInstallResult = await DeployServerlessUseCase.npmInstall();
        // logging.print(colors.green(npmInstallResult));
        //
        // logging.print(colors.green('\n\n\n2. Build lambda functions.'));
        // const buildResult = await DeployServerlessUseCase.build();
        // logging.print(colors.green(buildResult));
        //
        //
        logging.print(colors.green('\n\n\n3. Bundle functions.'));
        await DeployServerlessUseCase.bundle();
        DeployServerlessUseCase.collectTemplates();
        logging.print(colors.green('Bundle completed.'));

        logging.print(colors.green('\n\n\n4. Upload functions and templates.'));
        await DeployServerlessUseCase.uploadLambda(this.deployBucketName);
        await DeployServerlessUseCase.uploadTemplates(this.deployBucketName);
        logging.print(colors.green('Upload completed.'));

        await DeployServerlessUseCase.deploy(this.deployBucketName, this.settings, this.option);


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

    public static bundle(): Promise<any> {
        return new Promise((resolve, reject) => {
            logging.print(colors.white('create zip...'));
            const deploy = './deploy';
            const dist = 'dist';
            fsExtra.mkdirsSync(deploy);
            const output = fs.createWriteStream(`./${deploy}/dist.zip`);
            const archive = archiver('zip', {zlib: {level: 9}});
            archive.pipe(output);
            archive.directory(dist, false);
            archive.finalize();

            output.on('close', () => resolve(archive));
            archive.on('error', (err) => reject(err));
        });
    }

    public static collectTemplates(): void {
        logging.print(colors.white('collect templates...'));
        fsExtra.copySync('./templates', './deploy/templates');
    }

    public static uploadLambda(bucketName: string): Promise<any> {
        const lambda = './deploy/dist.zip';
        const key = 'test/dist.zip'; //TODO base key name
        return S3Power.putFile(bucketName, lambda, key);
    }

    public static uploadTemplates(bucketName: string): Promise<any> {
        const templatesDir = './deploy/templates';
        const keyBase = 'test'; //TODO base key name
        const puts = fs.readdirSync(templatesDir).map((yaml) => {
            const templateYaml = `${templatesDir}/${yaml}`;
            const s3Key = `${keyBase}/templates/${yaml}`;
            return S3Power.putFile(bucketName, templateYaml, s3Key);
        });
        return Promise.all(puts);
    }

    public static async deploy(bucketName: string, settings: ISettings, option: IOption): Promise<any> {
        const templateS3Url = `https://s3.amazonaws.com/${bucketName}/test/templates/lambda.yaml`;
        const stackName = `${option.env}-${settings.appName}-lambda-stack`;
        return CfnPower.deployStack(templateS3Url, stackName);
    }
}
