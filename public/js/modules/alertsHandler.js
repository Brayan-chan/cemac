import { InventoryService } from "../services/inventoryService.js"

class AlertsHandler {
  constructor() {
    // Verificar autenticación
    const token = localStorage.getItem("authToken")
    if (!token) {
      window.location.href = "/index.html"
      return
    }

    this.inventoryService = new InventoryService()
    this.alerts = []
    this.currentFilters = {
      startDate: "",
      endDate: "",
      priority: "",
      status: "",
      sort: "date_desc",
      page: 1,
      limit: 10,
    }
    this.totalPages = 1
    this.totalAlerts = 0
    this.currentAlert = null

    // Stock thresholds for alert generation
    this.stockThresholds = {
      urgente: 0, // Out of stock
      alta: 5, // Very low stock
      media: 10, // Low stock
      baja: 20, // Warning level
    }

    this.initializeEventListeners()
    this.loadAlerts()

    // Set up periodic refresh for real-time alerts
    this.setupPeriodicRefresh()
  }

  initializeEventListeners() {
    // Filter controls
    document.getElementById("applyFiltersBtn")?.addEventListener("click", () => {
      this.applyFilters()
    })

    document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
      this.clearFilters()
    })

    document.getElementById("refreshAlertsBtn")?.addEventListener("click", () => {
      this.loadAlerts()
    })

    document.getElementById("markAllReadBtn")?.addEventListener("click", () => {
      this.markAllAsRead()
    })

    // Pagination
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
      if (this.currentFilters.page > 1) {
        this.currentFilters.page--
        this.loadAlerts()
      }
    })

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
      if (this.currentFilters.page < this.totalPages) {
        this.currentFilters.page++
        this.loadAlerts()
      }
    })

    // Modal controls
    document.getElementById("closeActionModal")?.addEventListener("click", () => {
      this.hideActionModal()
    })

    // Alert actions
    document.getElementById("markAsReadBtn")?.addEventListener("click", () => {
      this.updateAlertStatus(this.currentAlert.id, "atendido")
    })

    document.getElementById("markInProgressBtn")?.addEventListener("click", () => {
      this.updateAlertStatus(this.currentAlert.id, "en_proceso")
    })

    document.getElementById("dismissAlertBtn")?.addEventListener("click", () => {
      this.updateAlertStatus(this.currentAlert.id, "descartado")
    })

    document.getElementById("viewProductBtn")?.addEventListener("click", () => {
      if (this.currentAlert && this.currentAlert.productId) {
        window.location.href = `/views/dashboard/inventario.html?product=${this.currentAlert.productId}`
      }
    })

    // Close modal when clicking outside
    document.getElementById("alertActionModal")?.addEventListener("click", (e) => {
      if (e.target.id === "alertActionModal") {
        this.hideActionModal()
      }
    })
  }

  async loadAlerts() {
    try {
      this.showLoadingState()

      // Generate alerts from inventory data
      await this.generateStockAlerts()

      // Apply filters and sorting
      this.applyFiltersAndSort()

      this.hideLoadingState()
      this.renderAlerts()
      this.updatePagination()
      this.updateAlertsCount()
    } catch (error) {
      console.error("Error al cargar alertas:", error)
      this.hideLoadingState()
      this.showError("Error al cargar las alertas. Por favor, intenta de nuevo.")
      this.showEmptyState()
    }
  }

  async generateStockAlerts() {
    try {
      // Get all products from inventory
      const products = await this.inventoryService.getProducts()
      const productList = Array.isArray(products) ? products : products.products || []

      // Get existing alerts from localStorage to maintain status
      const existingAlerts = this.getStoredAlerts()

      // Generate new alerts based on stock levels
      const newAlerts = []

      productList.forEach((product) => {
        if (product.stock !== undefined && product.stock !== null) {
          const priority = this.calculatePriority(product.stock)
          if (priority) {
            // Check if alert already exists
            const existingAlert = existingAlerts.find(
              (alert) => alert.productId === product.id && alert.type === "stock_low",
            )

            const alert = {
              id: existingAlert?.id || this.generateAlertId(),
              type: "stock_low",
              priority: priority,
              status: existingAlert?.status || "pendiente",
              productId: product.id,
              productName: product.name || "Producto sin nombre",
              productCategory: product.category || "Sin categoría",
              currentStock: product.stock,
              message: this.generateStockMessage(product.name, product.category, product.stock),
              createdAt: existingAlert?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            newAlerts.push(alert)
          }
        }
      })

      // Store alerts
      this.storeAlerts(newAlerts)
      this.alerts = newAlerts
    } catch (error) {
      console.error("Error generando alertas de stock:", error)
      throw error
    }
  }

  calculatePriority(stock) {
    if (stock <= this.stockThresholds.urgente) return "urgente"
    if (stock <= this.stockThresholds.alta) return "alta"
    if (stock <= this.stockThresholds.media) return "media"
    if (stock <= this.stockThresholds.baja) return "baja"
    return null // No alert needed
  }

  generateStockMessage(productName, category, stock) {
    if (stock === 0) {
      return `Producto agotado: ${productName} en la sección de ${category}`
    } else if (stock <= 5) {
      return `Stock crítico: Solo quedan ${stock} unidades de ${productName} en ${category}`
    } else if (stock <= 10) {
      return `Stock bajo: ${stock} unidades restantes de ${productName} en ${category}`
    } else {
      return `Advertencia de stock: ${stock} unidades de ${productName} en ${category}`
    }
  }

  generateAlertId() {
    return "alert_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  }

  applyFiltersAndSort() {
    let filteredAlerts = [...this.alerts]

    // Apply filters
    if (this.currentFilters.startDate) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => new Date(alert.createdAt) >= new Date(this.currentFilters.startDate),
      )
    }

    if (this.currentFilters.endDate) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => new Date(alert.createdAt) <= new Date(this.currentFilters.endDate),
      )
    }

    if (this.currentFilters.priority) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.priority === this.currentFilters.priority)
    }

    if (this.currentFilters.status) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === this.currentFilters.status)
    }

    // Apply sorting
    filteredAlerts.sort((a, b) => {
      switch (this.currentFilters.sort) {
        case "date_desc":
          return new Date(b.createdAt) - new Date(a.createdAt)
        case "date_asc":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "priority_desc":
          return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
        case "priority_asc":
          return this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority)
        case "product_name":
          return a.productName.localeCompare(b.productName)
        default:
          return 0
      }
    })

    // Apply pagination
    this.totalAlerts = filteredAlerts.length
    this.totalPages = Math.ceil(this.totalAlerts / this.currentFilters.limit)

    const startIndex = (this.currentFilters.page - 1) * this.currentFilters.limit
    const endIndex = startIndex + this.currentFilters.limit

    this.filteredAlerts = filteredAlerts.slice(startIndex, endIndex)
  }

  getPriorityWeight(priority) {
    const weights = { urgente: 4, alta: 3, media: 2, baja: 1 }
    return weights[priority] || 0
  }

  renderAlerts() {
    const container = document.getElementById("alertsContainer")
    if (!container) return

    // Clear existing alerts (keep loading and empty states)
    const existingAlerts = container.querySelectorAll(".alert-item")
    existingAlerts.forEach((alert) => alert.remove())

    if (this.filteredAlerts.length === 0) {
      this.showEmptyState()
      return
    }

    this.hideEmptyState()

    // Render each alert
    this.filteredAlerts.forEach((alert) => {
      const alertElement = this.createAlertElement(alert)
      container.appendChild(alertElement)
    })
  }

  createAlertElement(alert) {
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert-item rounded-lg p-4 transition-all hover:shadow-md ${this.getAlertBackgroundClass(alert.priority)}`

    alertDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-gray-600 text-lg"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 mb-1">Alerta de stock bajo</h3>
            <p class="text-gray-700 text-sm">${this.getSimpleMessage(alert)}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">${this.formatSimpleDate(alert.createdAt)}</span>
          <button 
            onclick="alertsHandler.showActionModal('${alert.id}')"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Acciones"
          >
            <i class="fas fa-ellipsis-h"></i>
          </button>
        </div>
      </div>
    `

    return alertDiv
  }

  getAlertBackgroundClass(priority) {
    const classes = {
      urgente: "bg-red-100 border border-red-200",
      alta: "bg-red-100 border border-red-200",
      media: "bg-yellow-100 border border-yellow-200",
      baja: "bg-yellow-100 border border-yellow-200",
    }
    return classes[priority] || classes.media
  }

  getSimpleMessage(alert) {
    return `se detectó un decremento en la sección de ${alert.productCategory || "productos"}`
  }

  formatSimpleDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  showActionModal(alertId) {
    this.currentAlert = this.alerts.find((alert) => alert.id === alertId)
    if (!this.currentAlert) return

    const modal = document.getElementById("alertActionModal")
    if (modal) {
      modal.classList.remove("hidden")
    }
  }

  hideActionModal() {
    const modal = document.getElementById("alertActionModal")
    if (modal) {
      modal.classList.add("hidden")
    }
    this.currentAlert = null
  }

  async updateAlertStatus(alertId, newStatus) {
    try {
      // Update alert in memory
      const alertIndex = this.alerts.findIndex((alert) => alert.id === alertId)
      if (alertIndex !== -1) {
        this.alerts[alertIndex].status = newStatus
        this.alerts[alertIndex].updatedAt = new Date().toISOString()

        // Store updated alerts
        this.storeAlerts(this.alerts)

        // Refresh display
        this.applyFiltersAndSort()
        this.renderAlerts()
        this.updateAlertsCount()

        this.hideActionModal()
        this.showSuccess(`Alerta marcada como ${this.getStatusLabel(newStatus).toLowerCase()}`)
      }
    } catch (error) {
      console.error("Error actualizando estado de alerta:", error)
      this.showError("Error al actualizar la alerta")
    }
  }

  async markAllAsRead() {
    try {
      // Update all pending alerts to "atendido"
      let updatedCount = 0
      this.alerts.forEach((alert) => {
        if (alert.status === "pendiente") {
          alert.status = "atendido"
          alert.updatedAt = new Date().toISOString()
          updatedCount++
        }
      })

      if (updatedCount > 0) {
        this.storeAlerts(this.alerts)
        this.applyFiltersAndSort()
        this.renderAlerts()
        this.updateAlertsCount()
        this.showSuccess(`${updatedCount} alertas marcadas como atendidas`)
      } else {
        this.showInfo("No hay alertas pendientes para marcar")
      }
    } catch (error) {
      console.error("Error marcando todas las alertas:", error)
      this.showError("Error al marcar las alertas")
    }
  }

  applyFilters() {
    // Get filter values
    this.currentFilters.startDate = document.getElementById("startDate")?.value || ""
    this.currentFilters.endDate = document.getElementById("endDate")?.value || ""
    this.currentFilters.priority = document.getElementById("priorityFilter")?.value || ""
    this.currentFilters.status = document.getElementById("statusFilter")?.value || ""
    this.currentFilters.sort = document.getElementById("sortFilter")?.value || "date_desc"
    this.currentFilters.page = 1 // Reset to first page

    this.applyFiltersAndSort()
    this.renderAlerts()
    this.updatePagination()
    this.updateAlertsCount()
  }

  clearFilters() {
    // Reset filter inputs
    document.getElementById("startDate").value = ""
    document.getElementById("endDate").value = ""
    document.getElementById("priorityFilter").value = ""
    document.getElementById("statusFilter").value = ""
    document.getElementById("sortFilter").value = "date_desc"

    // Reset filter state
    this.currentFilters = {
      startDate: "",
      endDate: "",
      priority: "",
      status: "",
      sort: "date_desc",
      page: 1,
      limit: 10,
    }

    this.applyFiltersAndSort()
    this.renderAlerts()
    this.updatePagination()
    this.updateAlertsCount()
  }

  updatePagination() {
    const paginationNumbers = document.getElementById("paginationNumbers")
    const prevBtn = document.getElementById("prevPageBtn")
    const nextBtn = document.getElementById("nextPageBtn")

    if (!paginationNumbers || !prevBtn || !nextBtn) return

    // Update button states
    prevBtn.disabled = this.currentFilters.page <= 1
    nextBtn.disabled = this.currentFilters.page >= this.totalPages

    // Generate page numbers
    const pageNumbers = this.generatePageNumbers()
    paginationNumbers.innerHTML = pageNumbers
      .map((page) => {
        if (page === "...") {
          return `<span class="px-3 py-2 text-gray-500">...</span>`
        }

        const isActive = page === this.currentFilters.page
        return `
          <button 
            onclick="alertsHandler.goToPage(${page})"
            class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                   ${isActive ? "bg-[#8B7EC7] text-white" : "text-gray-600 hover:bg-gray-100"}"
          >
            ${page}
          </button>
        `
      })
      .join("")
  }

  generatePageNumbers() {
    const current = this.currentFilters.page
    const total = this.totalPages
    const pages = []

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (current <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      } else if (current >= total - 3) {
        pages.push("...")
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push("...")
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      }
    }

    return pages
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentFilters.page) {
      this.currentFilters.page = page
      this.applyFiltersAndSort()
      this.renderAlerts()
      this.updatePagination()
    }
  }

  updateAlertsCount() {
    const countElement = document.getElementById("alertsCount")
    if (countElement) {
      countElement.textContent = this.totalAlerts
    }
  }

  setupPeriodicRefresh() {
    // Refresh alerts every 5 minutes
    setInterval(
      () => {
        this.loadAlerts()
      },
      5 * 60 * 1000,
    )
  }

  // Storage methods
  getStoredAlerts() {
    try {
      const stored = localStorage.getItem("cemac_alerts")
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error reading stored alerts:", error)
      return []
    }
  }

  storeAlerts(alerts) {
    try {
      localStorage.setItem("cemac_alerts", JSON.stringify(alerts))
    } catch (error) {
      console.error("Error storing alerts:", error)
    }
  }

  // UI State methods
  showLoadingState() {
    const loadingState = document.getElementById("loadingState")
    const emptyState = document.getElementById("emptyState")

    if (loadingState) loadingState.classList.remove("hidden")
    if (emptyState) emptyState.classList.add("hidden")
  }

  hideLoadingState() {
    const loadingState = document.getElementById("loadingState")
    if (loadingState) loadingState.classList.add("hidden")
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState")
    const loadingState = document.getElementById("loadingState")

    if (emptyState) emptyState.classList.remove("hidden")
    if (loadingState) loadingState.classList.add("hidden")
  }

  hideEmptyState() {
    const emptyState = document.getElementById("emptyState")
    if (emptyState) emptyState.classList.add("hidden")
  }

  // Notification methods
  showSuccess(message) {
    this.showNotification(message, "success")
  }

  showError(message) {
    this.showNotification(message, "error")
  }

  showInfo(message) {
    this.showNotification(message, "info")
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`

    const bgClass =
      {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
      }[type] || "bg-gray-500 text-white"

    notification.className += ` ${bgClass}`
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full")
    }, 100)

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("translate-x-full")
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.alertsHandler = new AlertsHandler()
})
