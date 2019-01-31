import * as util from "util";
import * as fs from "fs";

export interface ISettings {
    nameSpace: string;
    appName: string;
    defaultRegion: string;
}

export class Settings {
    public static async load():Promise<ISettings> {
        const path = `tsas.config.json`;
        const jsonString: string = await util.promisify(fs.readFile)(path, 'utf8');
        return JSON.parse(jsonString);
    }
}
