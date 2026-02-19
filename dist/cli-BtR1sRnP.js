import { o as createSubsystemLogger } from "./entry.js";
import "./auth-profiles-CLN7qdwL.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-tDG9mXT6.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { i as loadConfig } from "./config-BYXIxSeu.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-B_EbOpJr.js";
import "./chrome-D81-KU5p.js";
import "./control-service-BGzaLKe-.js";
import "./client-DMloFP_O.js";
import "./call-BVsSPFqZ.js";
import "./message-channel-BlgPSDAh.js";
import "./links-7M-j83As.js";
import "./plugins-w06Vb-by.js";
import "./logging-CfEk_PnX.js";
import "./accounts-C9CKH8EW.js";
import { t as loadOpenClawPlugins } from "./loader-BvVnSZJi.js";
import "./progress-Da1ehW-x.js";
import "./prompt-style-Dc0C5HC9.js";
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