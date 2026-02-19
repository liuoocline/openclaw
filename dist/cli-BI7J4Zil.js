import { o as createSubsystemLogger } from "./entry.js";
import "./auth-profiles-FJ3VY25a.js";
import "./utils-Dk86IbEs.js";
import "./exec-B8JKbXKW.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-D3me2AZa.js";
import "./github-copilot-token-SLWintYd.js";
import "./pi-model-discovery-DzEIEgHL.js";
import { i as loadConfig } from "./config-BXK2Ocdw.js";
import "./manifest-registry-D5SiA3xq.js";
import "./server-context-lyNcqJYD.js";
import "./chrome-B2UjqY-9.js";
import "./control-service-Dwmi4Fwz.js";
import "./client-DMloFP_O.js";
import "./call-OvaClfky.js";
import "./message-channel-BlgPSDAh.js";
import "./links-7M-j83As.js";
import "./plugins-B7F0Ly9G.js";
import "./logging-CfEk_PnX.js";
import "./accounts-DbzMEfKN.js";
import { t as loadOpenClawPlugins } from "./loader-ByFLjGzH.js";
import "./progress-Da1ehW-x.js";
import "./prompt-style-Dc0C5HC9.js";
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