/**
 * Servicio para gestión de ventas
 * Consume la API de CEMAC para operaciones de ventas
 */
export class SalesService {
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
   * Buscar productos disponibles para venta
   */
  async searchProducts(searchTerm = "", limit = 10) {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      params.append("limit", limit.toString())
      params.append("includeStock", "true")

      const response = await fetch(`${this.baseURL}/sales/products/search?${params}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error buscando productos:", error)
      throw error
    }
  }

  /**
   * Obtener lista de vendedores del sistema
   */
  async getVendedores(includeInactive = false) {
    try {
      const params = new URLSearchParams()
      if (includeInactive) params.append("includeInactive", "true")

      const response = await fetch(`${this.baseURL}/sales/users/vendedores?${params}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("🔄 Vendedores obtenidos de la API:", data)
      return data
    } catch (error) {
      console.error("Error obteniendo vendedores:", error)
      throw error
    }
  }

  /**
   * Crear nueva venta
   */
  async createSale(saleData) {
    try {
      const response = await fetch(`${this.baseURL}/sales`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error creando venta:", error)
      throw error
    }
  }

  /**
   * Obtener historial de ventas
   */
  async getSales(filters = {}) {
    try {
      const params = new URLSearchParams()

      // Agregar filtros si existen
      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.vendedor) params.append("vendedor", filters.vendedor)
      if (filters.cliente) params.append("cliente", filters.cliente)
      if (filters.status) params.append("status", filters.status)
      if (filters.sortBy) params.append("sortBy", filters.sortBy)
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)

      const response = await fetch(`${this.baseURL}/sales?${params}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo ventas:", error)
      throw error
    }
  }

  /**
   * Obtener venta específica
   */
  async getSale(saleId) {
    try {
      const response = await fetch(`${this.baseURL}/sales/${saleId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error obteniendo venta:", error)
      throw error
    }
  }

  /**
   * Actualizar estado de venta
   */
  async updateSaleStatus(saleId, status) {
    try {
      const response = await fetch(`${this.baseURL}/sales/${saleId}/status`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error actualizando estado de venta:", error)
      throw error
    }
  }

  /**
   * Generar reporte de ventas
   */
  async getSalesReport(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.vendedor) params.append("vendedor", filters.vendedor)

      const response = await fetch(`${this.baseURL}/sales/reports/summary?${params}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error generando reporte:", error)
      throw error
    }
  }

  /**
   * Exportar ventas (generar reporte para descarga)
   */
  async exportSales(filters = {}) {
    try {
      const salesData = await this.getSales(filters)

      // Convertir a CSV
      const csvContent = this.convertToCSV(salesData.sales)

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `ventas_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, message: "Reporte exportado exitosamente" }
    } catch (error) {
      console.error("Error exportando ventas:", error)
      throw error
    }
  }

  /**
   * Convertir datos a formato CSV
   */
  convertToCSV(sales) {
    if (!sales || sales.length === 0) {
      return "No hay datos para exportar"
    }

    const headers = [
      "ID",
      "Fecha",
      "Cliente",
      "Vendedor",
      "Subtotal",
      "Descuento",
      "IVA",
      "Total",
      "Estado",
      "Método de Pago",
    ]
    const csvRows = [headers.join(",")]

    sales.forEach((sale) => {
      const row = [
        sale.id,
        sale.date,
        `"${sale.cliente}"`,
        `"${sale.vendedor}"`,
        sale.subtotal,
        sale.discountAmount || 0,
        sale.ivaAmount || 0,
        sale.total,
        sale.status,
        `"${sale.paymentMethod}"`,
      ]
      csvRows.push(row.join(","))
    })

    return csvRows.join("\n")
  }
}
