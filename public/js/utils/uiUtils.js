/**
 * Utilidades para la interfaz de usuario
 * Maneja alertas, validaciones y otros elementos de UI
 */

class UIUtils {
  /**
   * Muestra una alerta en la interfaz
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de alerta (success, error, warning, info)
   * @param {number} duration - Duración en milisegundos (default: 4000)
   */
  static showAlert(message, type = "info", duration = 4000) {
    // Crear el elemento de alerta
    const alert = document.createElement("div")
    alert.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`

    // Definir colores según el tipo
    const colors = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500 text-white",
    }

    alert.className += ` ${colors[type] || colors.info}`
    alert.textContent = message

    // Agregar al DOM
    document.body.appendChild(alert)

    // Mostrar la alerta con animación
    setTimeout(() => {
      alert.classList.remove("translate-x-full")
    }, 100)

    // Remover después del tiempo especificado
    setTimeout(() => {
      alert.classList.add("translate-x-full")
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert)
        }
      }, 300)
    }, duration)
  }

  /**
   * Valida si un email tiene formato correcto
   * @param {string} email - Email a validar
   * @returns {boolean} True si es válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Valida si una contraseña cumple los requisitos mínimos
   * @param {string} password - Contraseña a validar
   * @returns {Object} Objeto con resultado de validación
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: [],
    }

    if (!password) {
      result.isValid = false
      result.errors.push("La contraseña es requerida")
      return result
    }

    if (password.length < 6) {
      result.isValid = false
      result.errors.push("La contraseña debe tener al menos 6 caracteres")
    }

    return result
  }

  /**
   * Agrega clase de error a un elemento de input
   * @param {HTMLElement} element - Elemento a marcar como error
   */
  static markAsError(element) {
    element.classList.add("border-red-500", "bg-red-50")
    element.classList.remove("border-gray-300")
  }

  /**
   * Remueve clase de error de un elemento de input
   * @param {HTMLElement} element - Elemento a limpiar
   */
  static clearError(element) {
    element.classList.remove("border-red-500", "bg-red-50")
    element.classList.add("border-gray-300")
  }

  /**
   * Muestra un indicador de carga en un botón
   * @param {HTMLElement} button - Botón a modificar
   * @param {string} loadingText - Texto durante la carga
   * @returns {Function} Función para restaurar el botón
   */
  static showButtonLoading(button, loadingText = "Cargando...") {
    const originalText = button.textContent
    const originalDisabled = button.disabled

    button.disabled = true
    button.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ${loadingText}
            </div>
        `

    // Retornar función para restaurar el botón
    return () => {
      button.disabled = originalDisabled
      button.textContent = originalText
    }
  }

  /**
   * Hace focus en el primer campo con error
   * @param {NodeList} elements - Lista de elementos a verificar
   */
  static focusFirstError(elements) {
    for (const element of elements) {
      if (element.classList.contains("border-red-500")) {
        element.focus()
        break
      }
    }
  }

  /**
   * Limpia todos los errores de un formulario
   * @param {HTMLElement} form - Formulario a limpiar
   */
  static clearFormErrors(form) {
    const inputs = form.querySelectorAll("input, select, textarea")
    inputs.forEach((input) => this.clearError(input))
  }

  /**
   * Obtiene los datos de un formulario como objeto
   * @param {HTMLElement} form - Formulario
   * @returns {Object} Datos del formulario
   */
  static getFormData(form) {
    const formData = new FormData(form)
    const data = {}
    for (const [key, value] of formData.entries()) {
      data[key] = value
    }
    return data
  }
}

// Hacer disponible globalmente
window.UIUtils = UIUtils

export default UIUtils
