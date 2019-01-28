import * as util from "util";
import * as fs from "fs";

export interface IEnvironmentVariables {
    Name: string;
    Value: string;
}

export class EnvironmentVariables {

    public static async load(env: string): Promise<IEnvironmentVariables[]> {
        const path = `environments/${env}/variables.json`;
        const jsonString: string = await util.promisify(fs.readFile)(path, 'utf8');
        return JSON.parse(jsonString);
    }
}


