export class CategoryService {
  constructor() {
    // URL de producción de la API
    this.baseUrl = "https://cemac-api.vercel.app/categories"

    // Obtener el token de autenticación
    this.token = localStorage.getItem("authToken")
  }

  /**
   * Obtener todas las categorías con búsqueda opcional
   */
  async getCategories(search = "") {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const queryParams = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await fetch(`${this.baseUrl}${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMessage = `Error al obtener categorías: ${response.status}`
        try {
          const errorText = await response.text()
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Categorías obtenidas:", data)
      return data
    } catch (error) {
      console.error("Error en getCategories:", error)
      throw error
    }
  }

  /**
   * Crear una nueva categoría
   */
  async createCategory(categoryData) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        let errorMessage = `Error al crear categoría: ${response.status}`
        try {
          const errorText = await response.text()
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Categoría creada:", data)
      return data
    } catch (error) {
      console.error("Error en createCategory:", error)
      throw error
    }
  }

  /**
   * Actualizar una categoría existente
   */
  async updateCategory(categoryId, categoryData) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.baseUrl}/${categoryId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        let errorMessage = `Error al actualizar categoría: ${response.status}`
        try {
          const errorText = await response.text()
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Categoría actualizada:", data)
      return data
    } catch (error) {
      console.error("Error en updateCategory:", error)
      throw error
    }
  }

  /**
   * Eliminar una categoría
   */
  async deleteCategory(categoryId) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.baseUrl}/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        let errorMessage = `Error al eliminar categoría: ${response.status}`
        try {
          const errorText = await response.text()
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Categoría eliminada:", data)
      return data
    } catch (error) {
      console.error("Error en deleteCategory:", error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de una categoría
   */
  async getCategoryStats(categoryId) {
    try {
      if (!this.token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.baseUrl}/${categoryId}/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        let errorMessage = `Error al obtener estadísticas: ${response.status}`
        try {
          const errorText = await response.text()
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Estadísticas obtenidas:", data)
      return data
    } catch (error) {
      console.error("Error en getCategoryStats:", error)
      throw error
    }
  }
}