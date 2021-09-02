// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as open from 'open';
import * as express from 'express';
import * as fs from 'fs';
import * as morgan from 'morgan';
import * as child_process from 'child_process';

/**
 * TODO:
 * 1. Add command for unlistening to Web.
 * 2. Add a Do not show again option for every notification.
 */

const SRC = "src";
const LOG = "/tmp/chrome_source_opener.log";
const WARNING_NOT_IN_SRC = `Please ensure in Chromium ${SRC}!`;
const ERROR_START_LISTENING_FAIL = "Http server cannot be started.";
const ERROR_STATUS = 404;
const ERROR_IDE_NOT_OK = 
	`Please ensure that the current workspace of your IDE is Chromium ${SRC}!`;
const ERROR_FILE_PATH_NOT_FIND = "File path is not found in your request URL.";

// Listen on local:PORT.
const PORT = 8989;

// Identify whether the server has been set up.
let listen_started = false;

function checkCurrentWorkspace() : boolean {
	const workspaceFolder = getCurrentWorkspace();
	if (!workspaceFolder) {
		return false;
	} else {
		return checkCurrentPath(workspaceFolder.name);
	}
}

function getCurrentWorkspace() : vscode.WorkspaceFolder | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		const errorMessage = 
			"Working folder not found, open a folder and try again.";
		
		// Bring current editor to foreground if it losts focus.
		var executed_command = `code`;
		execute_command(executed_command);

		vscode.window.showErrorMessage(errorMessage);
		return undefined;
	} else {
		return workspaceFolders[0];
	}
}

// This extension is mainly for Chromium src/ now.
function checkCurrentPath(path: string) : boolean {
	if (!path)
		return false;
	
	return path.search(SRC) != -1;
}

function execute_command(command: string) {
	if (!command) {
		return;
	}

	child_process.exec(command, (err, stdout, stderr) => {
		if (err) {
			console.log('error: ' + err);
		}
	});
}

function startedInDebugMode(context: vscode.ExtensionContext) : boolean{
	return context.extensionMode == vscode.ExtensionMode.Development;
}

// Start server on local:PORT. Listen for GET.
function startServer() {
	if (listen_started) {
		vscode.window.showWarningMessage('Server already started!');
		return;
	}

	// Make sure that we are listening in Chromium src/.
	if (!checkCurrentWorkspace()) {
		vscode.window.showErrorMessage(ERROR_START_LISTENING_FAIL);
		vscode.window.showWarningMessage(WARNING_NOT_IN_SRC);

		return;
	}

	let logSystem = fs.createWriteStream(LOG, {flags: 'a'});

	let app = express();
	app.use(morgan('short', {stream: logSystem}));
	app.get('/file', (req, res) => {
		if (!checkCurrentWorkspace()) {
			vscode.window.showWarningMessage(WARNING_NOT_IN_SRC);

			res.status(ERROR_STATUS).send(ERROR_IDE_NOT_OK);
			return;
		}

		var filePath = req.query.f;
		if (!filePath) {
			res.status(ERROR_STATUS).send(ERROR_FILE_PATH_NOT_FIND);
			return;
		}
		
		const workspace = getCurrentWorkspace();
		// `workspace` is always defined. It's ensure by the checkness of 
		// checkCurrentWorkspace(). The check here just for passing grammar 
		// examination.
		if (!workspace)
			return;
		
		const workspaceName = workspace.uri.fsPath;
		var src_idx = workspaceName.search(SRC);
		var srcPath = workspaceName.substr(0, src_idx + 4);
		var openPath = srcPath + '/' + filePath;
		var lineNumber = Number(req.query.l);
		var execute_command = `code -g ${openPath}:${lineNumber}`;
		child_process.exec(execute_command, (err, stdout, stderr) => {
			if (err) {
				console.log('error: ' + err);
				res.status(ERROR_STATUS)
				.send("This error appears in local IDE: " + err.message);

				return;
			}
		});

		console.log(`Open file - ${openPath}:${lineNumber}.`);
		vscode.window.showInformationMessage('Opened from WEB source!');

		res.send("OK");
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
	if (startedInDebugMode(context) && 
		checkCurrentWorkspace()) {
		// Start listening.
		startServer();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
