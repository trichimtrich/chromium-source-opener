// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as open from 'open';
import * as child_process from 'child_process';

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

	let listen_started = false;
	let listen_web = vscode.commands.registerCommand('chromium-source-opener.listenWeb', function() {
		if (!listen_started) {
			var execute_command = `python ~/chromium/src/tools/chrome_extensions/open_my_editor/omed.py`;
			child_process.exec(execute_command, (err, stdout, stderr) => {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (err) {
							console.log('error: ' + err);
					}
			});
			vscode.window.showInformationMessage('Listening to source.chromium.org successfuly!');
			listen_started = true;
		} else {
			vscode.window.showWarningMessage('Server already started!');
		}
	})

	context.subscriptions.push(
		disposable,
		listen_web
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
