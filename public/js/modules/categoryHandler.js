import { CategoryService } from "/js/services/categoryService.js"

export class CategoryHandler {
  constructor() {
    this.categoryService = new CategoryService()
    this.categories = []
  }

  /**
   * Cargar todas las categorías
   */
  async loadCategories() {
    try {
      const response = await this.categoryService.getCategories()
      if (response.success) {
        this.categories = response.categories || []
        return this.categories
      } else {
        throw new Error(response.message || "Error al cargar categorías")
      }
    } catch (error) {
      console.error("Error cargando categorías:", error)
      throw error
    }
  }

  /**
   * Buscar categorías por nombre
   */
  async searchCategories(searchTerm) {
    try {
      const response = await this.categoryService.getCategories(searchTerm)
      if (response.success) {
        return response.categories || []
      } else {
        throw new Error(response.message || "Error en búsqueda de categorías")
      }
    } catch (error) {
      console.error("Error buscando categorías:", error)
      throw error
    }
  }

  /**
   * Crear nueva categoría
   */
  async createCategory(categoryData) {
    try {
      const response = await this.categoryService.createCategory(categoryData)
      if (response.success) {
        // Actualizar lista local
        await this.loadCategories()
        return response.category
      } else {
        throw new Error(response.message || "Error al crear categoría")
      }
    } catch (error) {
      console.error("Error creando categoría:", error)
      throw error
    }
  }

  /**
   * Actualizar categoría existente
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await this.categoryService.updateCategory(categoryId, categoryData)
      if (response.success) {
        // Actualizar lista local
        await this.loadCategories()
        return response.category
      } else {
        throw new Error(response.message || "Error al actualizar categoría")
      }
    } catch (error) {
      console.error("Error actualizando categoría:", error)
      throw error
    }
  }

  /**
   * Eliminar categoría
   */
  async deleteCategory(categoryId) {
    try {
      const response = await this.categoryService.deleteCategory(categoryId)
      if (response.success) {
        // Actualizar lista local
        await this.loadCategories()
        return response
      } else {
        throw new Error(response.message || "Error al eliminar categoría")
      }
    } catch (error) {
      console.error("Error eliminando categoría:", error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de categoría
   */
  async getCategoryStats(categoryId) {
    try {
      const response = await this.categoryService.getCategoryStats(categoryId)
      if (response.success) {
        return response
      } else {
        throw new Error(response.message || "Error al obtener estadísticas")
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error)
      throw error
    }
  }

  /**
   * Poblar un select con categorías
   */
  async populateCategorySelect(selectElement, includeEmpty = true) {
    try {
      if (!selectElement) {
        throw new Error("Elemento select no encontrado")
      }

      // Limpiar opciones existentes
      selectElement.innerHTML = ""

      // Agregar opción vacía si se requiere
      if (includeEmpty) {
        const emptyOption = document.createElement("option")
        emptyOption.value = ""
        emptyOption.textContent = "Seleccionar categoría..."
        selectElement.appendChild(emptyOption)
      }

      // Cargar categorías si no están cargadas
      if (this.categories.length === 0) {
        await this.loadCategories()
      }

      // Agregar opciones de categorías
      this.categories.forEach(category => {
        const option = document.createElement("option")
        option.value = category.name
        option.textContent = `${category.name} (${category.productCount})`
        option.dataset.categoryId = category.id
        selectElement.appendChild(option)
      })

      return this.categories.length
    } catch (error) {
      console.error("Error poblando select de categorías:", error)
      throw error
    }
  }

  /**
   * Crear elemento de categoría para lista
   */
  createCategoryListItem(category) {
    return `
      <div class="category-item p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-category-id="${category.id}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="font-medium text-gray-900">${category.name}</h3>
            ${category.description ? `<p class="text-sm text-gray-600 mt-1">${category.description}</p>` : ""}
            <p class="text-xs text-gray-500 mt-2">${category.productCount} producto(s)</p>
          </div>
          <div class="flex items-center space-x-2">
            <button class="edit-category-btn p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors" 
                    data-category-id="${category.id}" title="Editar categoría">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-category-btn p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors" 
                    data-category-id="${category.id}" title="Eliminar categoría">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Obtener categoría por ID
   */
  getCategoryById(categoryId) {
    return this.categories.find(cat => cat.id === categoryId)
  }

  /**
   * Obtener categoría por nombre
   */
  getCategoryByName(categoryName) {
    return this.categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())
  }

  /**
   * Validar si existe una categoría con el nombre dado
   */
  categoryNameExists(name, excludeId = null) {
    return this.categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && 
      (excludeId ? cat.id !== excludeId : true)
    )
  }
}