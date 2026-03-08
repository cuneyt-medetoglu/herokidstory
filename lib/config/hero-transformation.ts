/**
 * Hero "Your Child, The Hero" – Konfigürasyon
 * Görseller build time'da scripts/optimize-hero-images.mjs ile webp'ye dönüştürülür (public/hero-transformation/optimized/).
 * Yeni görsel eklerken: docs/guides/HERO_IMAGES_OPTIMIZATION_GUIDE.md
 * Bkz. docs/guides/HERO_YOUR_CHILD_THE_HERO_IMAGES_ANALYSIS.md
 */

import type { LucideIcon } from "lucide-react"
import { Rocket, TreePine, Castle } from "lucide-react"

export type HeroTransformationItem = {
  id: string
  name: string
  icon: LucideIcon
  gradient: string
  sparkleColors: string[]
  realPhoto: { src: string; name: string; age: string }
  storyCharacter: { src: string }
}

export const heroTransformationConfig: HeroTransformationItem[] = [
  {
    id: "forest",
    name: "Forest Journey",
    icon: TreePine,
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    sparkleColors: ["#10b981", "#22c55e", "#84cc16"],
    realPhoto: { src: "/hero-transformation/optimized/arya-real.webp", name: "Arya", age: "Age 1" },
    storyCharacter: { src: "/hero-transformation/optimized/arya-forest.webp" },
  },
  {
    id: "space",
    name: "Space Adventure",
    icon: Rocket,
    gradient: "from-indigo-600 via-purple-600 to-blue-600",
    sparkleColors: ["#818cf8", "#c084fc", "#60a5fa"],
    realPhoto: { src: "/hero-transformation/optimized/arya-real.webp", name: "Arya", age: "Age 1" },
    storyCharacter: { src: "/hero-transformation/optimized/arya-space.webp" },
  },
  {
    id: "castle",
    name: "Magical Castle",
    icon: Castle,
    gradient: "from-pink-500 via-purple-500 to-rose-500",
    sparkleColors: ["#ec4899", "#a855f7", "#f43f5e"],
    realPhoto: { src: "/hero-transformation/optimized/arya-real.webp", name: "Arya", age: "Age 1" },
    storyCharacter: { src: "/hero-transformation/optimized/arya-castle.webp" },
  },
  {
    id: "dinosaur",
    name: "Dinosaur Jungle",
    icon: TreePine,
    gradient: "from-amber-600 via-green-600 to-lime-500",
    sparkleColors: ["#eab308", "#22c55e", "#84cc16"],
    realPhoto: { src: "/hero-transformation/optimized/arya-real.webp", name: "Arya", age: "Age 1" },
    storyCharacter: { src: "/hero-transformation/optimized/arya-dinosaur.webp" },
  },
]
