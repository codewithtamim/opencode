import { rm } from "node:fs/promises"
import { Global } from "@opencode-ai/core/global"

// Mirrors `opencode uninstall` removal targets, but keeps the binary and
// shell config untouched. Removes database (under data), KV + TUI state
// (under state), cache, and configs so the next launch starts fresh.
export async function factoryReset(
  targets: string[] = [Global.Path.data, Global.Path.cache, Global.Path.config, Global.Path.state],
) {
  const removed: string[] = []
  for (const target of targets) {
    await rm(target, { recursive: true, force: true }).catch(() => undefined)
    removed.push(target)
  }
  return removed
}
