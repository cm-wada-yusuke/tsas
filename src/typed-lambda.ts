import 'source-map-support/register'
import yargs from 'yargs';
import { print, setVerbose } from './logging';
import { Init } from './init';
import { ListParameters } from './param/list-parameters';
import colors = require('colors/safe');
import { OptionParser } from './option/option';
import { ISettings, Settings } from './settings/settings';
import { PushParameters } from './param/push-parameters';

const CLI = 'tlam';

class TypedLambda {
    static async initCommandLine() {
        setVerbose();
        const settings = await this.loadSettingFile();
        TypedLambda.executeCommandLine(settings);
    }

    private static async loadSettingFile(): Promise<ISettings>{
        return Settings.load();
    }

    private static executeCommandLine(settings: ISettings) {
        return yargs
            .usage(`Usage: ${CLI} COMMAND`)
            .option('profile', {type: 'string', desc: 'Use the indicated AWS profile as the default environment'})
            .option('env', {type: 'string', alias: 'e', desc: 'Environment name; such as dev, stg, prod...'})
            .command({
                command: 'init',
                describe: 'Create a new, empty Typed Lambda project from a template.',
                handler: async (_) => new Init().execute()
            })
            .command({
                command: 'param',
                handler: (_) => print(colors.yellow(`usage: ${CLI} param <action> [options]`)),
                describe: 'Manage application parameters, [push|list]',
                builder: (param) => {
                    return param
                        .command({
                            command: 'push',
                            describe: 'Push parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new PushParameters(settings, OptionParser.parse(argv)).execute(),
                        })
                        .command({
                            command: 'list',
                            describe: 'ListParameters parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new ListParameters(settings, OptionParser.parse(argv)).execute()
                        })
                        .help()
                }
            })
            .demandCommand(1, 'You need at least one command before moving on')
            .demandOption('env', 'Please provide environment name.')
            .help()
            .alias('h', 'help')
            .locale('en')
            .argv;
    }

}

TypedLambda.initCommandLine().then();
