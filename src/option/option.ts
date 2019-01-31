export interface IOption {
    e: string;
    env: string;
    region?: string;
}

export class OptionParser {
    public static parse(args: any): IOption {
        return {
            e: args.e,
            env: args.env,
            region: args.region
        }
    }
}
