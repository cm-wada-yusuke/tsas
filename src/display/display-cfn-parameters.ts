import { IOption } from '../option/option';
import { Settings } from '../settings/settings-loader';
import { AwsHangar } from '../infrastructures/aws/aws-hangar';
import { SsmPower } from '../infrastructures/aws/ssm-power';
import * as logging from '../logging';
import { ParameterUtils } from '../param/util';
import colors = require('colors/safe');

export class DisplayCfnParameters {

    settings: Settings;
    option: IOption;
    awsHanger: AwsHangar;

    constructor(settings: Settings, option: IOption) {
        this.settings = settings;
        this.option = option;
        this.awsHanger = new AwsHangar(settings, option);
    }

    public async execute() {
        const basePath = ParameterUtils.basePath(this.settings, this.option.env);
        const result = await DisplayCfnParametersUseCase.getParameters(new SsmPower(this.awsHanger.ssm()), basePath);
        logging.print(colors.bold('You don\'t need to write Parameter section in your templates/*.yaml. Deploy scripts will append Parameters to each automatically.'));
        console.log('\n');
        logging.print(colors.yellow(result));
    }

}

class DisplayCfnParametersUseCase {

    public static async getParameters(ssmPower: SsmPower, basePath: string): Promise<string> {
        return ssmPower.generateCfnParameterSectionYaml(basePath);
    }
}



