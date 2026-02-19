import { C as setVerbose, O as isRich, k as theme, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-CLN7qdwL.js";
import { n as replaceCliName, r as resolveCliName } from "./command-format-ayFsmwwz.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import "./agent-scope-tDG9mXT6.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { M as VERSION } from "./config-BYXIxSeu.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-B_EbOpJr.js";
import "./chrome-D81-KU5p.js";
import "./control-service-BGzaLKe-.js";
import "./tailscale-DU6DgqVy.js";
import "./auth-BcNHFK-i.js";
import "./client-DMloFP_O.js";
import "./call-BVsSPFqZ.js";
import "./message-channel-BlgPSDAh.js";
import { t as formatDocsLink } from "./links-7M-j83As.js";
import "./plugin-auto-enable-D8FeubdD.js";
import "./plugins-w06Vb-by.js";
import "./logging-CfEk_PnX.js";
import "./accounts-C9CKH8EW.js";
import "./loader-BvVnSZJi.js";
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
import { n as resolveCliChannelOptions } from "./channel-options-QUuWwqa5.js";
import { a as getCommandPath, d as hasHelpOrVersion, l as getVerboseFlag } from "./register.subclis-DR1Sp5Rn.js";
import "./completion-cli-2ItpXD-U.js";
import "./gateway-rpc-KFfnfnoN.js";
import "./deps-DK7844Cb.js";
import "./daemon-runtime-PO6b9aOs.js";
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
import { t as forceFreePort } from "./ports-Cle7tMpt.js";
import "./auth-health-CnSJfOT4.js";
import { i as hasEmittedCliBanner, n as emitCliBanner, o as registerProgramCommands, r as formatCliBannerLine, t as ensureConfigReady } from "./config-guard-BDR9GTbx.js";
import "./help-format-CUnac_bT.js";
import "./configure-Daks_tts.js";
import "./systemd-linger-eO-4-yqy.js";
import "./doctor-DgO4lD9v.js";
import { Command } from "commander";

//#region src/cli/program/context.ts
function createProgramContext() {
	const channelOptions = resolveCliChannelOptions();
	return {
		programVersion: VERSION,
		channelOptions,
		messageChannelOptions: channelOptions.join("|"),
		agentChannelOptions: ["last", ...channelOptions].join("|")
	};
}

//#endregion
//#region src/cli/program/help.ts
const CLI_NAME = resolveCliName();
const EXAMPLES = [
	["openclaw channels login --verbose", "Link personal WhatsApp Web and show QR + connection logs."],
	["openclaw message send --target +15555550123 --message \"Hi\" --json", "Send via your web session and print JSON result."],
	["openclaw gateway --port 18789", "Run the WebSocket Gateway locally."],
	["openclaw --dev gateway", "Run a dev Gateway (isolated state/config) on ws://127.0.0.1:19001."],
	["openclaw gateway --force", "Kill anything bound to the default gateway port, then start it."],
	["openclaw gateway ...", "Gateway control via WebSocket."],
	["openclaw agent --to +15555550123 --message \"Run summary\" --deliver", "Talk directly to the agent using the Gateway; optionally send the WhatsApp reply."],
	["openclaw message send --channel telegram --target @mychat --message \"Hi\"", "Send via your Telegram bot."]
];
function configureProgramHelp(program, ctx) {
	program.name(CLI_NAME).description("").version(ctx.programVersion).option("--dev", "Dev profile: isolate state under ~/.openclaw-dev, default gateway port 19001, and shift derived ports (browser/canvas)").option("--profile <name>", "Use a named profile (isolates OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH under ~/.openclaw-<name>)");
	program.option("--no-color", "Disable ANSI colors", false);
	program.configureHelp({
		sortSubcommands: true,
		sortOptions: true,
		optionTerm: (option) => theme.option(option.flags),
		subcommandTerm: (cmd) => theme.command(cmd.name())
	});
	program.configureOutput({
		writeOut: (str) => {
			const colored = str.replace(/^Usage:/gm, theme.heading("Usage:")).replace(/^Options:/gm, theme.heading("Options:")).replace(/^Commands:/gm, theme.heading("Commands:"));
			process.stdout.write(colored);
		},
		writeErr: (str) => process.stderr.write(str),
		outputError: (str, write) => write(theme.error(str))
	});
	if (process.argv.includes("-V") || process.argv.includes("--version") || process.argv.includes("-v")) {
		console.log(ctx.programVersion);
		process.exit(0);
	}
	program.addHelpText("beforeAll", () => {
		if (hasEmittedCliBanner()) return "";
		const rich = isRich();
		return `\n${formatCliBannerLine(ctx.programVersion, { richTty: rich })}\n`;
	});
	const fmtExamples = EXAMPLES.map(([cmd, desc]) => `  ${theme.command(replaceCliName(cmd, CLI_NAME))}\n    ${theme.muted(desc)}`).join("\n");
	program.addHelpText("afterAll", ({ command }) => {
		if (command !== program) return "";
		const docs = formatDocsLink("/cli", "docs.openclaw.ai/cli");
		return `\n${theme.heading("Examples:")}\n${fmtExamples}\n\n${theme.muted("Docs:")} ${docs}\n`;
	});
}

//#endregion
//#region src/cli/program/preaction.ts
function setProcessTitleForCommand(actionCommand) {
	let current = actionCommand;
	while (current.parent && current.parent.parent) current = current.parent;
	const name = current.name();
	const cliName = resolveCliName();
	if (!name || name === cliName) return;
	process.title = `${cliName}-${name}`;
}
const PLUGIN_REQUIRED_COMMANDS = new Set([
	"message",
	"channels",
	"directory"
]);
function registerPreActionHooks(program, programVersion) {
	program.hook("preAction", async (_thisCommand, actionCommand) => {
		setProcessTitleForCommand(actionCommand);
		const argv = process.argv;
		if (hasHelpOrVersion(argv)) return;
		const commandPath = getCommandPath(argv, 2);
		if (!(isTruthyEnvValue(process.env.OPENCLAW_HIDE_BANNER) || commandPath[0] === "update" || commandPath[0] === "completion" || commandPath[0] === "plugins" && commandPath[1] === "update")) emitCliBanner(programVersion);
		const verbose = getVerboseFlag(argv, { includeDebug: true });
		setVerbose(verbose);
		if (!verbose) process.env.NODE_NO_WARNINGS ??= "1";
		if (commandPath[0] === "doctor" || commandPath[0] === "completion") return;
		await ensureConfigReady({
			runtime: defaultRuntime,
			commandPath
		});
		if (PLUGIN_REQUIRED_COMMANDS.has(commandPath[0])) ensurePluginRegistryLoaded();
	});
}

//#endregion
//#region src/cli/program/build-program.ts
function buildProgram() {
	const program = new Command();
	const ctx = createProgramContext();
	const argv = process.argv;
	configureProgramHelp(program, ctx);
	registerPreActionHooks(program, ctx.programVersion);
	registerProgramCommands(program, ctx, argv);
	return program;
}

//#endregion
export { buildProgram };