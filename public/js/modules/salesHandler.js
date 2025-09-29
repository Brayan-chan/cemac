/**
 * Manejador de la interfaz de ventas
 * Gestiona la interacción del usuario con el sistema de ventas
 */
import { SalesService } from "../services/salesService.js"

export class SalesHandler {
  constructor() {
    this.salesService = new SalesService()
    this.currentSale = {
      cliente: "",
      vendedor: "",
      products: [],
      descuento: 0,
      iva: 0,
      paymentMethod: "efectivo",
      notes: "",
    }
    this.productSearchResults = []
    this.salesHistory = []
    this.currentPage = 1
    this.itemsPerPage = 10

    this.init()
  }

  /**
   * Inicializar el manejador
   */
  async init() {
    try {
      console.log("[v0] Inicializando SalesHandler...")
      this.bindEvents()
      await this.loadSalesHistory()
      await this.loadInitialData()
      console.log("[v0] SalesHandler inicializado correctamente")
    } catch (error) {
      console.error("[v0] Error inicializando SalesHandler:", error)
      this.showError("Error inicializando el sistema de ventas")
    }
  }

  /**
   * Vincular eventos del DOM
   */
  bindEvents() {
    // Búsqueda de productos
    const productSearchInput = document.querySelector('input[placeholder="Buscar producto..."]')
    if (productSearchInput) {
      productSearchInput.addEventListener("input", this.debounce(this.handleProductSearch.bind(this), 300))
      productSearchInput.addEventListener("keydown", this.handleProductSearchKeydown.bind(this))
    }

    // Campos del formulario
    const clienteInput = document.querySelector('input[placeholder="Buscar cliente..."]')
    if (clienteInput) {
      clienteInput.addEventListener("input", (e) => {
        this.currentSale.cliente = e.target.value
      })
    }

    const vendedorSelect = document.querySelector("select")
    if (vendedorSelect) {
      vendedorSelect.addEventListener("change", (e) => {
        this.currentSale.vendedor = e.target.value
      })
    }

    // Botón agregar producto
    const addProductBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent.includes("Agregar producto"),
    )
    if (addProductBtn) {
      addProductBtn.addEventListener("click", this.handleAddProduct.bind(this))
    }

    // Botón cobrar
    const cobrarBtn = Array.from(document.querySelectorAll("button")).find((btn) => btn.textContent.includes("Cobrar"))
    if (cobrarBtn) {
      cobrarBtn.addEventListener("click", this.handleProcessSale.bind(this))
    }

