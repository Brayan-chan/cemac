/**
 * Manejador del dashboard
 * Controla la lógica del dashboard incluyendo logout, verificación de auth, etc.
 */

class DashboardHandler {
  constructor() {
    this.userInfo = null
  }

  /**
   * Inicializa el dashboard
   */
  async init() {
    console.log("🏠 Inicializando dashboard...")

    // Verificar autenticación
    if (!this.checkAuthentication()) {
      return
    }

    // Cargar información del usuario
    this.loadUserInfo()

    // Configurar event listeners
    this.setupEventListeners()

    console.log("✅ Dashboard inicializado correctamente")
  }

  /**
   * Verifica si el usuario está autenticado
   */
  checkAuthentication() {
    if (!window.authService?.isAuthenticated()) {
      console.log("❌ Usuario no autenticado, redirigiendo al login...")
      if (window.UIUtils) {
        window.UIUtils.showAlert("Sesión expirada. Redirigiendo al login...", "warning")
      }
      setTimeout(() => {
        window.location.href = "../../index.html"
      }, 2000)
      return false
    }
    return true
  }

  /**
   * Carga la información del usuario en la interfaz
   */
  loadUserInfo() {
    const user = window.authService?.getUser()
    if (user) {
      this.userInfo = user
      console.log("👤 Usuario cargado:", user)

      // Actualizar elementos de la interfaz
      this.updateUserDisplay(user)
    }
  }

  /**
   * Actualiza la visualización del usuario en el dashboard
   * @param {Object} user - Información del usuario
   */
  updateUserDisplay(user) {
    // Actualizar nombre del usuario
    const userNameElement = document.querySelector(".user-name")
    if (userNameElement && user.email) {
      userNameElement.textContent = user.firstName || user.email.split("@")[0] || "Usuario"
    }

    // Actualizar email del usuario
    const userEmailElement = document.querySelector(".user-email")
    if (userEmailElement && user.email) {
      userEmailElement.textContent = user.email
    }

    console.log("✅ Información del usuario actualizada en la interfaz")
  }

  /**
   * Configura todos los event listeners del dashboard
   */
  setupEventListeners() {
    // Event listeners para botones de logout
    this.setupLogoutButtons()

    // Event listeners para navegación
    this.setupNavigation()

    // Event listeners para dropdown del usuario
    this.setupUserDropdown()
  }

  /**
   * Configura los botones de logout
   */
  setupLogoutButtons() {
    // Botón de logout en el sidebar
    const sidebarLogoutBtn = document.querySelector('a[href="../../index.html"]')
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.handleLogout()
      })
    }

    // Botón de logout en el dropdown
    const dropdownLogoutBtn = document.querySelector(".logout-btn")
    if (dropdownLogoutBtn) {
      dropdownLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.handleLogout()
      })
    }

    console.log("✅ Botones de logout configurados")
  }

  /**
   * Maneja el proceso de logout
   */
  async handleLogout() {
    console.log("🚪 Iniciando proceso de logout...")

    try {
      // Mostrar confirmación
      const confirmed = confirm("¿Estás seguro de que quieres cerrar sesión?")
      if (!confirmed) {
        console.log("❌ Logout cancelado por el usuario")
        return
      }

      // Mostrar mensaje de despedida
      if (window.UIUtils) {
        window.UIUtils.showAlert("Cerrando sesión...", "info", 2000)
      }

      // Realizar logout
      await window.authService.logout()
    } catch (error) {
      console.error("❌ Error durante el logout:", error)
      if (window.UIUtils) {
        window.UIUtils.showAlert("Error al cerrar sesión", "error")
      }

      // Forzar logout local aunque falle el servidor
      window.authService.clearSession()
      window.location.href = "../../index.html"
    }
  }

  /**
   * Configura la navegación del dashboard
   */
  setupNavigation() {
    // Aquí se pueden agregar event listeners para la navegación
    // Por ejemplo, para manejar la navegación SPA si fuera necesario
    console.log("🧭 Navegación configurada")
  }

  /**
   * Configura el dropdown del usuario
   */
  setupUserDropdown() {
    const userMenuBtn = document.getElementById("userMenuBtn")
    const userDropdown = document.getElementById("userDropdown")

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        userDropdown.classList.toggle("hidden")
      })

      // Cerrar dropdown al hacer click fuera
      document.addEventListener("click", () => {
        userDropdown.classList.add("hidden")
      })

      // Prevenir que el dropdown se cierre al hacer click dentro
      userDropdown.addEventListener("click", (e) => {
        e.stopPropagation()
      })

      console.log("✅ Dropdown del usuario configurado")
    }
  }

  /**
   * Verifica periódicamente la autenticación
   */
  startAuthCheck() {
    setInterval(() => {
      this.checkAuthentication()
    }, 300000) // Verificar cada 5 minutos
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 Dashboard cargado")

  const dashboardHandler = new DashboardHandler()
  await dashboardHandler.init()

  // Iniciar verificación periódica de autenticación
  dashboardHandler.startAuthCheck()

  // Hacer disponible globalmente para debugging
  window.dashboardHandler = dashboardHandler
})

export default DashboardHandler
