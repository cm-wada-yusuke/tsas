import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import * as uuid from 'uuid';

const EnvironmentVariableSample = process.env.GREETING_TABLE_NAME!;
const Region = process.env.REGION!;

const DYNAMO = new AWS.DynamoDB(
    {
        apiVersion: '2012-08-10',
        region: Region
    }
);

exports.handler = async (event: any) => {
    return HelloWorldController.hello(event);
};

export class HelloWorldController {

    public static hello(payload: any): Promise<IGreeting> {
        console.log(payload);
        return GreetingDynamodbTable.greetingStore(this.createMessage());
    }

    private static createMessage(): IGreeting {
        return {
            title: 'hello, lambda!',
            description: 'my first message.',
        }
    }
}

class GreetingDynamodbTable {

    public static async greetingStore(greeting:IGreeting): Promise<any> {

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

        return DYNAMO.updateItem(params).promise()
    }

}

export interface IGreeting {
    title: string;
    description: string;
}
