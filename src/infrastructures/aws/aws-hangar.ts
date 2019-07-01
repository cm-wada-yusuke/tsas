import { ISettings } from '../../settings/settings';
import { IOption } from '../../option/option';
import AWS = require('aws-sdk');
import * as CloudFormation from 'aws-sdk/clients/cloudformation';
import S3 = require('aws-sdk/clients/s3');
import SSM = require('aws-sdk/clients/ssm');
import * as STS from 'aws-sdk/clients/sts';

export class AwsHangar {


    private readonly settings: ISettings;
    private readonly option: IOption;
    private readonly region: string;


    constructor(settings: ISettings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.region = option.region ? option.region : settings.defaultRegion;
    }

    public cloudFormation(): CloudFormation {
        return new AWS.CloudFormation(
            {
                apiVersion: '2010-05-15',
                region: this.region
            }
        );
    }

    public s3(): S3 {
        return new AWS.S3(
            {
                apiVersion: '2006-03-01',
                region: this.region
            }
        );
    }

    public ssm(): SSM {
        return new AWS.SSM(
            {
                apiVersion: '2014-11-06',
                region: this.region
            }
        );
    }

    public sts(): STS {
        return new AWS.STS(
            {
                apiVersion: '2011-06-15',
                region: this.region
            }
        );
    }


}
