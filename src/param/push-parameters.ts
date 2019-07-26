import * as SSM from 'aws-sdk/clients/ssm';
import { PutParameterRequest } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { Settings } from '../settings/settings-loader';
import { EnvironmentVariables, IEnvironmentVariable } from '../settings/environment-variables';
import { ParameterUtils } from './util';
import { ListParametersUseCase } from './list-parameters';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';

export class PushParameters {

    settings: Settings;
    option: IOption;
    awsHanger: AwsHangar;


    constructor(settings: Settings, option: IOption) {
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

    public static async push(ssm: SSM, basePath: string, variables: IEnvironmentVariable[]): Promise<any[]> {

        const promise: Promise<any>[] = variables.map((p: IEnvironmentVariable) => {
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
