import sharp from "sharp"
import { existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const images = [
  {
    input: "public/hero-transformation/real/arya.png",
    output: "public/hero-transformation/optimized/arya-real.webp",
  },
  {
    input: "public/hero-transformation/stories/arya-forest.jpg",
    output: "public/hero-transformation/optimized/arya-forest.webp",
  },
  {
    input: "public/hero-transformation/stories/arya-space.jpg",
    output: "public/hero-transformation/optimized/arya-space.webp",
  },
  {
    input: "public/hero-transformation/stories/arya-castle.jpg",
    output: "public/hero-transformation/optimized/arya-castle.webp",
  },
  {
    input: "public/hero-transformation/stories/arya-dinosaur.jpg",
    output: "public/hero-transformation/optimized/arya-dinosaur.webp",
  },
]

const outputDir = join(ROOT, "public/hero-transformation/optimized")
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

for (const { input, output } of images) {
  const inputPath = join(ROOT, input)
  const outputPath = join(ROOT, output)

  await sharp(inputPath)
    .resize(800, 800, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outputPath)

  console.log(`✅ ${output}`)
}

console.log("\n🎉 Tüm görseller optimize edildi.")
