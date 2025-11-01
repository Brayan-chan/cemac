import { AnalyticsService } from "../services/analyticsService.js"

const Chart = window.Chart

export class AnalyticsHandler {
  constructor() {
    this.analyticsService = new AnalyticsService()
    this.charts = {}
    this.isLoading = false

    console.log("Inicializando AnalyticsHandler...")
    this.init()
  }

  async init() {
    try {
      this.bindEvents()
      await this.loadAnalyticsData()
      console.log("AnalyticsHandler inicializado correctamente")
    } catch (error) {
      console.error("Error inicializando AnalyticsHandler:", error)
      this.showError("Error inicializando el sistema de análisis")
    }
  }

  bindEvents() {
    // Evento para refrescar datos
    const refreshBtn = document.querySelector("#refreshAnalytics")
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshData())
    }
  }

  async loadAnalyticsData() {
    if (this.isLoading) return

    this.isLoading = true
    this.showLoadingState()

    try {
      // Obtener datos analíticos generales
      const analyticsData = await this.analyticsService.getAnalyticsData()

      // Obtener análisis de inventario
      const inventoryAnalysis = await this.analyticsService.getInventoryAnalysis()

      // Obtener estadísticas de hoy
      const todayStats = await this.analyticsService.getTodayStats()

      // Actualizar la interfaz
      this.updateTodayStats(todayStats)
      this.updateCharts(analyticsData, inventoryAnalysis)

      console.log("Datos de análisis cargados exitosamente")
    } catch (error) {
      console.error("Error cargando datos de análisis:", error)
      this.showError("Error al cargar los datos de análisis. Intente de nuevo más tarde.")
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  }

  updateTodayStats(stats) {
    this.updateStatCard("revenue", stats.revenue)
    this.updateStatCard("orders", stats.orders)
    this.updateStatCard("products", stats.products)
    this.updateStatCard("clients", stats.clients)
  }

  updateStatCard(type, data) {
    const card = document.querySelector(`[data-stat="${type}"]`)
    if (!card) return

    const valueElement = card.querySelector(".stat-value")
    const changeElement = card.querySelector(".stat-change")
    const labelElement = card.querySelector(".stat-label")

    if (valueElement) {
      if (type === "revenue") {
        valueElement.textContent = `$${this.formatNumber(data.value)}`
      } else {
        valueElement.textContent = this.formatNumber(data.value)
      }
    }

    if (changeElement) {
      const changeText = data.change > 0 ? `+${data.change}%` : `${data.change}%`
      changeElement.textContent = `${changeText} respecto a ayer`
      changeElement.className = `stat-change ${data.change >= 0 ? "text-green-600" : "text-red-600"}`
    }

    if (labelElement) {
      labelElement.textContent = data.label
    }
  }

  updateCharts(analyticsData, inventoryAnalysis) {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy()
    })
    this.charts = {}

    // Crear gráficos con Chart.js
    this.createInventoryChart(inventoryAnalysis)
    this.createAnnualChart(analyticsData.monthly)
    this.createRotationChart(inventoryAnalysis)
    this.createIncomeChart(analyticsData.daily)
    this.createExpensesChart(analyticsData.daily)
  }

  createInventoryChart(inventoryData) {
    const canvas = document.getElementById("inventoryChart")
    if (!canvas) return

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
            position: "bottom",
            labels: {
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (context) => {
                return context.label + ": " + context.parsed + "%"
              },
            },
          },
        },
      },
    })
  }

  createAnnualChart(monthlyData) {
    const canvas = document.getElementById("annualChart")
    if (!canvas) return

    this.charts.annual = new Chart(canvas, {
      type: "bar",
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: "Ingresos mensuales",
            data: monthlyData.values,
            backgroundColor: "#8B7EC7",
            borderColor: "#7A6DB8",
            borderWidth: 0,
            borderRadius: 6,
            hoverBackgroundColor: "#7A6DB8",
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => "$" + context.parsed.y.toLocaleString("es-ES"),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + (value / 1000).toFixed(0) + "k",
              font: { size: 11 },
            },
            grid: { color: "rgba(200, 200, 200, 0.1)" },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 0,
            },
          },
        },
      },
    })
  }

  createRotationChart(inventoryData) {
    const canvas = document.getElementById("rotationChart")
    if (!canvas) return

    this.charts.rotation = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Muy frecuente", "Frecuente", "Poco frecuente"],
        datasets: [
          {
            data: [45, 35, 20],
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
            position: "bottom",
            labels: {
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (context) => context.label + ": " + context.parsed + "%",
            },
          },
        },
      },
    })
  }

  createIncomeChart(dailyData) {
    const canvas = document.getElementById("incomeChart")
    if (!canvas) return

    this.charts.income = new Chart(canvas, {
      type: "line",
      data: {
        labels: dailyData.labels,
        datasets: [
          {
            label: "Ingresos",
            data: dailyData.values,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "#10B981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: "#059669",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => "$" + context.parsed.y.toLocaleString("es-ES"),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + (value / 1000).toFixed(1) + "k",
              font: { size: 10 },
            },
            grid: { color: "rgba(200, 200, 200, 0.1)" },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
            },
          },
        },
      },
    })
  }

  createExpensesChart(dailyData) {
    const canvas = document.getElementById("expensesChart")
    if (!canvas) return

    const expensesData = dailyData.values.map((value) => value * 0.6)

    this.charts.expenses = new Chart(canvas, {
      type: "line",
      data: {
        labels: dailyData.labels,
        datasets: [
          {
            label: "Egresos",
            data: expensesData,
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "#EF4444",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: "#DC2626",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => "$" + context.parsed.y.toLocaleString("es-ES"),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + (value / 1000).toFixed(1) + "k",
              font: { size: 10 },
            },
            grid: { color: "rgba(200, 200, 200, 0.1)" },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
            },
          },
        },
      },
    })
  }

  async refreshData() {
    console.log("Refrescando datos de análisis...")
    await this.loadAnalyticsData()
  }

  showLoadingState() {
    const loadingElements = document.querySelectorAll(".loading-placeholder")
    loadingElements.forEach((element) => {
      element.classList.remove("hidden")
    })
  }

  hideLoadingState() {
    const loadingElements = document.querySelectorAll(".loading-placeholder")
    loadingElements.forEach((element) => {
      element.classList.add("hidden")
    })
  }

  showError(message) {
    console.error("Error en análisis:", message)

    // Mostrar notificación de error
    const errorDiv = document.createElement("div")
    errorDiv.className = "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    errorDiv.textContent = message

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      errorDiv.remove()
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

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new AnalyticsHandler()
})