    // Botón exportar
    const exportBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent.includes("Exportar"),
    )
    if (exportBtn) {
      exportBtn.addEventListener("click", this.handleExportSales.bind(this))
    }
  }

  /**
   * Debounce para búsquedas
   */
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Manejar búsqueda de productos
   */
  async handleProductSearch(event) {
    const searchTerm = event.target.value.trim()

    if (searchTerm.length < 2) {
      this.hideProductSearchResults()
      return
    }

    try {
      console.log("[v0] Buscando productos:", searchTerm)
      const response = await this.salesService.searchProducts(searchTerm, 10)
      this.productSearchResults = response.products || []
      this.showProductSearchResults()
    } catch (error) {
      console.error("[v0] Error buscando productos:", error)
      this.showError("Error buscando productos")
    }
  }

  /**
   * Manejar teclas en búsqueda de productos
   */
  handleProductSearchKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      const firstResult = this.productSearchResults[0]
      if (firstResult) {
        this.selectProduct(firstResult)
      }
    } else if (event.key === "Escape") {
      this.hideProductSearchResults()
    }
  }

  /**
   * Mostrar resultados de búsqueda de productos
   */
  showProductSearchResults() {
    // Remover dropdown existente
    const existingDropdown = document.getElementById("productSearchDropdown")
    if (existingDropdown) {
      existingDropdown.remove()
    }

    if (this.productSearchResults.length === 0) {
      return
    }

    const searchInput = document.querySelector('input[placeholder="Buscar producto..."]')
    const dropdown = document.createElement("div")
    dropdown.id = "productSearchDropdown"
    dropdown.className =
      "absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"

    this.productSearchResults.forEach((product) => {
      const item = document.createElement("div")
      item.className = "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
      item.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.category || "Sin categoría"}</div>
                        <div class="text-sm text-gray-600">Stock: ${product.availability === "unlimited" ? "∞" : product.stock}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium text-[#8B7EC7]">$${product.suggestedPrice}</div>
                        ${product.promotionalPrice ? `<div class="text-xs text-gray-500 line-through">$${product.price}</div>` : ""}
                    </div>
                </div>
            `

      item.addEventListener("click", () => {
        this.selectProduct(product)
      })

      dropdown.appendChild(item)
    })

    // Posicionar dropdown
    const searchContainer = searchInput.parentElement
    searchContainer.style.position = "relative"
    searchContainer.appendChild(dropdown)
  }

  /**
   * Ocultar resultados de búsqueda
   */
  hideProductSearchResults() {
    const dropdown = document.getElementById("productSearchDropdown")
    if (dropdown) {
      dropdown.remove()
    }
  }

  /**
   * Seleccionar producto de la búsqueda
   */
  selectProduct(product) {
    console.log("[v0] Producto seleccionado:", product)

    // Verificar si el producto ya está en la venta
    const existingProduct = this.currentSale.products.find((p) => p.productId === product.id)

    if (existingProduct) {
      // Incrementar cantidad si ya existe
      existingProduct.quantity += 1
    } else {
      // Agregar nuevo producto
      this.currentSale.products.push({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.suggestedPrice,
        maxQuantity: product.maxQuantity,
        availability: product.availability,
      })
    }

    // Limpiar búsqueda
    const searchInput = document.querySelector('input[placeholder="Buscar producto..."]')
    if (searchInput) {
      searchInput.value = ""
    }

    this.hideProductSearchResults()
    this.updateProductTable()
    this.updateTotals()
  }

  /**
   * Actualizar tabla de productos
   */
  updateProductTable() {
    const tableContainer = document.querySelector(".bg-gray-50.rounded-lg.p-4")
    if (!tableContainer) return

    // Limpiar tabla existente
    const existingRows = tableContainer.querySelectorAll(".grid.grid-cols-3.gap-4.items-center.border-b")
    existingRows.forEach((row) => row.remove())

    // Agregar productos
    this.currentSale.products.forEach((product, index) => {
      const row = document.createElement("div")
      row.className = "grid grid-cols-3 gap-4 items-center border-b border-gray-200 py-2"
      row.innerHTML = `
                <div>
                    <div class="font-medium">${product.productName}</div>
                    <div class="text-sm text-gray-500">$${product.price} c/u</div>
                </div>
                <div class="text-center flex items-center justify-center gap-2">
                    <button class="decrease-qty w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300" data-index="${index}">-</button>
                    <span class="quantity-display font-medium">${product.quantity}</span>
                    <button class="increase-qty w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300" data-index="${index}">+</button>
                </div>
                <div class="text-right flex items-center justify-end gap-2">
                    <span class="font-medium">$${(product.price * product.quantity).toFixed(2)}</span>
                    <button class="remove-product text-red-500 hover:text-red-700" data-index="${index}">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            `

      tableContainer.appendChild(row)
    })

    // Vincular eventos de cantidad y eliminación
    this.bindProductTableEvents()
  }

  /**
   * Vincular eventos de la tabla de productos
   */
  bindProductTableEvents() {
    // Botones de incrementar cantidad
    document.querySelectorAll(".increase-qty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number.parseInt(e.target.dataset.index)
        const product = this.currentSale.products[index]

        if (product.quantity < product.maxQuantity) {
          product.quantity += 1
          this.updateProductTable()
          this.updateTotals()
        } else {
          this.showError(`Stock máximo disponible: ${product.maxQuantity}`)
        }
      })
    })

    // Botones de decrementar cantidad
    document.querySelectorAll(".decrease-qty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number.parseInt(e.target.dataset.index)
        const product = this.currentSale.products[index]

        if (product.quantity > 1) {
          product.quantity -= 1
          this.updateProductTable()
          this.updateTotals()
        }
      })
    })

    // Botones de eliminar producto
    document.querySelectorAll(".remove-product").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number.parseInt(e.target.dataset.index)
        this.currentSale.products.splice(index, 1)
        this.updateProductTable()
        this.updateTotals()
      })
    })
  }

  /**
   * Actualizar totales de la venta
   */
  updateTotals() {
    const subtotal = this.currentSale.products.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)

    const discountAmount = subtotal * (this.currentSale.descuento / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    const ivaAmount = subtotalAfterDiscount * (this.currentSale.iva / 100)
    const total = subtotalAfterDiscount + ivaAmount

    // Actualizar elementos del DOM
    const subtotalElement = document.querySelector(".space-y-2 .flex:nth-child(1) span:last-child")
    const ivaElement = document.querySelector(".space-y-2 .flex:nth-child(2) span:last-child")
    const totalElement = document.querySelector(".space-y-2 .flex:nth-child(3) span:last-child")

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`
    if (ivaElement) ivaElement.textContent = `$${ivaAmount.toFixed(2)}`
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`
  }

  /**
   * Manejar agregar producto manualmente
   */
  handleAddProduct() {
    // Mostrar modal o formulario para agregar producto manualmente
    // Por ahora, mostrar mensaje para usar la búsqueda
    this.showInfo("Utiliza la búsqueda de productos para agregar artículos a la venta")
  }

  /**
   * Procesar venta
   */
  async handleProcessSale() {
    try {
      // Validar venta
      if (this.currentSale.products.length === 0) {
        this.showError("Agrega al menos un producto a la venta")
        return
      }

      // Preparar datos de la venta
      const saleData = {
        cliente: this.currentSale.cliente || "Cliente General",
        vendedor: this.currentSale.vendedor || "No asignado",
        products: this.currentSale.products.map((product) => ({
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
        })),
        descuento: this.currentSale.descuento,
        iva: this.currentSale.iva,
        paymentMethod: this.currentSale.paymentMethod,
        notes: this.currentSale.notes,
      }

      console.log("[v0] Procesando venta:", saleData)

      // Crear venta
      const response = await this.salesService.createSale(saleData)

      if (response.success) {
        this.showSuccess("Venta procesada exitosamente")
        this.resetSale()
        await this.loadSalesHistory()
      } else {
        throw new Error(response.message || "Error procesando la venta")
      }
    } catch (error) {
      console.error("[v0] Error procesando venta:", error)
      this.showError(error.message || "Error procesando la venta")
    }
  }

  /**
   * Resetear venta actual
   */
  resetSale() {
    this.currentSale = {
      cliente: "",
      vendedor: "",
      products: [],
      descuento: 0,
      iva: 0,
      paymentMethod: "efectivo",
      notes: "",
    }

    // Limpiar formulario
    const clienteInput = document.querySelector('input[placeholder="Buscar cliente..."]')
    const vendedorSelect = document.querySelector("select")
    const productSearchInput = document.querySelector('input[placeholder="Buscar producto..."]')

    if (clienteInput) clienteInput.value = ""
    if (vendedorSelect) vendedorSelect.selectedIndex = 0
    if (productSearchInput) productSearchInput.value = ""

    this.updateProductTable()
    this.updateTotals()
  }

  /**
   * Cargar historial de ventas
   */
  async loadSalesHistory() {
    try {
      console.log("[v0] Cargando historial de ventas...")
      const response = await this.salesService.getSales({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      })

      this.salesHistory = response.sales || []
      this.updateSalesHistory()
    } catch (error) {
      console.error("[v0] Error cargando historial:", error)
      // No mostrar error al usuario para el historial
    }
  }

  /**
   * Actualizar historial de ventas en el DOM
   */
  updateSalesHistory() {
    const historyContainer = document.querySelector(".space-y-3")
    if (!historyContainer) return

    // Limpiar historial existente
    historyContainer.innerHTML = ""

    // Agregar ventas recientes
    this.salesHistory.slice(0, 5).forEach((sale) => {
      const historyItem = document.createElement("div")
      historyItem.className = "bg-white p-3 rounded-lg cursor-pointer hover:bg-gray-50"
      historyItem.innerHTML = `
                <div class="text-sm font-medium">${sale.cliente}</div>
                <div class="text-xs text-gray-500">${sale.date}</div>
                <div class="text-xs text-gray-500">Total: $${sale.total}</div>
                <div class="text-xs text-gray-500">${sale.products.length} producto(s)</div>
            `

      historyItem.addEventListener("click", () => {
        this.showSaleDetails(sale)
      })

      historyContainer.appendChild(historyItem)
    })

    if (this.salesHistory.length === 0) {
      historyContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No hay ventas recientes</div>'
    }
  }

  /**
   * Mostrar detalles de una venta
   */
  showSaleDetails(sale) {
    // Crear modal con detalles de la venta
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Detalles de Venta</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-3">
                    <div><strong>ID:</strong> ${sale.id}</div>
                    <div><strong>Cliente:</strong> ${sale.cliente}</div>
                    <div><strong>Vendedor:</strong> ${sale.vendedor}</div>
                    <div><strong>Fecha:</strong> ${sale.date}</div>
                    <div><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${this.getStatusClass(sale.status)}">${sale.status}</span></div>
                    <div><strong>Productos:</strong></div>
                    <div class="bg-gray-50 p-3 rounded">
                        ${sale.products
                          .map(
                            (product) => `
                            <div class="flex justify-between py-1">
                                <span>${product.productName} x${product.quantity}</span>
                                <span>$${product.totalPrice}</span>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                    <div class="border-t pt-3">
                        <div class="flex justify-between"><span>Subtotal:</span><span>$${sale.subtotal}</span></div>
                        ${sale.discountAmount ? `<div class="flex justify-between"><span>Descuento:</span><span>-$${sale.discountAmount}</span></div>` : ""}
                        ${sale.ivaAmount ? `<div class="flex justify-between"><span>IVA:</span><span>$${sale.ivaAmount}</span></div>` : ""}
                        <div class="flex justify-between font-semibold"><span>Total:</span><span>$${sale.total}</span></div>
                    </div>
                </div>
            </div>
        `

    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.remove()
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })

    document.body.appendChild(modal)
  }

  /**
   * Obtener clase CSS para estado de venta
   */
  getStatusClass(status) {
    const classes = {
      completada: "bg-green-100 text-green-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      cancelada: "bg-red-100 text-red-800",
      devuelta: "bg-gray-100 text-gray-800",
    }
    return classes[status] || "bg-gray-100 text-gray-800"
  }

  /**
   * Exportar ventas
   */
  async handleExportSales() {
    try {
      console.log("[v0] Exportando ventas...")
      await this.salesService.exportSales()
      this.showSuccess("Reporte exportado exitosamente")
    } catch (error) {
      console.error("[v0] Error exportando ventas:", error)
      this.showError("Error exportando el reporte")
    }
  }

  /**
   * Cargar datos iniciales
   */
  async loadInitialData() {
    // Cargar vendedores disponibles
    const vendedorSelect = document.querySelector("select")
    if (vendedorSelect) {
      // Por ahora usar vendedores estáticos, se puede mejorar con endpoint de usuarios
      vendedorSelect.innerHTML = `
                <option value="">No asignado</option>
                <option value="María García">María García</option>
                <option value="Carlos López">Carlos López</option>
                <option value="Ana Rodríguez">Ana Rodríguez</option>
                <option value="Luis Martín">Luis Martín</option>
            `
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  showSuccess(message) {
    this.showNotification(message, "success")
  }

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    this.showNotification(message, "error")
  }

  /**
   * Mostrar mensaje informativo
   */
  showInfo(message) {
    this.showNotification(message, "info")
  }

  /**
   * Mostrar notificación
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${this.getNotificationClass(type)}`
    notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

    notification.querySelector("button").addEventListener("click", () => {
      notification.remove()
    })

    document.body.appendChild(notification)

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  /**
   * Obtener clase CSS para notificación
   */
  getNotificationClass(type) {
    const classes = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
      warning: "bg-yellow-500 text-white",
    }
    return classes[type] || classes.info
  }

  /**
   * Obtener icono para notificación
   */
  getNotificationIcon(type) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
    }
    return icons[type] || icons.info
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Inicializando sistema de ventas...")
  window.salesHandler = new SalesHandler()
})
