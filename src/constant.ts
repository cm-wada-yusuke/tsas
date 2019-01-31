declare const APP_NAME: string;
declare const VERSION: string;

const _APP_NAME = APP_NAME;
const _VERSION = VERSION;

export {_APP_NAME as APP_NAME};
export {_VERSION as VERSION};


const _SYSTEM_PARAMETERS: ISystemParameter[] = [
    {
        Name: 'ChangeSetHash'
    },
    {
        Name: 'AppName'
    },
    {
        Name: 'DeployBucketName'
    }
];

export {_SYSTEM_PARAMETERS as SYSTEM_PARAMETERS}

export interface ISystemParameter {
    Name: string;
}
