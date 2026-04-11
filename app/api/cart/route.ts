import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/api-auth"
import { getBooksByIds } from "@/lib/db/books"
import { getProductPrice } from "@/lib/pricing/payment-products"
import { getUserCurrency } from "@/lib/currency"

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()

    // For now, cart is stored in localStorage on client-side
    // In the future, we can store it in database
    // This endpoint can be used to sync client cart with server
    
    return NextResponse.json({
      success: true,
      items: [], // Empty for now, client manages cart
      message: "Cart retrieved successfully",
    })
  } catch (error) {
    console.error("[Cart API] GET Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const { action, book_ids } = body

    if (action === "add") {
      if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
        return NextResponse.json(
          { error: "book_ids array is required" },
          { status: 400 }
        )
      }

      // Validate that books exist and belong to user
      // Check if books are purchased E-Books (required for hardcopy)
      const { data: books, error: booksError } = await getBooksByIds(user.id, book_ids)

      if (booksError) {
        console.error("[Cart API] Error fetching books:", booksError)
        return NextResponse.json(
          { error: "Failed to fetch books" },
          { status: 500 }
        )
      }

      if (!books || books.length !== book_ids.length) {
        return NextResponse.json(
          { error: "Some books not found or don't belong to you" },
          { status: 404 }
        )
      }

      // Check if all books are purchased (status: 'completed')
      const unpurchasedBooks = books.filter((book) => book.status !== "completed")
      if (unpurchasedBooks.length > 0) {
        return NextResponse.json(
          {
            error: "Only purchased E-Books can be converted to hardcopy",
            unpurchased_books: unpurchasedBooks.map((b) => b.id),
          },
          { status: 400 }
        )
      }

      const currency = getUserCurrency(request.headers)
      const hardcopyPrice = getProductPrice("hardcopy", currency)

      const cartItems = books.map((book) => ({
        bookId: book.id,
        bookTitle: book.title || "Untitled Book",
        coverImage: book.cover_image_url || "",
        price: hardcopyPrice,
        currency,
        type: "hardcopy" as const,
      }))

      return NextResponse.json({
        success: true,
        items: cartItems,
        message: "Items validated and ready to add to cart",
      })
    }

    if (action === "clear") {
      // Cart is managed client-side, this is just for validation
      return NextResponse.json({
        success: true,
        message: "Cart cleared",
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[Cart API] POST Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const { item_id } = body

    if (!item_id) {
      return NextResponse.json(
        { error: "item_id is required" },
        { status: 400 }
      )
    }

    // Cart is managed client-side, this is just for validation
    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    })
  } catch (error) {
    console.error("[Cart API] DELETE Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
