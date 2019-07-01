import * as AWS from 'aws-sdk';
import { GetParametersByPathRequest, Parameter } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import { ParameterUtils } from './util';
import * as SSM from 'aws-sdk/clients/ssm';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';

export class ListParameters {

    settings: ISettings;
    option: IOption;
    awsHanger: AwsHangar;

    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(this.settings, this.option.env);
        const result = await ListParametersUseCase.getParameters(this.awsHanger.ssm(), basePath);
        console.log(result);
        console.log(this.option);
    }

}

export class ListParametersUseCase {

    public static async getParameters(ssm: SSM, basePath: string): Promise<Parameter[]> {

        const parameters: GetParametersByPathRequest = {
            Path: basePath,
            Recursive: true,
            WithDecryption: true,
            MaxResults: 2,
        };
        let result: Parameter[] = [];
        do {
            const response = await ssm.getParametersByPath(parameters).promise();
            parameters.NextToken = response.NextToken;
            if (response.Parameters) {
                result = result.concat(response.Parameters);
            }

        } while (parameters.NextToken);

        return result;
    }
}



