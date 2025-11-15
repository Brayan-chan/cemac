/**
 * Manejador de login para empleados
 * Gestiona la autenticación de usuarios con rol "user"
 */

class EmployeeLoginHandler {
  constructor() {
    this.emailInput = null
    this.passwordInput = null
    this.submitButton = null
    this.loadingOverlay = null
  }

  init() {
    console.log("[EMPLOYEE LOGIN] Inicializando...")
    this.setupElements()
    this.setupEventListeners()
    this.checkAuthStatus()
  }

  setupElements() {
    this.emailInput = document.getElementById("email")
    this.passwordInput = document.getElementById("password")
    this.submitButton = document.querySelector('button[type="submit"]')
    this.loadingOverlay = document.getElementById("loadingOverlay")

    if (!this.emailInput || !this.passwordInput || !this.submitButton) {
      console.error("[EMPLOYEE LOGIN] Elementos del formulario no encontrados")
      return false
    }

    console.log("[EMPLOYEE LOGIN] Elementos configurados correctamente")
    return true
  }

  setupEventListeners() {
    if (!this.submitButton) return

    // Click en botón de submit
    this.submitButton.addEventListener("click", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Enter en los inputs
    ;[this.emailInput, this.passwordInput].forEach((input) => {
      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            this.handleLogin()
          }
        })
      }
    })

    console.log("[EMPLOYEE LOGIN] Event listeners configurados")
  }

  async handleLogin() {
    const email = this.emailInput.value.trim()
    const password = this.passwordInput.value.trim()

    // Validación de campos
    if (!email || !password) {
      this.showError("Por favor, completa todos los campos")
      return
    }

    // Validación de formato de email
    if (!this.isValidEmail(email)) {
      this.showError("Por favor, ingresa un correo válido")
      return
    }

    this.setLoadingState(true)

    try {
      console.log("[EMPLOYEE LOGIN] Intentando login para:", email)

      // Llamar al servicio de autenticación
      const result = await window.authService.login(email, password)

      if (result.success) {
        console.log("[EMPLOYEE LOGIN] Respuesta de login recibida:", result)

        // VALIDAR ROL ANTES DE CUALQUIER ACCIÓN
        if (!result.user || result.user.role !== "user") {
          console.log("❌ Usuario no es empleado, rol:", result.user?.role)
          
          // Mensaje específico según el rol
          if (result.user && result.user.role === "admin") {
            this.showError("Esta cuenta tiene permisos de administrador. Usa el login de administradores.")
          } else {
            this.showError("Esta cuenta no tiene permisos de empleado. Contacta al administrador.")
          }
          
          // Limpiar cualquier dato que se haya podido guardar
          window.authService.clearSession()
          return
        }

        // Verificar que la cuenta esté activa
        if (result.user.isActive === false) {
          console.log("❌ Cuenta de empleado desactivada")
          this.showError("Tu cuenta está desactivada. Contacta al administrador.")
          window.authService.clearSession()
          return
        }

        // Solo aquí mostramos éxito y redirigimos
        console.log("✅ Empleado autenticado correctamente")
        const userName = result.user.firstName || result.user.email || 'Empleado'
        this.showSuccess(`¡Bienvenido ${userName}! Redirigiendo...`)

        // Redirigir al dashboard después de 1.5 segundos
        setTimeout(() => {
          window.location.href = "/views/dashboard/inicio.html"
        }, 1500)
      } else {
        console.error("[EMPLOYEE LOGIN] Login fallido:", result.error)
        this.showError(result.error || "Credenciales inválidas")
      }
    } catch (error) {
      console.error("[EMPLOYEE LOGIN] Error en handleLogin:", error)
      this.showError("Error de conexión. Verifica tu conexión a internet.")
    } finally {
      this.setLoadingState(false)
    }
  }

  checkAuthStatus() {
    // Verificar si ya hay una sesión activa
    if (window.authService && window.authService.isAuthenticated()) {
      const user = window.authService.getUser()

      if (user && user.role === "user") {
        console.log("[EMPLOYEE LOGIN] Usuario empleado ya autenticado, redirigiendo...")
        window.location.href = "/views/dashboard/inicio.html"
      } else if (user && user.role === "admin") {
        // Si es admin, cerrar sesión y permitir login de empleado
        console.log("[EMPLOYEE LOGIN] Usuario admin detectado, cerrando sesión para permitir login de empleado...")
        window.authService.clearSession()
        this.showError("Sesión de administrador detectada. Inicia sesión como empleado.")
      } else {
        // Si no tiene rol válido, limpiar sesión
        console.log("[EMPLOYEE LOGIN] Usuario sin rol válido, limpiando sesión...")
        window.authService.clearSession()
      }
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  setLoadingState(loading) {
    if (this.submitButton) {
      this.submitButton.disabled = loading
      this.submitButton.textContent = loading ? "Iniciando..." : "Iniciar"
    }
    ;[this.emailInput, this.passwordInput].forEach((input) => {
      if (input) input.disabled = loading
    })

    if (this.loadingOverlay) {
      if (loading) {
        this.loadingOverlay.classList.remove("hidden")
      } else {
        this.loadingOverlay.classList.add("hidden")
      }
    }
  }

  showSuccess(message) {
    console.log("[EMPLOYEE LOGIN] Éxito:", message)
    this.showMessage(message, "success")
  }

  showError(message) {
    console.error("[EMPLOYEE LOGIN] Error:", message)
    this.showMessage(message, "error")
  }

  showMessage(message, type) {
    let messageContainer = document.getElementById("message-container")

    if (!messageContainer) {
      messageContainer = document.createElement("div")
      messageContainer.id = "message-container"
      messageContainer.className = "fixed top-4 right-4 z-50 max-w-md"
      document.body.appendChild(messageContainer)
    }

    const messageEl = document.createElement("div")
    let bgClass, icon

    switch (type) {
      case "success":
        bgClass = "bg-green-100 border border-green-400 text-green-700"
        icon = "✓"
        break
      case "error":
        bgClass = "bg-red-100 border border-red-400 text-red-700"
        icon = "✕"
        break
      default:
        bgClass = "bg-gray-100 border border-gray-400 text-gray-700"
        icon = "ℹ"
    }

    messageEl.className = `px-4 py-3 rounded-lg shadow-lg mb-2 flex items-center gap-2 ${bgClass}`
    messageEl.innerHTML = `<span class="font-bold">${icon}</span><span>${message}</span>`

    messageContainer.appendChild(messageEl)

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.opacity = "0"
        messageEl.style.transition = "opacity 0.3s"
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl)
          }
        }, 300)
      }
    }, 5000)
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const employeeLoginHandler = new EmployeeLoginHandler()
  employeeLoginHandler.init()
})

export default EmployeeLoginHandler