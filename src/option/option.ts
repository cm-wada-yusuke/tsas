import * as logging from '../logging';

export interface IOption {
    e: string;
    env: string;
    region?: string;
    cfnTemplateName?: string;
    putIndividualParameterKey: string;
    putIndividualParameterValue: string;
}

export class OptionParser {
    public static parse(args: any): IOption {
        if(args.verbose) {
            logging.setVerbose();
        }

        return {
            e: args.e,
            env: args.env,
            region: args.region,
            cfnTemplateName: args.name,
            putIndividualParameterKey: args.putIndividualParameterKey,
            putIndividualParameterValue: args.putIndividualParameterValue,
        }
    }
}
