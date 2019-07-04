import 'source-map-support/register';
import { GreetingMessage, HelloWorldUseCase, User } from '../../domains/greeting/hello-world-use-case';

export async function handler(event: User): Promise<GreetingMessage> {
    return HelloWorldUseCase.hello(event);
}
