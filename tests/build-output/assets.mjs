import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const distRoot = path.join(repoRoot, "dist");
const iconAssetVersion = "logo11-20260617";

function readDistText(relativePath) {
  return readFileSync(path.join(distRoot, relativePath), "utf8");
}

function distPathFor(assetUrl) {
  const cleanPath = assetUrl.split("?")[0].replace(/^\.?\//, "");
  return path.join(distRoot, cleanPath);
}

function assertDistFile(assetUrl) {
  assert.ok(existsSync(distPathFor(assetUrl)), `missing dist asset: ${assetUrl}`);
}

test("dist files have build id placeholders replaced consistently", () => {
  const html = readDistText("index.html");
  const serviceWorker = readDistText("sw.js");
  const manifest = readDistText("manifest.webmanifest");

  for (const content of [html, serviceWorker, manifest]) {
    assert.equal(content.includes("%XSHOW_BUILD_ID%"), false);
    assert.equal(content.includes("__XSHOW_BUILD_ID__"), false);
  }

  const buildId = html.match(/<meta name="xshow-build-id" content="([^"]+)"/)?.[1];
  assert.ok(buildId);
  assert.ok(buildId.length >= 3);
  assert.ok(serviceWorker.includes(`const BUILD_ID = "${buildId}";`));
  assert.ok(manifest.includes(`v=${buildId}-${iconAssetVersion}`));
});

test("dist index and service worker reference assets that exist after build", () => {
  const html = readDistText("index.html");
  const serviceWorker = readDistText("sw.js");

  const htmlAssets = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => asset.startsWith("./") || asset.startsWith("/"));
  const serviceWorkerAssets = [
    ...[...serviceWorker.matchAll(/versioned\("([^"]+)"\)/g)].map((match) => match[1]),
    ...[...serviceWorker.matchAll(/^\s+"([^"]+)",?$/gm)].map((match) => match[1]),
  ].filter((asset) => asset !== "/" && asset !== "/index.html");

  for (const asset of [...htmlAssets, ...serviceWorkerAssets]) {
    assertDistFile(asset);
  }
});
