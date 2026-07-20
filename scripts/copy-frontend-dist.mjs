import { cp, rm, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cwd = path.resolve(process.cwd())
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

const rootSourceDir = path.join(repoRoot, 'apps', 'frontend', 'dist')
const localSourceDir = path.join(cwd, 'dist')
const rootTargetDir = path.join(repoRoot, 'dist')
const localTargetDir = path.join(cwd, '..', 'dist')

async function exists(dir) {
  try {
    await access(dir, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function main() {
  const sourceDir = (await exists(rootSourceDir)) ? rootSourceDir : localSourceDir
  const targetDir = sourceDir === rootSourceDir ? rootTargetDir : localTargetDir

  if (!(await exists(sourceDir))) {
    throw new Error(`Frontend build output not found at ${sourceDir}`)
  }

  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
