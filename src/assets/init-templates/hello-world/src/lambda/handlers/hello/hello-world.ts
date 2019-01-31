import 'source-map-support/register';

const EnvironmentVariableSample = process.env.GREET_TABLE_NAME!;

exports.handler = async (event: any) => {
    return HelloWorldController.hello(event);
};

export class HelloWorldController {

    public static hello(payload: any): Promise<IGreet> {
        console.log(payload);
        return Promise.resolve(this.createMessage())
    }

    private static createMessage(): IGreet {
        return {
            title: 'hello, lambda!',
            description: 'my first message.',
            greetTableName: EnvironmentVariableSample
        }
    }
}

export interface IGreet {
    title: string;
    description: string;
    greetTableName: string;
}
