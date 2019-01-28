import * as AWS from 'aws-sdk';
import { GetParametersByPathRequest, Parameter } from 'aws-sdk/clients/ssm';
import { IOption } from '../option/option';
import { ISettings } from '../settings/settings';
import { ParameterUtils } from './util';

const SSM = new AWS.SSM({
    apiVersion: '2014-11-06',
    region: 'ap-northeast-1' //TODO
});

export class ListParameters {

    settings: ISettings;
    option: IOption;

    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(this.settings, this.option.env);
        const result = await ListParametersUseCase.getParameters(basePath);
        console.log(result);
        console.log(this.option);
    }

}

export class ListParametersUseCase {

    public static async getParameters(basePath: string): Promise<Parameter[]> {

        const parameters: GetParametersByPathRequest = {
            Path: basePath,
            Recursive: true,
            WithDecryption: true,
            MaxResults: 2,
        };
        let result: Parameter[] = [];
        do {
            const response = await SSM.getParametersByPath(parameters).promise();
            parameters.NextToken = response.NextToken;
            if (response.Parameters) {
                result = result.concat(response.Parameters);
            }

        } while (parameters.NextToken);

        return result;
    }
}



