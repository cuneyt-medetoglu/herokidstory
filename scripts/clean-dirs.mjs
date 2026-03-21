/**
 * rimraf/npx bağımlılığı olmadan dizin siler (deploy: clean:all için).
 * Node 14.14+ fs.rmSync
 */
import fs from 'node:fs'
import path from 'node:path'

const dirs = process.argv.slice(2)
if (dirs.length === 0) {
  console.error('Kullanım: node scripts/clean-dirs.mjs <dizin> [...]')
  process.exit(1)
}

const root = process.cwd()
for (const d of dirs) {
  const p = path.join(root, d)
  try {
    fs.rmSync(p, { recursive: true, force: true })
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') continue
    throw e
  }
}
