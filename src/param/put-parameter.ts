import * as SSM from 'aws-sdk/clients/ssm';
import { PutParameterRequest } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import { IEnvironmentVariable } from '../settings/environment-variables';
import { ParameterUtils } from './util';
import { ListParametersUseCase } from './list-parameters';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';

export class PutParameter {

    settings: ISettings;
    option: IOption;
    awsHanger: AwsHangar;
    key: string;
    value: string;


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
        console.log(option);
        this.key = option.putIndividualParameterKey!;
        this.value = option.putIndividualParameterValue!;
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(await this.settings, this.option.env);
        const variable: IEnvironmentVariable = {Name: this.key, Value: this.value};
        await PutParameterUseCase.put(this.awsHanger.ssm(), basePath, variable);
        const result = await ListParametersUseCase.getParameters(this.awsHanger.ssm(), basePath);
        console.log(result);
    }

}

class PutParameterUseCase {

    public static async put(ssm: SSM, basePath: string, variable: IEnvironmentVariable): Promise<any> {

        const putParameters: PutParameterRequest = {
            Name: `${basePath}/${variable.Name}`,
            Value: variable.Value,
            Type: 'String',
            Overwrite: true,
        };
        return ssm.putParameter(putParameters).promise();
    }

}
