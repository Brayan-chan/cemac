/**
 * Utilidad para manejar contadores diarios usando localStorage
 * Se reinicia automáticamente cada día
 */
class DailyCounterManager {
  constructor() {
    this.storageKey = 'cemac_daily_counters'
    this.initializeDailyCounters()
  }

  /**
   * Inicializar contadores diarios
   */
  initializeDailyCounters() {
    const today = new Date().toDateString()
    const stored = this.getStoredData()
    
    // Si es un nuevo día, reiniciar contadores
    if (!stored || stored.date !== today) {
      console.log("🗓️ Nuevo día detectado, reiniciando contadores diarios")
      this.resetDailyCounters()
    }
  }

  /**
   * Obtener datos almacenados
   */
  getStoredData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn("Error leyendo contadores diarios:", error)
      return null
    }
  }

  /**
   * Guardar datos
   */
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn("Error guardando contadores diarios:", error)
    }
  }

  /**
   * Reiniciar contadores para el día actual
   */
  resetDailyCounters() {
    const today = new Date().toDateString()
    const newData = {
      date: today,
      salesCount: 0,
      revenue: 0.0,
      lastSaleTime: null,
      salesIds: [] // Para evitar duplicados
    }
    this.saveData(newData)
    return newData
  }

  /**
   * Incrementar contador de ventas
   */
  incrementSaleCounter(saleData) {
    try {
      const stored = this.getStoredData()
      if (!stored) return this.resetDailyCounters()

      const saleId = saleData.id
      const saleTotal = parseFloat(saleData.total) || 0

      // Evitar duplicados
      if (stored.salesIds.includes(saleId)) {
        console.log("Venta ya contabilizada en el día:", saleId)
        return stored
      }

      // Incrementar contadores
      stored.salesCount += 1
      stored.revenue += saleTotal
      stored.lastSaleTime = new Date().toISOString()
      stored.salesIds.push(saleId)

      console.log("📊 Actualizando contadores diarios:", {
        ventas: stored.salesCount,
        ingresos: stored.revenue.toFixed(2),
        nuevaVenta: saleTotal.toFixed(2)
      })

      this.saveData(stored)
      return stored
    } catch (error) {
      console.warn("Error incrementando contador de ventas:", error)
      return this.getStoredData() || this.resetDailyCounters()
    }
  }

  /**
   * Obtener contadores del día actual
   */
  getTodaysCounters() {
    const stored = this.getStoredData()
    if (!stored) return this.resetDailyCounters()

    return {
      salesCount: stored.salesCount,
      revenue: stored.revenue,
      lastSaleTime: stored.lastSaleTime,
      date: stored.date
    }
  }

  /**
   * Sincronizar con API (opcional)
   * Verifica si hay ventas en la API que no están en localStorage
   */
  async syncWithAPI(salesFromAPI) {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const stored = this.getStoredData()
      
      if (!stored) return this.resetDailyCounters()

      // Filtrar ventas del día de hoy de la API
      const todaysSalesFromAPI = salesFromAPI.filter(sale => {
        const saleDate = sale.date || sale.createdAt || ''
        return saleDate.includes(today) || saleDate.split('T')[0] === today
      })

      console.log("🔄 Sincronizando con API:", {
        ventasEnAPI: todaysSalesFromAPI.length,
        ventasEnLocal: stored.salesCount
      })

      // Agregar ventas que no están en localStorage
      let updated = false
      for (const sale of todaysSalesFromAPI) {
        if (!stored.salesIds.includes(sale.id)) {
          console.log("➕ Agregando venta faltante:", sale.id)
          this.incrementSaleCounter(sale)
          updated = true
        }
      }

      if (updated) {
        console.log("✅ Sincronización completada")
      }

      return this.getStoredData()
    } catch (error) {
      console.warn("Error sincronizando con API:", error)
      return this.getStoredData()
    }
  }

  /**
   * Método de utilidad para debugging
   */
  debug() {
    const stored = this.getStoredData()
    console.log("🔍 Estado actual de contadores diarios:", {
      fecha: stored?.date,
      ventas: stored?.salesCount,
      ingresos: stored?.revenue?.toFixed(2),
      ultimaVenta: stored?.lastSaleTime,
      ventasRegistradas: stored?.salesIds?.length
    })
    return stored
  }
}

// Crear instancia global
window.dailyCounterManager = new DailyCounterManager()

export { DailyCounterManager }