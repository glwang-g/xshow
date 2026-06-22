import { readFile } from "node:fs/promises";
import { transformWithEsbuild } from "vite";

export async function compiledModuleUrl(path, baseUrl, replacements = []) {
  let source = await readFile(new URL(path, baseUrl), "utf8");
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to);
  }

  const { code } = await transformWithEsbuild(source, path, {
    format: "esm",
    loader: "ts",
  });
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
