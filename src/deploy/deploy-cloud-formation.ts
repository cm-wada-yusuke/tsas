import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import * as logging from '../logging';
import { S3Power } from './s3-power';
import { CfnPower } from './cfn/cfn-power';
import { SsmPower } from './ssm-power';
import { ParameterUtils } from '../param/util';
import { AwsHangar } from '../option/profile/aws-hangar';
import { DeployUtils } from './deploy-utils';
import colors = require('colors/safe');
import uuid = require('uuid');
import { debug } from '../logging';

export class DeployCloudFormation {

    settings: ISettings;
    option: IOption;
    deployBucketName: string;
    awsHanger: AwsHangar;
    deployName: string;


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.deployBucketName = `${settings.nameSpace}-${option.env}-${settings.appName}-deploy`;
        this.awsHanger = new AwsHangar(settings, option);
        this.deployName = option.cfnTemplateName!;
    }

    public async execute() {

        const cfnPower = new CfnPower(this.awsHanger.cloudFormation());
        const s3Power = new S3Power(this.awsHanger.s3());
        const ssmPower = new SsmPower(this.awsHanger.ssm());

        logging.print(colors.green('Check deploy bucket.'));
        await s3Power.createDeployBucketIfNotExists(this.deployBucketName);


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
        await DeployUtils.uploadTemplates(s3Power, this.deployBucketName, hash);
        logging.print(colors.green('Upload completed.'));

        logging.print(colors.green('\n\n\n3. Deploy aws resources.'));
        const parameters = CfnPower.generateCfnParameter(this.settings, this.option, hash, this.deployBucketName);
        await DeployUtils.deploy(cfnPower, this.deployBucketName, this.option.env, this.settings.appName, this.deployName, hash, parameters);


        logging.print(colors.green('\n\n\nCleaning up...'));
        await DeployUtils.cleanup();
        logging.print(colors.green('\n\n\n✅ All done.'));

    }

}
