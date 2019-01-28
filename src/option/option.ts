export interface IOption {
    e: string;
    env: string;
}

export class OptionParser {
    public static parse(args: any): IOption {
        return {
            e: args.e,
            env: args.env
        }
    }
}
