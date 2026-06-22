import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicRoot = path.join(repoRoot, "public");
const iconAssetVersion = "logo11-20260617";

const readText = (relativePath) =>
  readFile(path.join(repoRoot, relativePath), "utf8");

const publicPathFor = (href) => {
  const assetPath = href.split("?")[0].replace(/^\.?\//, "");
  return path.join(publicRoot, assetPath);
};

const assertPublicFile = (href) => {
  const filename = publicPathFor(href);
  assert.ok(existsSync(filename), `missing public asset: ${href}`);
  return filename;
};

const pngSize = (filename) => {
  const buffer = readFileSync(filename);
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const icoSizes = (filename) => {
  const buffer = readFileSync(filename);
  assert.equal(buffer.readUInt16LE(0), 0);
  assert.equal(buffer.readUInt16LE(2), 1);

  const count = buffer.readUInt16LE(4);
  const sizes = [];
  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    const width = buffer[offset] || 256;
    const height = buffer[offset + 1] || 256;
    sizes.push(`${width}x${height}`);
  }

  return sizes;
};

test("manifest icon entries point at existing logo11 assets with matching PNG dimensions", async () => {
  const manifest = JSON.parse(await readText("public/manifest.webmanifest"));

  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length >= 4);

  for (const icon of manifest.icons) {
    assert.match(icon.src, /__XSHOW_BUILD_ID__-logo11-20260617/);
    assert.match(icon.type, /^image\/png$/);

    const [expectedWidth, expectedHeight] = icon.sizes
      .split("x")
      .map((value) => Number.parseInt(value, 10));
    const filename = assertPublicFile(icon.src);

    assert.deepEqual(pngSize(filename), {
      width: expectedWidth,
      height: expectedHeight,
    });
  }
});

test("index html keeps the selected logo11 assets wired into browser metadata", async () => {
  const html = await readText("index.html");
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

  assert.match(html, /name="xshow-build-id" content="%XSHOW_BUILD_ID%"/);
  assert.ok(
    hrefs.some((href) =>
      href.includes(`manifest.webmanifest?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );
  assert.ok(
    hrefs.some((href) =>
      href.includes(`favicon.ico?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );
  assert.ok(
    hrefs.some((href) =>
      href.includes(`favicon-32x32.png?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );
  assert.ok(
    hrefs.some((href) =>
      href.includes(`favicon-16x16.png?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );
  assert.ok(
    hrefs.some((href) =>
      href.includes(`app-icon.svg?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );
  assert.ok(
    hrefs.some((href) =>
      href.includes(`apple-touch-icon.png?v=%XSHOW_BUILD_ID%-${iconAssetVersion}`),
    ),
  );

  for (const href of hrefs.filter((href) => href.includes("/img/icons/"))) {
    assertPublicFile(href);
  }
});

test("service worker precache shell references existing icon and offline assets", async () => {
  const serviceWorker = await readText("public/sw.js");
  const versionedAssets = [
    ...serviceWorker.matchAll(/versioned\("([^"]+)"\)/g),
  ].map((match) => match[1]);
  const rawShellAssets = [
    ...serviceWorker.matchAll(/^\s+"([^"]+)",?$/gm),
  ].map((match) => match[1]);

  assert.match(
    serviceWorker,
    /const ICON_ASSET_VERSION = "logo11-20260617";/,
  );
  assert.ok(versionedAssets.includes("/manifest.webmanifest"));
  assert.ok(versionedAssets.includes("/favicon.ico"));
  assert.ok(versionedAssets.includes("/img/icons/app-icon.svg"));
  assert.ok(rawShellAssets.includes("/offline.html"));

  for (const asset of [...versionedAssets, ...rawShellAssets].filter(
    (asset) => asset !== "/" && asset !== "/index.html",
  )) {
    assertPublicFile(asset);
  }
});

test("favicon and vector fallback remain suitable for small browser surfaces", async () => {
  const faviconSizes = icoSizes(path.join(publicRoot, "favicon.ico"));
  assert.ok(faviconSizes.includes("16x16"));
  assert.ok(faviconSizes.includes("32x32"));

  const appIconSvg = await readText("public/img/icons/app-icon.svg");
  assert.match(appIconSvg, /viewBox="0 0 512 512"/);
  assert.match(appIconSvg, /data:image\/png;base64,/);
});
