import { c as enableConsoleCapture, i as normalizeEnv, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-FJ3VY25a.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import "./agent-scope-D3me2AZa.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { M as VERSION, N as loadDotEnv } from "./config-BXK2Ocdw.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-lyNcqJYD.js";
import "./chrome-B2UjqY-9.js";
import { r as formatUncaughtError } from "./errors-x4NYs-1P.js";
import "./control-service-Dwmi4Fwz.js";
import { t as ensureOpenClawCliOnPath } from "./path-env-CXWUFfFv.js";
import "./tailscale-DU6DgqVy.js";
import "./auth-BcNHFK-i.js";
import "./client-DMloFP_O.js";
import "./call-OvaClfky.js";
import "./message-channel-BlgPSDAh.js";
import "./links-7M-j83As.js";
import "./plugin-auto-enable-BROgMZcf.js";
import "./plugins-B7F0Ly9G.js";
import "./logging-CfEk_PnX.js";
import "./accounts-DbzMEfKN.js";
import { Mt as installUnhandledRejectionHandler } from "./loader-BiT4rSNx.js";
import "./progress-Da1ehW-x.js";
import "./prompt-style-Dc0C5HC9.js";
import "./note-Ci08TSbV.js";
import "./clack-prompter-DuBVnTKy.js";
import "./onboard-channels-DuFmfcKu.js";
import "./archive-D0z3LZDK.js";
import "./skill-scanner-C_fQzVDu.js";
import "./installs-89zeUsVn.js";
import "./manager-CMFBuvVd.js";
import "./paths-IivnSNkP.js";
import "./sqlite-DODNHWJb.js";
import "./routes-C__9tksn.js";
import "./pi-embedded-helpers-BthJO_Br.js";
import "./deliver-Dy7LmUkR.js";
import "./sandbox-Cpj2BrV_.js";
import "./tui-formatters-DzBOmAcS.js";
import "./wsl-CrGyo_xb.js";
import "./skills-BWrDh4bx.js";
import "./image-DYnVuHDd.js";
import "./redact-BHmk44DI.js";
import "./tool-display-DUVhO36P.js";
import "./channel-selection-DAHCVAX4.js";
import "./session-cost-usage-CcCEQNuc.js";
import "./commands-BoN6i4jC.js";
import "./pairing-store-CO6umWFP.js";
import "./login-qr-inSTZ8NE.js";
import "./pairing-labels-CHxlh3tT.js";
import "./channels-status-issues-DFhI_u0p.js";
import { n as ensurePluginRegistryLoaded } from "./command-options-xhWzHa3U.js";
import { a as getCommandPath, c as getPrimaryCommand, d as hasHelpOrVersion } from "./register.subclis-CdeahXR4.js";
import "./completion-cli-BWuOtUN5.js";
import "./gateway-rpc-C4zSXVRZ.js";
import "./deps-Ke8Wk1mJ.js";
import { h as assertSupportedRuntime } from "./daemon-runtime-BVwi2nj2.js";
import "./service-DDPRbf8a.js";
import "./systemd-BEWwfwn0.js";
import "./service-audit-BGqsD-4v.js";
import "./table-cCoGqLsk.js";
import "./widearea-dns-CMIG6-74.js";
import "./audit-BeEZVTyH.js";
import "./onboard-skills-CyV50h7M.js";
import "./health-format-D5LNzkMT.js";
import "./update-runner-Bo3SoIbq.js";
import "./github-copilot-auth-CM4JIr71.js";
import "./logging-DuK6YXuK.js";
import "./hooks-status-ByLEoE9W.js";
import "./status-mdNkh3Xx.js";
import "./skills-status-CqGyqEEo.js";
import "./tui-CcNcDhg7.js";
import "./agent-C_ARtktj.js";
import "./node-service-u8g85nD3.js";
import "./auth-health-Cx5exPMV.js";
import { a as findRoutedCommand, n as emitCliBanner, t as ensureConfigReady } from "./config-guard-5SP2o2KS.js";
import "./help-format-CUnac_bT.js";
import "./configure-M2Aby1j-.js";
import "./systemd-linger-CDo2UbHM.js";
import "./doctor-DJkozcSc.js";
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
	const { buildProgram } = await import("./program-MEjTp5XY.js");
	const program = buildProgram();
	installUnhandledRejectionHandler();
	process$1.on("uncaughtException", (error) => {
		console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
		process$1.exit(1);
	});
	const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
	const primary = getPrimaryCommand(parseArgv);
	if (primary) {
		const { registerSubCliByName } = await import("./register.subclis-CdeahXR4.js").then((n) => n.i);
		await registerSubCliByName(program, primary);
	}
	if (!(!primary && hasHelpOrVersion(parseArgv))) {
		const { registerPluginCliCommands } = await import("./cli-wkI93dUP.js");
		const { loadConfig } = await import("./config-BXK2Ocdw.js").then((n) => n.t);
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