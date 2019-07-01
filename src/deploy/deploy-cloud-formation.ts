import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import * as logging from '../logging';
import { S3Power } from '../infrastructures/aws/s3-power';
import { CfnPower } from '../infrastructures/aws/cfn-power';
import { SsmPower } from '../infrastructures/aws/ssm-power';
import { ParameterUtils } from '../param/util';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';
import { DeployUtils } from './deploy-utils';
import colors = require('colors/safe');
import uuid = require('uuid');
import { debug } from '../logging';
import { StsPower } from '../infrastructures/aws/sts-power';

export class DeployCloudFormation {

    settings: ISettings;
    option: IOption;
    awsHanger: AwsHangar;
    deployName: string;


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
        this.deployName = option.cfnTemplateName!;
    }

    public async execute() {

        const cfnPower = new CfnPower(this.awsHanger.cloudFormation());
        const s3Power = new S3Power(this.awsHanger.s3());
        const ssmPower = new SsmPower(this.awsHanger.ssm());
        const stsPower = new StsPower(this.awsHanger.sts());

        const deployBucketName = await DeployUtils.getDeployBukcetName(this.settings, this.option, stsPower);
        logging.print(colors.green(`Checking deploy bucket... ${deployBucketName}`));
        await s3Power.createDeployBucketIfNotExists(deployBucketName);

        logging.print(colors.green('\n\n\n1. Bundle templates.'));
        // generate cfn templates. search from ssm.
        const parameterSearchBasePath = ParameterUtils.basePath(this.settings, this.option.env);
        const parameterYaml: string = await ssmPower.generateCfnParameterSectionYaml(parameterSearchBasePath);
        debug(parameterYaml);
        DeployUtils.collectTemplates();
        await DeployUtils.mergeParametersToTemplates(parameterYaml);
        logging.print(colors.green('Bundle completed.'));

        logging.print(colors.green('\n\n\n2. Upload templates.'));
        const hash = uuid.v4();
        await DeployUtils.uploadTemplates(s3Power, deployBucketName, hash);
        logging.print(colors.green('Upload completed.'));

        logging.print(colors.green('\n\n\n3. Deploy aws resources.'));
        const parameters = CfnPower.generateCfnParameter(this.settings, this.option, hash, deployBucketName);
        await DeployUtils.deploy(cfnPower, deployBucketName, this.option.env, this.settings.appName, this.deployName, hash, parameters);


        logging.print(colors.green('\n\n\nCleaning up...'));
        await DeployUtils.cleanup();
        logging.print(colors.green('\n\n\n✅ All done.'));

    }

}
