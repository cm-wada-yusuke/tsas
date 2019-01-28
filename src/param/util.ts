import { ISettings } from '../settings/settings';

export class ParameterUtils {
    public static basePath(settings: ISettings, env: string): string {
        return `/${settings.nameSpace}/${settings.appName}/${env}`;
    }
}
