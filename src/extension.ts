// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as open from 'open';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Chromium Source Opener" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('chromium-source-opener.openInWeb', async () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;

		if (!editor)	{
			vscode.window.showInformationMessage('Not in a valid editor!');
			return;
		}
		const baseUrl = "https://source.chromium.org/chromium/chromium/src/+/main:";
		var path = editor.document.uri.fsPath
		var src_idx = path.search('src/')
		if (src_idx == -1) {
			vscode.window.showInformationMessage('Not in a src file!');
			return;
		}
		path = path.substring(src_idx + 4 )
		var line = (editor.selection.active.line + 1).toString()
		console.log(path, line)
		await open(`${baseUrl}${path};l=${line}`)

		// Display a message box to the user
		vscode.window.showInformationMessage('Code succesfully showed in WebSite!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
