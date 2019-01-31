import * as AWS from 'aws-sdk';
import { PutParameterRequest } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { ISettings, Settings } from '../settings/settings';
import { EnvironmentVariables, IEnvironmentVariables } from '../settings/environment-variables';
import { ParameterUtils } from './util';
import { ListParametersUseCase } from './list-parameters';

const SSM = new AWS.SSM({
    apiVersion: '2014-11-06',
    region: 'ap-northeast-1' //TODO
});

export class PushParameters {

    settings: Promise<ISettings>;
    option: IOption;

    constructor(settings: ISettings, option: IOption) {
        this.settings = Settings.load();
        this.option = option;
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(await this.settings, this.option.env);
        const variables = await EnvironmentVariables.load(this.option.env);
        await PushParametersUseCase.push(basePath, variables);
        const result = await ListParametersUseCase.getParameters(basePath);
        console.log(result);
    }

}

class PushParametersUseCase {

    public static async push(basePath: string, variables: IEnvironmentVariables[]): Promise<any[]> {

        const promise: Promise<any>[] = variables.map((p: IEnvironmentVariables) => {
            const putParameters: PutParameterRequest = {
                Name: `${basePath}/${p.Name}`,
                Value: p.Value,
                Type: 'String',
                Overwrite: true,
            };
            return SSM.putParameter(putParameters).promise();
        });
        return Promise.all(promise);
    }
}
