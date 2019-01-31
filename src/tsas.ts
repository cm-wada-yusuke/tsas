import 'source-map-support/register'
import yargs from 'yargs';
import { print, setVerbose } from './logging';
import { Init } from './init';
import { ListParameters } from './param/list-parameters';
import { OptionParser } from './option/option';
import { Settings } from './settings/settings';
import { PushParameters } from './param/push-parameters';
import { DeployServerless } from './deploy/deploy-serverless';
import colors = require('colors/safe');

const CLI = 'tsas';

class Tsas {
    static async initCommandLine() {
        setVerbose();
        Tsas.executeCommandLine();
    }

    private static executeCommandLine() {
        return yargs
            .usage(`Usage: ${CLI} COMMAND`)
            .option('region', {type: 'string', desc: 'Use the indicated AWS region to override default in config file.'})
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
                            handler: async (argv) => new PushParameters(await Settings.load(), OptionParser.parse(argv)).execute(),
                        })
                        .command({
                            command: 'list',
                            describe: 'ListParameters parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new ListParameters(await Settings.load(), OptionParser.parse(argv)).execute()
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
                            handler: async (argv) => new DeployServerless(await Settings.load(), OptionParser.parse(argv)).execute(),
                        })
                        .command({
                            command: ['cloudformation', 'cfn'],
                            describe: 'Deploy a pure CloudFormation template.',
                            handler: async (argv) => new ListParameters(await Settings.load(), OptionParser.parse(argv)).execute()
                        })
                        .help()
                        .demandOption('env', 'Please provide environment name.')
                }
            })
            .demandCommand(1, 'You need at least one command before moving on')
            .help()
            .alias('h', 'help')
            .locale('en')
            .argv;
    }

}

Tsas.initCommandLine().then().catch(error => error(colors.red(error)));
