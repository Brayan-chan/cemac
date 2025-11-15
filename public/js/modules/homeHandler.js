import { AnalyticsService } from "../services/analyticsService.js"

const Chart = window.Chart

export class HomeHandler {
  constructor() {
    this.analyticsService = new AnalyticsService()
    this.charts = {}
    this.isLoading = false

    console.log("Inicializando HomeHandler...")
    this.init()
  }

  async init() {
    try {
      this.bindEvents()
      await this.loadHomeData()
      console.log("HomeHandler inicializado correctamente")
    } catch (error) {
      console.error("Error inicializando HomeHandler:", error)
      this.showError("Error inicializando el dashboard")
    }
  }

  bindEvents() {
    // Evento para refrescar datos
    const refreshBtn = document.querySelector("#refreshHome")
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshData())
    }

    // Evento para exportar datos
    const exportBtn = document.querySelector(".fas.fa-download")?.closest('button')
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportData())
    }
  }

  async loadHomeData() {
    if (this.isLoading) return

    this.isLoading = true
    this.showLoadingState()

    try {
      // Obtener estadísticas de hoy
      const todayStats = await this.analyticsService.getTodayStats()

      // Obtener análisis de inventario
      const inventoryAnalysis = await this.analyticsService.getInventoryAnalysis()

      // Obtener datos analíticos generales
      const analyticsData = await this.analyticsService.getAnalyticsData()

      // Obtener resumen ejecutivo
      const executiveSummary = await this.analyticsService.getExecutiveSummary()

      // Actualizar la interfaz
      this.updateTodayStats(todayStats)
      this.updateCharts(inventoryAnalysis, executiveSummary)

      console.log("Datos del dashboard cargados exitosamente")
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error)
      this.showError("Error al cargar los datos del dashboard. Intente de nuevo más tarde.")
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  }

  updateTodayStats(stats) {
    // Actualizar las tarjetas de estadísticas
    this.updateStatCard("revenue", stats.revenue)
    this.updateStatCard("orders", stats.orders)
    this.updateStatCard("products", stats.products)
    this.updateStatCard("clients", stats.clients)
  }

  updateStatCard(type, data) {
    const cards = {
      revenue: {
        selector: ".stats-card-red",
        valueSelector: "h3",
        changeSelector: "p:last-child"
      },
      orders: {
        selector: ".stats-card-yellow",
        valueSelector: "h3",
        changeSelector: "p:last-child"
      },
      products: {
        selector: ".stats-card-green",
        valueSelector: "h3",
        changeSelector: "p:last-child"
      },
      clients: {
        selector: ".stats-card-blue",
        valueSelector: "h3",
        changeSelector: "p:last-child"
      }
    }

    const card = document.querySelector(cards[type].selector)
    if (!card) return

    const valueElement = card.querySelector(cards[type].valueSelector)
    const changeElement = card.querySelector(cards[type].changeSelector)

    if (valueElement) {
      if (type === "revenue") {
        valueElement.textContent = `$ ${this.formatNumber(data.value)}`
      } else {
        valueElement.textContent = this.formatNumber(data.value)
      }
    }

    if (changeElement) {
      const changeText = data.change > 0 ? `+${data.change}%` : `${data.change}%`
      changeElement.textContent = `${changeText} respecto a ayer`
    }
  }

  updateCharts(inventoryAnalysis, executiveSummary) {
    // Destruir gráficos existentes
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy()
    })
    this.charts = {}

    // Crear gráfico de inventario
    this.createInventoryChart(inventoryAnalysis)

    // Crear gráfico del mes
    this.createMonthlyChart(executiveSummary)
  }

  createInventoryChart(inventoryData) {
    const chartContainer = document.querySelector('.chart-container .donut-chart')?.parentElement
    if (!chartContainer) return

    // Crear canvas si no existe
    let canvas = chartContainer.querySelector('canvas')
    if (!canvas) {
      // Reemplazar el SVG con un canvas
      chartContainer.innerHTML = '<canvas id="homeInventoryChart" width="200" height="200"></canvas>'
      canvas = document.getElementById('homeInventoryChart')
    }

    this.charts.inventory = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Stock disponible", "Stock bajo", "Agotado"],
        datasets: [
          {
            data: [
              inventoryData.disponible.percentage,
              inventoryData.stockBajo.percentage,
              inventoryData.agotado.percentage,
            ],
            backgroundColor: ["#8B7EC7", "#A78BFA", "#E9D5FF"],
            borderColor: "#ffffff",
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false // Ocultamos la leyenda ya que tenemos una custom
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.parsed}%`
              },
            },
          },
        },
      },
    })

    // Actualizar leyenda personalizada
    this.updateInventoryLegend(inventoryData)
  }

  updateInventoryLegend(inventoryData) {
    const legends = document.querySelectorAll('.chart-container ~ div .flex.items-center.justify-between')
    
    if (legends.length >= 2) {
      // Actualizar primera leyenda (Stock disponible)
      const firstLegend = legends[0]
      const firstPercentage = firstLegend.querySelector('span:last-child')
      if (firstPercentage) {
        firstPercentage.textContent = `${inventoryData.disponible.percentage}%`
      }

      // Actualizar segunda leyenda (Stock bajo)
      const secondLegend = legends[1]
      const secondPercentage = secondLegend.querySelector('span:last-child')
      if (secondPercentage) {
        secondPercentage.textContent = `${inventoryData.stockBajo.percentage}%`
      }
    }
  }

  createMonthlyChart(executiveSummary) {
    const monthlyChartContainers = document.querySelectorAll('.chart-container')
    const monthlyChartContainer = monthlyChartContainers[1] // El segundo chart-container
    if (!monthlyChartContainer) return

    // Crear canvas si no existe
    let canvas = monthlyChartContainer.querySelector('canvas')
    if (!canvas) {
      monthlyChartContainer.innerHTML = '<canvas id="homeMonthlyChart" width="200" height="200"></canvas>'
      canvas = document.getElementById('homeMonthlyChart')
    }

    const currentMonth = executiveSummary.currentMonth
    const targetRevenue = 15000 // Meta mensual ejemplo
    const achieved = (currentMonth.revenue / targetRevenue) * 100
    const remaining = 100 - achieved

    this.charts.monthly = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Meta alcanzada", "Meta pendiente"],
        datasets: [
          {
            data: [achieved, remaining],
            backgroundColor: ["#8B7EC7", "#E9D5FF"],
            borderColor: "#ffffff",
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.parsed.toFixed(1)}%`
              },
            },
          },
        },
      },
    })

    // Actualizar leyendas del mes
    this.updateMonthlyLegend(achieved, remaining)
  }

  updateMonthlyLegend(achieved, remaining) {
    const monthlySection = document.querySelectorAll('.bg-white.rounded-2xl')[1] // Segunda sección de gráfico
    if (!monthlySection) return

    const legends = monthlySection.querySelectorAll('.flex.items-center.justify-between')
    
    if (legends.length >= 2) {
      // Actualizar meta alcanzada
      const achievedLegend = legends[0]
      const achievedPercentage = achievedLegend.querySelector('span:last-child')
      if (achievedPercentage) {
        achievedPercentage.textContent = `${achieved.toFixed(1)}%`
      }

      // Actualizar meta pendiente
      const remainingLegend = legends[1]
      const remainingPercentage = remainingLegend.querySelector('span:last-child')
      if (remainingPercentage) {
        remainingPercentage.textContent = `${remaining.toFixed(1)}%`
      }
    }
  }

  async refreshData() {
    console.log("Refrescando datos del dashboard...")
    await this.loadHomeData()
  }

  async exportData() {
    try {
      console.log("Exportando datos...")
      
      // Obtener datos actuales
      const todayStats = await this.analyticsService.getTodayStats()
      const inventoryAnalysis = await this.analyticsService.getInventoryAnalysis()
      
      // Crear objeto con los datos
      const exportData = {
        fecha: new Date().toISOString().split('T')[0],
        ventasHoy: {
          totalVentas: todayStats.revenue.value,
          ordenesTotales: todayStats.orders.value,
          productosVendidos: todayStats.products.value,
          nuevosClientes: todayStats.clients.value
        },
        inventario: {
          stockDisponible: inventoryAnalysis.disponible,
          stockBajo: inventoryAnalysis.stockBajo,
          agotado: inventoryAnalysis.agotado
        }
      }
      
      // Crear archivo CSV
      const csvContent = this.generateCSV(exportData)
      this.downloadFile(csvContent, 'dashboard-datos.csv', 'text/csv')
      
      console.log("Datos exportados exitosamente")
    } catch (error) {
      console.error("Error exportando datos:", error)
      this.showError("Error al exportar los datos")
    }
  }

  generateCSV(data) {
    const headers = ['Métrica', 'Valor', 'Porcentaje', 'Descripción']
    const rows = [
      headers.join(','),
      `Total de Ventas,$${data.ventasHoy.totalVentas},,Ingresos del día`,
      `Órdenes Totales,${data.ventasHoy.ordenesTotales},,Número de órdenes`,
      `Productos Vendidos,${data.ventasHoy.productosVendidos},,Cantidad de productos`,
      `Nuevos Clientes,${data.ventasHoy.nuevosClientes},,Clientes nuevos`,
      `Stock Disponible,${data.inventario.stockDisponible.count},${data.inventario.stockDisponible.percentage}%,Productos disponibles`,
      `Stock Bajo,${data.inventario.stockBajo.count},${data.inventario.stockBajo.percentage}%,Productos con stock bajo`,
      `Agotado,${data.inventario.agotado.count},${data.inventario.agotado.percentage}%,Productos agotados`
    ]
    
    return rows.join('\n')
  }

  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  showLoadingState() {
    // Mostrar indicadores de carga en las tarjetas
    document.querySelectorAll('.stats-card-red h3, .stats-card-yellow h3, .stats-card-green h3, .stats-card-blue h3').forEach(element => {
      if (element) {
        element.textContent = "..."
      }
    })
  }

  hideLoadingState() {
    // Los datos se actualizan en updateTodayStats
  }

  showError(message) {
    console.error(message)
    
    // Crear notificación de error
    const errorDiv = document.createElement('div')
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    
    document.body.appendChild(errorDiv)
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove()
      }
    }, 5000)
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k"
    }
    return num.toString()
  }
}

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  window.HomeHandler = HomeHandler
}