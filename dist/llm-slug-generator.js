import "./paths-BZtyHNCi.js";
import "./utils-dp_OM900.js";
import "./exec-CiH_vkWn.js";
import { c as resolveDefaultAgentId, r as resolveAgentDir, s as resolveAgentWorkspaceDir } from "./agent-scope-Dp8sREli.js";
import "./deliver-CTPB-_j4.js";
import { t as runEmbeddedPiAgent } from "./pi-embedded-DtG2WV1D.js";
import "./pi-embedded-helpers-Cur6BUxk.js";
import "./boolean-M-esQJt6.js";
import "./model-auth-BqjMkNFs.js";
import "./config-ethqi73X.js";
import "./github-copilot-token-C9IJh2Pn.js";
import "./pi-model-discovery-DzFOAbQt.js";
import "./chrome-3G45nnOm.js";
import "./frontmatter-xwTm0734.js";
import "./paths-MnZaxqPw.js";
import "./image-BP7Tz23r.js";
import "./manager-D2Ndphg3.js";
import "./sqlite-Bwo2rASR.js";
import "./redact-BRmQPYDR.js";
import "./login-qr-BVeOFfNW.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

//#region src/hooks/llm-slug-generator.ts
/**
* LLM-based slug generator for session memory filenames
*/
/**
* Generate a short 1-2 word filename slug from session content using LLM
*/
async function generateSlugViaLLM(params) {
	let tempSessionFile = null;
	try {
		const agentId = resolveDefaultAgentId(params.cfg);
		const workspaceDir = resolveAgentWorkspaceDir(params.cfg, agentId);
		const agentDir = resolveAgentDir(params.cfg, agentId);
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-slug-"));
		tempSessionFile = path.join(tempDir, "session.jsonl");
		const prompt = `Based on this conversation, generate a short 1-2 word filename slug (lowercase, hyphen-separated, no file extension).

Conversation summary:
${params.sessionContent.slice(0, 2e3)}

Reply with ONLY the slug, nothing else. Examples: "vendor-pitch", "api-design", "bug-fix"`;
		const result = await runEmbeddedPiAgent({
			sessionId: `slug-generator-${Date.now()}`,
			sessionKey: "temp:slug-generator",
			agentId,
			sessionFile: tempSessionFile,
			workspaceDir,
			agentDir,
			config: params.cfg,
			prompt,
			timeoutMs: 15e3,
			runId: `slug-gen-${Date.now()}`
		});
		if (result.payloads && result.payloads.length > 0) {
			const text = result.payloads[0]?.text;
			if (text) return text.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || null;
		}
		return null;
	} catch (err) {
		console.error("[llm-slug-generator] Failed to generate slug:", err);
		return null;
	} finally {
		if (tempSessionFile) try {
			await fs.rm(path.dirname(tempSessionFile), {
				recursive: true,
				force: true
			});
		} catch {}
	}
}

//#endregion
export { generateSlugViaLLM };