// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as open from 'open';
import * as express from 'express';
import * as fs from 'fs';
import * as morgan from 'morgan';

/**
 * TODO:
 * 1. Add command for unlistening to Web.
 * 2. Add a Do not show again option for every notification.
 * 3. Bring current editor to foreground after it lost focus.
 */

const SRC = "src";
const LOG = "/tmp/chrome_source_opener.log";
const WARNING_NOT_IN_SRC = `Please ensure in Chromium ${SRC}!`;

// Listen on local:PORT.
const PORT = 8989;

// Identify whether the server has been set up.
let listen_started = false;

// This extension mainly for Chromium src/ now.
function checkCurrentWorkspace(
	editor: vscode.TextEditor | undefined) : boolean {
	if (!editor)
		return false;

	const workspaceFolder = vscode.workspace.getWorkspaceFolder(
		editor.document.uri);
	if (!workspaceFolder)
		return false;
	
	return checkCurrentPath(workspaceFolder.name);
}

function checkCurrentPath(path: string) : boolean {
	if (!path)
		return false;
	
	return path.search(SRC) != -1;
}

// Start server on local:PORT. Listen for GET.
function startServer() {
	if (listen_started) {
		vscode.window.showWarningMessage('Server already started!');
		return;
	}

	let logSystem = fs.createWriteStream(LOG, {flags: 'a'});

	let app = express();
	app.use(morgan('short', {stream: logSystem}));
	app.get('/file', (req, res) => {
		var editor = vscode.window.activeTextEditor;
		if (!editor)
			return;

		if (!checkCurrentWorkspace(editor)) {
			vscode.window.showWarningMessage(WARNING_NOT_IN_SRC);
			return;
		}

		var filePath = req.query.f;
		if (!filePath)
			return;
		
		const fsPath = editor.document.uri.fsPath;
		if (!fsPath)
			return;
		
		var src_idx = fsPath.search(SRC);
		var srcPath = fsPath.substr(0, src_idx + 4);
		var openPath = srcPath + '/' + filePath;
		vscode.workspace.openTextDocument(vscode.Uri.file(openPath)).then(doc => {
			vscode.window.showTextDocument(doc).then(editor => {
				var lineNumber = Number(req.query.l);
				var colNumber = 0;
				var pos = new vscode.Position(lineNumber - 1, colNumber);
				// Line added - by having a selection at the same position 
				// twice, the cursor jumps there.
				editor.selections = [new vscode.Selection(pos, pos)]; 

				// And the visible range jumps there too.
				var range = new vscode.Range(pos, pos);
				editor.revealRange(range);

				// TODO: Bring current editor to foreground.
				
				console.log(`Open file - ${openPath}:${lineNumber}.`);
				vscode.window.showInformationMessage('Opened from WEB source!');
			});
		});
	});

	app.listen(PORT);

	vscode.window.showInformationMessage(
		'Listening to source.chromium.org successfuly!');
	listen_started = true;
}

// Send request to remote source.chromium.org.
async function sendRequest() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('Not in a valid editor!');
		return;
	}

	const baseUrl = "https://source.chromium.org/chromium/chromium/src/+/main:";
	var path = editor.document.uri.fsPath;
	var src_idx = path.search(SRC);
	if (src_idx == -1) {
		vscode.window.showWarningMessage(WARNING_NOT_IN_SRC);
		return;
	}
	path = path.substring(src_idx + 4 );
	var line = (editor.selection.active.line + 1).toString();
	var queryUrl = `${baseUrl}${path};l=${line}`;
	const selection = editor.selection;
	if (!selection.isEmpty) {
		const selected = editor.document.getText(new vscode.Range
			(selection.start, selection.end));
		queryUrl += `?q=${selected}`;
	}
	console.log(path, line, selection.isEmpty);
	await open(queryUrl);

	// Display a message box to the user
	vscode.window.showInformationMessage('Code succesfully showed in WebSite!');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "Chromium Source Opener" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// TODO: Add command for unlistening to Web.
	let listen_to_web = vscode.commands.registerCommand(
		'chromium-source-opener.listenToWeb', startServer);
	let open_in_web = vscode.commands.registerCommand(
		'chromium-source-opener.openInWeb', sendRequest);

	context.subscriptions.push(
		listen_to_web,
		open_in_web
	);

	// For testing. Should not enable in production environment.
	if (vscode.debug.activeDebugSession && 
		checkCurrentWorkspace(vscode.window.activeTextEditor)) {
		// Start listening.
		startServer();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
