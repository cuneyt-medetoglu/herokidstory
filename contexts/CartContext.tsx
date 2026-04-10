"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Currency } from "@/lib/currency"
import type { ProductId } from "@/lib/pricing/payment-products"

export interface CartItem {
  id: string            // Unique cart item ID (client-side)
  type: "hardcopy" | "ebook_plan" | "ebook" | "bundle"
  /** Sunucu tarafında fiyat hesabı için kullanılır (lib/pricing/payment-products.ts) */
  productId?: ProductId
  bookId?: string       // Hardcopy / ebook için
  bookTitle: string
  coverImage?: string
  price: number         // Görüntüleme amaçlı; checkout'ta sunucu yeniden hesaplar
  /**
   * Para birimi — CurrencyContext'ten doldurulur.
   */
  currency?: Currency
  quantity: number
  planType?: string     // ebook_plan: "10", "15", "20" sayfa
  draftId?: string      // ebook_plan: draft ID
  characterData?: unknown // ebook_plan: karakter verisi
}

export interface AppliedPromo {
  code:           string
  promoCodeId:    string
  discountType:   "percent" | "fixed"
  discountValue:  number
  discountAmount: number
}

interface CartContextType {
  items:          CartItem[]
  appliedPromo:   AppliedPromo | null
  addToCart:      (item: Omit<CartItem, "id">) => void
  removeFromCart: (itemId: string) => void
  clearCart:      () => void
  getCartTotal:   () => number
  getCartSubtotal: () => number
  getCartCount:   () => number
  setAppliedPromo: (promo: AppliedPromo | null) => void
  isLoading:      boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY  = "herokidstory_cart"
const PROMO_STORAGE_KEY = "herokidstory_promo"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]             = useState<CartItem[]>([])
  const [appliedPromo, setAppliedPromoState] = useState<AppliedPromo | null>(null)
  const [isLoading, setIsLoading]     = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) setItems(JSON.parse(savedCart))

      const savedPromo = localStorage.getItem(PROMO_STORAGE_KEY)
      if (savedPromo) setAppliedPromoState(JSON.parse(savedPromo))
    } catch (error) {
      console.error("[Cart] Error loading from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist cart
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error("[Cart] Error saving cart:", error)
      }
    }
  }, [items, isLoading])

  // Persist promo
  useEffect(() => {
    if (!isLoading) {
      try {
        if (appliedPromo) {
          localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(appliedPromo))
        } else {
          localStorage.removeItem(PROMO_STORAGE_KEY)
        }
      } catch (error) {
        console.error("[Cart] Error saving promo:", error)
      }
    }
  }, [appliedPromo, isLoading])

  const addToCart = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => {
        if (item.type === "hardcopy" && i.type === "hardcopy") {
          return i.bookId === item.bookId
        }
        if (item.type === "ebook_plan" && i.type === "ebook_plan") {
          return true // Only one ebook plan allowed
        }
        return false
      })

      if (existingIndex >= 0) {
        return prev
      }

      const newItem: CartItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      return [...prev, newItem]
    })
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setAppliedPromoState(null)
    localStorage.removeItem(CART_STORAGE_KEY)
    localStorage.removeItem(PROMO_STORAGE_KEY)
  }, [])

  const getCartSubtotal = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [items])

  const getCartTotal = useCallback(() => {
    const subtotal = getCartSubtotal()
    if (appliedPromo) {
      return Math.max(0, subtotal - appliedPromo.discountAmount)
    }
    return subtotal
  }, [items, appliedPromo, getCartSubtotal])

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  const setAppliedPromo = useCallback((promo: AppliedPromo | null) => {
    setAppliedPromoState(promo)
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        appliedPromo,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        getCartCount,
        setAppliedPromo,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
