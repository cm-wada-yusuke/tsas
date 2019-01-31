import * as logging from '../logging';
import * as fs from 'fs';
import colors = require('colors/safe');
import S3 = require('aws-sdk/clients/s3');


export class S3Power {

    private readonly s3: S3;

    constructor(s3: S3) {
        this.s3 = s3;
    }

    public async createDeployBucketIfNotExists(deployBucketName: string) {
        const exists = await this.checkDeployBucketExists(deployBucketName);
        if (exists) {
            logging.print(colors.green(`Deploy bucket: ${deployBucketName} is already exists. Skip creating...`));
        } else {
            logging.print(colors.yellow(`Deploy bucket: ${deployBucketName} is not exists. creating...`));
            await this.createDeployBucket(deployBucketName);
        }


    }

    public async putFile(deployBucketName: string, localFilePath: string, s3Key: string): Promise<any> {
        logging.print(colors.white('upload %s'), localFilePath);
        return this.s3.putObject({
            Bucket: deployBucketName,
            Key: s3Key,
            Body: fs.readFileSync(localFilePath)
        }).promise();
    }

    private async checkDeployBucketExists(bucketName: string): Promise<boolean> {
        const result = this.s3.headBucket({
            Bucket: bucketName
        }).promise();

        try {
            await result;
            return true;
        } catch (error) {
            if (error.statusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    private async createDeployBucket(bucketName: string) {
        return this.s3.createBucket({
            Bucket: bucketName
        }).promise();
    }


}


