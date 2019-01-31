import * as SSM from 'aws-sdk/clients/ssm';
import { PutParameterRequest } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import { EnvironmentVariables, IEnvironmentVariables } from '../settings/environment-variables';
import { ParameterUtils } from './util';
import { ListParametersUseCase } from './list-parameters';
import { AwsHangar } from '../option/profile/aws-hangar';

export class PushParameters {

    settings: ISettings;
    option: IOption;
    awsHanger: AwsHangar;


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(await this.settings, this.option.env);
        const variables = await EnvironmentVariables.load(this.option.env);
        await PushParametersUseCase.push(this.awsHanger.ssm(), basePath, variables);
        const result = await ListParametersUseCase.getParameters(this.awsHanger.ssm(), basePath);
        console.log(result);
    }

}

class PushParametersUseCase {

    public static async push(ssm: SSM, basePath: string, variables: IEnvironmentVariables[]): Promise<any[]> {

        const promise: Promise<any>[] = variables.map((p: IEnvironmentVariables) => {
            const putParameters: PutParameterRequest = {
                Name: `${basePath}/${p.Name}`,
                Value: p.Value,
                Type: 'String',
                Overwrite: true,
            };
            return ssm.putParameter(putParameters).promise();
        });
        return Promise.all(promise);
    }
}
