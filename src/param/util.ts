import { Settings } from '../settings/settings-loader';

export class ParameterUtils {
    public static basePath(settings: Settings, env: string): string {
        return `/${settings.nameSpace}/${settings.appName}/${env}`;
    }
}
