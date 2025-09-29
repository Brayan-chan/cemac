import { UserService } from "../services/userService.js"

class UserHandler {
  constructor() {
    this.userService = new UserService()
    this.users = []
    this.filteredUsers = []
    this.currentPage = 1
    this.usersPerPage = 10
    this.filters = {
      search: "",
      role: "",
      status: "",
    }
    this.isLoading = false
  }

  async init() {
    console.log("UserHandler inicializando...")

    if (!this.checkAuthentication()) {
      return
    }

    this.setupEventListeners()
    await this.loadUsers()

    console.log("UserHandler inicializado correctamente")
  }

  checkAuthentication() {
    if (!window.authService?.isAuthenticated()) {
      console.log("Usuario no autenticado, redirigiendo...")
      setTimeout(() => {
        window.location.href = "/index.html"
      }, 1000)
      return false
    }
    return true
  }

  setupEventListeners() {
    // Botón nuevo usuario
    const newUserBtn = document.getElementById("newUserBtn")
    if (newUserBtn) {
      newUserBtn.addEventListener("click", () => this.showCreateUserModal())
    }

    // Botón filtros
    const filtersBtn = document.getElementById("filtersBtn")
    if (filtersBtn) {
      filtersBtn.addEventListener("click", () => this.toggleFilters())
    }

    // Barra de búsqueda
    const searchInput = document.querySelector('input[placeholder="Search"]')
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filters.search = e.target.value.toLowerCase()
        this.applyFilters()
      })
    }
  }

  async loadUsers() {
    if (this.isLoading) return

    try {
      this.isLoading = true
      this.showLoadingState()

      console.log("Cargando usuarios...")
      const response = await this.userService.getAllUsers()

      if (response.success && response.users) {
        this.users = response.users
        this.filteredUsers = [...this.users]
        this.renderUsers()
        console.log("Usuarios cargados:", this.users.length)
      } else {
        throw new Error("Respuesta inválida del servidor")
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      this.showError("Error al cargar los usuarios: " + error.message)
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  }

  renderUsers() {
    const tbody = document.querySelector("table tbody")
    if (!tbody) return

    // Calcular paginación
    const startIndex = (this.currentPage - 1) * this.usersPerPage
    const endIndex = startIndex + this.usersPerPage
    const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex)

    if (paginatedUsers.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-2 block"></i>
                        No se encontraron usuarios
                    </td>
                </tr>
            `
      this.renderPagination()
      return
    }

    tbody.innerHTML = paginatedUsers
      .map(
        (user) => `
            <tr class="hover:bg-gray-50" data-user-id="${user.uid}">
                <td class="px-6 py-4 text-sm text-gray-900 font-mono">${user.uid.substring(0, 10)}...</td>
                <td class="px-6 py-4 text-sm text-gray-900">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${user.firstName} ${user.lastName}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }">
                        ${user.role === "admin" ? "Administrador" : "Empleado"}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }">
                        ${user.isActive ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button class="edit-user-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Editar usuario" data-user-id="${user.uid}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="toggle-status-btn p-2 ${user.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"} rounded-lg transition-colors" 
                                title="${user.isActive ? "Desactivar" : "Activar"} usuario" data-user-id="${user.uid}" data-current-status="${user.isActive}">
                            <i class="fas ${user.isActive ? "fa-user-slash" : "fa-user-check"}"></i>
                        </button>
                        <button class="change-role-btn p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" 
                                title="Cambiar rol" data-user-id="${user.uid}" data-current-role="${user.role}">
                            <i class="fas fa-user-cog"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")

    this.attachUserActionListeners()
    this.renderPagination()
  }

  attachUserActionListeners() {
    // Botones de editar
    document.querySelectorAll(".edit-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = e.currentTarget.dataset.userId
        this.showEditUserModal(userId)
      })
    })

    // Botones de cambiar estado
    document.querySelectorAll(".toggle-status-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = e.currentTarget.dataset.userId
        const currentStatus = e.currentTarget.dataset.currentStatus === "true"
        this.toggleUserStatus(userId, !currentStatus)
      })
    })

    // Botones de cambiar rol
    document.querySelectorAll(".change-role-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = e.currentTarget.dataset.userId
        const currentRole = e.currentTarget.dataset.currentRole
        this.showChangeRoleModal(userId, currentRole)
      })
    })
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage)
    const paginationContainer = document.querySelector(".bg-gray-50.px-6.py-4")

    if (!paginationContainer || totalPages <= 1) {
      if (paginationContainer) {
        paginationContainer.style.display = totalPages <= 1 ? "none" : "flex"
      }
      return
    }

    paginationContainer.style.display = "flex"

    const prevBtn = paginationContainer.querySelector("button:first-child")
    const nextBtn = paginationContainer.querySelector("button:last-child")
    const pageButtonsContainer = paginationContainer.querySelector(".flex.items-center.gap-1")

    // Actualizar botones prev/next
    prevBtn.disabled = this.currentPage === 1
    nextBtn.disabled = this.currentPage === totalPages

    prevBtn.onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.renderUsers()
      }
    }

    nextBtn.onclick = () => {
      if (this.currentPage < totalPages) {
        this.currentPage++
        this.renderUsers()
      }
    }

    // Generar botones de página
    let pageButtons = ""
    const maxVisiblePages = 5
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons += `
                <button class="w-8 h-8 rounded text-sm ${
                  i === this.currentPage ? "bg-[#8B7EC7] text-white font-medium" : "text-gray-500 hover:bg-gray-100"
                }" onclick="userHandler.goToPage(${i})">${i}</button>
            `
    }

    if (endPage < totalPages) {
      pageButtons += '<span class="text-gray-500 px-2">...</span>'
      pageButtons += `<button class="w-8 h-8 rounded text-sm text-gray-500 hover:bg-gray-100" onclick="userHandler.goToPage(${totalPages})">${totalPages}</button>`
    }

    pageButtonsContainer.innerHTML = pageButtons
  }

  goToPage(page) {
    this.currentPage = page
    this.renderUsers()
  }

  applyFilters() {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !this.filters.search ||
        user.email.toLowerCase().includes(this.filters.search) ||
        user.firstName.toLowerCase().includes(this.filters.search) ||
        user.lastName.toLowerCase().includes(this.filters.search)

      const matchesRole = !this.filters.role || user.role === this.filters.role
      const matchesStatus =
        !this.filters.status ||
        (this.filters.status === "active" && user.isActive) ||
        (this.filters.status === "inactive" && !user.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })

    this.currentPage = 1
    this.renderUsers()
  }

  async toggleUserStatus(userId, newStatus) {
    try {
      const user = this.users.find((u) => u.uid === userId)
      if (!user) return

      const action = newStatus ? "activar" : "desactivar"
      if (!confirm(`¿Estás seguro de que quieres ${action} al usuario "${user.firstName} ${user.lastName}"?`)) {
        return
      }

      console.log(`${action} usuario:`, userId)
      await this.userService.updateUserStatus(userId, newStatus)

      // Actualizar usuario local
      user.isActive = newStatus
      this.renderUsers()

      this.showSuccess(`Usuario ${action} exitosamente`)
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      this.showError("Error al cambiar el estado del usuario: " + error.message)
    }
  }

  showCreateUserModal() {
    // Crear modal dinámicamente
    const modal = this.createModal(
      "Crear Nuevo Usuario",
      `
            <form id="createUserForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="firstName" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input type="text" name="lastName" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" name="password" required minlength="6"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select name="role" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                        <option value="user">Empleado</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </form>
        `,
      [
        {
          text: "Cancelar",
          class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
          action: () => this.closeModal(),
        },
        {
          text: "Crear Usuario",
          class: "px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6FB8] transition-colors",
          action: () => this.handleCreateUser(),
        },
      ],
    )

    document.body.appendChild(modal)
  }

  async handleCreateUser() {
    const form = document.getElementById("createUserForm")
    const formData = new FormData(form)

    const userData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    }

    try {
      console.log("Creando usuario:", userData.email)
      await this.userService.createUser(userData)
      this.closeModal()
      await this.loadUsers()
      this.showSuccess("Usuario creado exitosamente")
    } catch (error) {
      console.error("Error al crear usuario:", error)
      this.showError("Error al crear usuario: " + error.message)
    }
  }

  showEditUserModal(userId) {
    const user = this.users.find((u) => u.uid === userId)
    if (!user) return

    const modal = this.createModal(
      "Editar Usuario",
      `
            <form id="editUserForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="firstName" value="${user.firstName}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input type="text" name="lastName" value="${user.lastName}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7EC7]">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value="${user.email}" disabled 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                    <p class="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                </div>
            </form>
        `,
      [
        {
          text: "Cancelar",
          class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
          action: () => this.closeModal(),
        },
        {
          text: "Guardar Cambios",
          class: "px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6FB8] transition-colors",
          action: () => this.handleEditUser(userId),
        },
      ],
    )

    document.body.appendChild(modal)
  }

  async handleEditUser(userId) {
    const form = document.getElementById("editUserForm")
    const formData = new FormData(form)

    const profileData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    }

    try {
      console.log("Actualizando perfil usuario:", userId)
      await this.userService.updateUserProfile(userId, profileData)
      this.closeModal()
      await this.loadUsers()
      this.showSuccess("Perfil actualizado exitosamente")
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      this.showError("Error al actualizar perfil: " + error.message)
    }
  }

  showChangeRoleModal(userId, currentRole) {
    const user = this.users.find((u) => u.uid === userId)
    if (!user) return

    const newRole = currentRole === "admin" ? "user" : "admin"
    const roleText = newRole === "admin" ? "Administrador" : "Empleado"

    const modal = this.createModal(
      "Cambiar Rol de Usuario",
      `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                    <i class="fas fa-user-cog text-purple-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">¿Cambiar rol del usuario?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Se cambiará el rol de <strong>${user.firstName} ${user.lastName}</strong> 
                    de <strong>${currentRole === "admin" ? "Administrador" : "Empleado"}</strong> 
                    a <strong>${roleText}</strong>
                </p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p class="text-xs text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-1"></i>
                        Este cambio afectará los permisos del usuario inmediatamente
                    </p>
                </div>
            </div>
        `,
      [
        {
          text: "Cancelar",
          class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
          action: () => this.closeModal(),
        },
        {
          text: "Cambiar Rol",
          class: "px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors",
          action: () => this.handleChangeRole(userId, newRole),
        },
      ],
    )

    document.body.appendChild(modal)
  }

  async handleChangeRole(userId, newRole) {
    try {
      console.log("Cambiando rol usuario:", userId, "a", newRole)
      await this.userService.updateUserRole(userId, newRole)
      this.closeModal()
      await this.loadUsers()
      this.showSuccess("Rol actualizado exitosamente")
    } catch (error) {
      console.error("Error al cambiar rol:", error)
      this.showError("Error al cambiar rol: " + error.message)
    }
  }

  createModal(title, content, buttons = []) {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">${title}</h2>
                </div>
                <div class="px-6 py-4">
                    ${content}
                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    ${buttons.map((btn) => `<button class="${btn.class}">${btn.text}</button>`).join("")}
                </div>
            </div>
        `

    // Agregar event listeners a los botones
    buttons.forEach((btn, index) => {
      const buttonElement = modal.querySelectorAll("button")[index]
      buttonElement.addEventListener("click", btn.action)
    })

    // Cerrar modal al hacer click fuera
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal()
      }
    })

    return modal
  }

  closeModal() {
    const modal = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-50")
    if (modal) {
      modal.remove()
    }
  }

  toggleFilters() {
    // Implementar panel de filtros si es necesario
    console.log("Toggle filters - Por implementar")
  }

  showLoadingState() {
    const tbody = document.querySelector("table tbody")
    if (tbody) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>
                        Cargando usuarios...
                    </td>
                </tr>
            `
    }
  }

  hideLoadingState() {
    // El estado de carga se oculta automáticamente al renderizar los usuarios
  }

  showSuccess(message) {
    this.showNotification(message, "success")
  }

  showError(message) {
    this.showNotification(message, "error")
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-100 text-green-800 border border-green-200"
        : type === "error"
          ? "bg-red-100 text-red-800 border border-red-200"
          : "bg-blue-100 text-blue-800 border border-blue-200"
    }`

    notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                  type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"
                } mr-2"></i>
                <span>${message}</span>
                <button class="ml-3 text-current hover:opacity-70" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  }
}

// Instancia global para acceso desde HTML
let userHandler

document.addEventListener("DOMContentLoaded", async () => {
  userHandler = new UserHandler()
  await userHandler.init()
})

export { UserHandler }
