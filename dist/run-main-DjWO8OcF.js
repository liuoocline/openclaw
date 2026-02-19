import { c as enableConsoleCapture, i as normalizeEnv, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-CLN7qdwL.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import "./agent-scope-tDG9mXT6.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { M as VERSION, N as loadDotEnv } from "./config-BYXIxSeu.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-B_EbOpJr.js";
import "./chrome-D81-KU5p.js";
import { r as formatUncaughtError } from "./errors-x4NYs-1P.js";
import "./control-service-BGzaLKe-.js";
import { t as ensureOpenClawCliOnPath } from "./path-env-CXWUFfFv.js";
import "./tailscale-DU6DgqVy.js";
import "./auth-BcNHFK-i.js";
import "./client-DMloFP_O.js";
import "./call-BVsSPFqZ.js";
import "./message-channel-BlgPSDAh.js";
import "./links-7M-j83As.js";
import "./plugin-auto-enable-D8FeubdD.js";
import "./plugins-w06Vb-by.js";
import "./logging-CfEk_PnX.js";
import "./accounts-C9CKH8EW.js";
import { Mt as installUnhandledRejectionHandler } from "./loader-BvVnSZJi.js";
import "./progress-Da1ehW-x.js";
import "./prompt-style-Dc0C5HC9.js";
import "./note-Ci08TSbV.js";
import "./clack-prompter-DuBVnTKy.js";
import "./onboard-channels-CnkIwT7I.js";
import "./archive-1r-XD_by.js";
import "./skill-scanner-BT7PBklM.js";
import "./installs-DFexIYlZ.js";
import "./manager-DF-AmlvH.js";
import "./paths-IivnSNkP.js";
import "./sqlite-DmufeXxk.js";
import "./routes-DSRGQ9mc.js";
import "./pi-embedded-helpers-BmGsPjNU.js";
import "./deliver-BNJsqxcs.js";
import "./sandbox-BETrMoPm.js";
import "./tui-formatters-CZbLfYzX.js";
import "./wsl-D1hifGjf.js";
import "./skills-CaMc6JEl.js";
import "./image-PhIZZ0zw.js";
import "./redact-BHmk44DI.js";
import "./tool-display-DUVhO36P.js";
import "./channel-selection-BwtEbA0Y.js";
import "./session-cost-usage-CcCEQNuc.js";
import "./commands-C7KQcnLn.js";
import "./pairing-store-B-ZYFpaj.js";
import "./login-qr-DGDI7JGp.js";
import "./pairing-labels-vG5sMXJr.js";
import "./channels-status-issues-BH0EGtoK.js";
import { n as ensurePluginRegistryLoaded } from "./command-options-t0-zcsKq.js";
import { a as getCommandPath, c as getPrimaryCommand, d as hasHelpOrVersion } from "./register.subclis-DR1Sp5Rn.js";
import "./completion-cli-2ItpXD-U.js";
import "./gateway-rpc-KFfnfnoN.js";
import "./deps-DK7844Cb.js";
import { h as assertSupportedRuntime } from "./daemon-runtime-PO6b9aOs.js";
import "./service-D6rtu1p1.js";
import "./systemd-C4ZgfK1Q.js";
import "./service-audit-De5E3f4l.js";
import "./table-cCoGqLsk.js";
import "./widearea-dns-CMIG6-74.js";
import "./audit-DqnrLraG.js";
import "./onboard-skills-D-4Qg6SU.js";
import "./health-format-DAG6GYZ5.js";
import "./update-runner-DBJfu6OC.js";
import "./github-copilot-auth-zMce9EDV.js";
import "./logging-DuK6YXuK.js";
import "./hooks-status-Cms3vhAm.js";
import "./status-D0ik2mPc.js";
import "./skills-status-D6ZWsOj-.js";
import "./tui-Cprb4KEl.js";
import "./agent-C84IgDM9.js";
import "./node-service-BIxei92R.js";
import "./auth-health-CnSJfOT4.js";
import { a as findRoutedCommand, n as emitCliBanner, t as ensureConfigReady } from "./config-guard-BDR9GTbx.js";
import "./help-format-CUnac_bT.js";
import "./configure-Daks_tts.js";
import "./systemd-linger-eO-4-yqy.js";
import "./doctor-DgO4lD9v.js";
import path from "node:path";
import process$1 from "node:process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

//#region src/cli/route.ts
async function prepareRoutedCommand(params) {
	emitCliBanner(VERSION, { argv: params.argv });
	await ensureConfigReady({
		runtime: defaultRuntime,
		commandPath: params.commandPath
	});
	if (params.loadPlugins) ensurePluginRegistryLoaded();
}
async function tryRouteCli(argv) {
	if (isTruthyEnvValue(process.env.OPENCLAW_DISABLE_ROUTE_FIRST)) return false;
	if (hasHelpOrVersion(argv)) return false;
	const path = getCommandPath(argv, 2);
	if (!path[0]) return false;
	const route = findRoutedCommand(path);
	if (!route) return false;
	await prepareRoutedCommand({
		argv,
		commandPath: path,
		loadPlugins: route.loadPlugins
	});
	return route.run(argv);
}

//#endregion
//#region src/cli/run-main.ts
function rewriteUpdateFlagArgv(argv) {
	const index = argv.indexOf("--update");
	if (index === -1) return argv;
	const next = [...argv];
	next.splice(index, 1, "update");
	return next;
}
async function runCli(argv = process$1.argv) {
	const normalizedArgv = stripWindowsNodeExec(argv);
	loadDotEnv({ quiet: true });
	normalizeEnv();
	ensureOpenClawCliOnPath();
	assertSupportedRuntime();
	if (await tryRouteCli(normalizedArgv)) return;
	enableConsoleCapture();
	const { buildProgram } = await import("./program-C-sUHR7F.js");
	const program = buildProgram();
	installUnhandledRejectionHandler();
	process$1.on("uncaughtException", (error) => {
		console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
		process$1.exit(1);
	});
	const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
	const primary = getPrimaryCommand(parseArgv);
	if (primary) {
		const { registerSubCliByName } = await import("./register.subclis-DR1Sp5Rn.js").then((n) => n.i);
		await registerSubCliByName(program, primary);
	}
	if (!(!primary && hasHelpOrVersion(parseArgv))) {
		const { registerPluginCliCommands } = await import("./cli-BtR1sRnP.js");
		const { loadConfig } = await import("./config-BYXIxSeu.js").then((n) => n.t);
		registerPluginCliCommands(program, loadConfig());
	}
	await program.parseAsync(parseArgv);
}
function stripWindowsNodeExec(argv) {
	if (process$1.platform !== "win32") return argv;
	const stripControlChars = (value) => {
		let out = "";
		for (let i = 0; i < value.length; i += 1) {
			const code = value.charCodeAt(i);
			if (code >= 32 && code !== 127) out += value[i];
		}
		return out;
	};
	const normalizeArg = (value) => stripControlChars(value).replace(/^['"]+|['"]+$/g, "").trim();
	const normalizeCandidate = (value) => normalizeArg(value).replace(/^\\\\\\?\\/, "");
	const execPath = normalizeCandidate(process$1.execPath);
	const execPathLower = execPath.toLowerCase();
	const execBase = path.basename(execPath).toLowerCase();
	const isExecPath = (value) => {
		if (!value) return false;
		const normalized = normalizeCandidate(value);
		if (!normalized) return false;
		const lower = normalized.toLowerCase();
		return lower === execPathLower || path.basename(lower) === execBase || lower.endsWith("\\node.exe") || lower.endsWith("/node.exe") || lower.includes("node.exe") || path.basename(lower) === "node.exe" && fs.existsSync(normalized);
	};
	const filtered = argv.filter((arg, index) => index === 0 || !isExecPath(arg));
	if (filtered.length < 3) return filtered;
	const cleaned = [...filtered];
	if (isExecPath(cleaned[1])) cleaned.splice(1, 1);
	if (isExecPath(cleaned[2])) cleaned.splice(2, 1);
	return cleaned;
}

//#endregion
export { runCli };