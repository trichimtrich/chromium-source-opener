// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as open from 'open';
import * as express from 'express';
import * as fs from 'fs';
import * as morgan from 'morgan';
import * as child_process from 'child_process';
import * as RateLimit from 'express-rate-limit';
import { findClosestLine } from './diff';

/**
 * TODO:
 * 1. Add command for unlistening to Web.
 * 2. Add a Do not show again option for every notification.
 */

const SRC = 'src';
const LOG = '/tmp/chrome_source_opener.log';
const WARNING_NOT_IN_SRC = `Please ensure in Chromium ${SRC}!`;
const ERROR_START_LISTENING_FAIL = 'Http server cannot be started.';
const ERROR_STATUS = 404;
const ERROR_IDE_NOT_OK =
	`Please ensure that the current workspace of your IDE is Chromium ${SRC}!`;
const ERROR_FILE_PATH_NOT_FIND = 'File path is not found in your request URL.';
const ERROR_FILE_NOT_FIND =
	`The request file does not exist in local Chromium ${SRC} version.`;

// Listen on local:PORT.
const PORT = 8989;

// Identify whether the server has been set up.
let listenStarted = false;

let logger: vscode.OutputChannel | null;
function log(message: string) {
	let date = new Date();
	logger?.appendLine(date.toISOString() + " " + message);
}

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
			'Working folder not found, open a folder and try again.';

		activateTextEditor();

		vscode.window.showErrorMessage(errorMessage);
		return undefined;
	} else {
		return workspaceFolders[0];
	}
}

// This extension is mainly for Chromium src/ now.
function checkCurrentPath(path: string) : boolean {
	if (!path) {
		return false;
	}

	return path.search(SRC) !== -1;
}

function executeCommand(command: string) : string | undefined {
	if (!command) {
		return 'The input "command" is null';
	}

	child_process.exec(command, (err, stdout, stderr) => {
		if (err) {
			log('error: ' + err);
			return err.message;
		}
	});
	return undefined;
}

// Bring current editor to foreground if it losts focus.
// Also show the error message if not null.
function activateTextEditor(error?: string) {
	var executedCommand = `code -r`;
	executeCommand(executedCommand);

	if (error) {
		vscode.window.showErrorMessage(error);
	}
}

function startedInDebugMode(context: vscode.ExtensionContext) : boolean{
	return context.extensionMode === vscode.ExtensionMode.Development;
}

