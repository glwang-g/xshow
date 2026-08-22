import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

test("optional Rubik renderer and solver stay behind their exploration route", () => {
  const assets = readdirSync(path.join(distRoot, "assets"));
  const rubikAsset = assets.find((asset) => asset.startsWith("RubiksCube-") && asset.endsWith(".js"));
  const rendererAsset = assets.find((asset) => asset.startsWith("three-renderer-") && asset.endsWith(".js"));
  const solverAsset = assets.find((asset) => asset.startsWith("cube-solver-") && asset.endsWith(".js"));

  assert.ok(rubikAsset);
  assert.ok(rendererAsset);
  assert.ok(solverAsset);
  const rubikSource = readDistText(`assets/${rubikAsset}`);
  assert.match(rubikSource, new RegExp(`\\./${rendererAsset}`));
  assert.match(rubikSource, new RegExp(`\\./${solverAsset}`));
  assert.equal(readDistText("index.html").includes(rendererAsset), false);
  assert.equal(readDistText("index.html").includes(solverAsset), false);
});

test("workbench palette and status panel stay behind on-demand imports", () => {
  const assets = readdirSync(path.join(distRoot, "assets"));
  const homeAsset = assets.find((asset) => asset.startsWith("Home-") && asset.endsWith(".js"));
  const paletteAsset = assets.find((asset) => asset.startsWith("ComponentPalette-") && asset.endsWith(".js"));
  const statusPanelAsset = assets.find((asset) => asset.startsWith("StatusPanel-") && asset.endsWith(".js"));

  assert.ok(homeAsset);
  assert.ok(paletteAsset);
  assert.ok(statusPanelAsset);

  const homeSource = readDistText(`assets/${homeAsset}`);
  for (const asset of [paletteAsset, statusPanelAsset]) {
    assert.match(homeSource, new RegExp(`import\\("\\./${asset}"\\)`));
    assert.doesNotMatch(homeSource, new RegExp(`from"\\./${asset}"`));
  }
});
