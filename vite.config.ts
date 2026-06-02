import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vite";

function resolveBuildId() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }

  try {
    return execSync("git rev-parse --short=12 HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

const buildId = resolveBuildId();

function xshowBuildIdPlugin(): Plugin {
  return {
    name: "xshow-build-id",
    transformIndexHtml(html) {
      return html.replaceAll("%XSHOW_BUILD_ID%", buildId);
    },
    closeBundle() {
      for (const file of ["sw.js", "manifest.webmanifest"]) {
        const filePath = path.resolve(__dirname, "dist", file);

        if (!fs.existsSync(filePath)) {
          continue;
        }

        fs.writeFileSync(
          filePath,
          fs.readFileSync(filePath, "utf8").replaceAll("__XSHOW_BUILD_ID__", buildId),
        );
      }
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    "import.meta.env.VITE_XSHOW_BUILD_ID": JSON.stringify(buildId),
  },
  plugins: [vue(), xshowBuildIdPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
