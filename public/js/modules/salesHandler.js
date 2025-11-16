/**
 * Manejador de la interfaz de ventas
 * Gestiona la interacción del usuario con el sistema de ventas
 */
import { SalesService } from "../services/salesService.js"

export class SalesHandler {
  constructor(customerHandler = null) {
    this.salesService = new SalesService()
    this.customerHandler = customerHandler
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
    this.totalTransactions = null // Total real de transacciones desde la API
    this.dailyCounterManager = null // Se inicializará después de cargar el módulo

    // Nueva UI: estado para búsqueda, filtros y selección
    this.searchTerm = ""
    this.filterBy = "todos"
    this.selectedSale = null

    this.init()
  }

  /**
   * Establecer referencia al customerHandler
   */
  setCustomerHandler(customerHandler) {
    this.customerHandler = customerHandler
  }

  /**
   * Función helper para parsear fechas de Firebase
   * Prioriza createdAt (formato ISO) sobre date (formato dd/mm/yyyy)
   */
  parseFirebaseDate(sale) {
    // Si recibe un sale object, extraer la mejor fecha disponible
    if (sale && typeof sale === 'object') {
      // Priorizar createdAt que tiene hora completa
      if (sale.createdAt) {
        const createdAtDate = new Date(sale.createdAt)
        if (!isNaN(createdAtDate.getTime())) {
          console.log('[SALES] Using createdAt:', sale.createdAt, '→', createdAtDate)
          return createdAtDate
        }
      }
      
      // Fallback a date si no hay createdAt
      if (sale.date) {
        return this.parseDateString(sale.date)
      }
      
      console.warn('[SALES] No valid date found in sale object:', sale)
      return new Date()
    }
    
    // Si recibe solo un string, parsearlo directamente
    return this.parseDateString(sale)
  }

