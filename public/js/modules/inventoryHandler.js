import { InventoryService } from "/js/services/inventoryService.js"

class InventoryHandler {
  constructor() {
    // Verificar autenticación
    const token = localStorage.getItem("authToken")
    if (!token) {
      window.location.href = "/index.html"
      return
    }

    this.inventoryService = new InventoryService()
    this.currentFilters = {
      search: "",
      category: "",
      price: "",
      status: "",
      sort: "name",
      page: 1,
      limit: 5, // Changed from 10 to 5 items per page
    }
    this.totalPages = 1
    this.totalProducts = 0
    this.products = []

    this.initializeEventListeners()
    this.loadProducts()
  }

  initializeEventListeners() {
    const searchInput = document.querySelector('input[placeholder="Search"]')
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentFilters.search = e.target.value
        this.currentFilters.page = 1 // Reset to first page
        this.loadProducts()
      })

      // Clear button
      const clearButton = document.querySelector('input[placeholder="Search"] ~ button:last-of-type')
      if (clearButton) {
        clearButton.addEventListener("click", () => {
          searchInput.value = ""
          this.currentFilters.search = ""
          this.currentFilters.page = 1
          this.loadProducts()
        })
      }
    }

    // Manejo de imágenes
    const imageInput = document.getElementById("imageInput")
    const uploadButton = document.getElementById("uploadButton")
    const previewContainer = document.getElementById("previewContainer")
    const imagePreview = document.getElementById("imagePreview")
    const uploadText = document.getElementById("uploadText")

    if (uploadButton && imageInput) {
      uploadButton.addEventListener("click", () => {
        imageInput.click()
      })

      imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (file) {
          // Mostrar vista previa
          const reader = new FileReader()
          reader.onload = (e) => {
            imagePreview.src = e.target.result
            previewContainer.classList.remove("hidden")
            uploadText.textContent = file.name
          }
          reader.readAsDataURL(file)
        }
      })
    }

    // Filter event listeners
    document.getElementById("categoryFilter")?.addEventListener("change", (e) => {
      this.currentFilters.category = e.target.value
      this.currentFilters.page = 1 // Reset to first page
      this.loadProducts()
    })

    document.getElementById("priceFilter")?.addEventListener("change", (e) => {
      this.currentFilters.price = e.target.value
      this.currentFilters.page = 1
      this.loadProducts()
    })

    document.getElementById("statusFilter")?.addEventListener("change", (e) => {
      this.currentFilters.status = e.target.value
      this.currentFilters.page = 1
      this.loadProducts()
    })

    document.getElementById("sortFilter")?.addEventListener("change", (e) => {
      this.currentFilters.sort = e.target.value
      this.currentFilters.page = 1
      this.loadProducts()
    })

    // Apply filters button
    document.getElementById("applyFiltersBtn")?.addEventListener("click", () => {
      this.loadProducts()
    })

    // Add product button
    document.getElementById("addProductBtn")?.addEventListener("click", () => {
      this.showAddProductModal()
    })

    // Pagination
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
      if (this.currentFilters.page > 1) {
        this.currentFilters.page--
        this.loadProducts()
      }
    })

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
      if (this.currentFilters.page < this.totalPages) {
        this.currentFilters.page++
        this.loadProducts()
      }
    })

    // Modal event listeners
    document.getElementById("closeModal")?.addEventListener("click", () => {
      this.hideModal()
    })

    document.getElementById("cancelBtn")?.addEventListener("click", () => {
      this.hideModal()
    })

    // Form submission
    document.getElementById("productForm")?.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const productData = {
        name: formData.get("nombre"),
        description: formData.get("descripcion"),
        category: formData.get("categoria"),
        price: Number.parseFloat(formData.get("precio")),
        stock: Number.parseInt(formData.get("stock")) || 0,
        availability: formData.get("disponible") ? "unlimited" : "limited",
      }

      const productId = e.target.getAttribute("data-product-id")
      if (productId) {
        this.updateProduct(productId, productData)
      } else {
        this.createProduct(productData)
      }
    })

    // Unlimited stock checkbox
    document.getElementById("disponible")?.addEventListener("change", (e) => {
      const stockInput = document.getElementById("stock")
      if (e.target.checked) {
        stockInput.disabled = true
        stockInput.value = ""
        stockInput.placeholder = "∞"
      } else {
        stockInput.disabled = false
        stockInput.placeholder = "0"
      }
    })
  }

  async loadProducts() {
    try {
      this.showLoadingState()

      // Asegurar que los parámetros sean números
      const queryParams = {
        page: parseInt(this.currentFilters.page) || 1,
        limit: parseInt(this.currentFilters.limit) || 5,
        search: this.currentFilters.search || "",
        category: this.currentFilters.category || "",
        price: this.currentFilters.price || "",
        status: this.currentFilters.status || "",
        sort: this.currentFilters.sort || "name"
      }

      console.log("[v0] Loading products with filters:", queryParams)

      const response = await this.inventoryService.getProducts(queryParams)

      // Procesar la respuesta
      if (response && response.products) {
        this.products = response.products
        this.totalProducts = parseInt(response.total) || response.products.length
        this.totalPages = Math.max(1, Math.ceil(this.totalProducts / queryParams.limit))
        
        // Actualizar los filtros con los valores de la respuesta
        this.currentFilters.page = parseInt(response.page) || queryParams.page
        this.currentFilters.limit = parseInt(response.limit) || queryParams.limit
      } else {
        this.products = []
        this.totalProducts = 0
        this.totalPages = 1
        this.currentFilters.page = 1
      }

      console.log("[v0] Pagination info:", {
        currentPage: this.currentFilters.page,
        totalPages: this.totalPages,
        totalProducts: this.totalProducts,
        productsPerPage: this.currentFilters.limit
      })

      console.log("[v0] Products loaded:", {
        count: this.products.length,
        total: this.totalProducts,
        totalPages: this.totalPages,
      })

      this.hideLoadingState()
      this.renderProducts()
      this.updatePagination()
    } catch (error) {
      console.error("[v0] Error al cargar productos:", error)
      this.hideLoadingState()

      if (error.message.includes("401")) {
        localStorage.removeItem("authToken")
        window.location.href = "/index.html"
      } else {
        this.showError("Error al cargar los productos. Por favor, intenta de nuevo.")
        this.showEmptyState()
      }
    }
  }

  renderProducts() {
    const tableBody = document.getElementById("productsTableBody")
    if (!tableBody) return

    if (this.products.length === 0) {
      this.showEmptyState()
      return
    }

    this.hideEmptyState()

    tableBody.innerHTML = this.products
      .map((product) => {
        const statusClass = this.getStatusClass(product.stock)
        const statusText = this.getStatusText(product.stock)

        return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-4">
                            <div class="flex-shrink-0 w-12 h-12">
                                <img src="${product.imageUrl || "/diverse-products-still-life.png"}" 
                                     alt="${product.name}" 
                                     class="w-12 h-12 object-cover rounded-lg bg-gray-100">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-gray-900 truncate">
                                    ${product.name || "Sin nombre"}
                                </div>
                                <div class="text-xs text-gray-500 font-mono">
                                    ${product.code || product.id || "N/A"}
                                </div>
                                <div class="text-xs text-gray-600 truncate max-w-xs">
                                    ${product.description || "Sin descripción"}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">${product.category || "Sin categoría"}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                            $${(product.price || 0).toFixed(2)}
                        </div>
                        ${
                          product.promotionalPrice
                            ? `<div class="text-xs text-red-600">$${product.promotionalPrice.toFixed(2)}</div>`
                            : ""
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">
                            ${product.stock !== undefined ? `${product.stock} unidades` : "N/A"}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center space-x-2">
                            <button onclick="inventoryHandler.showEditProductModal('${product.id}')" 
                                    class="text-[#8B7EC7] hover:text-[#7A6DB8] transition-colors"
                                    title="Editar producto">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="inventoryHandler.deleteProduct('${product.id}')"
                                    class="text-red-600 hover:text-red-800 transition-colors"
                                    title="Eliminar producto">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")
  }

  getStatusClass(stock) {
    if (stock === undefined || stock === null) return "bg-gray-100 text-gray-800"
    if (stock === 0) return "bg-red-100 text-red-800"
    if (stock <= 10) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  getStatusText(stock) {
    if (stock === undefined || stock === null) return "Sin datos"
    if (stock === 0) return "Agotado"
    if (stock <= 10) return "Stock bajo"
    return "Disponible"
  }

  updatePagination() {
    const paginationNumbers = document.getElementById("paginationNumbers")
    const prevBtn = document.getElementById("prevPageBtn")
    const nextBtn = document.getElementById("nextPageBtn")
    const currentPageSpan = document.getElementById("currentPage")
    const totalPagesSpan = document.getElementById("totalPages")

    if (!paginationNumbers || !prevBtn || !nextBtn) {
      console.log("[v0] Pagination elements not found")
      return
    }

    console.log("[v0] Updating pagination:", {
      currentPage: this.currentFilters.page,
      totalPages: this.totalPages,
      totalProducts: this.totalProducts,
      productsPerPage: this.currentFilters.limit
    })

    // Actualizar los contadores de página
    if (currentPageSpan) currentPageSpan.textContent = this.currentFilters.page
    if (totalPagesSpan) totalPagesSpan.textContent = this.totalPages

    // Si no hay productos o solo hay una página, ocultar la paginación
    const paginationContainer = document.querySelector('.pagination-container')
    if (this.totalPages <= 1) {
      if (paginationContainer) paginationContainer.style.display = 'none'
      return
    } else {
      if (paginationContainer) paginationContainer.style.display = 'flex'
    }

    // Actualizar estado de los botones de navegación
    const isFirstPage = this.currentFilters.page <= 1
    const isLastPage = this.currentFilters.page >= this.totalPages

    prevBtn.disabled = isFirstPage
    prevBtn.classList.toggle("opacity-50", isFirstPage)
    
    nextBtn.disabled = isLastPage
    nextBtn.classList.toggle("opacity-50", isLastPage)

    // Generar números de página
    const pageNumbers = this.generatePageNumbers()
    console.log("[v0] Generated page numbers:", pageNumbers)

    paginationNumbers.innerHTML = pageNumbers
      .map((page) => {
        if (page === "...") {
          return `<span class="inline-flex items-center justify-center w-10 h-10 text-gray-500">...</span>`
        }

        const isCurrentPage = parseInt(page) === parseInt(this.currentFilters.page)
        return `
          <button 
            onclick="window.inventoryHandler.goToPage(${page})"
            class="inline-flex items-center justify-center w-10 h-10 rounded-full ${
              isCurrentPage
                ? "bg-purple-100 text-purple-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }"
            ${isCurrentPage ? "disabled" : ""}
            aria-current="${isCurrentPage ? "page" : "false"}"
            aria-label="Ir a la página ${page}"
          >
            ${page}
          </button>
        `
      })
      .join("")
  }

  generatePageNumbers() {
    const current = parseInt(this.currentFilters.page) || 1
    const total = Math.max(1, parseInt(this.totalPages))
    const pages = []

    console.log("[v0] Generating page numbers:", { 
      currentPage: current, 
      totalPages: total,
      totalProducts: this.totalProducts,
      itemsPerPage: this.currentFilters.limit
    })

    // Si no hay páginas o solo hay una, retornar solo esa página
    if (total <= 1) {
      return [1]
    }

    // Si hay 7 páginas o menos, mostrar todas sin ellipsis
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1)

      if (current <= 4) {
        // Cerca del inicio: 1, 2, 3, 4, 5, ..., total
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      } else if (current >= total - 3) {
        // Cerca del final: 1, ..., total-4, total-3, total-2, total-1, total
        pages.push("...")
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // En el medio: 1, ..., current-2, current-1, current, current+1, current+2, ..., total
        pages.push("...")
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      }
    }

    console.log("[v0] Final page numbers:", pages)
    return pages
  }

  goToPage(page) {
    console.log("[v0] Going to page:", page)
    if (page >= 1 && page <= this.totalPages && page !== this.currentFilters.page) {
      this.currentFilters.page = page
      this.loadProducts()
    }
  }

  showLoadingState() {
    const loadingState = document.getElementById("loadingState")
    const tableBody = document.getElementById("productsTableBody")
    const emptyState = document.getElementById("emptyState")

    if (loadingState) loadingState.classList.remove("hidden")
    if (tableBody) tableBody.innerHTML = ""
    if (emptyState) emptyState.classList.add("hidden")
  }

  hideLoadingState() {
    const loadingState = document.getElementById("loadingState")
    if (loadingState) loadingState.classList.add("hidden")
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState")
    const tableBody = document.getElementById("productsTableBody")

    if (emptyState) emptyState.classList.remove("hidden")
    if (tableBody) tableBody.innerHTML = ""
  }

  hideEmptyState() {
    const emptyState = document.getElementById("emptyState")
    if (emptyState) emptyState.classList.add("hidden")
  }

  async createProduct(productData) {
    try {
      // Obtener el archivo de imagen
      const imageInput = document.getElementById("imageInput")
      const imageFile = imageInput.files[0]

      // Si hay una imagen, añadirla a los datos del producto
      if (imageFile) {
        productData.image = imageFile
      }

      const response = await this.inventoryService.createProduct(productData)
      this.showSuccess("Producto creado exitosamente")
      this.hideModal()
      await this.loadProducts()

      // Limpiar la vista previa de la imagen
      const previewContainer = document.getElementById("previewContainer")
      const uploadText = document.getElementById("uploadText")
      if (previewContainer) {
        previewContainer.classList.add("hidden")
      }
      if (uploadText) {
        uploadText.textContent = "Cargar una imagen"
      }
      if (imageInput) {
        imageInput.value = ""
      }

      return response
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      this.showError(error.message || "Error al crear el producto")
      throw error
    }
  }

  async updateProduct(productId, productData) {
    try {
      await this.inventoryService.updateProduct(productId, productData)
      this.loadProducts()
      this.hideModal()
      this.showSuccess("Producto actualizado exitosamente")
    } catch (error) {
      console.error("[v0] Error al actualizar producto:", error)
      this.showError(error.message || "Error al actualizar el producto")
    }
  }

  async deleteProduct(productId) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return

    try {
      await this.inventoryService.deleteProduct(productId)
      this.loadProducts()
      this.showSuccess("Producto eliminado exitosamente")
    } catch (error) {
      console.error("[v0] Error al eliminar producto:", error)
      this.showError(error.message || "Error al eliminar el producto")
    }
  }

  showAddProductModal() {
    const modal = document.getElementById("productModal")
    const form = document.getElementById("productForm")
    const modalTitle = document.getElementById("modalTitle")

    if (!modal || !form) return

    form.reset()
    form.removeAttribute("data-product-id")
    modalTitle.textContent = "Añadir producto"

    // Reset unlimited checkbox
    const unlimitedCheckbox = document.getElementById("disponible")
    const stockInput = document.getElementById("stock")
    if (unlimitedCheckbox && stockInput) {
      unlimitedCheckbox.checked = true
      stockInput.disabled = true
      stockInput.value = ""
      stockInput.placeholder = "∞"
    }

    modal.classList.remove("hidden")
  }

  async showEditProductModal(productId) {
    const product = this.products.find((p) => p.id === productId)
    if (!product) return

    const modal = document.getElementById("productModal")
    const form = document.getElementById("productForm")
    const modalTitle = document.getElementById("modalTitle")

    if (!modal || !form) return

    // Fill form with product data
    form.elements.nombre.value = product.name || ""
    form.elements.descripcion.value = product.description || ""
    form.elements.categoria.value = product.category || ""
    form.elements.precio.value = product.price || ""
    form.elements.stock.value = product.stock || ""

    // Handle unlimited availability
    const unlimitedCheckbox = document.getElementById("disponible")
    const stockInput = document.getElementById("stock")
    if (unlimitedCheckbox && stockInput) {
      const isUnlimited = product.availability === "unlimited" || product.stock === null
      unlimitedCheckbox.checked = isUnlimited
      stockInput.disabled = isUnlimited
      if (!isUnlimited) {
        stockInput.placeholder = "0"
      }
    }

    form.setAttribute("data-product-id", productId)
    modalTitle.textContent = "Editar producto"
    modal.classList.remove("hidden")
  }

  hideModal() {
    const modal = document.getElementById("productModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  showSuccess(message) {
    console.log("[v0] Success:", message)
    // Implementar notificación de éxito
    alert(message) // Temporal, mejorar con una notificación más elegante
  }

  showError(message) {
    console.log("[v0] Error:", message)
    // Implementar notificación de error
    alert(message) // Temporal, mejorar con una notificación más elegante
  }
}

// Inicializar el manejador cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.inventoryHandler = new InventoryHandler()
})

export { InventoryHandler }
