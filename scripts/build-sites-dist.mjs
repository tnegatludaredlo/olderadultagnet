import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const serverRoot = path.join(distRoot, "server");

const EXCLUDED = new Set([
  ".git",
  ".codex",
  ".agents",
  ".DS_Store",
  "dist",
  "node_modules",
]);

async function copyRecursive(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED.has(entry.name)) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await cp(sourcePath, targetPath);
    }
  }
}

const workerSource = `
const HTML_FALLBACK = "/index.html";

function buildRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

async function fetchAsset(env, request, pathname) {
  return env.ASSETS.fetch(buildRequest(request, pathname));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    let response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    if (pathname === "/") {
      return fetchAsset(env, request, HTML_FALLBACK);
    }

    if (!pathname.includes(".")) {
      response = await fetchAsset(env, request, pathname.replace(/\\/?$/, "/index.html"));
      if (response.status !== 404) return response;

      response = await fetchAsset(env, request, pathname + ".html");
      if (response.status !== 404) return response;
    }

    return new Response("Not found", { status: 404 });
  },
};
`.trimStart();

await rm(distRoot, { recursive: true, force: true });
await mkdir(serverRoot, { recursive: true });
await copyRecursive(projectRoot, distRoot);

await rm(path.join(distRoot, "server"), { recursive: true, force: true });
await mkdir(serverRoot, { recursive: true });
await writeFile(path.join(serverRoot, "index.js"), workerSource, "utf8");

const distStat = await stat(path.join(distRoot, "index.html"));
if (!distStat.isFile()) {
  throw new Error("dist/index.html was not generated");
}

console.log("Built dist for Sites deployment.");
