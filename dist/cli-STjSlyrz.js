import "./paths-DVBShlw6.js";
import { t as createSubsystemLogger } from "./subsystem-DPnkvS73.js";
import "./utils-BTaR--Ln.js";
import "./pi-embedded-helpers-DXojJlR9.js";
import { ut as loadOpenClawPlugins } from "./reply-CidCVX8G.js";
import "./exec-DFOtZbI0.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-DnyDZ5RH.js";
import "./model-selection-DbsbOAoh.js";
import "./github-copilot-token-BW-SEg7E.js";
import "./boolean-BgXe2hyu.js";
import "./env-B5YXooWp.js";
import { i as loadConfig } from "./config-Bj2eDa02.js";
import "./manifest-registry-DyMRD3rY.js";
import "./plugins-CQw3z3Nw.js";
import "./sandbox-qt49csTr.js";
import "./image-v9SPyzQ7.js";
import "./pi-model-discovery-CV2V1HHz.js";
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
import "./deliver-CQakkcfN.js";
import "./dispatcher-BfXtm4Dl.js";
import "./manager-C-jXr9ks.js";
import "./sqlite-cSdsHVEw.js";
import "./tui-formatters-AXKLnvYF.js";
import "./client-C0gQ7hrj.js";
import "./call-CM25qgxz.js";
import "./login-qr-CJ__cE3-.js";
import "./pairing-store-BpPUNzmB.js";
import "./links-Dg90NTyF.js";
import "./progress-COzt9PNY.js";
import "./pi-tools.policy-gG96mWwA.js";
import "./prompt-style-DjZDxcFg.js";
import "./pairing-labels-xImhiJax.js";
import "./session-cost-usage-PvyVZz-g.js";
import "./control-service-BDgF-FZ0.js";
import "./channel-selection-DPV9hvY8.js";

//#region src/plugins/cli.ts
const log = createSubsystemLogger("plugins");
function registerPluginCliCommands(program, cfg) {
	const config = cfg ?? loadConfig();
	const workspaceDir = resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	const logger = {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
	const registry = loadOpenClawPlugins({
		config,
		workspaceDir,
		logger
	});
	const existingCommands = new Set(program.commands.map((cmd) => cmd.name()));
	for (const entry of registry.cliRegistrars) {
		if (entry.commands.length > 0) {
			const overlaps = entry.commands.filter((command) => existingCommands.has(command));
			if (overlaps.length > 0) {
				log.debug(`plugin CLI register skipped (${entry.pluginId}): command already registered (${overlaps.join(", ")})`);
				continue;
			}
		}
		try {
			const result = entry.register({
				program,
				config,
				workspaceDir,
				logger
			});
			if (result && typeof result.then === "function") result.catch((err) => {
				log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
			});
			for (const command of entry.commands) existingCommands.add(command);
		} catch (err) {
			log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
		}
	}
}

//#endregion
export { registerPluginCliCommands };