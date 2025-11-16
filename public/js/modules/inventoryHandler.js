import { InventoryService } from "/js/services/inventoryService.js"
import { CategoryHandler } from "/js/modules/categoryHandler.js"

class InventoryHandler {
  constructor() {
    // Verificar autenticación
    const token = localStorage.getItem("authToken")
    if (!token) {
      window.location.href = "/index.html"
      return
    }

    this.inventoryService = new InventoryService()
    this.categoryHandler = new CategoryHandler()
    // Add filters
    this.currentFilters = {
      page: 1,
      limit: 10,
      category: "",
      minPrice: null,
      maxPrice: null,
      sortBy: "name",
      sortOrder: "asc",
      search: "",
    }

    // Debounced search to avoid excessive API calls
    this.searchTimeout = null
    this.debouncedLoadProducts = this.debounce(() => {
      this.loadProducts()
    }, 300)
    this.totalPages = 1
    this.totalProducts = 0
    this.products = []
    
    // Variables para gestión de categorías
    this.currentEditingCategoryId = null
    this.categories = []

    this.initializeEventListeners()
    this.loadCategories()
    
    // Restore search state if exists
    this.restoreSearchState()
    
    this.loadProducts()
  }

  initializeEventListeners() {
    // Main search input in header
    const searchInput = document.getElementById('headerSearch')
    const clearSearchBtn = document.getElementById('clearSearch')
    const searchIcon = document.getElementById('searchIcon')
    const searchLoading = document.getElementById('searchLoading')
    
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentFilters.search = e.target.value
        this.currentFilters.page = 1 // Reset to first page
        
        // Show/hide clear button
        if (clearSearchBtn) {
          if (e.target.value.trim()) {
            clearSearchBtn.classList.remove('hidden')
          } else {
            clearSearchBtn.classList.add('hidden')
          }
        }
        
        // Show loading state
        if (searchIcon && searchLoading) {
          searchIcon.classList.add('hidden')
          searchLoading.classList.remove('hidden')
        }
        
        this.debouncedLoadProducts()
      })

      // Clear search on escape key
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.clearSearch()
        }
      })
    }

    // Clear search button
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        this.clearSearch()
      })
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
      this.hideAddProductModal()
    })

    document.getElementById("cancelBtn")?.addEventListener("click", () => {
      this.hideAddProductModal()
    })

    // Form submission
    document.getElementById("productForm")?.addEventListener("submit", (e) => {
      e.preventDefault()
      
      // Usar FormData para manejar también la imagen
      const formData = new FormData()
      
      // Obtener datos del formulario usando los nombres correctos
      const nombre = document.getElementById("nombre")?.value?.trim()
      const descripcion = document.getElementById("descripcion")?.value?.trim()
      const categoria = document.getElementById("categoria")?.value?.trim()
      const precio = parseFloat(document.getElementById("precio")?.value)
      const precioPromocional = parseFloat(document.getElementById("precioPromocional")?.value) || null
      const disponible = document.getElementById("disponible")?.checked
      const stock = parseInt(document.getElementById("stock")?.value) || 0
      const barcode = document.getElementById("barcode")?.value?.trim()
      const supplierCode = document.getElementById("supplierCode")?.value?.trim()
      const imageFile = document.getElementById("imageInput")?.files[0]

      // Validaciones básicas
      if (!nombre) {
        this.showError("El nombre del producto es requerido")
        return
      }
      if (!precio || precio <= 0) {
        this.showError("El precio debe ser mayor a 0")
        return
      }
      if (!disponible && (!stock || stock < 0)) {
        this.showError("El stock debe ser 0 o mayor cuando no es ilimitado")
        return
      }

      // Agregar datos al FormData
      formData.append("name", nombre)
      formData.append("description", descripcion || "")
      formData.append("price", precio)
      if (precioPromocional) {
        formData.append("promotionalPrice", precioPromocional)
      }
      formData.append("availability", disponible ? "unlimited" : "limited")
      if (!disponible) {
        formData.append("stock", stock)
      }
      if (categoria) {
        formData.append("category", categoria)
      }
      if (barcode) {
        formData.append("barcode", barcode)
      }
      if (supplierCode) {
        formData.append("supplierCode", supplierCode)
      }
      if (imageFile) {
        formData.append("image", imageFile)
      }

      const productId = e.target.getAttribute("data-product-id")
      if (productId) {
        this.updateProduct(productId, formData)
      } else {
        this.createProduct(formData)
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

    // Event listeners para gestión de categorías
    this.initializeCategoryEventListeners()
  }

  // ===== MÉTODOS PARA GESTIÓN DE CATEGORÍAS =====

  initializeCategoryEventListeners() {
    // Botón para gestionar categorías
    document.getElementById("manageCategoriesBtn")?.addEventListener("click", () => {
      this.showManageCategoriesModal()
    })

    // Modales de categorías
    document.getElementById("closeCategoriesModal")?.addEventListener("click", () => {
      this.hideManageCategoriesModal()
    })

    document.getElementById("closeCategoryFormModal")?.addEventListener("click", () => {
      this.hideCategoryFormModal()
    })

    document.getElementById("cancelCategoryBtn")?.addEventListener("click", () => {
      this.hideCategoryFormModal()
    })

    // Búsqueda de categorías
    document.getElementById("categoriesSearchInput")?.addEventListener("input", (e) => {
      this.searchCategories(e.target.value)
    })

    // Crear nueva categoría
    document.getElementById("createCategoryBtn")?.addEventListener("click", () => {
      this.showCreateCategoryModal()
    })

    // Botón para agregar nueva categoría desde el modal de producto
    document.getElementById("addNewCategoryBtn")?.addEventListener("click", () => {
      this.showCreateCategoryModal()
    })

    // Formulario de categoría
    document.getElementById("categoryForm")?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveCategoryForm()
    })

    // Modal de confirmación de eliminación
    document.getElementById("cancelDeleteCategoryBtn")?.addEventListener("click", () => {
      this.hideDeleteCategoryModal()
    })

    document.getElementById("confirmDeleteCategoryBtn")?.addEventListener("click", () => {
      this.confirmDeleteCategory()
    })
  }

  async loadCategories() {
    try {
      const categories = await this.categoryHandler.loadCategories()
      this.categories = categories
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()
    } catch (error) {
      console.error("Error cargando categorías:", error)
      // No mostrar error al usuario, categorías son opcionales
    }
  }

  async populateCategoryFilters() {
    const categoryFilter = document.getElementById("categoryFilter")
    if (!categoryFilter) return

    try {
      await this.categoryHandler.populateCategorySelect(categoryFilter, true)
      // Cambiar texto de la opción vacía
      const emptyOption = categoryFilter.querySelector('option[value=""]')
      if (emptyOption) {
        emptyOption.textContent = "Todas las categorías"
      }
    } catch (error) {
      console.error("Error poblando filtros de categoría:", error)
    }
  }

  async loadProducts() {
    try {
      this.showLoadingState()

      // Build query parameters - Include search parameter
      const queryParams = {}
      if (this.currentFilters.search) queryParams.search = this.currentFilters.search
      if (this.currentFilters.category) queryParams.category = this.currentFilters.category
      if (this.currentFilters.price) queryParams.price = this.currentFilters.price
      if (this.currentFilters.status) queryParams.status = this.currentFilters.status
      if (this.currentFilters.sort) queryParams.sort = this.currentFilters.sort
      queryParams.page = this.currentFilters.page
      queryParams.limit = this.currentFilters.limit

      console.log("Loading products with filters:", queryParams)

      const response = await this.inventoryService.getProducts(queryParams)

      // Handle different response structures
      if (Array.isArray(response)) {
        this.products = response
        this.totalProducts = response.length
        this.totalPages = Math.ceil(this.totalProducts / this.currentFilters.limit)
      } else if (response.products) {
        this.products = response.products
        this.totalProducts = response.total || response.products.length
        this.totalPages = response.totalPages || Math.ceil(this.totalProducts / this.currentFilters.limit)
      } else {
        this.products = []
        this.totalProducts = 0
        this.totalPages = 1
      }

      console.log("Products loaded:", {
        count: this.products.length,
        total: this.totalProducts,
        totalPages: this.totalPages,
      })

      this.hideLoadingState()
      this.renderProducts()
      this.updatePagination()
    } catch (error) {
      console.error("Error al cargar productos:", error)
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

  // ===== MÉTODOS PARA GESTIÓN DE CATEGORÍAS =====

  initializeCategoryEventListeners() {
    // Botón para gestionar categorías
    document.getElementById("manageCategoriesBtn")?.addEventListener("click", () => {
      this.showManageCategoriesModal()
    })

    // Modales de categorías
    document.getElementById("closeCategoriesModal")?.addEventListener("click", () => {
      this.hideManageCategoriesModal()
    })

    document.getElementById("closeCategoryFormModal")?.addEventListener("click", () => {
      this.hideCategoryFormModal()
    })

    document.getElementById("cancelCategoryBtn")?.addEventListener("click", () => {
      this.hideCategoryFormModal()
    })

    // Búsqueda de categorías
    document.getElementById("categoriesSearchInput")?.addEventListener("input", (e) => {
      this.searchCategories(e.target.value)
    })

    // Crear nueva categoría
    document.getElementById("createCategoryBtn")?.addEventListener("click", () => {
      this.showCreateCategoryModal()
    })

    // Botón para agregar nueva categoría desde el modal de producto
    document.getElementById("addNewCategoryBtn")?.addEventListener("click", () => {
      this.showCreateCategoryModal()
    })

    // Formulario de categoría
    document.getElementById("categoryForm")?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveCategoryForm()
    })

    // Modal de confirmación de eliminación
    document.getElementById("cancelDeleteCategoryBtn")?.addEventListener("click", () => {
      this.hideDeleteCategoryModal()
    })

    document.getElementById("confirmDeleteCategoryBtn")?.addEventListener("click", () => {
      this.confirmDeleteCategory()
    })
  }

  async loadCategories() {
    try {
      const categories = await this.categoryHandler.loadCategories()
      this.categories = categories
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()
    } catch (error) {
      console.error("Error cargando categorías:", error)
      // No mostrar error al usuario, categorías son opcionales
    }
  }

  async populateCategoryFilters() {
    const categoryFilter = document.getElementById("categoryFilter")
    if (!categoryFilter) return

    try {
      await this.categoryHandler.populateCategorySelect(categoryFilter, true)
      // Cambiar texto de la opción vacía
      const emptyOption = categoryFilter.querySelector('option[value=""]')
      if (emptyOption) {
        emptyOption.textContent = "Todas las categorías"
      }
    } catch (error) {
      console.error("Error poblando filtros de categoría:", error)
    }
  }

  async populateProductCategorySelect() {
    const categorySelect = document.getElementById("categoria")
    if (!categorySelect) return

    try {
      await this.categoryHandler.populateCategorySelect(categorySelect, true)
      // Cambiar texto de la opción vacía
      const emptyOption = categorySelect.querySelector('option[value=""]')
      if (emptyOption) {
        emptyOption.textContent = "Seleccionar categoría..."
      }
    } catch (error) {
      console.error("Error poblando select de categoría del producto:", error)
      // Mostrar estado de error en el select
      categorySelect.innerHTML = '<option value="">Error al cargar categorías</option>'
    }
  }

  async showManageCategoriesModal() {
    const modal = document.getElementById("manageCategoriesModal")
    if (!modal) return

    modal.classList.remove("hidden")
    await this.loadCategoriesInModal()
  }

  hideManageCategoriesModal() {
    const modal = document.getElementById("manageCategoriesModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  async loadCategoriesInModal() {
    const container = document.getElementById("categoriesContainer")
    if (!container) return

    try {
      // Mostrar loading
      container.innerHTML = `
        <div class="category-loading">
          <i class="fas fa-spinner"></i>
          <span>Cargando categorías...</span>
        </div>
      `

      await this.categoryHandler.loadCategories()
      this.categories = this.categoryHandler.categories

      if (this.categories.length === 0) {
        container.innerHTML = `
          <div class="category-empty-state">
            <i class="fas fa-tags"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p class="text-gray-600">Crea tu primera categoría para organizar tus productos.</p>
          </div>
        `
        return
      }

      // Renderizar categorías
      container.innerHTML = this.categories.map(category => 
        this.categoryHandler.createCategoryListItem(category)
      ).join("")

      // Agregar event listeners a los botones
      this.bindCategoryActionButtons()

    } catch (error) {
      console.error("Error cargando categorías en modal:", error)
      container.innerHTML = `
        <div class="category-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3 class="text-lg font-medium mb-2">Error al cargar categorías</h3>
          <p class="text-sm">${error.message}</p>
        </div>
      `
    }
  }

  bindCategoryActionButtons() {
    // Botones de editar
    document.querySelectorAll(".edit-category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.categoryId
        this.showEditCategoryModal(categoryId)
      })
    })

    // Botones de eliminar
    document.querySelectorAll(".delete-category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.categoryId
        this.showDeleteCategoryModal(categoryId)
      })
    })
  }

  async searchCategories(searchTerm) {
    const container = document.getElementById("categoriesContainer")
    if (!container) return

    try {
      if (!searchTerm.trim()) {
        await this.loadCategoriesInModal()
        return
      }

      container.innerHTML = `
        <div class="category-loading">
          <i class="fas fa-spinner"></i>
          <span>Buscando categorías...</span>
        </div>
      `

      const categories = await this.categoryHandler.searchCategories(searchTerm)

      if (categories.length === 0) {
        container.innerHTML = `
          <div class="category-empty-state">
            <i class="fas fa-search"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron categorías</h3>
            <p class="text-gray-600">No hay categorías que coincidan con "${searchTerm}".</p>
          </div>
        `
        return
      }

      container.innerHTML = categories.map(category => 
        this.categoryHandler.createCategoryListItem(category)
      ).join("")

      this.bindCategoryActionButtons()

    } catch (error) {
      console.error("Error buscando categorías:", error)
      container.innerHTML = `
        <div class="category-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3 class="text-lg font-medium mb-2">Error en la búsqueda</h3>
          <p class="text-sm">${error.message}</p>
        </div>
      `
    }
  }

  showCreateCategoryModal() {
    this.currentEditingCategoryId = null
    const modal = document.getElementById("categoryFormModal")
    const title = document.getElementById("categoryFormTitle")
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")

    if (modal && title) {
      title.textContent = "Nueva Categoría"
      if (nameInput) nameInput.value = ""
      if (descriptionInput) descriptionInput.value = ""
      modal.classList.remove("hidden")
      nameInput?.focus()
    }
  }

  showEditCategoryModal(categoryId) {
    this.currentEditingCategoryId = categoryId
    const category = this.categoryHandler.getCategoryById(categoryId)
    
    if (!category) {
      console.error("Categoría no encontrada:", categoryId)
      return
    }

    const modal = document.getElementById("categoryFormModal")
    const title = document.getElementById("categoryFormTitle")
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")

    if (modal && title) {
      title.textContent = "Editar Categoría"
      if (nameInput) nameInput.value = category.name
      if (descriptionInput) descriptionInput.value = category.description || ""
      modal.classList.remove("hidden")
      nameInput?.focus()
    }
  }

  hideCategoryFormModal() {
    const modal = document.getElementById("categoryFormModal")
    if (modal) {
      modal.classList.add("hidden")
      this.currentEditingCategoryId = null
    }
  }

  async saveCategoryForm() {
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")
    const saveBtn = document.getElementById("saveCategoryBtn")

    if (!nameInput || !saveBtn) return

    const name = nameInput.value.trim()
    if (!name) {
      this.showError("El nombre de la categoría es requerido")
      nameInput.focus()
      return
    }

    // Validar nombre único
    if (this.categoryHandler.categoryNameExists(name, this.currentEditingCategoryId)) {
      this.showError("Ya existe una categoría con este nombre")
      nameInput.focus()
      return
    }

    const categoryData = {
      name: name,
      description: descriptionInput?.value.trim() || undefined
    }

    try {
      saveBtn.disabled = true
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'

      if (this.currentEditingCategoryId) {
        await this.categoryHandler.updateCategory(this.currentEditingCategoryId, categoryData)
        this.showSuccess("Categoría actualizada correctamente")
      } else {
        await this.categoryHandler.createCategory(categoryData)
        this.showSuccess("Categoría creada correctamente")
      }

      this.hideCategoryFormModal()
      await this.loadCategoriesInModal()
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()

    } catch (error) {
      console.error("Error guardando categoría:", error)
      this.showError(error.message || "Error al guardar la categoría")
    } finally {
      saveBtn.disabled = false
      saveBtn.innerHTML = "Guardar"
    }
  }

  showDeleteCategoryModal(categoryId) {
    const category = this.categoryHandler.getCategoryById(categoryId)
    if (!category) {
      console.error("Categoría no encontrada:", categoryId)
      return
    }

    const modal = document.getElementById("deleteCategoryModal")
    const message = document.getElementById("deleteCategoryMessage")
    const confirmBtn = document.getElementById("confirmDeleteCategoryBtn")

    if (modal && message && confirmBtn) {
      if (category.productCount > 0) {
        message.innerHTML = `
          No se puede eliminar la categoría <strong>"${category.name}"</strong> porque tiene <strong>${category.productCount} producto(s)</strong> asociado(s).
          <br><br>
          Para eliminarla, primero debe cambiar la categoría de todos los productos o eliminarlos.
        `
        confirmBtn.style.display = "none"
      } else {
        message.innerHTML = `
          ¿Estás seguro de que deseas eliminar la categoría <strong>"${category.name}"</strong>?
          <br><br>
          Esta acción no se puede deshacer.
        `
        confirmBtn.style.display = "block"
        confirmBtn.dataset.categoryId = categoryId
      }
      
      modal.classList.remove("hidden")
    }
  }

  hideDeleteCategoryModal() {
    const modal = document.getElementById("deleteCategoryModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  async confirmDeleteCategory() {
    const confirmBtn = document.getElementById("confirmDeleteCategoryBtn")
    const categoryId = confirmBtn?.dataset.categoryId

    if (!categoryId) return

    try {
      confirmBtn.disabled = true
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'

      await this.categoryHandler.deleteCategory(categoryId)
      this.showSuccess("Categoría eliminada correctamente")
      
      this.hideDeleteCategoryModal()
      await this.loadCategoriesInModal()
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()

    } catch (error) {
      console.error("Error eliminando categoría:", error)
      this.showError(error.message || "Error al eliminar la categoría")
    } finally {
      confirmBtn.disabled = false
      confirmBtn.innerHTML = "Eliminar"
    }
  }

  async showManageCategoriesModal() {
    const modal = document.getElementById("manageCategoriesModal")
    if (!modal) return

    modal.classList.remove("hidden")
    await this.loadCategoriesInModal()
  }

  hideManageCategoriesModal() {
    const modal = document.getElementById("manageCategoriesModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  async loadCategoriesInModal() {
    const container = document.getElementById("categoriesContainer")
    if (!container) return

    try {
      // Mostrar loading
      container.innerHTML = `
        <div class="category-loading">
          <i class="fas fa-spinner"></i>
          <span>Cargando categorías...</span>
        </div>
      `

      await this.categoryHandler.loadCategories()
      this.categories = this.categoryHandler.categories

      if (this.categories.length === 0) {
        container.innerHTML = `
          <div class="category-empty-state">
            <i class="fas fa-tags"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p class="text-gray-600">Crea tu primera categoría para organizar tus productos.</p>
          </div>
        `
        return
      }

      // Renderizar categorías
      container.innerHTML = this.categories.map(category => 
        this.categoryHandler.createCategoryListItem(category)
      ).join("")

      // Agregar event listeners a los botones
      this.bindCategoryActionButtons()

    } catch (error) {
      console.error("Error cargando categorías en modal:", error)
      container.innerHTML = `
        <div class="category-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3 class="text-lg font-medium mb-2">Error al cargar categorías</h3>
          <p class="text-sm">${error.message}</p>
        </div>
      `
    }
  }

  bindCategoryActionButtons() {
    // Botones de editar
    document.querySelectorAll(".edit-category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.categoryId
        this.showEditCategoryModal(categoryId)
      })
    })

    // Botones de eliminar
    document.querySelectorAll(".delete-category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.categoryId
        this.showDeleteCategoryModal(categoryId)
      })
    })
  }

  async searchCategories(searchTerm) {
    const container = document.getElementById("categoriesContainer")
    if (!container) return

    try {
      if (!searchTerm.trim()) {
        await this.loadCategoriesInModal()
        return
      }

      container.innerHTML = `
        <div class="category-loading">
          <i class="fas fa-spinner"></i>
          <span>Buscando categorías...</span>
        </div>
      `

      const categories = await this.categoryHandler.searchCategories(searchTerm)

      if (categories.length === 0) {
        container.innerHTML = `
          <div class="category-empty-state">
            <i class="fas fa-search"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron categorías</h3>
            <p class="text-gray-600">No hay categorías que coincidan con "${searchTerm}".</p>
          </div>
        `
        return
      }

      container.innerHTML = categories.map(category => 
        this.categoryHandler.createCategoryListItem(category)
      ).join("")

      this.bindCategoryActionButtons()

    } catch (error) {
      console.error("Error buscando categorías:", error)
      container.innerHTML = `
        <div class="category-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3 class="text-lg font-medium mb-2">Error en la búsqueda</h3>
          <p class="text-sm">${error.message}</p>
        </div>
      `
    }
  }

  showCreateCategoryModal() {
    this.currentEditingCategoryId = null
    const modal = document.getElementById("categoryFormModal")
    const title = document.getElementById("categoryFormTitle")
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")

    if (modal && title) {
      title.textContent = "Nueva Categoría"
      if (nameInput) nameInput.value = ""
      if (descriptionInput) descriptionInput.value = ""
      modal.classList.remove("hidden")
      nameInput?.focus()
    }
  }

  showEditCategoryModal(categoryId) {
    this.currentEditingCategoryId = categoryId
    const category = this.categoryHandler.getCategoryById(categoryId)
    
    if (!category) {
      console.error("Categoría no encontrada:", categoryId)
      return
    }

    const modal = document.getElementById("categoryFormModal")
    const title = document.getElementById("categoryFormTitle")
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")

    if (modal && title) {
      title.textContent = "Editar Categoría"
      if (nameInput) nameInput.value = category.name
      if (descriptionInput) descriptionInput.value = category.description || ""
      modal.classList.remove("hidden")
      nameInput?.focus()
    }
  }

  hideCategoryFormModal() {
    const modal = document.getElementById("categoryFormModal")
    if (modal) {
      modal.classList.add("hidden")
      this.currentEditingCategoryId = null
    }
  }

  async saveCategoryForm() {
    const nameInput = document.getElementById("categoryName")
    const descriptionInput = document.getElementById("categoryDescription")
    const saveBtn = document.getElementById("saveCategoryBtn")

    if (!nameInput || !saveBtn) return

    const name = nameInput.value.trim()
    if (!name) {
      this.showError("El nombre de la categoría es requerido")
      nameInput.focus()
      return
    }

    // Validar nombre único
    if (this.categoryHandler.categoryNameExists(name, this.currentEditingCategoryId)) {
      this.showError("Ya existe una categoría con este nombre")
      nameInput.focus()
      return
    }

    const categoryData = {
      name: name,
      description: descriptionInput?.value.trim() || undefined
    }

    try {
      saveBtn.disabled = true
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'

      if (this.currentEditingCategoryId) {
        await this.categoryHandler.updateCategory(this.currentEditingCategoryId, categoryData)
        this.showSuccess("Categoría actualizada correctamente")
      } else {
        await this.categoryHandler.createCategory(categoryData)
        this.showSuccess("Categoría creada correctamente")
      }

      this.hideCategoryFormModal()
      await this.loadCategoriesInModal()
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()

    } catch (error) {
      console.error("Error guardando categoría:", error)
      this.showError(error.message || "Error al guardar la categoría")
    } finally {
      saveBtn.disabled = false
      saveBtn.innerHTML = "Guardar"
    }
  }

  showDeleteCategoryModal(categoryId) {
    const category = this.categoryHandler.getCategoryById(categoryId)
    if (!category) {
      console.error("Categoría no encontrada:", categoryId)
      return
    }

    const modal = document.getElementById("deleteCategoryModal")
    const message = document.getElementById("deleteCategoryMessage")
    const confirmBtn = document.getElementById("confirmDeleteCategoryBtn")

    if (modal && message && confirmBtn) {
      if (category.productCount > 0) {
        message.innerHTML = `
          No se puede eliminar la categoría <strong>"${category.name}"</strong> porque tiene <strong>${category.productCount} producto(s)</strong> asociado(s).
          <br><br>
          Para eliminarla, primero debe cambiar la categoría de todos los productos o eliminarlos.
        `
        confirmBtn.style.display = "none"
      } else {
        message.innerHTML = `
          ¿Estás seguro de que deseas eliminar la categoría <strong>"${category.name}"</strong>?
          <br><br>
          Esta acción no se puede deshacer.
        `
        confirmBtn.style.display = "block"
        confirmBtn.dataset.categoryId = categoryId
      }
      
      modal.classList.remove("hidden")
    }
  }

  hideDeleteCategoryModal() {
    const modal = document.getElementById("deleteCategoryModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  async confirmDeleteCategory() {
    const confirmBtn = document.getElementById("confirmDeleteCategoryBtn")
    const categoryId = confirmBtn?.dataset.categoryId

    if (!categoryId) return

    try {
      confirmBtn.disabled = true
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'

      await this.categoryHandler.deleteCategory(categoryId)
      this.showSuccess("Categoría eliminada correctamente")
      
      this.hideDeleteCategoryModal()
      await this.loadCategoriesInModal()
      await this.populateCategoryFilters()
      await this.populateProductCategorySelect()

    } catch (error) {
      console.error("Error eliminando categoría:", error)
      this.showError(error.message || "Error al eliminar la categoría")
    } finally {
      confirmBtn.disabled = false
      confirmBtn.innerHTML = "Eliminar"
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

    // Show search results counter if searching
    this.showSearchResultsInfo()

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
                                    ${this.highlightSearchTerm(product.name || "Sin nombre")}
                                </div>
                                <div class="text-xs text-gray-500 font-mono">
                                    ${product.code || product.id || "N/A"}
                                </div>
                                <div class="text-xs text-gray-600 truncate max-w-xs">
                                    ${this.highlightSearchTerm(product.description || "Sin descripción")}
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

    if (currentPageSpan) currentPageSpan.textContent = this.currentFilters.page
    if (totalPagesSpan) totalPagesSpan.textContent = this.totalPages

    if (!paginationNumbers || !prevBtn || !nextBtn) {
      console.log("Pagination elements not found")
      return
    }

    console.log("Updating pagination - Current page:", this.currentFilters.page, "Total pages:", this.totalPages)

    // Update button states
    prevBtn.disabled = this.currentFilters.page <= 1
    nextBtn.disabled = this.currentFilters.page >= this.totalPages

    // Generate page numbers
    const pageNumbers = this.generatePageNumbers()
    console.log("Generated page numbers:", pageNumbers)

    paginationNumbers.innerHTML = pageNumbers
      .map((page) => {
        if (page === "...") {
          return `<span class="pagination-ellipsis">...</span>`
        }

        const isActive = page === this.currentFilters.page
        return `
          <button 
            onclick="inventoryHandler.goToPage(${page})"
            class="pagination-btn ${isActive ? "active" : ""}"
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

    if (total <= 1) {
      return []
    }

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (current <= 4) {
        // Show 1, 2, 3, 4, 5, ..., last
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      } else if (current >= total - 3) {
        // Show 1, ..., last-4, last-3, last-2, last-1, last
        pages.push("...")
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // Show 1, ..., current-1, current, current+1, ..., last
        pages.push("...")
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(total)
      }
    }

    console.log("Final page numbers:", pages)
    return pages
  }

  goToPage(page) {
    console.log("Going to page:", page)
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
    
    // Also reset search visual state
    this.resetSearchState()
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState")
    const tableBody = document.getElementById("productsTableBody")

    if (emptyState) {
      emptyState.classList.remove("hidden")
      
      // Check if there's an active search
      const hasActiveSearch = this.currentFilters.search && this.currentFilters.search.trim()
      const hasActiveFilters = this.currentFilters.category || this.currentFilters.price || this.currentFilters.status
      
      if (hasActiveSearch || hasActiveFilters) {
        emptyState.innerHTML = `
          <div class="text-gray-500">
            <i class="fas fa-search text-4xl mb-4"></i>
            <p class="text-lg font-medium">No se encontraron productos</p>
            <p class="text-sm">
              ${hasActiveSearch ? `No hay productos que coincidan con "${this.currentFilters.search}"` : 'No hay productos que coincidan con los filtros aplicados'}
            </p>
            <button onclick="inventoryHandler.clearAllFilters()" class="mt-4 px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6DB4] transition-colors">
              Limpiar ${hasActiveSearch ? 'búsqueda' : 'filtros'}
            </button>
          </div>
        `
      } else {
        emptyState.innerHTML = `
          <div class="text-gray-500">
            <i class="fas fa-box-open text-4xl mb-4"></i>
            <p class="text-lg font-medium">No hay productos</p>
            <p class="text-sm">Agrega tu primer producto para comenzar</p>
          </div>
        `
      }
    }
    
    if (tableBody) tableBody.innerHTML = ""
  }

  hideEmptyState() {
    const emptyState = document.getElementById("emptyState")
    if (emptyState) emptyState.classList.add("hidden")
  }

  // Utility function for debouncing search
  debounce(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(this.searchTimeout)
        func(...args)
      }
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(later, wait)
    }.bind(this)
  }

  // Clear search functionality
  clearSearch() {
    const searchInput = document.getElementById('headerSearch')
    const clearSearchBtn = document.getElementById('clearSearch')
    
    if (searchInput) {
      searchInput.value = ""
    }
    if (clearSearchBtn) {
      clearSearchBtn.classList.add('hidden')
    }
    
    this.currentFilters.search = ""
    this.currentFilters.page = 1
    this.loadProducts()
  }

  // Clear all filters and search
  clearAllFilters() {
    // Clear search
    this.clearSearch()
    
    // Clear other filters
    const categoryFilter = document.getElementById('categoryFilter')
    const priceFilter = document.getElementById('priceFilter')
    const statusFilter = document.getElementById('statusFilter')
    const sortFilter = document.getElementById('sortFilter')
    
    if (categoryFilter) categoryFilter.value = ""
    if (priceFilter) priceFilter.value = ""
    if (statusFilter) statusFilter.value = ""
    if (sortFilter) sortFilter.value = "name"
    
    // Reset filters object
    this.currentFilters = {
      page: 1,
      limit: 10,
      category: "",
      price: "",
      status: "",
      sort: "name",
      search: "",
    }
    
    // Reload products
    this.loadProducts()
  }

  // Reset search visual state
  resetSearchState() {
    const searchIcon = document.getElementById('searchIcon')
    const searchLoading = document.getElementById('searchLoading')
    
    if (searchIcon && searchLoading) {
      searchIcon.classList.remove('hidden')
      searchLoading.classList.add('hidden')
    }
  }

  // Restore search state from filters
  restoreSearchState() {
    const searchInput = document.getElementById('headerSearch')
    const clearSearchBtn = document.getElementById('clearSearch')
    
    if (searchInput && this.currentFilters.search) {
      searchInput.value = this.currentFilters.search
      
      if (clearSearchBtn) {
        clearSearchBtn.classList.remove('hidden')
      }
    }
  }

  // Highlight search terms in text
  highlightSearchTerm(text) {
    if (!this.currentFilters.search || !this.currentFilters.search.trim()) {
      return text
    }
    
    const searchTerm = this.currentFilters.search.trim()
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<span class="search-highlight">$1</span>')
  }

  // Show search results information
  showSearchResultsInfo() {
    const hasActiveSearch = this.currentFilters.search && this.currentFilters.search.trim()
    const tableContainer = document.querySelector('.bg-white.rounded-lg.shadow-sm.border.border-gray-200.overflow-hidden')
    
    // Remove existing search info
    const existingInfo = document.querySelector('.search-result-count')
    if (existingInfo) {
      existingInfo.remove()
    }
    
    if (hasActiveSearch && tableContainer) {
      const searchInfo = document.createElement('div')
      searchInfo.className = 'search-result-count'
      searchInfo.innerHTML = `
        Se encontraron <span class="highlight">${this.totalProducts}</span> productos para 
        "<span class="highlight">${this.currentFilters.search}"</span>
      `
      tableContainer.insertBefore(searchInfo, tableContainer.firstChild)
    }
  }

  async createProduct(formData) {
    try {
      const response = await this.inventoryService.createProduct(formData)
      this.showSuccess("Producto creado exitosamente")
      this.hideAddProductModal()
      await this.loadProducts()

    } catch (error) {
      console.error("Error al crear producto:", error)
      this.showError(error.message || "Error al crear el producto")
    }
  }

  async updateProduct(productId, productData) {
    try {
      await this.inventoryService.updateProduct(productId, productData)
      this.loadProducts()
      this.hideModal()
      this.showSuccess("Producto actualizado exitosamente")
    } catch (error) {
      console.error("Error al actualizar producto:", error)
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
      console.error("Error al eliminar producto:", error)
      this.showError(error.message || "Error al eliminar el producto")
    }
  }

  showAddProductModal() {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("authToken")
    
    // Debug logs para verificar información del usuario
    console.log("Debug - Usuario actual:", user)
    console.log("Debug - Token presente:", !!token)
    console.log("Debug - Rol del usuario:", user.role)
    
    if (user.role !== "admin") {
      console.error("Acceso denegado - Usuario no es admin:", user)
      this.showError("No tienes permisos para agregar productos. Solo administradores pueden hacerlo.")
      return
    }

    console.log("Usuario autorizado como admin, abriendo modal...")

    const modal = document.getElementById("productModal")
    const form = document.getElementById("productForm")
    const modalTitle = document.getElementById("modalTitle")

    if (!modal || !form) return

    // Limpiar formulario
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

    // Reset image preview
    const previewContainer = document.getElementById("previewContainer")
    const uploadText = document.getElementById("uploadText")
    if (previewContainer) {
      previewContainer.classList.add("hidden")
    }
    if (uploadText) {
      uploadText.textContent = "Cargar una imagen"
    }

    modal.classList.remove("hidden")
  }

  hideAddProductModal() {
    const modal = document.getElementById("productModal")
    if (modal) {
      modal.classList.add("hidden")
    }
  }

  async showEditProductModal(productId) {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (user.role !== "admin") {
      this.showError("No tienes permisos para editar productos. Solo administradores pueden hacerlo.")
      return
    }

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
    console.log("Success:", message)
    // Implementar notificación de éxito
    alert(message) // Temporal, mejorar con una notificación más elegante
  }

  showError(message) {
    console.log("Error:", message)
    // Implementar notificación de error
    alert(message) // Temporal, mejorar con una notificación más elegante
  }
}

// Inicializar el manejador cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.inventoryHandler = new InventoryHandler()
})

export { InventoryHandler }