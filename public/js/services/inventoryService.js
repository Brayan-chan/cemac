export class InventoryService {
  constructor() {
    // URL de producción de la API
    this.baseUrl = "https://cemac-api.vercel.app/inventory"

    // Obtener el token de autenticación
    this.token = localStorage.getItem("authToken")
  }

  async getProducts(filters = {}) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      console.log("Fetching products from:", this.baseUrl)

      // Obtener todos los productos sin usar paginación
      const queryParams = new URLSearchParams({
        search: filters.search || "",
        category: filters.category || "",
        price: filters.price || "",
        status: filters.status || "",
        sort: filters.sort || "name",
        limit: 1000 // Un número grande para obtener todos los productos
      }).toString()

      console.log("[v0] Fetching all products...")
      const response = await fetch(`${this.baseUrl}?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMessage = `Error al obtener productos: ${response.status}`
        try {
          const errorText = await response.text()
          console.error("[v0] Error response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })

          // Intentar parsear el error si es JSON
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            }
          } catch (e) {
            // Si no es JSON, usar el texto como está
            if (errorText) {
              errorMessage = errorText
            }
          }

          if (response.status === 401) {
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            window.location.href = "/index.html"
            throw new Error("Sesión expirada o inválida")
          }
        } catch (error) {
          console.error("[v0] Error processing error response:", error)
        }
        
        throw new Error(errorMessage)
      }

      let data = await response.json()
      console.log("[v0] Initial products response:", data)

      // Extraer los productos de la respuesta
      let allProducts = []
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          allProducts = data
        } else if (data.products && Array.isArray(data.products)) {
          allProducts = data.products
        } else if (data.data && Array.isArray(data.data)) {
          allProducts = data.data
        } else {
          // Si es un objeto de Firebase, intentar convertirlo
          try {
            allProducts = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...(typeof value === 'object' ? value : { value })
            }))
          } catch (error) {
            console.error("[v0] Error processing products:", error)
            allProducts = []
          }
        }
      }

      console.log("[v0] Processed products count:", allProducts.length)

      // Filtrar productos según los criterios
      let filteredProducts = allProducts.filter(product => {
        // Filtrar por búsqueda
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          if (!product.name?.toLowerCase().includes(searchTerm) &&
              !product.description?.toLowerCase().includes(searchTerm)) {
            return false
          }
        }

        // Filtrar por categoría
        if (filters.category && filters.category !== 'all') {
          if (product.category !== filters.category) {
            return false
          }
        }

        return true
      })

      // Ordenar productos
      if (filters.sort) {
        filteredProducts.sort((a, b) => {
          if (filters.sort === 'name') {
            return (a.name || '').localeCompare(b.name || '')
          }
          if (filters.sort === 'price') {
            return (a.price || 0) - (b.price || 0)
          }
          return 0
        })
      }

      // Implementar paginación
      const limit = parseInt(filters.limit) || 5
      const page = parseInt(filters.page) || 1
      const total = filteredProducts.length
      const totalPages = Math.max(1, Math.ceil(total / limit))
      
      // Calcular slice para la página actual
      const start = (page - 1) * limit
      const end = Math.min(start + limit, total)
      
      const paginatedProducts = filteredProducts.slice(start, end)
      
      console.log("[v0] Pagination details:", {
        totalProducts: total,
        totalPages,
        currentPage: page,
        limit,
        displayingProducts: paginatedProducts.length,
        startIndex: start,
        endIndex: end
      })

      const result = {
        products: paginatedProducts,
        total: total,
        totalPages: totalPages,
        page: page,
        limit: limit,
        hasMore: end < total,
        filteredTotal: filteredProducts.length,
        allProductsTotal: allProducts.length
      }

      console.log("[v0] Final response:", {
        productsInCurrentPage: paginatedProducts.length,
        totalProducts: total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        totalFiltered: filteredProducts.length,
        totalInDatabase: allProducts.length
      })

      return result
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
      throw error
    }
  }

  async createProduct(productData) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const formData = new FormData()
      for (const [key, value] of Object.entries(productData)) {
        if (key === "image" && value instanceof File) {
          formData.append("image", value)
        } else {
          formData.append(key, value)
        }
      }

      const response = await fetch(`${this.baseUrl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        mode: "cors",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al crear producto")
      }

      return await response.json()
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  async updateProduct(productId, updateData) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const formData = new FormData()
      for (const [key, value] of Object.entries(updateData)) {
        if (key === "image" && value instanceof File) {
          formData.append("image", value)
        } else {
          formData.append(key, value)
        }
      }

      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        mode: "cors",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 403) {
          throw new Error("No tienes permisos para actualizar productos. Solo administradores pueden hacerlo.")
        }

        throw new Error(errorData.message || "Error al actualizar producto")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Error updating product:", error)
      throw error
    }
  }

  async deleteProduct(productId) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 403) {
          throw new Error("No tienes permisos para eliminar productos. Solo administradores pueden hacerlo.")
        }

        throw new Error(errorData.message || "Error al eliminar producto")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      throw error
    }
  }

  async updateStock(productId, quantity, type = "add") {
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}/stock`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, type }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar stock")
      }

      return await response.json()
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  async getStockHistory(productId) {
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}/stock-history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener historial de stock")
      }

      return await response.json()
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }
}