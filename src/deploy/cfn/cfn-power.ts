import { debug, print } from '../../logging';
import { describeStack, stackExists, stackFailedCreating, waitForChangeSet, waitForStack } from './cfn';
import { CreateChangeSetInput, Parameters } from 'aws-sdk/clients/cloudformation';
import { ISettings } from '../../settings/settings';
import { IOption } from '../../option/option';
import colors = require('colors/safe');
import uuid = require('uuid');
import CloudFormation = require('aws-sdk/clients/cloudformation');

export class CfnPower {

    private readonly cfn: CloudFormation;

    constructor(cfn: CloudFormation) {
        this.cfn = cfn;
    }

    public async deployStack(templateS3Url: string, deployName: string, parameters: Parameters): Promise<any> {
        const executionId = `${deployName}-${uuid.v4()}`;

        if (await stackFailedCreating(this.cfn, deployName)) {
            debug(`Found existing stack ${deployName} that had previously failed creation. Deleting it before attempting to re-create it.`);
            await this.cfn.deleteStack({StackName: deployName}).promise();
            const deletedStack = await waitForStack(this.cfn, deployName, false);
            if (deletedStack && deletedStack.StackStatus !== 'DELETE_COMPLETE') {
                throw new Error(`Failed deleting stack ${deployName} that had previously failed creation (current state: ${deletedStack.StackStatus})`);
            }
        }

        const update = await stackExists(this.cfn, deployName);

        const changeSetName = `${executionId}`;
        debug(`Attempting to create ChangeSet ${changeSetName} to ${update ? 'update' : 'create'} stack ${deployName}`);
        print(`%s: creating CloudFormation changeset...`, colors.bold(deployName));
        const changeSetInput: CreateChangeSetInput = {
            StackName: deployName,
            ChangeSetName: changeSetName,
            ChangeSetType: update ? 'UPDATE' : 'CREATE',
            Description: `Changeset for execution ${executionId}`,
            TemplateURL: templateS3Url,
            Parameters: parameters,
            Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
        };
        debug('changeSetInput:', JSON.stringify(changeSetInput));

        const changeSet = await this.cfn.createChangeSet(changeSetInput).promise();

        debug('Initiated creation of changeset: %s; waiting for it to finish creating...', changeSet.Id);

        const changeSetDescription = await waitForChangeSet(this.cfn, deployName, changeSetName);
        if (!changeSetDescription || !changeSetDescription.Changes || changeSetDescription.Changes.length === 0) {
            print('No changes are to be performed on %s, assuming success.', deployName);
            await this.cfn.deleteChangeSet({StackName: deployName, ChangeSetName: changeSetName}).promise();
            return {noOp: true, outputs: await this.getStackOutputs(this.cfn, deployName), stackArn: changeSet.StackId!};
        }

        print('Initiating execution of changeset %s on stack %s', changeSetName, deployName);
        await this.cfn.executeChangeSet({StackName: deployName, ChangeSetName: changeSetName}).promise();
        print('Execution of changeset %s on stack %s has started; waiting for the update to complete...', changeSetName, deployName);
        await waitForStack(this.cfn, deployName);
        print(colors.green('Stack %s has completed updating'), deployName);
        return {noOp: false, outputs: await this.getStackOutputs(this.cfn, deployName), stackArn: changeSet.StackId!};
    }

    private async getStackOutputs(cfn: CloudFormation, stackName: string): Promise<{ [name: string]: string }> {
        const description = await describeStack(cfn, stackName);
        const result: { [name: string]: string } = {};
        if (description && description.Outputs) {
            description.Outputs.forEach(output => {
                result[output.OutputKey!] = output.OutputValue!;
            });
        }
        return result;
    }

    public static generateCfnParameter(settings: ISettings, options: IOption, changeHash: string, deployBucketName: string): Parameters {
        return [
            {
                ParameterKey: 'ChangeSetHash',
                ParameterValue: changeHash
            },
            {
                ParameterKey: 'AppName',
                ParameterValue: settings.appName
            },
            {
                ParameterKey: 'DeployBucketName',
                ParameterValue: deployBucketName
            },
            {
                ParameterKey: 'NameSpace',
                ParameterValue: settings.nameSpace
            }
        ];
    }
}
