#!/usr/bin/env node
/**
 * patch-all-exports.js
 *
 * Patches all package.json files in node_modules that have "exports" entries
 * with only "import" condition (no "default" or "require"). Adds a "default"
 * condition pointing to the same file as "import".
 *
 * This is needed because jiti (the TypeScript runtime used for loading OpenClaw
 * plugins/extensions) uses CJS-style require() internally, which doesn't match
 * the "import" condition in package.json exports. Adding "default" makes these
 * packages resolvable by jiti.
 *
 * Usage:
 *   node patch-all-exports.js [node_modules_path]
 *   Default: /usr/lib/node_modules/openclaw/node_modules
 */

const fs = require("node:fs");
const path = require("node:path");

const nodeModulesDir = process.argv[2] || "/usr/lib/node_modules/openclaw/node_modules";

let patchedPackages = 0;
let patchedEntries = 0;

function patchExportsObject(exports) {
  if (!exports || typeof exports !== "object") return false;
  let changed = false;

  for (const [key, value] of Object.entries(exports)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (value.import && !value.default && !value.require) {
        value.default = value.import;
        changed = true;
        patchedEntries++;
      }
      // Recurse into nested conditions
      if (patchExportsObject(value)) {
        changed = true;
      }
    }
  }
  return changed;
}

function walkNodeModules(dir, depth = 0) {
  if (depth > 3) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.name.startsWith("@")) {
      // Scoped package — recurse into scope dir
      walkNodeModules(fullPath, depth);
      continue;
    }

    const pkgJsonPath = path.join(fullPath, "package.json");
    try {
      if (!fs.existsSync(pkgJsonPath)) continue;
      const raw = fs.readFileSync(pkgJsonPath, "utf8");
      const pkg = JSON.parse(raw);

      if (!pkg.exports) continue;

      const beforeEntries = patchedEntries;
      const changed = patchExportsObject(pkg.exports);

      if (changed) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        const count = patchedEntries - beforeEntries;
        console.log(`  patched ${pkg.name || entry.name} (${count} entries)`);
        patchedPackages++;
      }
    } catch {
      // skip unreadable packages
    }

    // Recurse into nested node_modules
    const nested = path.join(fullPath, "node_modules");
    if (fs.existsSync(nested)) {
      walkNodeModules(nested, depth + 1);
    }
  }
}

console.log(`Patching exports in: ${nodeModulesDir}`);
walkNodeModules(nodeModulesDir);
console.log(`Done. Patched ${patchedPackages} packages (${patchedEntries} export entries).`);
