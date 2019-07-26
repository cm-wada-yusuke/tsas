import * as util from 'util';
import * as fs from 'fs';

export interface Settings {
    nameSpace: string;
    appName: string;
    defaultRegion: string;
    version: string;
}

interface TsasConfig {
    nameSpace: string;
    appName: string;
    defaultRegion: string;
}

interface PackageConfig {
    version: string;
}

export class SettingsLoader {
    public static async load(): Promise<Settings> {
        const tsasConfig = await SettingsLoader.loadTsas();
        const packageConfig = await SettingsLoader.loadPackageJson();
        return {
            ...tsasConfig,
            ...packageConfig
        }
    }

    private static async loadTsas(): Promise<TsasConfig> {
        const path = `tsas.config.json`;
        const jsonString: string = await util.promisify(fs.readFile)(path, 'utf8');
        return JSON.parse(jsonString) as TsasConfig;
    }

    private static async loadPackageJson(): Promise<PackageConfig> {
        const path = `package.json`;
        const jsonString: string = await util.promisify(fs.readFile)(path, 'utf8');
        return JSON.parse(jsonString) as PackageConfig;
    }
}
