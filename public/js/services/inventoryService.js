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

      // Construir query parameters según la documentación de la API
      const queryParams = new URLSearchParams()
      
      if (filters.search) queryParams.append("search", filters.search)
      if (filters.category) queryParams.append("category", filters.category)
      if (filters.brand) queryParams.append("brand", filters.brand)
      if (filters.supplier) queryParams.append("supplier", filters.supplier)
      if (filters.availability) queryParams.append("availability", filters.availability)
      if (filters.minPrice !== null && filters.minPrice !== undefined) queryParams.append("minPrice", filters.minPrice)
      if (filters.maxPrice !== null && filters.maxPrice !== undefined) queryParams.append("maxPrice", filters.maxPrice)
      if (filters.page) queryParams.append("page", filters.page)
      if (filters.limit) queryParams.append("limit", filters.limit)
      if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
      if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)

      const queryString = queryParams.toString()
      console.log("Query parameters:", queryString)

      const response = await fetch(`${this.baseUrl}${queryString ? `?${queryString}` : ""}`, {
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
          console.error("Error response:", {
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
          console.error("Error processing error response:", error)
        }
        
        throw new Error(errorMessage)
      }

      let data = await response.json()
      console.log("API response:", data)

      // La API maneja la paginación, solo retornamos la respuesta completa
      return data
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  }

  async createProduct(productData) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      // Debug logs para verificar token
      console.log("Debug - Token presente en servicio:", !!this.token)
      console.log("Debug - Primeros 20 caracteres del token:", this.token?.substring(0, 20))

      let formData
      
      // Si ya es FormData, usarlo directamente
      if (productData instanceof FormData) {
        formData = productData
      } else {
        // Si es un objeto, convertir a FormData
        formData = new FormData()
        for (const [key, value] of Object.entries(productData)) {
          if (key === "image" && value instanceof File) {
            formData.append("image", value)
          } else if (value !== null && value !== undefined) {
            formData.append(key, value)
          }
        }
      }

      console.log("Enviando producto con FormData:")
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1])
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
        let errorMessage = `Error al crear producto: ${response.status}`
        try {
          const errorText = await response.text()
          console.error("Error response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })

          // Intentar parsear el error si es JSON
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            } else if (errorJson.error) {
              errorMessage = errorJson.error
            }
          } catch (parseError) {
            // Si no es JSON, usar el texto directamente
            if (errorText) {
              errorMessage = errorText
            }
          }
        } catch (textError) {
          console.error("Error reading error response:", textError)
        }
        
        throw new Error(errorMessage)
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

      let formData
      
      // Si ya es FormData, usarlo directamente
      if (updateData instanceof FormData) {
        formData = updateData
      } else {
        // Si es un objeto, convertir a FormData
        formData = new FormData()
        for (const [key, value] of Object.entries(updateData)) {
          if (key === "image" && value instanceof File) {
            formData.append("image", value)
          } else if (value !== null && value !== undefined) {
            formData.append(key, value)
          }
        }
      }

      console.log("Actualizando producto con FormData:")
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1])
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
      console.error("Error updating product:", error)
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
      console.error("Error deleting product:", error)
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