// Start server on local:PORT. Listen for GET.
function startServer() {
	if (listenStarted) {
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

	// Set up rate limiter: maximum of five requests per minute
	var limiter = RateLimit({
		windowMs: 1*60*1000, // 1 minute
		max: 5
	});

	let app = express();
	app.use(morgan('short', {stream: logSystem}));

	// Apply rate limiter to all requests
	app.use(limiter);

	app.get('/file', (req, res) => {
		if (!checkCurrentWorkspace()) {
			vscode.window.showWarningMessage(WARNING_NOT_IN_SRC);

			res.status(ERROR_STATUS).send(ERROR_IDE_NOT_OK);
			return;
		}

		var filePath = req.query.f;
		if (!filePath) {
			activateTextEditor(ERROR_FILE_PATH_NOT_FIND);

			res.status(ERROR_STATUS).send(ERROR_FILE_PATH_NOT_FIND);
			return;
		}


		const workspaceFolder = getCurrentWorkspace();
		// `workspace` is always defined. It's ensure by the checkness of
		// checkCurrentWorkspace(). The check here just for passing grammar
		// examination.
		if (!workspaceFolder) {
			return;
		}

		const workspaceName = workspaceFolder.uri.fsPath;
		var srcIdx = workspaceName.search(SRC);
		var srcPath = workspaceName.substr(0, srcIdx + 4);
		var openPath = srcPath + '/' + filePath;
		if (!fs.existsSync(openPath)) {
			activateTextEditor(ERROR_FILE_NOT_FIND);

			res.status(ERROR_STATUS).send(ERROR_FILE_NOT_FIND);
			return;
		}

		var lineNumber = Number(req.query.l);
		var executedCommand = `code -g ${openPath}:${lineNumber}`;
		var errMessage = executeCommand(executedCommand);
		if (errMessage) {
			res.status(ERROR_STATUS)
			.send('This error appears in local IDE: ' + errMessage);

			return;
		}

		log(`Open file - ${openPath}:${lineNumber}.`);
		vscode.window.showInformationMessage('Opened from WEB source!');

		res.send("OK");
	});

	app.listen(PORT);

	vscode.window.showInformationMessage(
		'Listening to source.chromium.org successfuly!');
	listenStarted = true;
}

// Send request to remote source.chromium.org.
async function sendRequest() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('Not in a valid editor!');
		return;
	}

	var path = editor.document.uri.fsPath.replace(/\\/g, '/');
	log('path: ' + path);

	var dirname = path.substring(0, path.lastIndexOf('/'));
	var filename = path.substring(path.lastIndexOf('/') + 1);

	try {
		// get the remote origin url
		var remoteUrl = child_process.execSync('git remote get-url origin', {cwd: dirname}).toString().trim();
		log('remoteUrl: ' + remoteUrl);

		// get the current commit hash
		var commitHash = child_process.execSync('git rev-parse HEAD', {cwd: dirname}).toString().trim();
		log('commitHash: ' + commitHash);

		// get full file path from git repo
		var fullPath = child_process.execSync(`git ls-files --full-name ${filename}`, {cwd: dirname}).toString().trim();
		log('fullPath: ' + fullPath);

		// get diff of current file
		var diff = child_process.execSync(`git diff ${filename}`, {cwd: dirname}).
			toString();

	} catch (e) {
		log('Error: ' + e);
		vscode.window.showErrorMessage('Not in a valid git repository!');
		return;
	}

	// guess the source
	var isGoogleSource = remoteUrl.includes('googlesource.com');
	var isChromium = remoteUrl.startsWith('https://chromium.googlesource.com/chromium/src.git');
	var isGithub = remoteUrl.includes('github.com');

	// guess the closest line
	var line = editor.selection.active.line + 1;
	log('line: ' + line);
	var closestLine = findClosestLine(line, diff);
	log('closestLine: ' + closestLine);

	// open in browser
	if (isChromium) {
		// https://source.chromium.org/chromium/chromium/src/+/0db6a70c51edfdfe5a8dffaeeed88ca3fe37103f:net/cert_net/cert_net_fetcher_url_request.cc;l=25
		var queryUrl = `https://source.chromium.org/chromium/chromium/src/+/` +
			`${commitHash}:${fullPath};l=${closestLine}`;
	} else if (isGoogleSource) {
		// https://chromium.googlesource.com/chromium/src.git/+/63015eb7fb3371dd0f1fdca41747a51c8bb94eca/chrome/browser/signin/bound_session_credentials/bound_session_cookie_refresh_service_impl.cc#17
		var queryUrl = `${remoteUrl}/+/` +
			`${commitHash}/${fullPath}#${closestLine}`;
	} else if (isGithub) {
		// git@github.com:
		remoteUrl = remoteUrl.replace('git@github.com:', 'https://github.com/');
		if (remoteUrl.endsWith('.git')) {
			remoteUrl = remoteUrl.slice(0, -4);
		}

		// https://github.com/koalamer/vsc-labeled-bookmarks/blob/42b966a7670761f3b7316b8ab63726eb1330745e/.vscodeignore#L5
		var queryUrl = `${remoteUrl}/blob/${commitHash}/${fullPath}#L${closestLine}`;
	} else {
		vscode.window.showErrorMessage('Not in a valid git repository!');
		return;
	}

	log('queryUrl: ' + queryUrl);
	await open(queryUrl);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	logger = vscode.window.createOutputChannel('Chromium Source Opener');

	log('Congratulations, your extension "Chromium Source Opener" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// TODO: Add command for unlistening to Web.
	let listenToWeb = vscode.commands.registerCommand(
		'chromium-source-opener.listenToWeb', startServer);
	let openInWeb = vscode.commands.registerCommand(
		'chromium-source-opener.openInWeb', sendRequest);

	context.subscriptions.push(
		listenToWeb,
		openInWeb
	);

	// For testing. Should not enable in production environment.
	if (startedInDebugMode(context) &&
		checkCurrentWorkspace()) {
		// Start listening.
		startServer();
	}

	vscode.window.showInformationMessage('Chromium Source Opener is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
