import * as child_process from 'child_process';
import * as vscode from 'vscode';
import * as vscodeGit from 'vscode.git';

const gitAPI: vscodeGit.API = vscode.extensions.getExtension('vscode.git')!.exports.getAPI(1);

export async function branchs(): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        child_process.exec(`${gitAPI.git.path} branch -a`, {
            cwd: vscode.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                return reject(stderr);
            }

            console.log(stdout);

            const branchs: Array<string> = stdout
                .split('\n')
                .filter(line => line && line.search("HEAD") === -1)
                .map(line => {
                    line = line.replace(/^\*?\s+/g, '');
                    return line;
                });
                
            resolve(branchs);
        });
    });
}

export async function trackedBranchs(): Promise<Map<string, string>> {
    return new Promise((resolve, reject) => {
        child_process.exec(`${gitAPI.git.path} branch -vv`, {
            cwd: vscode.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                return reject(stderr);
            }

            console.log(stdout);

            let tracked = new Map<string, string>();

            stdout.split('\n')
                .filter(line => line)
                .map(line => {
                    line = line.replace(/^\*?\s+/g, '');
                    const matched = line.match(/(.+)\s[A-Za-z0-9]{8}\s\[(.+)\]/);
                    if (matched && matched.length === 3) {
                        tracked.set(matched[1], matched[2]);
                        tracked.set(matched[2], matched[1]);
                    }
                });

            resolve(tracked);
        });
    });
}

export async function deleteLocalBranch(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        child_process.exec(`${gitAPI.git.path} branch -d ${name}`, {
            cwd: vscode.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                return reject(stderr);
            }

            console.log(stdout);
                
            resolve(true);
        });
    });
}

export async function deleteRemoteBranch(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const matched = name.match(/([A-Za-z0-9]+)\/(.+)/);
        if (!matched || matched.length !== 3) {
            return reject(`remote branch ${name} decode failed`);
        }

        child_process.exec(`${gitAPI.git.path} push --progress --porcelain ${matched[1]} :${matched[2]}`, {
            cwd: vscode.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }

            console.log(stdout);
                
            resolve(true);
        });
    });
}