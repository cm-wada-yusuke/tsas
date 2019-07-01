import * as SSM from 'aws-sdk/clients/ssm';
import { GetParametersByPathRequest, Parameter } from 'aws-sdk/clients/ssm';
import { ISystemParameter, SYSTEM_PARAMETERS } from '../../constant';
import * as jsyaml from 'js-yaml';

export class SsmPower {

    private readonly ssm: SSM;

    constructor(ssm: SSM) {
        this.ssm = ssm;
    }

    public async generateCfnParameterSectionYaml(searchBasePath: string): Promise<string> {
        const cfnParameters = await this.generateCfnParameterSection(searchBasePath);
        const outData = jsyaml.safeDump(cfnParameters);
        return outData;
    }

    public async generateCfnParameterSection(searchBasePath: string): Promise<ICfnParameterSection> {

        // Get CFn base data array from file.
        const systemParameters = SYSTEM_PARAMETERS;

        // Get CFn base data array from ssm(parameter storeForAvailableMissions).
        const ssmParameters = await this.getSsmParameters(searchBasePath);

        // convert Cfn base data to common Key-Value data.
        const cfnParametersFromFile: ICfnKeyValue[] = systemParameters.map(this.convertSystemParameterToCfnParameter);
        const cfnParametersFromSsm: ICfnKeyValue[] = ssmParameters.map(this.convertSsmParameterToCfnParameter);
        const cfnParameters: ICfnParameterSection = {
            Parameters:
                cfnParametersFromFile.concat(cfnParametersFromSsm).reduce((map: ICfnParameter, obj) => {
                    map[obj.Key] = obj.Value;
                    return map;
                }, {}),
        };
        return cfnParameters;
    }

    private async getSsmParameters(searchBasePath: string): Promise<Parameter[]> {

        const parameters: GetParametersByPathRequest = {
            Path: searchBasePath,
            Recursive: true,
            WithDecryption: true,
            MaxResults: 2,
        };

        let result: Parameter[] = [];

        do {
            const response = await this.ssm.getParametersByPath(parameters).promise();
            parameters.NextToken = response.NextToken;
            if (response.Parameters) {
                result = result.concat(response.Parameters);
            }

        } while (parameters.NextToken);

        return result;

    }

    private convertSsmParameterToCfnParameter(p: Parameter): ICfnKeyValue {
        const parameterName = p.Name!.split('/').slice(-1)[0];
        return {
            Key: parameterName,
            Value: {
                Type: 'AWS::SSM::Parameter::Value<String>',
                Default: p.Name!,
            },
        };
    }


    private convertSystemParameterToCfnParameter(f: ISystemParameter): ICfnKeyValue {
        return {
            Key: f.Name,
            Value: {
                Type: 'String',
            },
        };
    }

}

interface ICfnKeyValue {
    Key: string;
    Value: {
        Type: string;
        Default?: string;
    };
}

interface ICfnParameter {
    [key: string]: {
        Type: string;
        Default?: string;
    };
}

export interface ICfnParameterSection {
    Parameters: ICfnParameter;
}

