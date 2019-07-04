import { DynamodbGreetingTable } from '../../infrastructures/dynamo/dynamodb-greeting-table';

export class HelloWorldUseCase {

    public static async hello(userInfo: User): Promise<GreetingMessage> {
        console.log(userInfo);
        const message = HelloWorldUseCase.createMessage(userInfo);
        await DynamodbGreetingTable.greetingStore(message);
        return message;
    }

    private static createMessage(userInfo: User): GreetingMessage {
        return {
            title: `hello, ${userInfo.name}`,
            description: 'my first message.',
        }
    }
}


export interface User {
    name: string;
}

export interface GreetingMessage {
    title: string;
    description: string;
}
