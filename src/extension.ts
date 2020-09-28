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
		const pick = vscode.window.showQuickPick(branchs());

		pick.then(async (branch?: string) => {
			if (!branch) {
				return;
			}
	
			const tracked = await trackedBranchs();
	
			if (branch.startsWith('remotes')) {
				return await safeDeleteRemoteBranch(branch);
			}

			await safeDeleteLocalBranch(branch);
	
			if (!tracked.has(branch)) {
				return;
			}
	
			const confirm = vscode.window.showQuickPick([YES, NO]);
			confirm.then(async (val?: string) => {
				if (val !== YES) {
					return;
				}

				const remote = tracked.get(branch)!;

				await safeDeleteRemoteBranch(remote);
			});
		});
	});

	const safeDeleteLocalBranch = async (branch: string) => {
		try {
			console.log('git delete local branch', branch);
			await deleteLocalBranch(branch);
			vscode.window.showInformationMessage(`git delete local branch ${branch} success!`);
		} catch(err) {
			return vscode.window.showErrorMessage(err.toString());
		}
	};

	const safeDeleteRemoteBranch = async (branch: string) => {
		try {
			console.log('git delete remote branch', branch);
			await deleteRemoteBranch(branch);
			vscode.window.showInformationMessage(`git delete remote branch ${branch} success!`);
		} catch(err) {
			return vscode.window.showErrorMessage(err.toString());
		}
	};

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
