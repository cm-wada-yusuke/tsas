import { debug, error, print } from '../../logging';
import { describeStack, stackExists, stackFailedCreating, waitForChangeSet, waitForStack } from './cfn';
import * as AWS from 'aws-sdk';

import colors = require('colors/safe');
import uuid = require('uuid');
import CloudFormation = require('aws-sdk/clients/cloudformation');
import { CreateChangeSetInput } from 'aws-sdk/clients/cloudformation';

const cfn = new AWS.CloudFormation(
    {
        apiVersion: '2010-05-15',
        region: 'ap-northeast-1' //TODO
    }
);

export class CfnPower {

    public static async deployStack(templateS3Url:string, deployName: string): Promise<any> {
        const executionId = `${deployName}-${uuid.v4()}`;

        if (await stackFailedCreating(cfn, deployName)) {
            debug(`Found existing stack ${deployName} that had previously failed creation. Deleting it before attempting to re-create it.`);
            await cfn.deleteStack({StackName: deployName}).promise();
            const deletedStack = await waitForStack(cfn, deployName, false);
            if (deletedStack && deletedStack.StackStatus !== 'DELETE_COMPLETE') {
                throw new Error(`Failed deleting stack ${deployName} that had previously failed creation (current state: ${deletedStack.StackStatus})`);
            }
        }

        const update = await stackExists(cfn, deployName);

        const changeSetName = `${executionId}`;
        debug(`Attempting to create ChangeSet ${changeSetName} to ${update ? 'update' : 'create'} stack ${deployName}`);
        print(`%s: creating CloudFormation changeset...`, colors.bold(deployName));
        const changeSetInput: CreateChangeSetInput = {
            StackName: deployName,
            ChangeSetName: changeSetName,
            ChangeSetType: update ? 'UPDATE' : 'CREATE',
            Description: `Changeset for execution ${executionId}`,
            TemplateURL: templateS3Url,
            Parameters: [],
            Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
        };
        console.log('changeSetInput:', changeSetInput);
        const changeSet = await cfn.createChangeSet(changeSetInput).promise();

        debug('Initiated creation of changeset: %s; waiting for it to finish creating...', changeSet.Id);
        const changeSetDescription = await waitForChangeSet(cfn, deployName, changeSetName);
        if (!changeSetDescription || !changeSetDescription.Changes || changeSetDescription.Changes.length === 0) {
            debug('No changes are to be performed on %s, assuming success.', deployName);
            await cfn.deleteChangeSet({StackName: deployName, ChangeSetName: changeSetName}).promise();
            return {noOp: true, outputs: await this.getStackOutputs(cfn, deployName), stackArn: changeSet.StackId!};
        }

        debug('Initiating execution of changeset %s on stack %s', changeSetName, deployName);
        await cfn.executeChangeSet({StackName: deployName, ChangeSetName: changeSetName}).promise();
        debug('Execution of changeset %s on stack %s has started; waiting for the update to complete...', changeSetName, deployName);
        await waitForStack(cfn, deployName);
        debug('Stack %s has completed updating', deployName);
        return {noOp: false, outputs: await this.getStackOutputs(cfn, deployName), stackArn: changeSet.StackId!};
    }

    private static async getStackOutputs(cfn: CloudFormation, stackName: string): Promise<{ [name: string]: string }> {
        const description = await describeStack(cfn, stackName);
        const result: { [name: string]: string } = {};
        if (description && description.Outputs) {
            description.Outputs.forEach(output => {
                result[output.OutputKey!] = output.OutputValue!;
            });
        }
        return result;
    }
}
