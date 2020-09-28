// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { branchs, deleteLocalBranch, deleteRemoteBranch, trackedBranchs } from './command';

const YES = 'YES';
const NO = 'NO';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, "git-branch-delete-kit" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('git-branch-delete-kit.deleteBranch', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		branchs().then(async (branchs) => {
			let items = new Array<string>();
			const tracked = await trackedBranchs();
			branchs.forEach((branch, key, map) => {
				items.push(branch.name);
				if (tracked.has(branch.name)) {
					branch.tracked = tracked.get(branch.name)!;
				}
			});

			const pick = vscode.window.showQuickPick(items);
			pick.then(async (select?: string) => {
				if (!select) {
					return;
				}
	
				try {
					const branch = branchs.get(select)!;
			
					// delete choice branch
					branch.isRemote? 
						await safeDeleteRemoteBranch(branch.name): 
						await safeDeleteLocalBranch(branch.name);
					branchs.delete(branch.name);
	
					if (!branch.tracked) {
						return;
					}
	
					const trackedBranch = branchs.get(branch.tracked);
					if (!trackedBranch) {
						// maybe branch deleted, tracked rule not.
						return;
					}

					const placeHolder = trackedBranch.isRemote? 
						`Delete tracking branch local ${trackedBranch}`: 
						`Delete tracking branch remote ${trackedBranch}`;
			
					const confirm = vscode.window.showQuickPick([YES, NO], {placeHolder: placeHolder});
					confirm.then(async (val?: string) => {
						if (val !== YES) {
							return;
						}
						try {
							select.startsWith('remotes')? 
								await safeDeleteLocalBranch(trackedBranch.name): 
								await safeDeleteRemoteBranch(trackedBranch.name);
						} catch(err) {
							return vscode.window.showErrorMessage(err.toString());
						}
					});
				} catch(err) {
					return vscode.window.showErrorMessage(err.toString());
				}
			});
		});
	});

	const safeDeleteLocalBranch = async (branch: string) => {
		console.log('git delete local branch', branch);
		await deleteLocalBranch(branch);
		vscode.window.showInformationMessage(`git delete local branch ${branch} success!`);
	};

	const safeDeleteRemoteBranch = async (branch: string) => {
		console.log('git delete remote branch', branch);
		await deleteRemoteBranch(branch);
		vscode.window.showInformationMessage(`git delete remote branch ${branch} success!`);
	};

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
