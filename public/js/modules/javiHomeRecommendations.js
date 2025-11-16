/**
 * Módulo para cargar y mostrar recomendaciones de JAVI en la página de inicio
 */

class JAVIHomeRecommendations {
  constructor() {
    this.container = null
    this.noRecommendationsMessage = null
    this.init()
  }

  init() {
    // Esperar a que el DOM esté cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup())
    } else {
      this.setup()
    }
  }

  setup() {
    this.container = document.getElementById('javiRecommendationsContainer')
    this.noRecommendationsMessage = document.getElementById('noRecommendationsMessage')
    
    if (!this.container) {
      console.warn('⚠️ No se encontró el contenedor de recomendaciones de JAVI')
      return
    }

    console.log('🤖 Inicializando recomendaciones de JAVI para inicio...')
    this.loadRecommendations()

    // Escuchar cambios en localStorage para actualizaciones en tiempo real
    window.addEventListener('storage', (e) => {
      if (e.key === 'javi_home_recommendations') {
        this.loadRecommendations()
      }
    })
  }

  loadRecommendations() {
    try {
      const storedRecommendations = localStorage.getItem('javi_home_recommendations')
      
      if (!storedRecommendations) {
        this.showNoRecommendations()
        return
      }

      const recommendations = JSON.parse(storedRecommendations)
      
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        this.showNoRecommendations()
        return
      }

      console.log(`📊 Cargando ${recommendations.length} recomendaciones de JAVI`)
      this.displayRecommendations(recommendations)
      
    } catch (error) {
      console.error('❌ Error cargando recomendaciones de JAVI:', error)
      this.showNoRecommendations()
    }
  }

  displayRecommendations(recommendations) {
    if (!this.container) return

    // Limpiar loading state
    this.container.innerHTML = ''
    
    // Ocultar mensaje de "no recomendaciones"
    if (this.noRecommendationsMessage) {
      this.noRecommendationsMessage.classList.add('hidden')
    }

    // Almacenar recomendaciones completas globalmente
    window.currentRecommendations = recommendations

    // Generar HTML para cada recomendación
    const recommendationsHTML = recommendations.slice(0, 3).map(rec => this.createRecommendationCard(rec)).join('')
    
    this.container.innerHTML = recommendationsHTML

    // Asegurar que las funciones del modal estén disponibles
    this.setupModalFunctions()
  }

  setupModalFunctions() {
    // Función global para mostrar el modal
    window.showRecommendationModal = (recommendationId) => {
      const recommendation = window.currentRecommendations?.find(rec => rec.id === recommendationId)
      if (recommendation) {
        this.showModal(recommendation)
      }
    }

    // Función global para cerrar el modal
    window.closeRecommendationModal = () => {
      this.hideModal()
    }
  }

  showModal(recommendation) {
    // Crear modal si no existe
    let modal = document.getElementById('recommendationModal')
    if (!modal) {
      modal = this.createModal()
      document.body.appendChild(modal)
    }

    // Actualizar contenido del modal
    const categoryConfig = this.getCategoryConfig(recommendation.category)
    const timeAgo = this.formatTimeAgo(recommendation.timestamp)

    document.getElementById('modalCategory').textContent = recommendation.category
    document.getElementById('modalCategoryIcon').className = categoryConfig.icon + ' ' + categoryConfig.iconColor
    document.getElementById('modalCategoryBg').className = 'w-16 h-16 rounded-full flex items-center justify-center ' + categoryConfig.bgClass
    document.getElementById('modalTitle').textContent = recommendation.title
    document.getElementById('modalTimestamp').textContent = `Generado por JAVI • ${timeAgo}`
    document.getElementById('modalDescription').textContent = recommendation.description

    // Mostrar modal
    modal.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }

  hideModal() {
    const modal = document.getElementById('recommendationModal')
    if (modal) {
      modal.classList.add('hidden')
      document.body.classList.remove('overflow-hidden')
    }
  }

  createModal() {
    const modal = document.createElement('div')
    modal.id = 'recommendationModal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden'
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-4">
                <div id="modalCategoryBg">
                  <i id="modalCategoryIcon"></i>
                </div>
                <div>
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 id="modalTitle" class="text-xl font-bold text-gray-900"></h3>
                    <span id="modalCategory" class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"></span>
                  </div>
                  <p id="modalTimestamp" class="text-sm text-gray-500"></p>
                </div>
              </div>
              <button onclick="window.closeRecommendationModal()" 
                      class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <div class="prose prose-sm max-w-none">
              <p id="modalDescription" class="text-gray-700 leading-relaxed text-base"></p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="p-6 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex text-yellow-400">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <span class="ml-2 text-sm text-gray-600">Recomendación de JAVI</span>
              </div>
              <div class="flex space-x-3">
                <button class="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <i class="fas fa-bookmark"></i>
                  <span>Guardar</span>
                </button>
                <button class="flex items-center space-x-2 px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6DB8] transition-colors">
                  <i class="fas fa-share"></i>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Event listeners para cerrar modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal()
      }
    })

    return modal
  }

  createRecommendationCard(recommendation) {
    const { title, description, category, color, icon, timestamp } = recommendation
    
    // Configurar colores e iconos por categoría
    const categoryConfig = this.getCategoryConfig(category, color, icon)
    
    // Formatear fecha
    const timeAgo = this.formatTimeAgo(timestamp)
    
    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-start">
          <div class="w-12 h-12 ${categoryConfig.bgClass} rounded-xl mr-4 flex items-center justify-center flex-shrink-0">
            <i class="${categoryConfig.icon} ${categoryConfig.iconColor}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <h3 class="font-medium text-gray-900 truncate">${this.sanitizeText(title)}</h3>
              <span class="text-xs font-medium ${categoryConfig.tagClass} px-2 py-1 rounded-full flex-shrink-0">
                ${category}
              </span>
            </div>
            <p class="text-xs text-gray-500 mb-2">Por JAVI • ${timeAgo}</p>
            <p class="text-sm text-gray-600 line-clamp-3 leading-relaxed">${this.sanitizeText(description)}${description.length > 150 ? '...' : ''}</p>
            <button class="mt-3 text-[#8B7EC7] hover:text-[#7A6DB8] text-sm font-medium flex items-center space-x-1 transition-colors" 
                    onclick="window.showRecommendationModal('${recommendation.id}')">
              <span>Ver detalles</span>
              <i class="fas fa-arrow-right text-xs"></i>
            </button>
          </div>
          <div class="flex flex-col items-center space-y-2 ml-4 flex-shrink-0">
            <div class="flex text-yellow-400">
              <i class="fas fa-star text-xs"></i>
              <i class="fas fa-star text-xs"></i>
              <i class="fas fa-star text-xs"></i>
              <i class="fas fa-star text-xs"></i>
              <i class="fas fa-star text-xs"></i>
            </div>
            <button class="text-gray-400 hover:text-[#8B7EC7] transition-colors" title="Marcar como favorito">
              <i class="fas fa-bookmark"></i>
            </button>
          </div>
        </div>
      </div>
    `
  }

  getCategoryConfig(category, color, icon) {
    const configs = {
      'INVENTARIO': {
        bgClass: 'bg-blue-100',
        iconColor: 'text-blue-600',
        tagClass: 'text-blue-600 bg-blue-50',
        icon: 'fas fa-boxes'
      },
      'PRECIOS': {
        bgClass: 'bg-green-100',
        iconColor: 'text-green-600',
        tagClass: 'text-green-600 bg-green-50',
        icon: 'fas fa-dollar-sign'
      },
      'VENTAS': {
        bgClass: 'bg-purple-100',
        iconColor: 'text-purple-600',
        tagClass: 'text-purple-600 bg-purple-50',
        icon: 'fas fa-chart-line'
      },
      'MÁRGENES': {
        bgClass: 'bg-orange-100',
        iconColor: 'text-orange-600',
        tagClass: 'text-orange-600 bg-orange-50',
        icon: 'fas fa-percentage'
      },
      'PROVEEDORES': {
        bgClass: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        tagClass: 'text-indigo-600 bg-indigo-50',
        icon: 'fas fa-truck'
      },
      'CRECIMIENTO': {
        bgClass: 'bg-pink-100',
        iconColor: 'text-pink-600',
        tagClass: 'text-pink-600 bg-pink-50',
        icon: 'fas fa-rocket'
      }
    }

    return configs[category] || {
      bgClass: 'bg-gray-100',
      iconColor: 'text-gray-600',
      tagClass: 'text-gray-600 bg-gray-50',
      icon: icon || 'fas fa-lightbulb'
    }
  }

  formatTimeAgo(timestamp) {
    try {
      const now = new Date()
      const date = new Date(timestamp)
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) {
        return diffMins <= 1 ? 'Ahora' : `Hace ${diffMins} min`
      } else if (diffHours < 24) {
        return `Hace ${diffHours}h`
      } else {
        return `Hace ${diffDays}d`
      }
    } catch (error) {
      return 'Reciente'
    }
  }

  sanitizeText(text) {
    // Crear un elemento temporal para sanitizar el texto
    const temp = document.createElement('div')
    temp.textContent = text
    return temp.innerHTML
  }

  showNoRecommendations() {
    if (!this.container) return

    this.container.innerHTML = ''
    
    if (this.noRecommendationsMessage) {
      this.noRecommendationsMessage.classList.remove('hidden')
    } else {
      // Si no existe el elemento, crearlo
      this.container.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
          <div class="w-16 h-16 bg-[#8B7EC7] bg-opacity-10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i class="fas fa-lightbulb text-[#8B7EC7] text-2xl"></i>
          </div>
          <h4 class="font-medium text-gray-900 mb-2">¡Genera recomendaciones inteligentes!</h4>
          <p class="text-sm text-gray-600 mb-4">JAVI puede analizar tu inventario y ventas para ofrecerte insights valiosos.</p>
          <a href="/public/views/dashboard/sugerencias.html" class="inline-flex items-center px-4 py-2 bg-[#8B7EC7] text-white text-sm rounded-lg hover:bg-[#7A6DB8] transition-colors">
            <i class="fas fa-magic mr-2"></i>
            Ir a Sugerencias
          </a>
        </div>
      `
    }
  }

  // Método público para refrescar recomendaciones
  refresh() {
    this.loadRecommendations()
  }
}

// Inicializar cuando se carga el módulo
const javiHomeRecommendations = new JAVIHomeRecommendations()

// Exponer globalmente para uso externo si es necesario
window.javiHomeRecommendations = javiHomeRecommendations

export default JAVIHomeRecommendations