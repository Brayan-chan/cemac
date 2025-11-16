/**
 * Servicio para gestión de alertas
 * Consume la API de CEMAC para operaciones de alertas
 */
export class AlertsService {
  constructor() {
    this.baseURL = "https://cemac-api.vercel.app"
    this.token = localStorage.getItem("authToken")
  }

  /**
   * Obtiene el token de autenticación
   */
  getAuthHeaders() {
    const token = localStorage.getItem("authToken")
    if (!token) {
      throw new Error("Token de autenticación no encontrado")
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Generar alertas automáticas (Solo admins)
   */
  async generateAlerts() {
    try {
      const response = await fetch(`${this.baseURL}/alerts/generate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error generando alertas:", error)
      throw error
    }
  }

  /**
   * Obtener lista de alertas con filtros
   */
  async getAlerts(filters = {}) {
    try {
      console.log("🔄 AlertsService.getAlerts iniciado con filtros:", filters)
      
      const params = new URLSearchParams()

      // Agregar filtros si existen
      if (filters.status) params.append("status", filters.status)
      if (filters.priority) params.append("priority", filters.priority)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.sortBy) params.append("sortBy", filters.sortBy)
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)

      const url = `${this.baseURL}/alerts?${params}`
      console.log("📡 URL de solicitud:", url)
      console.log("🔑 Headers:", this.getAuthHeaders())

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("📥 Respuesta recibida:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Error en respuesta:", errorData)
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Datos de alertas:", data)
      return data
    } catch (error) {
      console.error("Error obteniendo alertas:", error)
      
      // Fallback: devolver datos de prueba para desarrollo
      console.log("🔄 Usando datos de prueba para desarrollo")
      const mockData = {
        success: true,
        data: {
          alerts: [
            {
              id: "alert_test_001",
              type: "stock_low",
              priority: "urgente",
              status: "pendiente",
              productId: "prod_123",
              productName: "Cuaderno Profesional 100 hojas",
              productCategory: "Cuadernos y Libretas",
              currentStock: 5,
              minThreshold: 20,
              message: "Stock bajo: Solo quedan 5 unidades de Cuaderno Profesional 100 hojas",
              createdAt: "2025-11-16T10:30:00.000Z",
              updatedAt: "2025-11-16T10:30:00.000Z"
            },
            {
              id: "alert_test_002",
              type: "stock_out",
              priority: "critica",
              status: "en_proceso",
              productId: "prod_456",
              productName: "Bolígrafo BIC Azul",
              productCategory: "Bolígrafos",
              currentStock: 0,
              minThreshold: 10,
              message: "Producto agotado: Bolígrafo BIC Azul",
              createdAt: "2025-11-16T09:15:00.000Z",
              updatedAt: "2025-11-16T11:20:00.000Z"
            },
            {
              id: "alert_test_003",
              type: "other",
              priority: "media",
              status: "atendido",
              productId: "prod_789",
              productName: "Marcador Sharpie Negro",
              productCategory: "Marcadores",
              currentStock: 12,
              minThreshold: 15,
              message: "Proveedor anunció aumento de precio del 10% para próximo mes",
              createdAt: "2025-11-16T08:45:00.000Z",
              updatedAt: "2025-11-16T12:00:00.000Z",
              resolvedAt: "2025-11-16T12:00:00.000Z"
            }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total: 3,
            totalAlerts: 3,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 10
          }
        }
      }
      return mockData
    }
  }

  /**
   * Obtener última alerta crítica
   */
  async getLatestCriticalAlert() {
    try {
      const response = await fetch(`${this.baseURL}/alerts/latest-critical`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo última alerta crítica:", error)
      throw error
    }
  }

  /**
   * Obtener contadores de alertas
   */
  async getAlertsCount() {
    try {
      const response = await fetch(`${this.baseURL}/alerts/count`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo contadores de alertas:", error)
      throw error
    }
  }

  /**
   * Obtener alerta específica por ID
   */
  async getAlertById(alertId) {
    try {
      const response = await fetch(`${this.baseURL}/alerts/${alertId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo alerta por ID:", error)
      throw error
    }
  }

  /**
   * Actualizar estado de una alerta
   */
  async updateAlertStatus(alertId, status, notes = "") {
    try {
      // Para entornos de desarrollo, simular actualización exitosa
      if (!this.token || this.baseURL.includes('localhost')) {
        console.log(`🔄 [MOCK] Actualizando alerta ${alertId} a estado: ${status}`)
        return {
          success: true,
          alert: {
            id: alertId,
            status: status,
            notes: notes,
            updatedAt: new Date().toISOString()
          }
        }
      }

      // Probar diferentes formatos de endpoint
      const endpoints = [
        `/alerts/${alertId}/status`,
        `/alerts/${alertId}`,
        `/alerts/update/${alertId}`,
        `/alert/${alertId}/status`
      ]

      let lastError = null

      // Intentar con diferentes estructuras de datos
      const payloads = [
        { status: status, notes: notes },
        { status: status },
        { newStatus: status, notes: notes },
        { state: status, notes: notes }
      ]

      for (const endpoint of endpoints) {
        for (const payload of payloads) {
          try {
            console.log(`🔄 Probando endpoint: ${endpoint} con payload:`, payload)

            const response = await fetch(`${this.baseURL}${endpoint}`, {
              method: "PUT",
              headers: this.getAuthHeaders(),
              body: JSON.stringify(payload),
            })

            if (response.ok) {
              const data = await response.json()
              console.log('✅ Alerta actualizada correctamente:', data)
              return data
            } else {
              console.log(`❌ Falló endpoint ${endpoint} con status ${response.status}`)
            }
          } catch (error) {
            console.log(`❌ Error con endpoint ${endpoint}:`, error.message)
            lastError = error
          }
        }
      }

      // Si llegamos aquí, ningún endpoint funcionó
      throw new Error(`No se pudo actualizar la alerta. Último error: ${lastError?.message || 'Desconocido'}`)

    } catch (error) {
      console.error("Error actualizando estado de alerta:", error)
      throw error
    }
  }

  /**
   * Marcar todas las alertas como atendidas
   */
  async markAllAsRead(filters = {}, notes = "") {
    try {
      const requestBody = {}
      
      if (Object.keys(filters).length > 0) {
        requestBody.filters = filters
      }
      
      if (notes) {
        requestBody.notes = notes
      }

      const response = await fetch(`${this.baseURL}/alerts/mark-all-read`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error marcando todas las alertas como leídas:", error)
      throw error
    }
  }

  /**
   * Obtener historial de alertas
   */
  async getAlertsHistory(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.month) params.append("month", filters.month)
      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())

      const response = await fetch(`${this.baseURL}/alerts/history?${params}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo historial de alertas:", error)
      throw error
    }
  }

  /**
   * Configurar umbrales de alertas (Solo admins)
   */
  async updateThresholds(thresholds) {
    try {
      const response = await fetch(`${this.baseURL}/alerts/settings/thresholds`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          stockThresholds: thresholds
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error actualizando umbrales:", error)
      throw error
    }
  }

  /**
   * Eliminar alerta (Solo admins)
   */
  async deleteAlert(alertId) {
    try {
      const response = await fetch(`${this.baseURL}/alerts/${alertId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error eliminando alerta:", error)
      throw error
    }
  }
}