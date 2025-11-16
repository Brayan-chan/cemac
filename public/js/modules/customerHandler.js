/**
 * Manejador de Gestión de Clientes en Ventas
 * Gestiona búsqueda, creación, edición y eliminación de clientes
 * Muestra clientes frecuentes e información del cliente seleccionado
 */
import { CustomerService } from "../services/customerService.js"

export class CustomerHandler {
  constructor(salesHandler) {
    this.customerService = new CustomerService()
    this.salesHandler = salesHandler
    this.allCustomers = []
    this.selectedCustomer = null
    this.searchTimeout = null

    this.init()
  }

  /**
   * Inicializar manejador
   */
  async init() {
    try {
      console.log("[CustomerHandler] Inicializando...")
      this.bindEvents()
      await this.loadAllCustomers()
      this.createCustomerPanel()
    } catch (error) {
      console.error("[CustomerHandler] Error inicializando:", error)
    }
  }

  /**
   * Cargar todos los clientes
   */
  async loadAllCustomers() {
    try {
      const response = await this.customerService.getCustomers({ limit: 1000 })
      this.allCustomers = response.customers || []
      console.log("[CustomerHandler] Clientes cargados:", this.allCustomers.length)
    } catch (error) {
      console.error("[CustomerHandler] Error cargando clientes:", error)
    }
  }

  /**
   * Vincular eventos del DOM
   */
  bindEvents() {
    const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
    if (clienteInput) {
      // Búsqueda en tiempo real
      clienteInput.addEventListener("input", this.handleClienteSearch.bind(this))
      // Limpiar dropdown al perder foco
      clienteInput.addEventListener("blur", () => {
        setTimeout(() => {
          const dropdown = document.getElementById("customerSearchDropdown")
          if (dropdown) dropdown.remove()
        }, 200)
      })
      // Permitir crear cliente con Enter
      clienteInput.addEventListener("keydown", this.handleClienteKeydown.bind(this))
    }
  }

