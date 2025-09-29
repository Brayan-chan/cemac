class UserService {
  constructor() {
    this.baseURL = "https://cemac-api.vercel.app"
  }

  async getAuthHeaders() {
    const token = localStorage.getItem("authToken")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  async getAllUsers() {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseURL}/auth/users`, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener usuarios")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en getAllUsers:", error)
      throw error
    }
  }

  async createUser(userData) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear usuario")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en createUser:", error)
      throw error
    }
  }

  async updateUserStatus(userId, isActive) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseURL}/auth/users/${userId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar estado del usuario")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en updateUserStatus:", error)
      throw error
    }
  }

  async updateUserRole(userId, role) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseURL}/auth/users/${userId}/role`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar rol del usuario")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en updateUserRole:", error)
      throw error
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseURL}/auth/users/${userId}/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar perfil del usuario")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en updateUserProfile:", error)
      throw error
    }
  }
}

export { UserService }
