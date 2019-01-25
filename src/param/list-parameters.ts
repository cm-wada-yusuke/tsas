import { print } from '../logging';
import { GetParametersByPathRequest, Parameter } from 'aws-sdk/clients/ssm';
import { SDK, SDKOptions } from '../option/profile/sdk';
import { Mode } from '../option/profile/credentials';
import colors = require('colors/safe');
import SSM = require('aws-sdk/clients/ssm');

export class ListParameters {


    public async execute(args: any) {
        const sdkOptions: SDKOptions = {
            profile: 'cm-wada'
        };
        const ssm = await new SDK(sdkOptions).ssm(args.awsAccoundId, args.region, Mode.ForWriting);
        const result = await new ListParametersUseCase().getParameters(ssm);
        console.log(result);
    }

}

class ListParametersUseCase {

    public async getParameters(ssm: SSM): Promise<Parameter[]> {

        const parameters: GetParametersByPathRequest = {
            Path: `/itg/lambda`,
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



