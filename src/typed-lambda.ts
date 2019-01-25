import 'source-map-support/register'
import yargs from 'yargs';
import { print, setVerbose } from './logging';
import { Init } from './init';
import { ListParameters } from './param/list-parameters';
import colors = require('colors/safe');

const CLI = 'tlam';

class TypedLambda {
    static initCommandLine() {
        setVerbose();
        TypedLambda.executeCommandLine();
    }

    private static executeCommandLine() {
        return yargs
            .usage(`Usage: ${CLI} COMMAND`)
            .option('profile', {type: 'string', desc: 'Use the indicated AWS profile as the default environment'})
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
                            handler: async (argv) => new ListParameters().execute(argv),
                        })
                        .command({
                            command: 'list',
                            describe: 'ListParameters parameters to AWS Systems Manager, parameter store.',
                            handler: async (argv) => new ListParameters().execute(argv)
                        })
                        .help()
                }
            })
            .demandCommand(1, 'You need at least one command before moving on')
            .help()
            .alias('h', 'help')
            .locale('en')
            .argv;
    }

}


TypedLambda.initCommandLine();
