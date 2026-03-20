"use client"

import type React from "react"

import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Upload,
  X,
  CheckCircle,
  Star,
  Heart,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Plus,
  Sparkles,
  Info,
} from "lucide-react"
import { Link, useRouter } from "@/i18n/navigation"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import {
  persistWizardData,
  readWizardFormMirror,
  readWizardLocal,
} from "@/lib/herokid-wizard-storage"
import { useTranslations } from "next-intl"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Character Type System (Group-based)
type CharacterGroup = "Child" | "Pets" | "Family Members" | "Toys" | "Other"

const HAIR_COLOR_VALUES = [
  "light-blonde",
  "blonde",
  "dark-blonde",
  "black",
  "brown",
  "red",
  "white",
] as const

const HAIR_VALUE_TO_STEP1_KEY: Record<(typeof HAIR_COLOR_VALUES)[number], string> = {
  "light-blonde": "lightBlonde",
  blonde: "blonde",
  "dark-blonde": "darkBlonde",
  black: "black",
  brown: "brown",
  red: "red",
  white: "white",
}

const EYE_COLOR_VALUES = ["blue", "green", "brown", "black", "hazel"] as const

type CharacterTypeInfo = {
  group: CharacterGroup
  value: string // "Dog", "Mom", "Custom Text", etc.
  displayName: string // "Dog", "Mom", "My Uncle", etc.
}

type Character = {
  id: string
  characterType: CharacterTypeInfo
  name?: string // Optional name for non-child characters
  // Child-specific details (only for Child characters)
  age?: number
  gender?: "boy" | "girl"
  hairColor?: string
  eyeColor?: string
  uploadedFile: File | null
  previewUrl: string | null
  uploadError: string | null
  isDragging: boolean
}

// Character Options Configuration (values stay English for storage/API)
const CHARACTER_OPTIONS = {
  Child: {
    value: "Child",
  },
  Pets: {
    options: ["Dog", "Cat", "Rabbit", "Bird", "Other Pet"],
  },
  FamilyMembers: {
    options: ["Mom", "Dad", "Grandma", "Grandpa", "Sister", "Brother", "Uncle", "Aunt", "Other Family"],
  },
  Toys: {
    options: [
      "Teddy Bear",
      "Doll",
      "Action Figure",
      "Robot",
      "Car",
      "Train",
      "Ball",
      "Blocks",
      "Puzzle",
      "Stuffed Animal",
      "Other Toy",
    ],
  },
  Other: {
    hasInput: true,
  },
} as const

/** Maps stored English option values to create.step2.optionLabels keys */
const OPTION_VALUE_TO_LABEL_KEY: Record<string, string> = {
  Child: "child",
  Dog: "dog",
  Cat: "cat",
  Rabbit: "rabbit",
  Bird: "bird",
  "Other Pet": "otherPet",
  Mom: "mom",
  Dad: "dad",
  Grandma: "grandma",
  Grandpa: "grandpa",
  Sister: "sister",
  Brother: "brother",
  Uncle: "uncle",
  Aunt: "aunt",
  "Other Family": "otherFamily",
  "Teddy Bear": "teddyBear",
  Doll: "doll",
  "Action Figure": "actionFigure",
  Robot: "robot",
  Car: "car",
  Train: "train",
  Ball: "ball",
  Blocks: "blocks",
  Puzzle: "puzzle",
  "Stuffed Animal": "stuffedAnimal",
  "Other Toy": "otherToy",
}

/** Maximum number of characters (main + additional) in book creation. */
const MAX_CHARACTERS = 5

