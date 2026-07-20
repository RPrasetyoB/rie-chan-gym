import { cp, rm, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd())
const sourceDir = path.join(rootDir, 'apps', 'frontend', 'dist')
const targetDir = path.join(rootDir, 'dist')

async function exists(dir) {
  try {
    await access(dir, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function main() {
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
