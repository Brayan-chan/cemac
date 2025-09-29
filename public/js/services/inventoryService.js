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

      const queryParams = new URLSearchParams(filters).toString()
      console.log("Token:", this.token) // Para depuración
      console.log("URL:", `${this.baseUrl}?${queryParams}`) // Para depuración

      const response = await fetch(`${this.baseUrl}?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })

        if (response.status === 401) {
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
          window.location.href = "/index.html"
          throw new Error("Sesión expirada o inválida")
        }
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Products data:", data)

      // Manejar diferentes estructuras de respuesta
      if (Array.isArray(data)) {
        return data
      } else if (data.products) {
        return data.products
      } else if (data.data) {
        return data.data
      }
      return []
    } catch (error) {
      console.error("Error:", error)
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
        throw new Error("Error al actualizar producto")
      }

      return await response.json()
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  async deleteProduct(productId) {
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar producto")
      }

      return await response.json()
    } catch (error) {
      console.error("Error:", error)
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
