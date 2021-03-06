import childProcess = require('child_process');
import colors = require('colors/safe');
import * as fs from 'fs-extra';
import * as path from 'path';
import { print, warning } from './logging';
import * as readlineSync from 'readline-sync';

// tslint:disable:no-var-requires those libraries don't have up-to-date @types modules
const camelCase = require('camelcase');
const decamelize = require('decamelize');
// tslint:enable:no-var-requires

const TEMPLATES_DIR = path.join(__dirname, 'init-templates');
const APP_DIR = path.join(TEMPLATES_DIR, 'hello-world');

export class Init {

    public async execute() {
        await this.assertIsEmptyDirectory();
        const config: ProjectInfo = this.readlineForConfig();
        await this.install(process.cwd(), config);
        await this.initializeGitRepository();
        await this.postInstall();
        if (await fs.pathExists('README.md')) {
            print(colors.green(await fs.readFile('README.md', {encoding: 'utf-8'})));
        } else {
            print(`✅ All done!`);
        }
    }

    private readlineForConfig(): ProjectInfo {
        const appName = readlineSync.question('What your serverless application name? [$<defaultInput>]', {
            defaultInput: this.getDefaultAppName(process.cwd())
        });
        const nameSpace = readlineSync
            .question('What your serverless application nameSpace? used for S3 bucket prefix. [$<defaultInput>]', {
                defaultInput: 'ns'
            });
        const defaultRegion = readlineSync
            .question('What your default region? [$<defaultInput>]', {
                defaultInput: 'ap-northeast-1'
            });

        return {appName, nameSpace, defaultRegion}
    }

    private async assertIsEmptyDirectory() {
        const files = await fs.readdir(process.cwd());
        if (files.filter(item => !(/(^|\/)\.[^\/.]/g).test(item)).length !== 0) {
            throw new Error('`init` command cannot be run in a non-empty directory!');
        }
    }

    private async install(targetDirectory: string, projectInfo: ProjectInfo) {
        const sourceDirectory = APP_DIR;
        print('create to:', process.cwd());
        await this.installFiles(sourceDirectory, targetDirectory, projectInfo);
    }

    private getDefaultAppName(targetDirectory: string): string {
        return decamelize(path.basename(path.resolve(targetDirectory)));
    }

    private async installFiles(sourceDirectory: string, targetDirectory: string, project: ProjectInfo) {
        for (const file of await fs.readdir(sourceDirectory)) {
            const fromFile = path.join(sourceDirectory, file);
            const toFile = path.join(targetDirectory, this.expand(file, project));
            if ((await fs.stat(fromFile)).isDirectory()) {
                await fs.mkdir(toFile);
                await this.installFiles(fromFile, toFile, project);
            } else if (file.match(/^.*\.template\.[^.]+$/)) {
                await this.installProcessed(fromFile, toFile.replace(/\.template(\.[^.]+)$/, '$1'), project);
            } else if (file.match(/^.*\.hook\.[^.]+$/)) {
            } else {
                await fs.copy(fromFile, toFile);
            }
        }
    }

    private async installProcessed(templatePath: string, toFile: string, project: ProjectInfo) {
        const template = await fs.readFile(templatePath, {encoding: 'utf-8'});
        await fs.writeFile(toFile, this.expand(template, project));
    }

    private async postInstall() {
        const command = 'npm';

        print(`Executing ${colors.green(`${command} install`)}...`);
        try {
            await execute(command, 'install');
        } catch (e) {
            throw new Error(`${colors.green(`${command} install`)} failed: ` + e.message);
        }
    }


    private expand(template: string, project: ProjectInfo) {
        return template.replace(/%appName%/g, project.appName)
            .replace(/%appName\.camelCased%/g, camelCase(project.appName))
            .replace(/%appName\.PascalCased%/g, camelCase(project.appName, {pascalCase: true}))
            .replace(/%nameSpace%/g, project.nameSpace)
            .replace(/%defaultRegion%/g, project.defaultRegion);
    }

    private async initializeGitRepository() {
        if (await this.isInGitRepository(process.cwd())) {
            return;
        }
        print('Initializing a new git repository...');
        try {
            await execute('git', 'init');
            await execute('git', 'add', '.');
            await execute('git', 'commit', '--message="Initial commit"', '--no-gpg-sign');
        } catch (e) {
            warning('Unable to initialize git repository for your project.');
        }
    }

    private async isInGitRepository(dir: string) {
        while (true) {
            if (await fs.pathExists(path.join(dir, '.git'))) {
                return true;
            }
            if (this.isRoot(dir)) {
                return false;
            }
            dir = path.dirname(dir);
        }
    }

    private isRoot(dir: string) {
        return path.dirname(dir) === dir;
    }
}

interface ProjectInfo {
    /** The value used for %name% */
    readonly appName: string;
    readonly nameSpace: string;
    readonly defaultRegion: string;
}


/**
 * Executes `command`. STDERR is emitted in real-time.
 *
 * If command exits with non-zero exit code, an exceprion is thrown and includes
 * the contents of STDOUT.
 *
 * @returns STDOUT (if successful).
 */
async function execute(cmd: string, ...args: string[]) {
    const child = childProcess.spawn(cmd, args, {shell: true, stdio: ['ignore', 'pipe', 'inherit']});
    let stdout = '';
    child.stdout.on('data', chunk => stdout += chunk.toString());
    return new Promise<string>((ok, fail) => {
        child.once('error', err => fail(err));
        child.once('exit', status => {
            if (status === 0) {
                return ok(stdout);
            } else {
                process.stderr.write(stdout);
                return fail(new Error(`${cmd} exited with status ${status}`));
            }
        });
    });
}
