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

exports.handler = async (event: User) => {
    return HelloWorldUseCase.hello(event);
};

export class HelloWorldUseCase {

    public static hello(userInfo: User): Promise<void> {
        console.log(userInfo);
        return GreetingDynamodbTable.greetingStore(HelloWorldUseCase.createMessage(userInfo));
    }

    static createMessage(userInfo: User): GreetingMessage {
        return {
            title: `hello, ${userInfo.name}`,
            description: 'my first message.',
        }
    }
}

class GreetingDynamodbTable {

    public static async greetingStore(greeting:GreetingMessage): Promise<void> {

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

export interface User {
    name: string;
}

export interface GreetingMessage {
    title: string;
    description: string;
}