export default function Step2Page() {
  const t = useTranslations("create.step2")
  const t1 = useTranslations("create.step1")
  const tc = useTranslations("create.common")

  const hairColorOptions = useMemo(
    () =>
      HAIR_COLOR_VALUES.map((value) => ({
        value,
        label: t1(`hairColors.${HAIR_VALUE_TO_STEP1_KEY[value]}` as "hairColors.lightBlonde"),
      })),
    [t1],
  )

  const eyeColorOptions = useMemo(
    () =>
      EYE_COLOR_VALUES.map((value) => ({
        value,
        label: t1(`eyeColors.${value}` as "eyeColors.blue"),
      })),
    [t1],
  )

  const optionLabel = useCallback(
    (value: string) => {
      const k = OPTION_VALUE_TO_LABEL_KEY[value]
      if (k) return t(`optionLabels.${k}` as "optionLabels.child")
      return value
    },
    [t],
  )

  const groupLabel = useCallback(
    (group: CharacterGroup) => {
      const map: Record<CharacterGroup, "characterTypes.child" | "characterTypes.familyMembers" | "characterTypes.pets" | "characterTypes.toys" | "characterTypes.other"> = {
        Child: "characterTypes.child",
        "Family Members": "characterTypes.familyMembers",
        Pets: "characterTypes.pets",
        Toys: "characterTypes.toys",
        Other: "characterTypes.other",
      }
      return t(map[group])
    },
    [t],
  )
  const router = useRouter()
  const { isPending, navigate } = useWizardNavigate()
  const { toast } = useToast()

  useEffect(() => {
    router.prefetch("/create/step3")
  }, [router])
  const [step1Data, setStep1Data] = useState<any>(null)
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: "1",
      characterType: {
        group: "Child",
        value: "Child",
        displayName: "Child",
      },
      uploadedFile: null,
      previewUrl: null,
      uploadError: null,
      isDragging: false,
    },
  ])

  // Load Step 1 data from localStorage + Migration logic
  useEffect(() => {
    try {
      const mirror = readWizardFormMirror()
      if (!mirror || Object.keys(mirror).length === 0) {
        const full = readWizardLocal()
        if (Object.keys(full).length > 0) {
          persistWizardData(full)
        }
      }
    } catch {
      /* ignore */
    }

    const data = readWizardLocal() as Record<string, any>
    if (data && (data.step1 || data.step2)) {
      try {
        setStep1Data(data.step1)

        // Migration: Old format (characterPhoto) → New format (characters array)
        if (data.step2?.characterPhoto && !data.step2?.characters) {
          console.log("[Step 2] Migrating old characterPhoto to characters array")

          // Convert old format to new format
          data.step2.characters = [
            {
              id: "1",
              characterType: {
                group: "Child",
                value: "Child",
                displayName: "Child",
              },
              photo: data.step2.characterPhoto,
              characterId: localStorage.getItem("herokidstory_character_id") || null,
            },
          ]

          // Remove old field
          delete data.step2.characterPhoto

          // Save migrated data
          persistWizardData(data as Record<string, unknown>)
          console.log("[Step 2] Migration completed")
        }

        // Load characters from localStorage
        if (data.step2?.characters && Array.isArray(data.step2.characters)) {
          setCharacters(
            data.step2.characters.map((char: any) => ({
              id: char.id,
              characterType: char.characterType,
              name: char.name || undefined, // Load optional name or required name for Child
              // NEW: Load Child-specific details if available
              age: char.age,
              gender: char.gender,
              hairColor: char.hairColor,
              eyeColor: char.eyeColor,
              uploadedFile: null, // File objects cannot be stored in localStorage
              previewUrl: char.photo?.url || null,
              uploadError: null,
              isDragging: false,
            })),
          )
          console.log("[Step 2] Loaded", data.step2.characters.length, "character(s) from localStorage")
        }
      } catch (error) {
        console.error("Error parsing wizard data:", error)
      }
    }
  }, [])

  const validateFile = useCallback((file: File): "invalidFormat" | "fileTooLarge" | null => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      return "invalidFormat"
    }

    if (file.size > maxSize) {
      return "fileTooLarge"
    }

    return null
  }, [])

  const handleFileUpload = useCallback(async (characterId: string, file: File) => {
    const error = validateFile(file)

    if (error) {
      setCharacters((prev) =>
        prev.map((char) => (char.id === characterId ? { ...char, uploadError: t(`validation.${error}`) } : char)),
      )
      toast({
        title: t("toasts.uploadError"),
        description: t(`validation.${error}`),
        variant: "destructive",
      })
      return
    }

    // Update character state with uploaded file
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            uploadedFile: file,
            previewUrl: URL.createObjectURL(file),
            uploadError: null,
          }
        }
        return char
      }),
    )

    // Save photo to localStorage and create character (no AI Analysis needed)
    try {
      // Convert file to base64 for localStorage
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const photoBase64 = dataUrl.split(",")[1] // Extract base64 part

        // Get current character info
        const currentCharacter = characters.find((char) => char.id === characterId)
        if (!currentCharacter) {
          console.error("[Step 2] Character not found:", characterId)
          return
        }

        // Save to localStorage (NEW: characters array)
        const wizardData = readWizardLocal() as Record<string, any>
        
        // Initialize step2.characters if not exists
        if (!wizardData.step2) wizardData.step2 = {}
        if (!wizardData.step2.characters) wizardData.step2.characters = []

        // Find this character in the array
        const charIndex = wizardData.step2.characters.findIndex((c: any) => c.id === characterId)
        
        // Prepare character data
        const characterData: any = {
          id: characterId,
          characterType: currentCharacter.characterType,
          name: currentCharacter.name || undefined, // Optional name (for non-Child) or required name (for Child)
          photo: {
            url: dataUrl,
            filename: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          },
          characterId: null, // Will be filled after API call
        }

        // NEW: Include appearance details for ALL character types
        if (currentCharacter.characterType.group === "Child") {
          // Child-specific details
          characterData.age = currentCharacter.age
          characterData.gender = currentCharacter.gender
          characterData.hairColor = currentCharacter.hairColor
          characterData.eyeColor = currentCharacter.eyeColor
        } else {
          // Non-Child characters appearance details (Pets hariç)
          if (currentCharacter.characterType.group !== "Pets") {
            characterData.hairColor = currentCharacter.hairColor
            characterData.eyeColor = currentCharacter.eyeColor
          }
          // Age and gender are optional for non-Child characters
          if (currentCharacter.age) characterData.age = currentCharacter.age
          if (currentCharacter.gender) characterData.gender = currentCharacter.gender
        }

        // Update or add character
        if (charIndex >= 0) {
          // Preserve existing character data (hairColor, eyeColor, etc.)
          wizardData.step2.characters[charIndex] = {
            ...wizardData.step2.characters[charIndex],
            ...characterData,
            // Preserve appearance details if they exist
            hairColor: characterData.hairColor || wizardData.step2.characters[charIndex].hairColor,
            eyeColor: characterData.eyeColor || wizardData.step2.characters[charIndex].eyeColor,
            age: characterData.age || wizardData.step2.characters[charIndex].age,
            gender: characterData.gender || wizardData.step2.characters[charIndex].gender,
          }
        } else {
          wizardData.step2.characters.push(characterData)
        }

        persistWizardData(wizardData)
        console.log("[Step 2] Saved photo to localStorage (character array):", characterData)

        // Create character in database (each character gets its own API call)
        if (step1Data) {
          try {
            // Determine character name and details based on type
            let characterName: string
            let characterAge: number
            let characterGender: string
            let characterHairColor: string
            let characterEyeColor: string

            // NEW: For Child characters, use their own details or fallback to Step 1
            if (currentCharacter.characterType.group === "Child") {
              characterName = currentCharacter.name || step1Data.name || "Child"
              characterAge = currentCharacter.age || step1Data.age || 5
              characterGender = currentCharacter.gender || step1Data.gender?.toLowerCase() || "girl"
              characterHairColor = currentCharacter.hairColor || step1Data.hairColor || "brown"
              characterEyeColor = currentCharacter.eyeColor || step1Data.eyeColor || "brown"
            } else {
              // NEW: For non-Child characters, use THEIR OWN form data (not Step 1 data)
              characterName = currentCharacter.characterType.displayName || currentCharacter.characterType.value
              characterAge = currentCharacter.age || 5 // Default age for non-child characters
              
              // Toys are gender-neutral - no gender needed
              if (currentCharacter.characterType.group === "Toys") {
                characterGender = "other" // Toys don't have gender
              }
              // FIX: Gender determination - determine default based on character type instead of taking from Step 1
              else if (currentCharacter.gender) {
                characterGender = currentCharacter.gender
              } else {
                // Determine default gender based on character type
                const charTypeValue = currentCharacter.characterType.value?.toLowerCase() || ''
                const charDisplayName = currentCharacter.characterType.displayName?.toLowerCase() || ''
                const charName = characterName?.toLowerCase() || ''
                
                // For "Other Family", check displayName (user's manual input like "uncle", "amca", etc.)
                const checkText = charTypeValue === "other family" ? charDisplayName || charName : charTypeValue || charName
                
                // Male character types
                if (charTypeValue === "dad" || charTypeValue === "brother" || charTypeValue === "grandpa" ||
                    charTypeValue === "uncle" ||
                    checkText.includes("uncle") || checkText.includes("father") || checkText.includes("dad") ||
                    checkText.includes("brother") || checkText.includes("grandpa")) {
                  characterGender = "boy"
                }
                // Female character types
                else if (charTypeValue === "mom" || charTypeValue === "sister" || charTypeValue === "grandma" ||
                         charTypeValue === "aunt" ||
                         checkText.includes("aunt") || checkText.includes("mother") || checkText.includes("mom") ||
                         checkText.includes("sister") || checkText.includes("grandma")) {
                  characterGender = "girl"
                }
                // Other cases default to "other" (will be corrected in backend)
                else {
                  characterGender = "other"
                }
              }
              
              // CRITICAL: Use character's own appearance data (from form), NOT Step 1 data
              characterHairColor = currentCharacter.hairColor || "brown" // Required from form
              characterEyeColor = currentCharacter.eyeColor || "brown" // Required from form
              
              console.log(`[Step 2] Non-Child character appearance:`, {
                name: characterName,
                type: currentCharacter.characterType,
                gender: characterGender,
                hairColor: characterHairColor,
                eyeColor: characterEyeColor,
              })
            }

            const createCharResponse = await fetch("/api/characters", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: characterName,
                age: characterAge.toString(),
                gender: characterGender,
                hairColor: characterHairColor,
                eyeColor: characterEyeColor,
                photoBase64: photoBase64, // Photo as base64 (without data URL prefix)
                characterType: currentCharacter.characterType, // Include character type info
              }),
            })

            const createCharResult = await createCharResponse.json()

            if (!createCharResponse.ok || !createCharResult.success) {
              throw new Error(createCharResult.error || "Failed to create character")
            }

            // Save character ID to localStorage (in characters array)
            const createdCharacterId = createCharResult.character?.id
            if (createdCharacterId) {
              // Update characterId in the array
              const wizardDataAgain = readWizardLocal() as Record<string, any>
              const charIndexAgain = wizardDataAgain.step2.characters.findIndex((c: any) => c.id === characterId)
              if (charIndexAgain >= 0) {
                wizardDataAgain.step2.characters[charIndexAgain].characterId = createdCharacterId
                persistWizardData(wizardDataAgain)
              }

              // Keep old localStorage key for backward compatibility (first character only)
              if (characterId === "1" || characters.length === 1) {
                localStorage.setItem("herokidstory_character_id", createdCharacterId)
              }

              console.log("[Step 2] Character created:", {
                id: createdCharacterId,
                name: characterName,
                type: currentCharacter.characterType,
              })
              
              const createdName = optionLabel(currentCharacter.characterType.displayName)
              toast({
                title: t("toasts.characterCreated"),
                description: t("toasts.characterCreatedDesc", { name: createdName }),
              })
            }
          } catch (error) {
            console.error("[Step 2] Error creating character:", error)
            toast({
              title: t("toasts.warning"),
              description: t("toasts.photoSavedCharFailed"),
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: t("toasts.warning"),
            description: t("toasts.step1Missing"),
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: t("toasts.error"),
        description: t("toasts.processError"),
        variant: "destructive",
      })
    }
  }, [characters, toast, step1Data, t, validateFile, optionLabel])

  const handleFileDrop = useCallback(
    (characterId: string, e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      setCharacters((prev) =>
        prev.map((char) => (char.id === characterId ? { ...char, isDragging: false } : char)),
      )

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileUpload(characterId, file)
      }
    },
    [handleFileUpload],
  )

  const handleFileInput = (characterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(characterId, file)
    }
  }

  const handleRemoveFile = (characterId: string) => {
    setCharacters((prev) => {
      const updated = prev.map((char) => {
        if (char.id === characterId) {
          if (char.previewUrl) {
            URL.revokeObjectURL(char.previewUrl)
          }
          return {
            ...char,
            uploadedFile: null,
            previewUrl: null,
            uploadError: null,
          }
        }
        return char
      })
      return updated
    })

    // Remove from localStorage (NEW: characters array)
    try {
      const wizardData = readWizardLocal() as Record<string, any>

      if (wizardData.step2?.characters && Array.isArray(wizardData.step2.characters)) {
        // Find and remove photo data for this character
        const charIndex = wizardData.step2.characters.findIndex((c: any) => c.id === characterId)
        if (charIndex >= 0) {
          // Remove photo and characterId, but keep the entry
          delete wizardData.step2.characters[charIndex].photo
          delete wizardData.step2.characters[charIndex].characterId

          persistWizardData(wizardData)
          console.log("[Step 2] Removed photo from character:", characterId)
        }
      }

      // Backward compatibility: Remove old characterPhoto if exists
      if (wizardData.step2?.characterPhoto) {
        delete wizardData.step2.characterPhoto
        persistWizardData(wizardData)
      }
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }
  }

  const handleAddCharacter = () => {
    if (characters.length >= MAX_CHARACTERS) return

    const newCharacter: Character = {
      id: Date.now().toString(),
      characterType: {
        group: "Child",
        value: "Child",
        displayName: "Child",
      },
      name: undefined, // NEW: Optional name
      uploadedFile: null,
      previewUrl: null,
      uploadError: null,
      isDragging: false,
    }

    setCharacters((prev) => [...prev, newCharacter])
  }

  // Handle character name change
  const handleCharacterNameChange = (characterId: string, name: string) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            name: name.trim(),
            characterType: {
              ...char.characterType,
              displayName: name.trim() || char.characterType.value, // Update displayName with name or fallback to value
            },
          }
        }
        return char
      }),
    )
  }

  // Handle character appearance details change (for all character types)
  const handleChildDetailsChange = (
    characterId: string,
    field: "name" | "age" | "gender" | "hairColor" | "eyeColor",
    value: string | number | string[],
  ) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          const updated = {
            ...char,
            [field]: value,
          }
          // Update displayName if name changes
          if (field === "name") {
            updated.characterType = {
              ...char.characterType,
              displayName: (value as string).trim() || char.characterType.value,
            }
          }

          // NEW: Also update localStorage immediately for character details
          try {
            const wizardData = readWizardLocal() as Record<string, any>
            if (wizardData.step2?.characters && Array.isArray(wizardData.step2.characters)) {
              const charIndex = wizardData.step2.characters.findIndex((c: any) => c.id === characterId)
              if (charIndex >= 0) {
                wizardData.step2.characters[charIndex] = {
                  ...wizardData.step2.characters[charIndex],
                  [field]: value,
                  characterType: updated.characterType, // Include updated characterType if name changed
                }
                persistWizardData(wizardData)
                console.log("[Step 2] Updated character details in localStorage:", field, value)
              }
            }
          } catch (error) {
            console.error("[Step 2] Error updating localStorage:", error)
          }

          return updated
        }
        return char
      }),
    )
  }

  const handleRemoveCharacter = (characterId: string) => {
    if (characters.length <= 1) return

    setCharacters((prev) => {
      const filtered = prev.filter((char) => {
        if (char.id === characterId) {
          if (char.previewUrl) {
            URL.revokeObjectURL(char.previewUrl)
          }
          return false
        }
        return true
      })
      return filtered
    })
  }

  // Handle character group selection (Child, Pets, Family Members, Other)
  const handleCharacterGroupChange = (characterId: string, group: CharacterGroup) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          // Reset to default value based on group
          if (group === "Child") {
            return {
              ...char,
              characterType: {
                group: "Child",
                value: "Child",
                displayName: "Child",
              },
            }
          } else if (group === "Pets") {
            return {
              ...char,
              characterType: {
                group: "Pets",
                value: "Dog", // Default pet
                displayName: "Dog",
              },
            }
          } else if (group === "Family Members") {
            return {
              ...char,
              characterType: {
                group: "Family Members",
                value: "Mom", // Default family member
                displayName: "Mom",
              },
            }
          } else if (group === "Toys") {
            return {
              ...char,
              characterType: {
                group: "Toys",
                value: "Teddy Bear", // Default toy
                displayName: "Teddy Bear",
              },
            }
          } else {
            // Other
            return {
              ...char,
              characterType: {
                group: "Other",
                value: "",
                displayName: "",
              },
            }
          }
        }
        return char
      }),
    )
  }

  // Handle character value selection (Dog, Cat, Mom, Dad, etc.)
  const handleCharacterValueChange = (characterId: string, value: string) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            characterType: {
              ...char.characterType,
              value: value,
              displayName: value, // Default: same as value
            },
          }
        }
        return char
      }),
    )
  }

  // Handle custom input (for Other Pet, Other Family, Other)
  const handleCharacterDisplayNameChange = (characterId: string, displayName: string) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            characterType: {
              ...char.characterType,
              displayName: displayName,
            },
          }
        }
        return char
      }),
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getUploadLabel = useCallback(
    (characterType: CharacterTypeInfo): string => {
      const shown = characterType.displayName ? optionLabel(characterType.displayName) : ""
      if (characterType.group === "Child") {
        return t("upload.childPhoto")
      }
      if (
        characterType.group === "Pets" ||
        characterType.group === "Family Members" ||
        characterType.group === "Toys"
      ) {
        return t("upload.namedPhoto", { name: shown || characterType.displayName || "" })
      }
      return characterType.displayName?.trim()
        ? t("upload.namedPhoto", { name: shown })
        : t("upload.characterPhoto")
    },
    [t, optionLabel],
  )

  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -15, 0],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 3 + i * 0.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut" as const,
      },
    }),
  }

  const decorativeElements = [
    { Icon: Star, top: "10%", left: "8%", delay: 0, size: "h-6 w-6", color: "text-yellow-400" },
    { Icon: Heart, top: "15%", right: "10%", delay: 0.5, size: "h-8 w-8", color: "text-brand-2" },
    { Icon: Sparkles, top: "70%", left: "5%", delay: 1, size: "h-6 w-6", color: "text-primary" },
    { Icon: BookOpen, top: "75%", right: "8%", delay: 1.5, size: "h-7 w-7", color: "text-blue-400" },
  ]

  /** uploadedFile sadece bu oturumda seçilen File için dolu; LS'den dönünce previewUrl dolu olur, File null kalır. */
  const hasUploadedPhotos = characters.some(
    (char) =>
      char.uploadedFile != null ||
      (typeof char.previewUrl === "string" && char.previewUrl.length > 0),
  )

  const formatGenderDisplay = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const lower = String(raw).toLowerCase()
      if (lower === "boy" || lower === "girl") return t(`gender.${lower}` as "gender.boy")
      return String(raw)
    },
    [t],
  )

  const formatHairColorFromRaw = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const normalized = String(raw).toLowerCase().replace(/\s+/g, "-")
      const sk = HAIR_VALUE_TO_STEP1_KEY[normalized as keyof typeof HAIR_VALUE_TO_STEP1_KEY]
      if (sk) return t1(`hairColors.${sk}` as "hairColors.lightBlonde")
      return String(raw)
    },
    [t, t1],
  )

  const formatEyeColorFromRaw = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const normalized = String(raw).toLowerCase()
      if ((EYE_COLOR_VALUES as readonly string[]).includes(normalized))
        return t1(`eyeColors.${normalized}` as "eyeColors.blue")
      return String(raw)
    },
    [t, t1],
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {decorativeElements.map((element, index) => {
          const Icon = element.Icon
          return (
            <motion.div
              key={index}
              custom={index}
              variants={floatingVariants}
              animate="animate"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.4, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: element.delay, duration: 0.5 }}
              className="absolute"
              style={{
                top: element.top,
                left: element.left,
                right: element.right,
              }}
            >
              <Icon className={`${element.size} ${element.color} drop-shadow-lg`} />
            </motion.div>
          )
        })}
      </div>

      <div className="container relative mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>{t("stepProgress")}</span>
              <span>{t("stepTitle")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "33.33%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-brand-2"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <div className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-800/80 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t("pageHeading")}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{t("pageSubheading")}</p>
            </motion.div>

            {/* Master photo best practices (better character consistency in book) */}
            <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex gap-3">
                <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-gray-700 dark:text-slate-300">
                  <p className="font-medium text-blue-900 dark:text-blue-100">{t("photoTips.title")}</p>
                  <ul className="mt-2 list-inside space-y-1 text-xs">
                    <li>{t("photoTips.frontFacing")}</li>
                    <li>{t("photoTips.naturalLight")}</li>
                    <li>{t("photoTips.plainBackground")}</li>
                    <li>{t("photoTips.naturalPose")}</li>
                    <li>{t("photoTips.avoidProfile")}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {characters.map((character, index) => (
                  <motion.div
                    key={character.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 shadow-lg dark:border-primary/20 dark:from-slate-800 dark:to-primary/5"
                  >
                    <div className="mb-4 space-y-3">
                      {/* Header: Character Number + Remove Button */}
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-gradient-to-r from-primary to-brand-2 px-3 py-1 text-xs font-bold text-white">
                          {t("characterBadge", { n: index + 1 })}
                        </span>
                        {characters.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveCharacter(character.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
                            aria-label={t("aria.removeCharacter")}
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>

                      {/* Main Group Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {t("characterTypeLabel")}
                        </label>
                        <Select 
                          value={character.characterType.group} 
                          onValueChange={(value) => handleCharacterGroupChange(character.id, value as CharacterGroup)}
                        >
                          <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Child">{groupLabel("Child")}</SelectItem>
                            <SelectItem value="Family Members">{groupLabel("Family Members")}</SelectItem>
                            <SelectItem value="Pets">{groupLabel("Pets")}</SelectItem>
                            <SelectItem value="Toys">{groupLabel("Toys")}</SelectItem>
                            <SelectItem value="Other">{groupLabel("Other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Conditional: Pets Dropdown */}
                      {(character.characterType.group as string) === "Pets" && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {t("selectPet")}
                          </label>
                          <Select 
                            value={character.characterType.value} 
                            onValueChange={(value) => handleCharacterValueChange(character.id, value)}
                          >
                            <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHARACTER_OPTIONS.Pets.options.map((pet) => (
                                <SelectItem key={pet} value={pet}>
                                  {optionLabel(pet)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Conditional: Family Members Dropdown */}
                      {character.characterType.group === "Family Members" && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {t("selectFamilyMember")}
                          </label>
                          <Select 
                            value={character.characterType.value} 
                            onValueChange={(value) => handleCharacterValueChange(character.id, value)}
                          >
                            <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHARACTER_OPTIONS.FamilyMembers.options.map((member) => (
                                <SelectItem key={member} value={member}>
                                  {optionLabel(member)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Conditional: Toys Dropdown */}
                      {character.characterType.group === "Toys" && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {t("selectToy")}
                          </label>
                          <Select 
                            value={character.characterType.value} 
                            onValueChange={(value) => handleCharacterValueChange(character.id, value)}
                          >
                            <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHARACTER_OPTIONS.Toys.options.map((toy) => (
                                <SelectItem key={toy} value={toy}>
                                  {optionLabel(toy)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Conditional: Custom Input (Other Pet, Other Family, Other Toy, Other) */}
                      {(character.characterType.value === "Other Pet" || 
                        character.characterType.value === "Other Family" ||
                        character.characterType.value === "Other Toy" ||
                        character.characterType.group === "Other") && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {character.characterType.value === "Other Pet" 
                              ? t("dynamicTypeLabels.petType") 
                              : character.characterType.value === "Other Family" 
                              ? t("dynamicTypeLabels.familyMemberType") 
                              : character.characterType.value === "Other Toy"
                              ? t("dynamicTypeLabels.toyType")
                              : t("dynamicTypeLabels.characterType")}
                          </label>
                          <Input
                            type="text"
                            placeholder={
                              character.characterType.value === "Other Pet" 
                                ? t("placeholders.otherPet") 
                                : character.characterType.value === "Other Family" 
                                ? t("placeholders.otherFamily") 
                                : character.characterType.value === "Other Toy"
                                ? t("placeholders.otherToy")
                                : t("placeholders.other")
                            }
                            value={character.characterType.displayName}
                            onChange={(e) => handleCharacterDisplayNameChange(character.id, e.target.value)}
                            className="border-primary/30 dark:border-primary/30"
                          />
                        </div>
                      )}

                      {/* Character 1 from Step 1: Read-only display + Photo upload only */}
                      {character.characterType.group === "Child" && index === 0 && step1Data && (
                        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                              {t("childDetailsFromStep1")}
                            </h3>
                            <Link
                              href="/create/step1"
                              className="text-xs font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {tc("edit")}
                            </Link>
                          </div>
                          
                          {/* Read-only information from Step 1 */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-slate-300">{t("labels.name")}</span>{" "}
                              <span className="text-gray-900 dark:text-slate-50">{step1Data.name || t("unknown")}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-slate-300">{t("labels.age")}</span>{" "}
                              <span className="text-gray-900 dark:text-slate-50">
                                {typeof step1Data.age === "number" && !Number.isNaN(step1Data.age)
                                  ? t("yearsOld", { count: step1Data.age })
                                  : t("unknown")}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-slate-300">{t("labels.gender")}</span>{" "}
                              <span className="text-gray-900 dark:text-slate-50">{formatGenderDisplay(step1Data.gender)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-slate-300">{t("labels.hair")}</span>{" "}
                              <span className="text-gray-900 dark:text-slate-50">{formatHairColorFromRaw(step1Data.hairColor)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-slate-300">{t("labels.eye")}</span>{" "}
                              <span className="text-gray-900 dark:text-slate-50">{formatEyeColorFromRaw(step1Data.eyeColor)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 rounded-md bg-blue-100/50 p-2 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {t("editHint")}
                          </div>
                        </div>
                      )}

                      {/* NEW: Detailed Form for Additional Child Characters (2, 3) */}
                      {character.characterType.group === "Child" && (index > 0 || !step1Data) && (
                        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/5">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                            {t("childDetails")}
                          </h3>
                          
                          {/* Name */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                              {t("fieldLabels.name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder={t("placeholders.childName")}
                              value={character.name || ""}
                              onChange={(e) => handleChildDetailsChange(character.id, "name", e.target.value)}
                              className="border-primary/30 dark:border-primary/30"
                              required
                            />
                          </div>

                          {/* Age & Gender */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t("fieldLabels.age")} <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                max="12"
                                placeholder={t("placeholders.age")}
                                value={character.age || ""}
                                onChange={(e) => handleChildDetailsChange(character.id, "age", parseInt(e.target.value) || 0)}
                                className="border-primary/30 dark:border-primary/30"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t("fieldLabels.gender")} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={character.gender || ""}
                                onValueChange={(value) => handleChildDetailsChange(character.id, "gender", value as "boy" | "girl")}
                              >
                                <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                                  <SelectValue placeholder={t("selectPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="boy">{t("gender.boy")}</SelectItem>
                                  <SelectItem value="girl">{t("gender.girl")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Hair & Eye Color */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t("labels.hairColor")} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={character.hairColor || ""}
                                onValueChange={(value) => handleChildDetailsChange(character.id, "hairColor", value)}
                              >
                                <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                                  <SelectValue placeholder={t("selectPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {hairColorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t("labels.eyeColor")} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={character.eyeColor || ""}
                                onValueChange={(value) => handleChildDetailsChange(character.id, "eyeColor", value)}
                              >
                                <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                                  <SelectValue placeholder={t("selectPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {eyeColorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Optional Name Input (for all non-Child characters) */}
                      {character.characterType.group !== "Child" && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {(character.characterType.group as string) === "Pets" 
                              ? t("nameOptional.pet") 
                              : t("nameOptional.default")}
                          </label>
                          <Input
                            type="text"
                            placeholder={
                              (character.characterType.group as string) === "Pets" 
                                ? t("placeholders.petName") 
                                : character.characterType.group === "Family Members" 
                                ? t("placeholders.familyName") 
                                : t("placeholders.genericName")
                            }
                            value={character.name || ""}
                            onChange={(e) => handleCharacterNameChange(character.id, e.target.value)}
                            className="border-primary/30 dark:border-primary/30"
                          />
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {(character.characterType.group as string) === "Pets" 
                              ? t("nameHints.pets") 
                              : character.characterType.group === "Family Members" 
                              ? t("nameHints.family") 
                              : character.characterType.group === "Toys"
                              ? t("nameHints.toys")
                              : t("nameHints.other")}
                          </p>
                        </div>
                      )}

                      {/* NEW: Appearance Details for Non-Child Characters (Family Members, Toys, Other - Pets excluded) */}
                      {character.characterType.group !== "Child" && character.characterType.group !== "Pets" && (
                        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/5">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                            {t("appearanceDetails")}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-slate-400">
                            {t("appearanceHelp")}
                          </p>
                          
                          {/* Hair/Fur & Eye Color */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Hair/Fur Color */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {(character.characterType.group as string) === "Pets" 
                                  ? t("labels.furColor") 
                                  : character.characterType.group === "Toys"
                                  ? t("labels.color")
                                  : t("labels.hairColor")} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={character.hairColor || ""}
                                onValueChange={(value) => handleChildDetailsChange(character.id, "hairColor", value)}
                              >
                                <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                                  <SelectValue placeholder={t("selectPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {hairColorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                  {(character.characterType.group as string) === "Pets" && (
                                    <>
                                      <SelectItem value="white">{t("furExtra.white")}</SelectItem>
                                      <SelectItem value="gray">{t("furExtra.gray")}</SelectItem>
                                      <SelectItem value="spotted">{t("furExtra.spotted")}</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Eye Color */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t("labels.eyeColor")} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={character.eyeColor || ""}
                                onValueChange={(value) => handleChildDetailsChange(character.id, "eyeColor", value)}
                              >
                                <SelectTrigger className="border-primary/30 bg-white dark:border-primary/30 dark:bg-slate-700">
                                  <SelectValue placeholder={t("selectPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {eyeColorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!character.previewUrl ? (
                      <motion.div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setCharacters((prev) =>
                            prev.map((char) => (char.id === character.id ? { ...char, isDragging: true } : char)),
                          )
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          setCharacters((prev) =>
                            prev.map((char) => (char.id === character.id ? { ...char, isDragging: false } : char)),
                          )
                        }}
                        onDrop={(e) => handleFileDrop(character.id, e)}
                        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                          character.isDragging
                            ? "border-primary bg-primary/10"
                            : "border-primary/30 bg-white/50 hover:border-primary/50 hover:bg-primary/5 dark:border-primary/30 dark:bg-slate-700/50 dark:hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="file"
                          id={`file-input-${character.id}`}
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={(e) => handleFileInput(character.id, e)}
                        />
                        <label
                          htmlFor={`file-input-${character.id}`}
                          className="flex cursor-pointer flex-col items-center justify-center"
                        >
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-white shadow-lg"
                          >
                            <Upload className="h-8 w-8" />
                          </motion.div>
                          <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
                            {getUploadLabel(character.characterType)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {t("upload.dragDrop")}
                          </p>
                          <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                            {t("upload.fileHint")}
                          </p>
                        </label>
                      </motion.div>
                    ) : (
                      <div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className="relative mx-auto max-w-sm"
                        >
                          <div className="relative overflow-hidden rounded-lg shadow-xl aspect-[2/3]">
                            <Image
                              src={character.previewUrl || ""}
                              alt={`${character.characterType.displayName} preview`}
                              fill
                              sizes="(max-width: 640px) 100vw, 384px"
                              className="object-cover"
                              unoptimized
                            />

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFile(character.id)}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600"
                              aria-label={t("aria.removePhoto")}
                            >
                              <X className="h-5 w-5" />
                            </motion.button>
                          </div>

                          <div className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
                            <p className="font-medium">{character.uploadedFile?.name}</p>
                            <p>{character.uploadedFile && formatFileSize(character.uploadedFile.size)}</p>
                            {character.uploadedFile && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-2 flex items-center justify-center gap-2 text-green-600 dark:text-green-400"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-semibold">{t("photoReady")}</span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {characters.length < MAX_CHARACTERS && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCharacter}
                    className="w-full border-2 border-dashed border-primary/30 bg-transparent py-6 text-base font-semibold text-primary transition-all hover:border-primary hover:bg-primary/5 dark:border-primary/30 dark:hover:border-primary"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    <span>{t("addCharacter")}</span>
                  </Button>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between"
            >
              <Link href="/create/step1" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-primary/5 dark:border-primary/30 sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>{tc("back")}</span>
                </Button>
              </Link>

              <Button
                type="button"
                onClick={() => {
                  if (!hasUploadedPhotos) {
                    toast({
                      title: t("toasts.photoRequired"),
                      description: t("toasts.photoRequiredDesc"),
                      variant: "destructive",
                    })
                    return
                  }
                  navigate("/create/step3")
                }}
                loading={isPending}
                disabled={!hasUploadedPhotos || isPending}
                className="w-full bg-gradient-to-r from-primary to-brand-2 text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 sm:w-auto"
              >
                <span>{isPending ? tc("navigating") : tc("next")}</span>
                {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
