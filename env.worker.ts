/**
 * BullMQ worker ve tsx CLI için ortam değişkenleri.
 * Next.js ile aynı sıra: önce `.env`, sonra `.env.local` (override).
 * `REDIS_URL` veya DB sadece `.env.local` içindeyse worker'ın bunları görmesi gerekir.
 *
 * Yol: `process.cwd()` yerine bu dosyanın bulunduğu proje kökü (worker başka dizinden
 * çalıştırılsa bile `.env` bulunur).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(projectRoot, '.env') })
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true })
