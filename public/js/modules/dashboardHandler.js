class DashboardHandler {
  constructor() {
    this.userInfo = null
    this.userRole = null
  }

  async init() {
    console.log("[DASHBOARD] Inicializando...")

    if (!this.checkAuthentication()) {
      return
    }

    this.loadUserInfo()
    this.setupEventListeners()
    this.applyRoleBasedPermissions()

    console.log("[DASHBOARD] Inicializado correctamente")
  }

  checkAuthentication() {
    if (!window.authService?.isAuthenticated()) {
      console.log("[DASHBOARD] Usuario no autenticado, redirigiendo...")
      setTimeout(() => {
        window.location.href = "/index.html"
      }, 1000)
      return false
    }

    // Verificar que el usuario tenga un rol válido
    const user = window.authService.getUser()
    if (!user || !user.role || (user.role !== 'admin' && user.role !== 'user')) {
      console.log("[DASHBOARD] Usuario sin rol válido, redirigiendo al login...")
      window.authService.clearSession()
      setTimeout(() => {
        window.location.href = "/index.html"
      }, 1000)
      return false
    }

    // Verificar que la cuenta esté activa
    if (user.isActive === false) {
      console.log("[DASHBOARD] Usuario con cuenta desactivada, cerrando sesión...")
      alert("Tu cuenta está desactivada. Contacta al administrador.")
      window.authService.logout()
      return false
    }

    console.log("[DASHBOARD] Usuario autenticado correctamente:", user.email, "- Rol:", user.role)
    return true
  }

  loadUserInfo() {
    const user = window.authService?.getUser()
    if (user) {
      this.userInfo = user
      this.userRole = user.role
      console.log("[DASHBOARD] Usuario cargado:", user)
      console.log("[DASHBOARD] Rol del usuario:", this.userRole)
      this.updateUserDisplay(user)
    }
  }

  updateUserDisplay(user) {
    // Actualizar nombre de usuario en el header
    const userNameElement = document.querySelector(".user-name")
    if (userNameElement) {
      const displayName =
        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email
      userNameElement.textContent = displayName
    }

    // Actualizar badge de rol si existe
    const roleBadge = document.querySelector(".user-role-badge")
    if (roleBadge) {
      const roleText = user.role === "admin" ? "Administrador" : "Empleado"
      const roleClass = user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
      roleBadge.textContent = roleText
      roleBadge.className = `user-role-badge px-2 py-1 rounded-full text-xs font-medium ${roleClass}`
    }
  }

  applyRoleBasedPermissions() {
    if (this.userRole === "user") {
      console.log("[DASHBOARD] Aplicando restricciones para empleado")

      // Ocultar o deshabilitar elementos solo para administradores
      const adminOnlyElements = document.querySelectorAll('[data-admin-only="true"]')
      adminOnlyElements.forEach((element) => {
        element.style.display = "none"
      })

      // Deshabilitar acciones de administrador
      const adminActions = document.querySelectorAll('[data-role-required="admin"]')
      adminActions.forEach((element) => {
        element.disabled = true
        element.classList.add("opacity-50", "cursor-not-allowed")
        element.title = "Requiere permisos de administrador"
      })
    } else {
      console.log("[DASHBOARD] Usuario con permisos de administrador")
    }
  }

  hasPermission(requiredRole) {
    if (requiredRole === "admin") {
      return this.userRole === "admin"
    }
    return true // Todos tienen acceso a funciones básicas
  }

  setupEventListeners() {
    // Botón de logout en sidebar
    const sidebarLogoutBtn = document.querySelector('a[href="/index.html"]')
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.handleLogout()
      })
    }

    // Todos los botones de logout
    const logoutButtons = document.querySelectorAll('[data-action="logout"]')
    logoutButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        this.handleLogout()
      })
    })
  }

  async handleLogout() {
    try {
      console.log("[DASHBOARD] Cerrando sesión...")
      await window.authService?.logout()
    } catch (error) {
      console.error("[DASHBOARD] Error en logout:", error)
      // Forzar redirección incluso si hay error
      window.location.href = "/index.html"
    }
  }

  getUserInfo() {
    return this.userInfo
  }

  getUserRole() {
    return this.userRole
  }

  isAdmin() {
    return this.userRole === "admin"
  }

  isEmployee() {
    return this.userRole === "user"
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  const dashboardHandler = new DashboardHandler()
  await dashboardHandler.init()

  // Hacer disponible globalmente para otros módulos
  window.dashboardHandler = dashboardHandler
})

export default DashboardHandler