  /**
   * Parsea strings de fecha en varios formatos
   */
  parseDateString(dateString) {
    if (!dateString) return new Date()

    // Si ya es un objeto Date válido
    if (dateString instanceof Date) return dateString

    // Convertir a string si no lo es
    const dateStr = dateString.toString()

    console.log('[SALES] Parsing date string:', dateStr)

    // Formato dd/mm/yyyy o d/m/yyyy (como se ve en Firebase)
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // JavaScript months are 0-based
        const year = parseInt(parts[2])
        
        // Validar que las partes sean números válidos
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const parsedDate = new Date(year, month, day)
          console.log('[SALES] Parsed date from', dateStr, 'to', parsedDate)
          return parsedDate
        }
      }
    }

    // Intentar parseo directo para otros formatos (ISO, etc.)
    const directParse = new Date(dateStr)
    if (!isNaN(directParse.getTime())) {
      console.log('[SALES] Direct parsed date from', dateStr, 'to', directParse)
      return directParse
    }

    // Si todo falla, retornar fecha actual
    console.warn('[SALES] No se pudo parsear la fecha:', dateString)
    return new Date()
  }

  /**
   * Formatear fecha para mostrar en la UI
   */
  formatDate(sale) {
    try {
      const date = this.parseFirebaseDate(sale)
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formateando fecha:', error, sale)
      return 'Fecha inválida'
    }
  }

  /**
   * Inicializar el manejador
   */
  async init() {
    try {
      console.log("🚀 Inicializando SalesHandler...")
      
      // Inicializar daily counter manager
      await this.initializeDailyCounterManager()
      
      this.bindEvents()
      console.log("✅ Eventos vinculados")
      
      await this.loadSalesHistory()
      console.log("✅ Historial de ventas cargado")
      
      await this.loadInitialData()
      console.log("✅ Datos iniciales cargados")
      
      console.log("🎉 SalesHandler inicializado correctamente")
    } catch (error) {
      console.error("❌ Error inicializando SalesHandler:", error)
      this.showError("Error inicializando el sistema de ventas")
    }
  }

  /**
   * Inicializar el administrador de contadores diarios
   */
  async initializeDailyCounterManager() {
    try {
      if (window.dailyCounterManager) {
        this.dailyCounterManager = window.dailyCounterManager
        console.log("📊 DailyCounterManager conectado")
      } else {
        console.warn("⚠️ DailyCounterManager no disponible - funcionalidad de contadores diarios limitada")
      }
    } catch (error) {
      console.warn("Error inicializando DailyCounterManager:", error)
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

    // Campos del formulario - solo vendedor (cliente se maneja en CustomerHandler)
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

    // Controles de descuento e IVA
    this.bindDiscountAndTaxEvents()

    // Búsqueda en el panel de historial
    const salesSearchInput = document.getElementById("salesSearchInput")
    if (salesSearchInput) {
      salesSearchInput.addEventListener(
        "input",
        this.debounce((e) => {
          this.searchTerm = e.target.value.trim().toLowerCase()
          this.applyFiltersAndRender()
        }, 300),
      )
    }

    // Filtros por período
    const filtersContainer = document.getElementById("salesFilters")
    if (filtersContainer) {
      const filterButtons = Array.from(filtersContainer.querySelectorAll("button[data-filter]"))

      // Assign click handlers
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const f = btn.dataset.filter
          this.filterBy = f

          // actualizar clases visuales: quitar activo de todos y poner en el seleccionado
          filterButtons.forEach((b) => {
            b.classList.remove("bg-[#8B7EC7]", "text-white")
            b.classList.add("bg-gray-100", "text-gray-700")
          })

          btn.classList.add("bg-[#8B7EC7]", "text-white")
          btn.classList.remove("bg-gray-100", "text-gray-700")

          this.applyFiltersAndRender()
        })
      })

      // Establecer botón activo inicial según this.filterBy
      const active = filterButtons.find((b) => b.dataset.filter === this.filterBy)
      if (active) {
        filterButtons.forEach((b) => {
          b.classList.remove("bg-[#8B7EC7]", "text-white")
          b.classList.add("bg-gray-100", "text-gray-700")
        })
        active.classList.add("bg-[#8B7EC7]", "text-white")
        active.classList.remove("bg-gray-100", "text-gray-700")
      }
    }
  }

  /**
   * Vincular eventos de descuento e IVA
   */
  bindDiscountAndTaxEvents() {
    // Input de descuento
    const discountInput = document.getElementById("discountInput")
    if (discountInput) {
      discountInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value) || 0
        this.currentSale.descuento = Math.max(0, Math.min(100, value))
        this.updateTotals()
      })
    }

    // Input de IVA
    const taxInput = document.getElementById("taxInput")
    if (taxInput) {
      taxInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value) || 0
        this.currentSale.iva = Math.max(0, Math.min(100, value))
        this.updateTotals()
      })
    }

    // Botones preset de descuento
    const discountPresets = document.querySelectorAll(".discount-preset")
    discountPresets.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const discount = parseFloat(btn.dataset.discount) || 0
        this.currentSale.descuento = discount
        if (discountInput) discountInput.value = discount
        this.updateTotals()
        
        // Visual feedback
        this.animateButton(btn)
      })
    })

    // Botones preset de IVA
    const taxPresets = document.querySelectorAll(".tax-preset")
    taxPresets.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const tax = parseFloat(btn.dataset.tax) || 0
        this.currentSale.iva = tax
        if (taxInput) taxInput.value = tax
        this.updateTotals()
        
        // Visual feedback
        this.animateButton(btn)
      })
    })
  }

  /**
   * Sincronizar los inputs de descuento e IVA con el estado actual
   */
  syncDiscountAndTaxInputs() {
    const discountInput = document.getElementById("discountInput")
    const taxInput = document.getElementById("taxInput")
    
    if (discountInput) {
      discountInput.value = this.currentSale.descuento || 0
    }
    
    if (taxInput) {
      taxInput.value = this.currentSale.iva || 0
    }
  }

  /**
   * Animar botón para feedback visual
   */
  animateButton(button) {
    button.classList.add("transform", "scale-95")
    setTimeout(() => {
      button.classList.remove("transform", "scale-95")
    }, 150)
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
      console.log("Buscando productos:", searchTerm)
      const response = await this.salesService.searchProducts(searchTerm, 10)
      this.productSearchResults = response.products || []
      this.showProductSearchResults()
    } catch (error) {
      console.error("Error buscando productos:", error)
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
    console.log("[SalesHandler] Producto seleccionado:", product)
    console.log("[SalesHandler] Estado actual de productos:", this.currentSale.products.length)

    // Verificar si el producto ya está en la venta
    const existingProduct = this.currentSale.products.find((p) => p.productId === product.id)

    if (existingProduct) {
      // Incrementar cantidad si ya existe
      existingProduct.quantity += 1
      console.log("[SalesHandler] Cantidad incrementada para:", product.name)
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
      console.log("[SalesHandler] Producto agregado:", product.name)
    }
    
    console.log("[SalesHandler] Total productos después de agregar:", this.currentSale.products.length)

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

    // Actualizar elementos del DOM con los nuevos IDs
    const subtotalElement = document.getElementById("subtotalDisplay")
    const discountRow = document.getElementById("discountRow")
    const discountPercentDisplay = document.getElementById("discountPercentDisplay")
    const discountAmountDisplay = document.getElementById("discountAmountDisplay")
    const taxRow = document.getElementById("taxRow")
    const taxPercentDisplay = document.getElementById("taxPercentDisplay")
    const taxAmountDisplay = document.getElementById("taxAmountDisplay")
    const totalElement = document.getElementById("totalDisplay")

    // Actualizar subtotal
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`

    // Mostrar/ocultar fila de descuento
    if (this.currentSale.descuento > 0) {
      if (discountRow) discountRow.style.display = 'flex'
      if (discountPercentDisplay) discountPercentDisplay.textContent = this.currentSale.descuento
      if (discountAmountDisplay) discountAmountDisplay.textContent = `-$${discountAmount.toFixed(2)}`
    } else {
      if (discountRow) discountRow.style.display = 'none'
    }

    // Mostrar/ocultar fila de IVA
    if (this.currentSale.iva > 0) {
      if (taxRow) taxRow.style.display = 'flex'
      if (taxPercentDisplay) taxPercentDisplay.textContent = this.currentSale.iva
      if (taxAmountDisplay) taxAmountDisplay.textContent = `+$${ivaAmount.toFixed(2)}`
    } else {
      if (taxRow) taxRow.style.display = 'none'
    }

    // Actualizar total
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`

    console.log("💰 Totales actualizados:", {
      subtotal: subtotal.toFixed(2),
      descuento: `${this.currentSale.descuento}% (-$${discountAmount.toFixed(2)})`,
      iva: `${this.currentSale.iva}% (+$${ivaAmount.toFixed(2)})`,
      total: total.toFixed(2)
    })
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
      
      // Obtener el valor actual del input del cliente
      const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
      if (clienteInput) {
        // Permitir espacios entre palabras, solo normalizar múltiples espacios y eliminar espacios al inicio y final
        this.currentSale.cliente = clienteInput.value.replace(/\s+/g, ' ').trim()
      }

      // Preparar datos de la venta
      const saleData = {
        cliente: this.currentSale.cliente.trim() || "Cliente General",
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

      // Agregar customerId si hay un cliente seleccionado
      if (this.customerHandler && this.customerHandler.selectedCustomer) {
        saleData.customerId = this.customerHandler.selectedCustomer.id
        console.log("[SalesHandler] Venta asociada al cliente:", {
          customerId: saleData.customerId,
          nombre: this.customerHandler.selectedCustomer.firstName
        })
      }

      console.log("Procesando venta:", saleData)

      // Crear venta
      const response = await this.salesService.createSale(saleData)

      if (response.success) {
        this.showSuccess("Venta procesada exitosamente")
        
        // Actualizar contador diario local
        if (this.dailyCounterManager && response.sale) {
          this.dailyCounterManager.incrementSaleCounter(response.sale)
          console.log("📊 Contador diario actualizado")
        }
        
        // Recargar datos del cliente desde el backend para obtener estadísticas actualizadas
        if (this.customerHandler && this.customerHandler.selectedCustomer) {
          await this.refreshCustomerData(this.customerHandler.selectedCustomer.id)
        }
        
        // Mantener cliente seleccionado para siguientes ventas
        this.resetSale(true)
        
        // Delay pequeño antes de recargar historial para asegurar sincronización
        setTimeout(async () => {
          await this.loadSalesHistory()
        }, 500) // 500ms de delay
        
      } else {
        throw new Error(response.message || "Error procesando la venta")
      }
    } catch (error) {
      console.error("Error procesando venta:", error)
      this.showError(error.message || "Error procesando la venta")
    }
  }

  /**
   * Resetear venta actual
   */
  resetSale(keepCustomer = false) {
    const currentCustomer = keepCustomer ? this.currentSale.cliente : ""
    
    this.currentSale = {
      cliente: currentCustomer,
      vendedor: this.currentSale.vendedor, // Mantener vendedor seleccionado
      products: [],
      descuento: 0,
      iva: 0,
      paymentMethod: "efectivo",
      notes: "",
    }

    // Limpiar formulario solo si no mantenemos cliente
    const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
    
    if (!keepCustomer && clienteInput) {
      clienteInput.value = ""
    }
    
    const vendedorSelect = document.querySelector("select")
    const productSearchInput = document.querySelector('input[placeholder="Buscar producto..."]')

    // Limpiar campos de producto siempre
    if (productSearchInput) productSearchInput.value = ""

    // Sincronizar inputs de descuento e IVA
    this.syncDiscountAndTaxInputs()

    this.updateProductTable()
    this.updateTotals()
  }

  /**
   * Cargar historial de ventas
   */
  async loadSalesHistory() {
    try {
      console.log("Cargando historial de ventas...")
      const response = await this.salesService.getSales({
        page: 1,
        limit: 10, // Revertir a 10 temporalmente para debugging
        sortBy: "createdAt",
        sortOrder: "desc",
      })

      console.log("[SalesHandler] Respuesta completa de la API:", response)
      console.log("[SalesHandler] Ventas cargadas desde API:", response.sales?.length || 0)
      
      // Obtener total de transacciones desde pagination.totalSales (según documentación)
      if (response.pagination?.totalSales !== undefined) {
        console.log("[SalesHandler] Total de transacciones desde API:", response.pagination.totalSales)
        this.totalTransactions = response.pagination.totalSales
      } else if (response.statistics?.totalSales !== undefined) {
        console.log("[SalesHandler] Total de transacciones desde statistics:", response.statistics.totalSales)
        this.totalTransactions = response.statistics.totalSales
      } else {
        console.log("[SalesHandler] API no proporciona total de transacciones en pagination.totalSales")
        this.totalTransactions = null
      }
      
      this.salesHistory = response.sales || []
      
      // Sincronizar contadores diarios con la API
      if (this.dailyCounterManager && this.salesHistory.length > 0) {
        await this.dailyCounterManager.syncWithAPI(this.salesHistory)
      }
      
      // Renderizar usando filtros y la nueva UI
      this.applyFiltersAndRender()
    } catch (error) {
      console.error("Error cargando historial:", error)
      // No mostrar error al usuario para el historial
    }
  }

  /**
   * Aplicar filtros (búsqueda y período) y renderizar cards en el DOM
   */
  applyFiltersAndRender() {
    const list = document.getElementById("salesList")
    if (!list) return

    console.log("[SalesHandler] Aplicando filtros - Total ventas en memoria:", this.salesHistory.length)
    console.log("[SalesHandler] Filtro actual:", this.filterBy, "Búsqueda:", this.searchTerm)

    const now = new Date()

    const filtered = this.salesHistory.filter((sale) => {      
      // Búsqueda por cliente
      if (this.searchTerm) {
        const cliente = (sale.cliente || "").toString().toLowerCase()
        if (!cliente.includes(this.searchTerm)) return false
      }

      // Filtro por período
      if (this.filterBy && this.filterBy !== "todos") {
        const saleDate = this.parseFirebaseDate(sale)
        const diffMs = now - saleDate

        if (this.filterBy === "hoy") {
          if (saleDate.toDateString() !== now.toDateString()) return false
        } else if (this.filterBy === "semana") {
          if (diffMs > 7 * 24 * 60 * 60 * 1000) return false
        } else if (this.filterBy === "mes") {
          if (diffMs > 30 * 24 * 60 * 60 * 1000) return false
        }
      }

      return true
    })

    console.log("[SalesHandler] Ventas después del filtrado:", filtered.length)

    // Debugging detallado del cálculo de totales
    console.log("[SalesHandler] Primeras 5 ventas para debugging:")
    filtered.slice(0, 5).forEach((sale, index) => {
      console.log(`  Venta ${index + 1}:`, {
        id: sale.id,
        total: sale.total,
        totalNumber: Number(sale.total),
        cliente: sale.cliente,
        fecha: sale.createdAt
      })
    })

    // Actualizar estadísticas
    const totalSales = filtered.reduce((sum, s) => {
      const saleTotal = Number(s.total) || 0
      return sum + saleTotal
    }, 0)
    
    const totalElem = document.getElementById("totalSalesValue")
    const transElem = document.getElementById("transactionsValue")
    
    // Determinar qué contador de transacciones mostrar
    let transactionCount
    const hasActiveFilters = (this.filterBy && this.filterBy !== "todos") || this.searchTerm
    
    if (hasActiveFilters) {
      // Con filtros activos, mostrar solo las transacciones filtradas
      transactionCount = filtered.length
      console.log("[SalesHandler] Mostrando conteo filtrado:", transactionCount)
    } else {
      // Sin filtros, mostrar total real desde la API
      transactionCount = this.totalTransactions !== null ? this.totalTransactions : this.salesHistory.length
      console.log("[SalesHandler] Mostrando total real:", transactionCount, 
        "(fuente:", this.totalTransactions !== null ? "API pagination" : "historial local", ")")
    }
    
    console.log("[SalesHandler] Estadísticas calculadas:", {
      totalVentas: totalSales.toFixed(2),
      transacciones: transactionCount,
      tieneContadorLocal: this.dailyCounterManager ? true : false
    })
    
    console.log("[SalesHandler] Cálculo final - Total: $" + totalSales.toFixed(2) + ", Transacciones mostradas:", transactionCount)
    
    if (totalElem) totalElem.textContent = `$${totalSales.toFixed(2)}`
    if (transElem) transElem.textContent = `${transactionCount}`

    // Renderizar lista
    list.innerHTML = ""
    if (filtered.length === 0) {
      list.innerHTML = '<div class="text-center text-gray-500 py-4">No hay ventas recientes</div>'
      return
    }

    filtered.forEach((sale) => {
      const card = document.createElement("div")
      card.className = `p-3 rounded-lg border-2 cursor-pointer transition group ${
        this.selectedSale && this.selectedSale.id === sale.id
          ? "border-[#8B7EC7] bg-[#F3EFFA]"
          : "border-gray-200 bg-white hover:border-[#B59DD6] hover:bg-[#F3EFFA]"
      }`

      card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-sm font-medium">${sale.cliente || "Cliente"}</div>
                        <div class="text-xs text-gray-500">${this.formatDate(sale)}</div>
                        <div class="text-xs text-gray-500">${sale.products ? sale.products.length : 0} producto(s)</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold text-[#8B7EC7]">$${(Number(sale.total) || 0).toFixed(2)}</div>
                    </div>
                </div>
            `

      card.addEventListener("click", () => {
        this.selectedSale = sale
        this.applyFiltersAndRender()
        this.showSaleDetails(sale)
      })

      list.appendChild(card)
    })
  }

  /**
   * Mostrar detalles de una venta
   */
  showSaleDetails(sale) {
    // Crear modal con detalles de la venta como ticket
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    
    // Calcular totales
    const subtotal = sale.products?.reduce((sum, product) => sum + (Number(product.totalPrice) || 0), 0) || Number(sale.subtotal) || 0
    const discountAmount = Number(sale.discountAmount) || 0
    const ivaAmount = Number(sale.ivaAmount) || 0
    const total = Number(sale.total) || 0
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header del ticket -->
        <div class="bg-[#8B7EC7] text-white p-4 text-center relative">
          <button class="close-modal absolute top-3 right-3 text-white hover:text-gray-200 transition-colors">
            <i class="fas fa-times text-lg"></i>
          </button>
          <h2 class="text-xl font-bold">TICKET DE VENTA</h2>
          <p class="text-sm opacity-90">Sistema CEMAC</p>
        </div>

        <!-- Contenido del ticket -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Información de la venta -->
          <div class="text-center border-b pb-4">
            <div class="text-sm text-gray-600 mb-1">Ticket #</div>
            <div class="font-mono text-lg font-semibold">${sale.id}</div>
            <div class="text-xs text-gray-500 mt-2">${this.formatDate(sale)}</div>
          </div>

          <!-- Información del cliente y vendedor -->
          <div class="grid grid-cols-1 gap-3 border-b pb-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 uppercase tracking-wide mb-1">Cliente</div>
              <div class="font-semibold text-gray-900">${sale.cliente || 'Cliente General'}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 uppercase tracking-wide mb-1">Vendedor</div>
              <div class="font-semibold text-gray-900">${sale.vendedor || 'No asignado'}</div>
            </div>
            ${sale.status ? `
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600 uppercase tracking-wide">Estado</span>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getStatusClass(sale.status)}">${sale.status}</span>
              </div>
            ` : ''}
          </div>

          <!-- Lista de productos -->
          <div class="border-b pb-4">
            <div class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Productos</div>
            <div class="space-y-2">
              ${sale.products?.map(product => `
                <div class="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                  <div class="flex-1 pr-2">
                    <div class="font-medium text-sm text-gray-900">${product.productName}</div>
                    <div class="text-xs text-gray-500">
                      ${product.quantity} × $${(Number(product.totalPrice) / Number(product.quantity)).toFixed(2)}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold text-[#8B7EC7]">$${Number(product.totalPrice).toFixed(2)}</div>
                  </div>
                </div>
              `).join('') || '<div class="text-center text-gray-500 py-2">No hay productos registrados</div>'}
            </div>
          </div>

          <!-- Totales -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">$${subtotal.toFixed(2)}</span>
            </div>
            
            ${discountAmount > 0 ? `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Descuento:</span>
                <span class="font-medium text-red-600">-$${discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            ${ivaAmount > 0 ? `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">IVA:</span>
                <span class="font-medium">$${ivaAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div class="border-t pt-2 mt-3">
              <div class="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span class="text-[#8B7EC7]">$${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${sale.paymentMethod ? `
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 uppercase tracking-wide mb-1">Método de Pago</div>
              <div class="font-medium capitalize">${sale.paymentMethod}</div>
            </div>
          ` : ''}

          ${sale.notes ? `
            <div class="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
              <div class="text-xs text-gray-600 uppercase tracking-wide mb-1">Notas</div>
              <div class="text-sm text-gray-800">${sale.notes}</div>
            </div>
          ` : ''}
        </div>

        <!-- Footer del ticket -->
        <div class="bg-gray-50 p-4 text-center border-t">
          <div class="text-xs text-gray-500">
            ¡Gracias por su compra!<br>
            Conserve este ticket como comprobante
          </div>
          <div class="mt-3 flex gap-2 justify-center">
            <button class="print-ticket bg-[#8B7EC7] hover:bg-[#7A6DB8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-print mr-2"></i>Imprimir
            </button>
            <button class="close-modal bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `

    // Eventos del modal
    const closeButtons = modal.querySelectorAll('.close-modal')
    closeButtons.forEach(btn => {
      btn.addEventListener("click", () => modal.remove())
    })

    // Cerrar al hacer clic fuera del modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })

    // Funcionalidad de imprimir
    const printButton = modal.querySelector('.print-ticket')
    if (printButton) {
      printButton.addEventListener('click', () => {
        this.printTicket(sale)
      })
    }

    // Cerrar con tecla Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove()
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)

    document.body.appendChild(modal)
  }

  /**
   * Imprimir ticket de venta
   */
  printTicket(sale) {
    const printWindow = window.open('', '_blank')
    const subtotal = sale.products?.reduce((sum, product) => sum + (Number(product.totalPrice) || 0), 0) || Number(sale.subtotal) || 0
    const discountAmount = Number(sale.discountAmount) || 0
    const ivaAmount = Number(sale.ivaAmount) || 0
    const total = Number(sale.total) || 0

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${sale.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
            .ticket { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .info { margin-bottom: 10px; }
            .products { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .product { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .totals { margin-top: 10px; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .total-final { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>SISTEMA CEMAC</h2>
              <p>TICKET DE VENTA</p>
              <p>#${sale.id}</p>
              <p>${this.formatDate(sale)}</p>
            </div>
            
            <div class="info">
              <p><strong>Cliente:</strong> ${sale.cliente || 'Cliente General'}</p>
              <p><strong>Vendedor:</strong> ${sale.vendedor || 'No asignado'}</p>
            </div>
            
            <div class="products">
              <h3>PRODUCTOS:</h3>
              ${sale.products?.map(product => `
                <div class="product">
                  <span>${product.productName} x${product.quantity}</span>
                  <span>$${Number(product.totalPrice).toFixed(2)}</span>
                </div>
              `).join('') || '<p>No hay productos</p>'}
            </div>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              ${discountAmount > 0 ? `
                <div class="total-line">
                  <span>Descuento:</span>
                  <span>-$${discountAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${ivaAmount > 0 ? `
                <div class="total-line">
                  <span>IVA:</span>
                  <span>$${ivaAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-line total-final">
                <span>TOTAL:</span>
                <span>$${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>Conserve este ticket como comprobante</p>
            </div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
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
      console.log("Exportando ventas...")
      await this.salesService.exportSales()
      this.showSuccess("Reporte exportado exitosamente")
    } catch (error) {
      console.error("Error exportando ventas:", error)
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

  /**
   * Recargar datos del cliente desde el backend después de una venta
   */
  async refreshCustomerData(customerId) {
    try {
      console.log("[SalesHandler] Recargando datos del cliente desde backend:", customerId)
      
      if (!this.customerHandler) {
        console.warn("[SalesHandler] No hay customerHandler disponible")
        return
      }

      // Obtener datos actualizados del cliente desde la API
      const response = await this.customerHandler.customerService.getCustomerById(customerId)
      console.log("[SalesHandler] Respuesta del backend:", response)
      
      // Manejar diferentes estructuras de respuesta
      let updatedCustomer = null
      
      if (response.success && response.customer) {
        updatedCustomer = response.customer
      } else if (response.success && response.data) {
        updatedCustomer = response.data
      } else if (response.customer) {
        updatedCustomer = response.customer
      } else if (response.data) {
        updatedCustomer = response.data
      } else if (response.firstName) {
        // La respuesta es directamente el objeto cliente
        updatedCustomer = response
      }
      
      if (updatedCustomer && updatedCustomer.firstName) {
        console.log("[SalesHandler] Datos actualizados recibidos:", {
          nombre: updatedCustomer.firstName,
          compras: updatedCustomer.totalPurchases || 0,
          gastado: updatedCustomer.totalSpent || 0
        })
        
        // Actualizar en el customerHandler
        const customerIndex = this.customerHandler.allCustomers.findIndex(c => c.id === customerId)
        if (customerIndex !== -1) {
          this.customerHandler.allCustomers[customerIndex] = updatedCustomer
        }
        
        // Actualizar cliente seleccionado y refrescar panel
        if (this.customerHandler.selectedCustomer && this.customerHandler.selectedCustomer.id === customerId) {
          this.customerHandler.selectedCustomer = updatedCustomer
          this.customerHandler.showCustomerPanel(updatedCustomer)
          console.log("[SalesHandler] Panel del cliente actualizado con estadísticas del backend")
        }
        
      } else {
        console.warn("[SalesHandler] No se pudieron obtener datos válidos del cliente:", response)
      }
      
    } catch (error) {
      console.error("[SalesHandler] Error recargando datos del cliente:", error)
    }
  }

  /**
   * Método de debugging para diagnósticar problemas con contadores
   */
  debugCounters() {
    console.log("🔍 === DEBUGGING DE CONTADORES ===")
    console.log("Total ventas en memoria:", this.salesHistory.length)
    console.log("Filtro actual:", this.filterBy)
    console.log("Búsqueda actual:", this.searchTerm)
    
    // Mostrar todas las ventas con sus totales
    console.log("📊 Ventas individuales:")
    this.salesHistory.forEach((sale, index) => {
      console.log(`  ${index + 1}. ID: ${sale.id} | Cliente: ${sale.cliente} | Total: $${sale.total} | Fecha: ${sale.createdAt}`)
    })
    
    // Calcular total manual
    const manualTotal = this.salesHistory.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    console.log("💰 Total calculado manualmente:", manualTotal.toFixed(2))
    
    // Mostrar elementos DOM
    const totalElem = document.getElementById("totalSalesValue")
    const transElem = document.getElementById("transactionsValue")
    console.log("🖥️ Valores en DOM:")
    console.log("  Total en UI:", totalElem?.textContent)
    console.log("  Transacciones en UI:", transElem?.textContent)
  }
}
