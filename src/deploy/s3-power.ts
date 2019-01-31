import * as AWS from 'aws-sdk';
import * as logging from '../logging';
import * as fs from 'fs';
import colors = require('colors/safe');

const S3 = new AWS.S3({
    region: 'ap-northeast-1' //TODO
});


export class S3Power {

    public static async createDeployBucketIfNotExists(deployBucketName: string) {
        const exists = await this.checkDeployBucketExists(deployBucketName);
        if (exists) {
            logging.print(colors.green(`Deploy bucket: ${deployBucketName} is already exists. Skip creating...`));
        } else {
            logging.print(colors.yellow(`Deploy bucket: ${deployBucketName} is not exists. creating...`));
            await this.createDeployBucket(deployBucketName);
        }


    }

    public static async putFile(deployBucketName: string, localFilePath: string, s3Key: string): Promise<any> {
        logging.print(colors.white('upload %s'), localFilePath);
        return S3.putObject({
            Bucket: deployBucketName,
            Key: s3Key,
            Body: fs.readFileSync(localFilePath)
        }).promise();
    }

    private static async checkDeployBucketExists(bucketName: string): Promise<boolean> {
        const result = S3.headBucket({
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

    private static async createDeployBucket(bucketName: string) {
        return S3.createBucket({
            Bucket: bucketName
        }).promise();
    }


}


