import * as child_process from 'child_process';
import * as vscode from 'vscode';
import * as vscodeGit from 'vscode.git';
import { Branch } from './model';

const gitAPI: vscodeGit.API = vscode.extensions.getExtension('vscode.git')!.exports.getAPI(1);

export async function branchs(): Promise<Map<string, Branch>> {
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

            let branchs = new Map<string, Branch>();
            stdout.split('\n')
                .filter(line => line && line.search("HEAD") === -1)
                .map(line => {
                    line = line.replace(/^\*?\s+/g, '');
                    let name = line.startsWith('remotes')?
					line.replace('remotes/', ''):
					line;
                    
                    branchs.set(name, {name: name, isRemote: line.startsWith('remotes'), tracked: ''});
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
                        const source = matched[1].replace(/\s+/g, '');
                        const dist = matched[2].replace(/\s+/g, '');
                        tracked.set(source, dist);
                        tracked.set(dist, source);
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