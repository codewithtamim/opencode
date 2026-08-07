#!/usr/bin/env bun

import path from "node:path"

const args = process.argv.slice(2)
const usage = "Usage: bun run script/install-local.ts [--bin-dir <dir>] [--skip-embed-web-ui]"

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage)
  process.exit(0)
}

const binDir = args.includes("--bin-dir") ? args[args.indexOf("--bin-dir") + 1] : path.join(process.env.HOME ?? "", ".opencode", "bin")
if (!binDir || (args.includes("--bin-dir") && args[args.indexOf("--bin-dir") + 1] === undefined)) {
  console.error(usage)
  process.exit(1)
}

const root = path.resolve(import.meta.dir, "..")
const osName = process.platform === "win32" ? "windows" : process.platform
const binaryName = `opencode-${osName}-${process.arch}`
const builtBinary = path.join(root, "packages", "opencode", "dist", binaryName, "bin", "opencode")

const buildArgs = ["run", "--cwd", "packages/opencode", "build", "--single", "--skip-install"]
if (args.includes("--skip-embed-web-ui")) buildArgs.push("--skip-embed-web-ui")
if (args.includes("--sourcemaps")) buildArgs.push("--sourcemaps")

console.log(`Building ${binaryName} for current platform...`)
const build = Bun.spawn([process.execPath, ...buildArgs], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
})
const buildCode = await build.exited
if (buildCode !== 0) process.exit(buildCode)

await Bun.$`mkdir -p ${binDir}`
await Bun.write(path.join(binDir, "opencode"), Bun.file(builtBinary))
await Bun.write(path.join(binDir, "oc"), Bun.file(builtBinary))
await Bun.$`codesign --force -s - ${path.join(binDir, "opencode")} ${path.join(binDir, "oc")}`

const version = (await Bun.$`${path.join(binDir, "opencode")} --version`.text()).trim()
console.log(`Installed local build (${version}) to ${binDir}/opencode and ${binDir}/oc`)
