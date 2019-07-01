import * as STS from 'aws-sdk/clients/sts';
import * as logging from '../../logging'

export class StsPower {

    private readonly sts: STS;

    constructor(sts: STS) {
        this.sts = sts;
    }

    public async getAccountId(): Promise<string> {
        const response = await this.sts.getCallerIdentity().promise();
        try {
            return response.Account!
        } catch (e) {
            logging.error('Maybe your security token is expired.', e);
            throw e;
        }
    }

}
