import { AlertsService } from "../services/alertsService.js"

class AlertsHandler {
  constructor() {
    try {
      console.log("🚀 Iniciando AlertsHandler...")
      
      // Verificar autenticación
      const token = localStorage.getItem("authToken")
      if (!token) {
        console.error("❌ No hay token de autenticación")
        window.location.href = "/index.html"
        return
      }
      
      console.log("✅ Token encontrado:", token.substring(0, 20) + "...")

      this.alertsService = new AlertsService()
      console.log("✅ AlertsService creado")
      
      this.alerts = []
      this.currentFilters = {
        startDate: "",
        endDate: "",
        priority: "",
        status: "",
        sort: "date",
        sortOrder: "desc",
        page: 1,
        limit: 10,
        showDiscarded: false,  // Nueva propiedad para mostrar/ocultar descartadas
      }
      this.totalPages = 1
      this.totalAlerts = 0
      this.currentAlert = null

      console.log("✅ Propiedades inicializadas")

      this.initializeEventListeners()
      console.log("✅ Event listeners inicializados")
      
      this.loadAlerts()
      console.log("✅ Carga de alertas iniciada")

      // Set up periodic refresh for real-time alerts
      this.setupPeriodicRefresh()
      console.log("✅ Refresh periódico configurado")
      
    } catch (error) {
      console.error("❌ Error en constructor de AlertsHandler:", error)
      this.showError("Error inicializando el sistema de alertas: " + error.message)
    }
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

    // Toggle para mostrar alertas descartadas
    document.getElementById("showDiscardedToggle")?.addEventListener("change", (e) => {
      this.currentFilters.showDiscarded = e.target.checked
      this.renderAlerts() // Re-renderizar inmediatamente sin recargar de API
      console.log(`🔄 Mostrar descartadas: ${e.target.checked}`)
    })

    // Generate alerts button (if user is admin)
    document.getElementById("generateAlertsBtn")?.addEventListener("click", () => {
      this.generateAlerts()
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
      this.updateAlertStatus(this.currentAlert.id, "atendido", "Marcado como atendido desde el dashboard")
    })

    document.getElementById("markInProgressBtn")?.addEventListener("click", () => {
      this.updateAlertStatus(this.currentAlert.id, "en_proceso", "Marcado en proceso desde el dashboard")
    })

    document.getElementById("dismissAlertBtn")?.addEventListener("click", () => {
      this.updateAlertStatus(this.currentAlert.id, "descartado", "Descartado desde el dashboard")
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

  async generateAlerts() {
    try {
      console.log("🔄 Generando alertas automáticas...")
      this.showLoadingState()
      
      const response = await this.alertsService.generateAlerts()
      console.log("✅ Alertas generadas:", response.data)
      
      // Reload alerts to show new ones
      await this.loadAlerts()
      
      this.showSuccess(`${response.data.totalGenerated} alertas generadas exitosamente`)
      
    } catch (error) {
      console.error("❌ Error generando alertas:", error)
      this.hideLoadingState()
      this.showError("Error al generar alertas: " + error.message)
    }
  }

  async loadAlerts() {
    try {
      console.log("🔄 Iniciando carga de alertas...")
      this.showLoadingState()

      console.log("🔄 Cargando alertas desde la API...")
      
      // Preparar filtros para la API
      const apiFilters = {
        page: this.currentFilters.page,
        limit: this.currentFilters.limit,
        sortBy: this.currentFilters.sort,
        sortOrder: this.currentFilters.sortOrder
      }

      console.log("📋 Filtros para API:", apiFilters)

      // Agregar filtros opcionales
      if (this.currentFilters.startDate) apiFilters.startDate = this.currentFilters.startDate
      if (this.currentFilters.endDate) apiFilters.endDate = this.currentFilters.endDate
      if (this.currentFilters.priority) apiFilters.priority = this.currentFilters.priority
      if (this.currentFilters.status) apiFilters.status = this.currentFilters.status

      console.log("🚀 Llamando a alertsService.getAlerts con filtros:", apiFilters)

      // Obtener alertas desde la API
      const response = await this.alertsService.getAlerts(apiFilters)
      
      console.log("📋 Alertas obtenidas:", response)

      // Extraer datos según la estructura de la API
      this.alerts = response.data?.alerts || []
      this.totalPages = response.data?.pagination?.totalPages || 1
      this.totalAlerts = response.data?.pagination?.total || response.data?.pagination?.totalAlerts || 0
      
      console.log("📊 Alertas procesadas:", this.alerts.length)
      console.log("📄 Páginas totales:", this.totalPages)
      console.log("🔢 Total alertas:", this.totalAlerts)

      this.hideLoadingState()
      this.renderAlerts()
      this.updatePaginationControls()
      this.updateAlertsCount()

      if (this.alerts.length === 0) {
        this.showEmptyState()
      } else {
        this.hideEmptyState()
      }

    } catch (error) {
      console.error("❌ Error cargando alertas:", error)
      console.error("❌ Stack trace:", error.stack)
      this.hideLoadingState()
      
      // Mostrar estado de error específico
      this.showError("Error al cargar alertas: " + error.message)
      
      // También mostrar el estado vacío para que no se quede colgado
      this.showEmptyState()
    }
  }

  renderAlerts() {
    const alertsList = document.getElementById("alertsList")
    if (!alertsList) return

    alertsList.innerHTML = ""

    // Filtrar alertas según la configuración
    let visibleAlerts = this.alerts
    
    // Si showDiscarded es false, ocultar las alertas descartadas
    if (!this.currentFilters.showDiscarded) {
      visibleAlerts = visibleAlerts.filter(alert => alert.status !== 'descartado')
    }
    
    if (visibleAlerts.length === 0) {
      this.showEmptyState()
      return
    }

    visibleAlerts.forEach((alert) => {
      const alertCard = this.createAlertCard(alert)
      alertsList.appendChild(alertCard)
    })
  }

  createAlertCard(alert) {
    console.log("🏗️ Creando tarjeta para alerta:", alert)
    
    const card = document.createElement("div")
    card.className = `alert-card bg-white rounded-lg shadow-sm border-l-4 p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow ${this.getAlertBorderClass(alert.priority)}`
    card.dataset.alertId = alert.id

    // Formatear fecha
    const alertDate = new Date(alert.createdAt || alert.created_at).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <span class="priority-badge px-2 py-1 text-xs font-medium rounded-full ${this.getPriorityClass(alert.priority)}">
              ${this.getPriorityText(alert.priority)}
            </span>
            <span class="status-badge px-2 py-1 text-xs font-medium rounded-full ${this.getStatusClass(alert.status)}">
              ${this.getStatusText(alert.status)}
            </span>
          </div>
          <h4 class="font-semibold text-gray-900 mb-1">${alert.message || 'Sin título'}</h4>
          <p class="text-gray-600 text-sm mb-2">Tipo: ${alert.type || 'N/A'}</p>
          <div class="text-xs text-gray-500">
            <span>${alertDate}</span>
            ${alert.productName ? ` • Producto: ${alert.productName}` : ""}
            ${alert.productCategory ? ` • ${alert.productCategory}` : ""}
            ${alert.currentStock !== undefined ? ` • Stock: ${alert.currentStock}` : ""}
          </div>
        </div>
        <div class="flex items-center space-x-2 ml-4">
          <button class="alert-action-btn text-blue-600 hover:text-blue-800 text-sm font-medium" 
                  onclick="alertsHandler.showActionModal('${alert.id}')">
            Acciones
          </button>
        </div>
      </div>
    `

    return card
  }

  getAlertBorderClass(priority) {
    const classes = {
      critica: "border-red-600",
      urgente: "border-red-500",
      alta: "border-orange-500",
      media: "border-yellow-500",
      baja: "border-green-500"
    }
    return classes[priority] || "border-gray-300"
  }

  getPriorityClass(priority) {
    const classes = {
      critica: "bg-red-200 text-red-900",
      urgente: "bg-red-100 text-red-800",
      alta: "bg-orange-100 text-orange-800",
      media: "bg-yellow-100 text-yellow-800",
      baja: "bg-green-100 text-green-800"
    }
    return classes[priority] || "bg-gray-100 text-gray-800"
  }

  getPriorityText(priority) {
    const texts = {
      critica: "Crítica",
      urgente: "Urgente",
      alta: "Alta",
      media: "Media",  
      baja: "Baja"
    }
    return texts[priority] || priority || 'N/A'
  }

  getStatusClass(status) {
    const classes = {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_proceso: "bg-blue-100 text-blue-800",
      atendido: "bg-green-100 text-green-800",
      descartado: "bg-gray-100 text-gray-800"
    }
    return classes[status] || "bg-gray-100 text-gray-800"
  }

  getStatusText(status) {
    const texts = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      atendido: "Atendido", 
      descartado: "Descartado"
    }
    return texts[status] || status
  }

  showActionModal(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return

    this.currentAlert = alert
    const modal = document.getElementById("alertActionModal")
    const alertTitle = document.getElementById("alertActionTitle")
    const alertDetails = document.getElementById("alertActionDetails")

    if (!modal || !alertTitle || !alertDetails) return

    alertTitle.textContent = alert.message || 'Alerta sin título'
    alertDetails.innerHTML = `
      <p class="text-gray-600 mb-2">${alert.type || 'Sin descripción'}</p>
      <div class="text-sm text-gray-500 space-y-1">
        <p><strong>ID:</strong> ${alert.id}</p>
        <p><strong>Tipo:</strong> ${alert.type || 'N/A'}</p>
        <p><strong>Prioridad:</strong> ${this.getPriorityText(alert.priority)}</p>
        <p><strong>Estado:</strong> ${this.getStatusText(alert.status)}</p>
        <p><strong>Fecha:</strong> ${new Date(alert.createdAt || alert.created_at).toLocaleString('es-ES')}</p>
        ${alert.productName ? `<p><strong>Producto:</strong> ${alert.productName}</p>` : ""}
        ${alert.productCategory ? `<p><strong>Categoría:</strong> ${alert.productCategory}</p>` : ""}
        ${alert.currentStock !== undefined ? `<p><strong>Stock actual:</strong> ${alert.currentStock}</p>` : ""}
        ${alert.minThreshold !== undefined ? `<p><strong>Umbral mínimo:</strong> ${alert.minThreshold}</p>` : ""}
      </div>
    `

    modal.classList.remove("hidden")
  }

  hideActionModal() {
    const modal = document.getElementById("alertActionModal")
    if (modal) {
      modal.classList.add("hidden")
    }
    this.currentAlert = null
  }

  async updateAlertStatus(alertId, newStatus, reason = "") {
    try {
      console.log(`🔄 Actualizando estado de alerta ${alertId} a ${newStatus}`)
      
      // Llamar al servicio con los parámetros correctos
      const notes = reason || `Estado cambiado a ${newStatus}`
      const response = await this.alertsService.updateAlertStatus(alertId, newStatus, notes)
      
      console.log("✅ Estado actualizado:", response)
      
      // Update local alert
      const alertIndex = this.alerts.findIndex(a => a.id === alertId)
      if (alertIndex !== -1) {
        this.alerts[alertIndex].status = newStatus
        this.alerts[alertIndex].updated_at = new Date().toISOString()
        if (notes) {
          this.alerts[alertIndex].notes = notes
        }
      }
      
      // Refresh display
      this.renderAlerts()
      this.hideActionModal()
      
      // Mensaje especial para alertas descartadas
      if (newStatus === 'descartado') {
        this.showSuccess('Alerta descartada y ocultada de la vista')
      } else {
        this.showSuccess(`Alerta ${this.getStatusText(newStatus).toLowerCase()}`)
      }
      
    } catch (error) {
      console.error("❌ Error actualizando estado:", error)
      this.showError("Error al actualizar el estado: " + error.message)
    }
  }

  async markAllAsRead() {
    try {
      console.log("🔄 Marcando todas las alertas como atendidas...")
      
      const response = await this.alertsService.markAllAsRead()
      console.log("✅ Todas las alertas marcadas como atendidas:", response.data)
      
      // Reload alerts to get updated statuses
      await this.loadAlerts()
      
      this.showSuccess(`${response.data.updated} alertas marcadas como atendidas`)
      
    } catch (error) {
      console.error("❌ Error marcando alertas:", error)
      this.showError("Error al marcar alertas: " + error.message)
    }
  }

  applyFilters() {
    // Get filter values
    this.currentFilters.startDate = document.getElementById("startDateFilter")?.value || ""
    this.currentFilters.endDate = document.getElementById("endDateFilter")?.value || ""
    this.currentFilters.priority = document.getElementById("priorityFilter")?.value || ""
    this.currentFilters.status = document.getElementById("statusFilter")?.value || ""
    this.currentFilters.sort = document.getElementById("sortFilter")?.value || "date"
    this.currentFilters.sortOrder = document.getElementById("sortOrderFilter")?.value || "desc"
    
    // Reset to first page
    this.currentFilters.page = 1
    
    console.log("🔍 Aplicando filtros:", this.currentFilters)
    this.loadAlerts()
  }

  clearFilters() {
    // Reset filter form
    const startDateFilter = document.getElementById("startDateFilter")
    const endDateFilter = document.getElementById("endDateFilter")
    const priorityFilter = document.getElementById("priorityFilter")
    const statusFilter = document.getElementById("statusFilter")
    const sortFilter = document.getElementById("sortFilter")
    const sortOrderFilter = document.getElementById("sortOrderFilter")

    if (startDateFilter) startDateFilter.value = ""
    if (endDateFilter) endDateFilter.value = ""
    if (priorityFilter) priorityFilter.value = ""
    if (statusFilter) statusFilter.value = ""
    if (sortFilter) sortFilter.value = "date"
    if (sortOrderFilter) sortOrderFilter.value = "desc"
    
    // Reset internal filters
    this.currentFilters = {
      startDate: "",
      endDate: "",
      priority: "",
      status: "",
      sort: "date",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    }
    
    console.log("🧹 Filtros limpiados")
    this.loadAlerts()
  }

  updatePaginationControls() {
    const prevBtn = document.getElementById("prevPageBtn")
    const nextBtn = document.getElementById("nextPageBtn")
    const pageInfo = document.getElementById("pageInfo")

    if (prevBtn) {
      prevBtn.disabled = this.currentFilters.page <= 1
      prevBtn.classList.toggle("opacity-50", this.currentFilters.page <= 1)
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentFilters.page >= this.totalPages
      nextBtn.classList.toggle("opacity-50", this.currentFilters.page >= this.totalPages)
    }

    if (pageInfo) {
      pageInfo.textContent = `Página ${this.currentFilters.page} de ${this.totalPages}`
    }
  }

  updateAlertsCount() {
    const alertsCount = document.getElementById("alertsCount")
    if (alertsCount) {
      alertsCount.textContent = `${this.totalAlerts} alerta${this.totalAlerts !== 1 ? 's' : ''}`
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
