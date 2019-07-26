import 'source-map-support/register'
import yargs from 'yargs';
import { print, setVerbose } from './logging';
import { Init } from './init';
import { ListParameters } from './param/list-parameters';
import { OptionParser } from './option/option';
import { SettingsLoader } from './settings/settings-loader';
import { PushParameters } from './param/push-parameters';
import { DeployServerless } from './deploy/deploy-serverless';
import colors = require('colors/safe');
import { DeployCloudFormation } from './deploy/deploy-cloud-formation';
import { DisplayCfnParameters } from './display/display-cfn-parameters';
import { PutParameter } from './param/put-parameter';

const CLI = 'tsas';

class Tsas {
    static async initCommandLine() {
        Tsas.executeCommandLine();
    }

    private static executeCommandLine() {
        return yargs
            .usage(`Usage: ${CLI} COMMAND`)
            .option('region', {
                type: 'string',
                desc: 'Use the indicated AWS region to override default in config file.'
            })
            .option('env', {type: 'string', alias: 'e', desc: 'Environment name; such as dev, stg, prod...'})
            .option('verbose', {type: 'boolean', default: false, desc: 'Set verbose mode.'})
            .command({
                command: 'init',
                describe: 'Create a new, empty Typed Lambda project from a template.',
                handler: async (_) => new Init().execute()
            })
            .command({
                command: 'param',
                handler: (_) => print(colors.yellow(`usage: ${CLI} param <action> [options]`)),
                describe: 'Manage application parameters, [push|put|list]',
                builder: (param) => {
                    return param
                        .command({
                            command: 'push',
                            describe: 'Push parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new PushParameters(await SettingsLoader.load(), OptionParser.parse(argv)).execute(),
                        })
                        .command({
                            command: ['put <putIndividualParameterKey> <putIndividualParameterValue>'],
                            describe: 'Put individual key-value parameter to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new PutParameter(await SettingsLoader.load(), OptionParser.parse(argv)).execute()
                        })
                        .command({
                            command: 'list',
                            describe: 'ListParameters parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new ListParameters(await SettingsLoader.load(), OptionParser.parse(argv)).execute()
                        })
                        .help()
                        .demandOption('env', 'Please provide environment name.')
                }
            })
            .command({
                command: 'deploy',
                handler: (_) => print(colors.yellow(`usage: ${CLI} deploy <action> [options]`)),
                describe: 'Deploy aws resources, [serverless|sls|cloudformation|cfn]',
                builder: (param) => {
                    return param
                        .command({
                            command: ['serverless', 'sls'],
                            describe: 'Deploy a template includes AWS::Serverless type.',
                            handler: async (argv) => new DeployServerless(await SettingsLoader.load(), OptionParser.parse(argv)).execute(),
                        })
                        .command({
                            command: ['cloudformation <name>', 'cfn <name>'],
                            describe: 'Deploy specified pure CloudFormation template.',
                            handler: async (argv) => new DeployCloudFormation(await SettingsLoader.load(), OptionParser.parse(argv)).execute()
                        })
                        .help()
                        .demandOption('env', 'Please provide environment name.')
                }
            })
            .command({
                command: 'display',
                handler: (_) => print(colors.yellow(`usage: ${CLI} display <target> [options]`)),
                describe: 'Display information [cfn-parameters]',
                builder: (param) => {
                    return param
                        .command({
                            command: 'cfn-parameters',
                            describe: 'Display parameters for CloudFormation template.',
                            handler: async (argv) => new DisplayCfnParameters(await SettingsLoader.load(), OptionParser.parse(argv)).execute(),
                        })
                        .help()
                        .demandOption('env', 'Please provide environment name.')
                }
            })
            .demandCommand(1, 'You need at least one command before moving on')
            .help().alias('h', 'help')
            .locale('en')
            .argv;
    }

}

Tsas.initCommandLine().then().catch(error => error(colors.red(error)));
