import { UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import * as uuid from 'uuid';
import * as AWS from 'aws-sdk';
import { GreetingMessage } from '../../domains/greeting/hello-world-use-case';

const EnvironmentVariableSample = process.env.GREETING_TABLE_NAME!;
const Region = process.env.REGION!;

const DYNAMO = new AWS.DynamoDB(
    {
        apiVersion: '2012-08-10',
        region: Region
    }
);

export class DynamodbGreetingTable {

    public static async greetingStore(greeting: GreetingMessage): Promise<void> {

        const params: UpdateItemInput = {
            TableName: EnvironmentVariableSample,
            Key: {greetingId: {S: uuid.v4()}},
            UpdateExpression: [
                'set title = :title',
                'description = :description'
            ].join(', '),
            ExpressionAttributeValues: {
                ':title': {S: greeting.title},
                ':description': {S: greeting.description}
            }
        };

        await DYNAMO.updateItem(params).promise()
    }

}