  /**
   * Manejar búsqueda de cliente
   */
  async handleClienteSearch(event) {
    const searchTerm = event.target.value.trim()

    // Limpiar timeout anterior
    if (this.searchTimeout) clearTimeout(this.searchTimeout)

    // Si está vacío, mostrar clientes frecuentes
    if (searchTerm.length === 0) {
      this.showFrequentCustomers()
      return
    }

    // Búsqueda después de 300ms
    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await this.customerService.searchCustomers(searchTerm)
        const customers = response.customers || response.data || []
        this.showSearchResults(customers, searchTerm)
      } catch (error) {
        console.error("[CustomerHandler] Error buscando clientes:", error)
        this.showSearchResults([], searchTerm)
      }
    }, 300)
  }

  /**
   * Manejar teclas en búsqueda de cliente
   */
  handleClienteKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      const searchTerm = event.target.value.trim()

      // Si hay resultados, seleccionar el primero
      const dropdown = document.getElementById("customerSearchDropdown")
      if (dropdown) {
        const firstOption = dropdown.querySelector("[data-customer-id]")
        if (firstOption) {
          firstOption.click()
          return
        }
      }

      // Si no hay resultados, crear nuevo cliente
      if (searchTerm.length > 0) {
        this.showCreateCustomerModal(searchTerm)
      }
    }
  }

  /**
   * Mostrar clientes frecuentes
   */
  showFrequentCustomers() {
    // Filtrar clientes frecuentes (10+ compras)
    const frequentCustomers = this.allCustomers
      .filter((c) => (c.totalPurchases || 0) >= 10)
      .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
      .slice(0, 10)

    if (frequentCustomers.length > 0) {
      this.showSearchResults(frequentCustomers, "")
    } else {
      this.removeSearchDropdown()
    }
  }

  /**
   * Mostrar resultados de búsqueda
   */
  showSearchResults(customers, searchTerm) {
    this.removeSearchDropdown()

    const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
    if (!clienteInput) return

    const dropdown = document.createElement("div")
    dropdown.id = "customerSearchDropdown"
    dropdown.className =
      "absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"

    // Mostrar clientes encontrados
    customers.forEach((customer) => {
      const item = document.createElement("div")
      item.className = "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
      item.setAttribute("data-customer-id", customer.id)

      const fullName = `${customer.firstName} ${customer.lastName || ""}`
      const isFrequent = (customer.totalPurchases || 0) >= 10

      item.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-medium text-gray-900">${fullName}</div>
            <div class="text-xs text-gray-500 space-y-1 mt-1">
              <div>Compras: <span class="font-semibold">${customer.totalPurchases || 0}</span></div>
              <div>Gastado: <span class="font-semibold">$${(customer.totalSpent || 0).toFixed(2)}</span></div>
              ${customer.lastPurchaseDate ? `<div>Última compra: <span class="font-semibold">${this.formatDate(customer.lastPurchaseDate)}</span></div>` : ""}
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            ${isFrequent ? `<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">⭐ Frecuente</span>` : ""}
          </div>
        </div>
      `

      item.addEventListener("click", () => {
        this.selectCustomer(customer)
      })

      dropdown.appendChild(item)
    })

    // Botón para crear nuevo cliente
    if (searchTerm.length > 0) {
      const createOption = document.createElement("div")
      createOption.className = "p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer border-t border-blue-200"
      createOption.innerHTML = `
        <div class="flex items-center gap-2 text-blue-700 font-medium">
          <i class="fas fa-plus"></i>
          Crear nuevo cliente: "<strong>${searchTerm}</strong>"
        </div>
      `

      createOption.addEventListener("click", () => {
        this.showCreateCustomerModal(searchTerm)
      })

      dropdown.appendChild(createOption)
    }

    // Posicionar y agregar dropdown
    const container = clienteInput.parentElement
    container.style.position = "relative"
    container.appendChild(dropdown)
  }

  /**
   * Remover dropdown de búsqueda
   */
  removeSearchDropdown() {
    const dropdown = document.getElementById("customerSearchDropdown")
    if (dropdown) dropdown.remove()
  }

  /**
   * Seleccionar cliente
   */
  selectCustomer(customer) {
    console.log("[CustomerHandler] Seleccionando cliente:", customer)
    
    // Validar que el cliente tenga la estructura mínima requerida
    if (!customer || typeof customer !== 'object') {
      console.error("[CustomerHandler] Cliente inválido (no es un objeto):", customer)
      alert("Error: datos del cliente inválidos")
      return
    }
    
    if (!customer.firstName) {
      console.error("[CustomerHandler] Cliente sin firstName:", customer)
      alert("Error: el cliente no tiene un nombre válido")
      return
    }

    this.selectedCustomer = customer
    const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
    if (clienteInput) {
      const fullName = `${customer.firstName} ${customer.lastName || ""}`.trim()
      clienteInput.value = fullName
    }

    // Actualizar el cliente en salesHandler
    const fullName = `${customer.firstName} ${customer.lastName || ""}`.trim()
    this.salesHandler.currentSale.cliente = fullName

    this.removeSearchDropdown()
    this.showCustomerPanel(customer)
  }

  /**
   * Mostrar panel del cliente seleccionado
   */
  showCustomerPanel(customer) {
    let panel = document.getElementById("customerPanel")
    if (!panel) {
      this.createCustomerPanel()
      panel = document.getElementById("customerPanel")
    }

    const isFrequent = (customer.totalPurchases || 0) >= 10

    panel.innerHTML = `
      <div class="bg-gradient-to-br from-[#8B7EC7] to-[#7A6DB4] rounded-lg p-4 text-white">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-lg font-bold">${customer.firstName} ${customer.lastName || ""}</h3>
            ${isFrequent ? `<span class="inline-block px-2 py-1 bg-yellow-300 text-yellow-900 text-xs font-bold rounded mt-1">⭐ CLIENTE FRECUENTE</span>` : ""}
          </div>
          <div class="flex gap-2">
            <button class="edit-customer p-2 hover:bg-white/20 rounded transition-colors" title="Editar cliente">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-customer p-2 hover:bg-white/20 rounded transition-colors" title="Eliminar cliente">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 bg-white/10 p-3 rounded-lg">
          <div>
            <p class="text-xs opacity-80">Compras Totales</p>
            <p class="text-2xl font-bold">${customer.totalPurchases || 0}</p>
          </div>
          <div>
            <p class="text-xs opacity-80">Gastado Total</p>
            <p class="text-2xl font-bold">$${(customer.totalSpent || 0).toFixed(2)}</p>
          </div>
        </div>

        ${customer.lastPurchaseDate ? `
          <div class="mt-3 bg-white/10 p-2 rounded text-sm">
            <p class="text-xs opacity-80">Última compra</p>
            <p class="font-semibold">${this.formatDate(customer.lastPurchaseDate)}</p>
          </div>
        ` : ""}

        ${customer.notes ? `
          <div class="mt-3 bg-white/10 p-2 rounded text-sm">
            <p class="text-xs opacity-80 mb-1">Notas</p>
            <p class="text-sm">${customer.notes}</p>
          </div>
        ` : ""}

        <button class="clear-customer w-full mt-3 px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors">
          Cambiar cliente
        </button>
      </div>
    `

    panel.classList.add("visible")

    // Eventos
    const editBtn = panel.querySelector(".edit-customer")
    const deleteBtn = panel.querySelector(".delete-customer")
    const clearBtn = panel.querySelector(".clear-customer")

    if (editBtn) {
      editBtn.addEventListener("click", () => this.showEditCustomerModal(customer))
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.confirmDeleteCustomer(customer))
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearCustomer())
    }
  }

  /**
   * Crear panel de cliente (estructura)
   */
  createCustomerPanel() {
    const clienteContainer = document.querySelector('input[placeholder="Nombre del cliente..."]')?.parentElement?.parentElement
    if (!clienteContainer) return

    const panel = document.createElement("div")
    panel.id = "customerPanel"
    panel.className = "hidden"

    clienteContainer.insertAdjacentElement("afterend", panel)
  }

  /**
   * Mostrar modal para crear cliente
   */
  showCreateCustomerModal(initialName = "") {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"

    const [firstName, lastName] = this.splitName(initialName)

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div class="bg-[#8B7EC7] text-white p-4 flex justify-between items-center">
          <h2 class="text-xl font-bold">Nuevo Cliente</h2>
          <button class="close-modal text-white hover:text-gray-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <form class="p-6 space-y-4" id="createCustomerForm">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" name="firstName" placeholder="Nombre" value="${firstName}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none" required>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input type="text" name="lastName" placeholder="Apellido" value="${lastName}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
            <input type="tel" name="phone" placeholder="+58 424 1234567" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea name="notes" placeholder="Agregar notas sobre el cliente..." class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none" rows="3"></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" class="close-modal flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6DB4] transition-colors font-medium">
              Crear Cliente
            </button>
          </div>
        </form>
      </div>
    `

    // Eventos
    const closeButtons = modal.querySelectorAll(".close-modal")
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => modal.remove())
    })

    const form = modal.querySelector("#createCustomerForm")
    form.addEventListener("submit", this.handleCreateCustomer.bind(this, modal))

    // Cerrar al hacer clic fuera
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove()
    })

    document.body.appendChild(modal)
  }

  /**
   * Manejar creación de cliente
   */
  async handleCreateCustomer(modal, event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    try {
      const customerData = {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        phone: formData.get("phone").trim() || undefined,
        notes: formData.get("notes").trim() || undefined,
        birthDate: undefined,
      }

      if (!customerData.firstName) {
        alert("El nombre es obligatorio")
        return
      }

      const response = await this.customerService.createCustomer(customerData)
      console.log("[CustomerHandler] Respuesta completa de creación:", response)

      // Manejar diferentes estructuras de respuesta de la API
      let newCustomer = null
      
      if (response.success && response.customer) {
        // Estructura: { success: true, customer: {...} }
        newCustomer = response.customer
      } else if (response.success && response.data) {
        // Estructura: { success: true, data: {...} }
        newCustomer = response.data
      } else if (response.customer) {
        // Estructura: { customer: {...} }
        newCustomer = response.customer
      } else if (response.data) {
        // Estructura: { data: {...} }
        newCustomer = response.data
      } else if (response.firstName) {
        // La respuesta es directamente el objeto cliente
        newCustomer = response
      } else {
        console.error("[CustomerHandler] Estructura de respuesta desconocida:", response)
        alert(response.message || "Error: estructura de respuesta inesperada")
        return
      }

      if (newCustomer && newCustomer.firstName) {
        this.allCustomers.push(newCustomer)
        this.selectCustomer(newCustomer)
        modal.remove()
        console.log("[CustomerHandler] Cliente creado exitosamente:", newCustomer)
      } else {
        console.error("[CustomerHandler] Cliente creado pero datos inválidos:", newCustomer)
        alert("Cliente creado pero hay problemas con los datos recibidos")
      }
    } catch (error) {
      console.error("[CustomerHandler] Error creando cliente:", error)
      alert("Error creando cliente: " + error.message)
    }
  }

  /**
   * Mostrar modal para editar cliente
   */
  showEditCustomerModal(customer) {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div class="bg-[#8B7EC7] text-white p-4 flex justify-between items-center">
          <h2 class="text-xl font-bold">Editar Cliente</h2>
          <button class="close-modal text-white hover:text-gray-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <form class="p-6 space-y-4" id="editCustomerForm">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" name="firstName" placeholder="Nombre" value="${customer.firstName}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none" required>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input type="text" name="lastName" placeholder="Apellido" value="${customer.lastName || ""}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" name="phone" placeholder="+58 424 1234567" value="${customer.phone || ""}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notes" placeholder="Agregar notas..." class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8B7EC7] focus:outline-none" rows="3">${customer.notes || ""}</textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" class="close-modal flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6DB4] transition-colors font-medium">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    `

    const closeButtons = modal.querySelectorAll(".close-modal")
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => modal.remove())
    })

    const form = modal.querySelector("#editCustomerForm")
    form.addEventListener("submit", this.handleEditCustomer.bind(this, modal, customer))

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove()
    })

    document.body.appendChild(modal)
  }

  /**
   * Manejar edición de cliente
   */
  async handleEditCustomer(modal, customer, event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    try {
      const updatedData = {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        phone: formData.get("phone").trim() || undefined,
        notes: formData.get("notes").trim() || undefined,
      }

      if (!updatedData.firstName) {
        alert("El nombre es obligatorio")
        return
      }

      const response = await this.customerService.updateCustomer(customer.id, updatedData)

      if (response.success || response.customer) {
        // Actualizar cliente en lista
        const index = this.allCustomers.findIndex((c) => c.id === customer.id)
        if (index !== -1) {
          this.allCustomers[index] = { ...customer, ...updatedData }
        }

        this.selectCustomer({ ...customer, ...updatedData })
        modal.remove()
        console.log("[CustomerHandler] Cliente actualizado:", updatedData)
      } else {
        alert(response.message || "Error actualizando cliente")
      }
    } catch (error) {
      console.error("[CustomerHandler] Error actualizando cliente:", error)
      alert("Error actualizando cliente")
    }
  }

  /**
   * Confirmar eliminación de cliente
   */
  confirmDeleteCustomer(customer) {
    const confirmModal = document.createElement("div")
    confirmModal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"

    confirmModal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div class="bg-red-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <i class="fas fa-exclamation-triangle"></i>
            Eliminar Cliente
          </h2>
        </div>

        <div class="p-6 space-y-4">
          <p class="text-gray-700">
            ¿Estás seguro de que deseas eliminar a <strong>${customer.firstName} ${customer.lastName || ""}</strong>?
          </p>
          <p class="text-sm text-gray-500">
            <i class="fas fa-info-circle mr-2"></i>
            Se eliminará todo el historial de compras de este cliente. Esta acción no se puede deshacer.
          </p>

          <div class="flex gap-3 pt-4">
            <button class="cancel-delete flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button class="confirm-delete flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    `

    const cancelBtn = confirmModal.querySelector(".cancel-delete")
    const deleteBtn = confirmModal.querySelector(".confirm-delete")

    cancelBtn.addEventListener("click", () => confirmModal.remove())
    deleteBtn.addEventListener("click", () => this.handleDeleteCustomer(customer, confirmModal))

    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) confirmModal.remove()
    })

    document.body.appendChild(confirmModal)
  }

  /**
   * Manejar eliminación de cliente
   */
  async handleDeleteCustomer(customer, confirmModal) {
    try {
      const response = await this.customerService.deleteCustomer(customer.id)

      if (response.success) {
        // Remover de lista local
        this.allCustomers = this.allCustomers.filter((c) => c.id !== customer.id)

        // Limpiar interfaz
        this.clearCustomer()
        confirmModal.remove()
        console.log("[CustomerHandler] Cliente eliminado:", customer)
      } else {
        alert(response.message || "Error eliminando cliente")
      }
    } catch (error) {
      console.error("[CustomerHandler] Error eliminando cliente:", error)
      alert("Error eliminando cliente")
    }
  }

  /**
   * Limpiar cliente seleccionado
   */
  clearCustomer() {
    this.selectedCustomer = null
    const clienteInput = document.querySelector('input[placeholder="Nombre del cliente..."]')
    if (clienteInput) {
      clienteInput.value = ""
    }
    this.salesHandler.currentSale.cliente = ""

    const panel = document.getElementById("customerPanel")
    if (panel) {
      panel.classList.remove("visible")
      panel.innerHTML = ""
    }

    this.removeSearchDropdown()
  }

  /**
   * Dividir nombre completo
   */
  splitName(fullName) {
    const parts = fullName.trim().split(" ")
    if (parts.length === 1) {
      return [parts[0], ""]
    }
    return [parts[0], parts.slice(1).join(" ")]
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }
}