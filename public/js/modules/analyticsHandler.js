/**
 * Manejador para la interfaz de análisis
 * Gestiona la visualización de datos y gráficos
 */
import { AnalyticsService } from "../services/analyticsService.js"

export class AnalyticsHandler {
  constructor() {
    this.analyticsService = new AnalyticsService();
    this.charts = {};
    this.isLoading = false;

    console.log("Inicializando AnalyticsHandler...");
    this.init();
  }

  async init() {
    try {
      this.bindEvents();
      await this.loadAnalyticsData();
      console.log("AnalyticsHandler inicializado correctamente");
    } catch (error) {
      console.error("Error inicializando AnalyticsHandler:", error);
      this.showError("Error inicializando el sistema de análisis");
    }
  }

  bindEvents() {
    // Evento para refrescar datos
    const refreshBtn = document.querySelector("#refreshAnalytics");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshData());
    }

    // Eventos para filtros de período
    const periodSelectors = document.querySelectorAll(".period-selector");
    periodSelectors.forEach((selector) => {
      selector.addEventListener("change", (e) => this.handlePeriodChange(e));
    });
  }

    async loadAnalyticsData() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      // Obtener datos analíticos generales
      const analyticsData = await this.analyticsService.getAnalyticsData();
      
      // Obtener análisis de inventario
      const inventoryAnalysis = await this.analyticsService.getInventoryAnalysis();
      
      // Obtener estadísticas de hoy
      const todayStats = await this.analyticsService.getTodayStats();

      // Actualizar la interfaz
      this.updateTodayStats(todayStats);
      this.updateCharts(analyticsData, inventoryAnalysis);

      console.log("Datos de análisis cargados exitosamente");
    } catch (error) {
      console.error("Error cargando datos de análisis:", error);
      this.showError("Error al cargar los datos de análisis. Intente de nuevo más tarde.");
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  updateTodayStats(stats) {
    // Actualizar tarjetas de estadísticas de hoy
    this.updateStatCard("revenue", stats.revenue)
    this.updateStatCard("orders", stats.orders)
    this.updateStatCard("products", stats.products)
    this.updateStatCard("clients", stats.clients)
  }

  updateStatCard(type, data) {
    const card = document.querySelector(`[data-stat="${type}"]`);
    if (!card) return;

    const valueElement = card.querySelector(".stat-value");
    const changeElement = card.querySelector(".stat-change");
    const labelElement = card.querySelector(".stat-label");

    if (valueElement) {
      if (type === "revenue") {
        valueElement.textContent = `$${this.formatNumber(data.value)}`;
      } else {
        valueElement.textContent = this.formatNumber(data.value);
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
    // Actualizar gráfico de inventario
    this.updateInventoryChart(inventoryAnalysis)

    // Actualizar gráfico de resumen anual
    this.updateAnnualChart(analyticsData.monthly)

    // Actualizar gráfico de rotación de inventario
    this.updateInventoryRotationChart(inventoryAnalysis)

    // Actualizar gráficos de ingresos y egresos
    this.updateIncomeChart(analyticsData.daily)
    this.updateExpensesChart(analyticsData.daily)
  }

  updateInventoryChart(inventoryData) {
    const canvas = document.getElementById("inventoryChart")
    if (!canvas) return

    const ctx = canvas.getContext("2d")

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Configurar dimensiones
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Datos del gráfico
    const data = [
      { label: "Stock disponible", value: inventoryData.disponible.percentage, color: "#8B7EC7" },
      { label: "Stock bajo", value: inventoryData.stockBajo.percentage, color: "#A78BFA" },
      { label: "Agotado", value: inventoryData.agotado.percentage, color: "#C4B5FD" },
    ]

    // Dibujar gráfico de dona
    let currentAngle = -Math.PI / 2

    data.forEach((item) => {
      const sliceAngle = (item.value / 100) * 2 * Math.PI

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.arc(centerX, centerY, radius * 0.6, currentAngle + sliceAngle, currentAngle, true)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      currentAngle += sliceAngle
    })

    // Agregar texto en el centro
    ctx.fillStyle = "#374151"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Productos agotados", centerX, centerY - 5)
    ctx.font = "12px sans-serif"
    ctx.fillText(`${inventoryData.agotado.percentage}%`, centerX, centerY + 15)
  }

  updateAnnualChart(monthlyData) {
    const canvas = document.getElementById("annualChart")
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    const maxValue = Math.max(...monthlyData.values)
    const minValue = Math.min(...monthlyData.values)
    const valueRange = maxValue - minValue || 1

    // Dibujar línea
    ctx.strokeStyle = "#8B7EC7"
    ctx.lineWidth = 3
    ctx.beginPath()

    monthlyData.values.forEach((value, index) => {
      const x = padding + index * (chartWidth / (monthlyData.values.length - 1))
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Dibujar puntos
    ctx.fillStyle = "#8B7EC7"
    monthlyData.values.forEach((value, index) => {
      const x = padding + index * (chartWidth / (monthlyData.values.length - 1))
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  updateInventoryRotationChart(inventoryData) {
    const canvas = document.getElementById("rotationChart")
    if (!canvas) return

    // Similar al gráfico de inventario pero con datos de rotación
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Datos simulados de rotación
    const rotationData = [
      { label: "Muy frecuente", value: 45, color: "#8B7EC7" },
      { label: "Frecuente", value: 35, color: "#A78BFA" },
      { label: "Poco frecuente", value: 20, color: "#C4B5FD" },
    ]

    let currentAngle = -Math.PI / 2

    rotationData.forEach((item) => {
      const sliceAngle = (item.value / 100) * 2 * Math.PI

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.arc(centerX, centerY, radius * 0.6, currentAngle + sliceAngle, currentAngle, true)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      currentAngle += sliceAngle
    })

    ctx.fillStyle = "#374151"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Muy frecuente", centerX, centerY - 5)
    ctx.font = "12px sans-serif"
    ctx.fillText("45%", centerX, centerY + 15)
  }

  updateIncomeChart(dailyData) {
    const canvas = document.getElementById("incomeChart")
    if (!canvas) return

    this.drawLineChart(canvas, dailyData.values, "#10B981")
  }

  updateExpensesChart(dailyData) {
    const canvas = document.getElementById("expensesChart")
    if (!canvas) return

    // Simular datos de egresos (aproximadamente 60% de los ingresos)
    const expensesData = dailyData.values.map((value) => value * 0.6)
    this.drawLineChart(canvas, expensesData, "#EF4444")
  }

  drawLineChart(canvas, data, color) {
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 20
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    const maxValue = Math.max(...data)
    const minValue = Math.min(...data)
    const valueRange = maxValue - minValue || 1

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = padding + index * (chartWidth / (data.length - 1))
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }

  async refreshData() {
    console.log("Refrescando datos de análisis...")
    await this.loadAnalyticsData()
  }

  async handlePeriodChange(event) {
    const period = event.target.value
    console.log("Cambiando período a:", period)

    // Implementar lógica para cambiar período
    // Por ahora solo refrescar datos
    await this.refreshData()
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
