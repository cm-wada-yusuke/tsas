import * as logging from '../logging';
import * as fs from 'fs';
import { S3Power } from '../infrastructures/aws/s3-power';
import { CfnPower } from '../infrastructures/aws/cfn-power';
import { Parameters } from 'aws-sdk/clients/cloudformation';
import fsExtra = require('fs-extra');
import { ISettings } from '../settings/settings';
import { IOption } from '../option/option';
import set = Reflect.set;
import { StsPower } from '../infrastructures/aws/sts-power';

const camelCase = require('camelcase');
const decamelize = require('decamelize');

export class DeployUtils {

    public static collectTemplates(): void {
        logging.print('collect templates...');
        fsExtra.copySync('./templates', './deploy/templates');
    }

    public static async mergeParametersToTemplates(parameterYaml: string): Promise<any> {
        const deployTemplatesDir = './deploy/templates';
        const merges = fs.readdirSync(deployTemplatesDir).map(async (yaml) => {
            const templateYaml = `${deployTemplatesDir}/${yaml}`;
            const appendData = '\n' + parameterYaml;
            logging.print(`parameter merged: ${templateYaml}`);
            return fsExtra.appendFile(templateYaml, appendData, {encoding: 'utf8'});
        });
        return Promise.all(merges);
    }

    public static uploadTemplates(s3Power: S3Power, bucketName: string, hash: string): Promise<any> {
        const templatesDir = './deploy/templates';
        const keyBase = hash;
        const puts = fs.readdirSync(templatesDir).map((yaml) => {
            const templateYaml = `${templatesDir}/${yaml}`;
            const s3Key = `${keyBase}/templates/${yaml}`;
            return s3Power.putFile(bucketName, templateYaml, s3Key);
        });
        return Promise.all(puts);
    }

    public static async deploy(cfnPower: CfnPower, bucketName: string, env: string, appName: string, deployName:string, hash: string, parameters: Parameters): Promise<any> {
        const templateS3Url = `https://s3.amazonaws.com/${bucketName}/${hash}/templates/${deployName}.yaml`;
        const deployStack = decamelize(camelCase(deployName), '-');
        const stackName = `${env}-${appName}-${deployStack}-stack`;
        return cfnPower.deployStack(templateS3Url, stackName, parameters);
    }

    public static async cleanup(): Promise<any> {
        const dist =  fsExtra.remove('./dist');
        const deploy = fsExtra.remove('./deploy');
        return Promise.all([dist, deploy]);
    }


    public static async getDeployBukcetName(settings: ISettings, option: IOption, stsPower: StsPower): Promise<string> {
        const region = option.region ? option.region : settings.defaultRegion;
        const accountId = await stsPower.getAccountId();
        return `${settings.nameSpace}-${option.env}-${settings.appName}-deploy-${region}-${accountId}`;
    }

}
