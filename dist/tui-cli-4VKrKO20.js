import "./paths-DVBShlw6.js";
import { R as theme, c as defaultRuntime } from "./subsystem-DPnkvS73.js";
import "./utils-BTaR--Ln.js";
import "./pi-embedded-helpers-DXojJlR9.js";
import "./exec-DFOtZbI0.js";
import "./agent-scope-DnyDZ5RH.js";
import "./model-selection-DbsbOAoh.js";
import "./github-copilot-token-BW-SEg7E.js";
import "./boolean-BgXe2hyu.js";
import "./env-B5YXooWp.js";
import "./config-Bj2eDa02.js";
import "./manifest-registry-DyMRD3rY.js";
import "./plugins-CQw3z3Nw.js";
import "./sandbox-qt49csTr.js";
import "./chrome-COabMr6f.js";
import "./skills-_eKGrw9z.js";
import "./routes-BrWrBk2R.js";
import "./server-context-39mkstUs.js";
import "./message-channel-CHRYQtAM.js";
import "./logging-BzvBIA3Y.js";
import "./accounts-MyAvfCVH.js";
import "./paths-Bkhd_qY8.js";
import "./redact-DAKeu7PA.js";
import "./tool-display-DNOVCI6J.js";
import "./tui-formatters-AXKLnvYF.js";
import "./client-C0gQ7hrj.js";
import "./call-CM25qgxz.js";
import { t as formatDocsLink } from "./links-Dg90NTyF.js";
import { t as parseTimeoutMs } from "./parse-timeout-DV8NQQWk.js";
import { t as runTui } from "./tui-C_cmtaaT.js";

//#region src/cli/tui-cli.ts
function registerTuiCli(program) {
	program.command("tui").description("Open a terminal UI connected to the Gateway").option("--url <url>", "Gateway WebSocket URL (defaults to gateway.remote.url when configured)").option("--token <token>", "Gateway token (if required)").option("--password <password>", "Gateway password (if required)").option("--session <key>", "Session key (default: \"main\", or \"global\" when scope is global)").option("--deliver", "Deliver assistant replies", false).option("--thinking <level>", "Thinking level override").option("--message <text>", "Send an initial message after connecting").option("--timeout-ms <ms>", "Agent timeout in ms (defaults to agents.defaults.timeoutSeconds)").option("--history-limit <n>", "History entries to load", "200").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/tui", "docs.openclaw.ai/cli/tui")}\n`).action(async (opts) => {
		try {
			const timeoutMs = parseTimeoutMs(opts.timeoutMs);
			if (opts.timeoutMs !== void 0 && timeoutMs === void 0) defaultRuntime.error(`warning: invalid --timeout-ms "${String(opts.timeoutMs)}"; ignoring`);
			const historyLimit = Number.parseInt(String(opts.historyLimit ?? "200"), 10);
			await runTui({
				url: opts.url,
				token: opts.token,
				password: opts.password,
				session: opts.session,
				deliver: Boolean(opts.deliver),
				thinking: opts.thinking,
				message: opts.message,
				timeoutMs,
				historyLimit: Number.isNaN(historyLimit) ? void 0 : historyLimit
			});
		} catch (err) {
			defaultRuntime.error(String(err));
			defaultRuntime.exit(1);
		}
	});
}

//#endregion
export { registerTuiCli };