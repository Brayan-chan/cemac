/**
 * Servicio de Clientes
 * Gestiona todas las operaciones con clientes en la API
 */
export class CustomerService {
  constructor() {
    this.baseURL = "https://cemac-api.vercel.app"
  }

  /**
   * Obtener token de autenticación actualizado
   */
  getAuthToken() {
    return localStorage.getItem("authToken")
  }

  /**
   * Crear headers de autorización
   */
  getAuthHeaders() {
    const token = this.getAuthToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  /**
   * Manejar respuestas de la API
   */
  async handleResponse(response, operation = "operation") {
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en ${operation}:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: errorText
      })
      
      if (response.status === 401) {
        console.warn("Token de autenticación inválido o expirado")
        // Opcional: redirigir al login
        // window.location.href = '/login'
      }
      
      throw new Error(`${operation} falló: ${response.status} ${response.statusText}`)
    }
    
    try {
      return await response.json()
    } catch (e) {
      console.error(`Error parseando JSON en ${operation}:`, e)
      throw new Error(`Error parseando respuesta de ${operation}`)
    }
  }

  /**
   * Obtener todos los clientes con filtros y búsqueda
   */
  async getCustomers(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || "",
        sortBy: params.sortBy || "firstName",
        sortOrder: params.sortOrder || "asc",
      })

      console.log("📞 Obteniendo clientes:", `${this.baseURL}/customers?${queryParams}`)
      
      const response = await fetch(`${this.baseURL}/customers?${queryParams}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      return await this.handleResponse(response, "obtener clientes")
    } catch (error) {
      console.error("❌ Error obteniendo clientes:", error)
      throw error
    }
  }

  /**
   * Buscar clientes en tiempo real (autocompletar)
   */
  async searchCustomers(query) {
    try {
      const url = `${this.baseURL}/customers/search?q=${encodeURIComponent(query)}`
      console.log("🔍 Buscando clientes:", url)
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      return await this.handleResponse(response, "buscar clientes")
    } catch (error) {
      console.error("❌ Error buscando clientes:", error)
      throw error
    }
  }

  /**
   * Obtener cliente específico con su historial de compras
   */
  async getCustomerById(customerId) {
    try {
      const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      return await this.handleResponse(response, "obtener cliente por ID")
    } catch (error) {
      console.error("Error obteniendo cliente por ID:", error)
      throw error
    }
  }

  /**
   * Crear nuevo cliente
   */
  async createCustomer(customerData) {
    try {
      console.log("⚡ Creando cliente:", customerData)
      
      const response = await fetch(`${this.baseURL}/customers`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(customerData),
      })

      const result = await this.handleResponse(response, "crear cliente")
      console.log("📋 Respuesta de creación de cliente:", result)
      return result
    } catch (error) {
      console.error("❌ Error creando cliente:", error)
      throw error
    }
  }

  /**
   * Actualizar cliente
   */
  async updateCustomer(customerId, customerData) {
    try {
      const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(customerData),
      })

      return await this.handleResponse(response, "actualizar cliente")
    } catch (error) {
      console.error("Error actualizando cliente:", error)
      throw error
    }
  }

  /**
   * Eliminar cliente
   */
  async deleteCustomer(customerId) {
    try {
      const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      return await this.handleResponse(response, "eliminar cliente")
    } catch (error) {
      console.error("Error eliminando cliente:", error)
      throw error
    }
  }
}