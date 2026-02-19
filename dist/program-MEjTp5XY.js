import { C as setVerbose, O as isRich, k as theme, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-FJ3VY25a.js";
import { n as replaceCliName, r as resolveCliName } from "./command-format-ayFsmwwz.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import "./agent-scope-D3me2AZa.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { M as VERSION } from "./config-BXK2Ocdw.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-lyNcqJYD.js";
import "./chrome-B2UjqY-9.js";
import "./control-service-Dwmi4Fwz.js";
import "./tailscale-DU6DgqVy.js";
import "./auth-BcNHFK-i.js";
import "./client-DMloFP_O.js";
import "./call-OvaClfky.js";
import "./message-channel-BlgPSDAh.js";
import { t as formatDocsLink } from "./links-7M-j83As.js";
import "./plugin-auto-enable-BROgMZcf.js";
import "./plugins-B7F0Ly9G.js";
import "./logging-CfEk_PnX.js";
import "./accounts-DbzMEfKN.js";
import "./loader-BiT4rSNx.js";
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
import { n as resolveCliChannelOptions } from "./channel-options-BulSEddO.js";
import { a as getCommandPath, d as hasHelpOrVersion, l as getVerboseFlag } from "./register.subclis-CdeahXR4.js";
import "./completion-cli-BWuOtUN5.js";
import "./gateway-rpc-C4zSXVRZ.js";
import "./deps-Ke8Wk1mJ.js";
import "./daemon-runtime-BVwi2nj2.js";
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
import { t as forceFreePort } from "./ports-kYsTYQdA.js";
import "./auth-health-Cx5exPMV.js";
import { i as hasEmittedCliBanner, n as emitCliBanner, o as registerProgramCommands, r as formatCliBannerLine, t as ensureConfigReady } from "./config-guard-5SP2o2KS.js";
import "./help-format-CUnac_bT.js";
import "./configure-M2Aby1j-.js";
import "./systemd-linger-CDo2UbHM.js";
import "./doctor-DJkozcSc.js";
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