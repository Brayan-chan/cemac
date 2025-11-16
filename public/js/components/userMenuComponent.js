/**
 * User Menu Component
 * Componente reutilizable que inyecta el user menu dinámico en todas las páginas
 */

export class UserMenuComponent {
    constructor() {
        this.userMenuHTML = `
            <div class="relative">
                <button id="userMenuBtn" class="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <span id="userDisplayName" class="text-sm font-medium text-gray-700">Cargando...</span>
                    <i class="fas fa-chevron-down text-xs text-gray-500"></i>
                </button>
                
                <!-- Dropdown Menu -->
                <div id="userDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-100">
                    <div class="py-1">
                        <a href="#" id="viewProfileLink" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <i class="far fa-user-circle w-5"></i>
                            <span>Ver perfil</span>
                        </a>
                        <a href="#" id="manageUsersLink" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-users-cog w-5"></i>
                            <span>Gestionar usuarios</span>
                        </a>
                        <hr class="my-1 border-gray-100">
                        <a href="#" id="logoutLink" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-sign-out-alt w-5"></i>
                            <span>Cerrar sesión</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Inyecta el user menu en un elemento contenedor
     * @param {HTMLElement|string} containerSelector - Elemento o selector CSS donde inyectar
     */
    mount(containerSelector) {
        console.log('Montando UserMenuComponent...');
        
        let container;
        if (typeof containerSelector === 'string') {
            container = document.querySelector(containerSelector);
        } else {
            container = containerSelector;
        }

        if (!container) {
            console.error('No se encontró el contenedor para UserMenuComponent');
            return;
        }

        // Inyectar HTML
        container.innerHTML = this.userMenuHTML;
        console.log('HTML del user menu inyectado');

        // Actualizar nombre del usuario desde localStorage
        this.updateUserDisplayName();

        // Retornar objeto con métodos para acceder a elementos
        return {
            userMenuBtn: document.getElementById('userMenuBtn'),
            userDropdown: document.getElementById('userDropdown'),
            userDisplayName: document.getElementById('userDisplayName'),
            viewProfileLink: document.getElementById('viewProfileLink'),
            manageUsersLink: document.getElementById('manageUsersLink'),
            logoutLink: document.getElementById('logoutLink')
        };
    }

    /**
     * Actualiza el nombre del usuario mostrado desde localStorage
     */
    updateUserDisplayName() {
        const userDisplayName = document.getElementById('userDisplayName');
        if (!userDisplayName) return;

        try {
            let user = null;
            
            // Primero intentar obtener del authService si está disponible
            if (window.authService) {
                user = window.authService.getUser();
            } else {
                // Si no hay authService, usar localStorage
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    user = JSON.parse(userJson);
                }
            }

            if (user) {
                let displayName;
                if (user.firstName && user.lastName) {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    // Si el nombre completo es muy largo, mostramos solo el primer nombre y la inicial del apellido
                    if (fullName.length > 20) {
                        displayName = `${user.firstName} ${user.lastName.charAt(0)}.`;
                    } else {
                        displayName = fullName;
                    }
                } else if (user.email) {
                    // Si no hay nombre, usamos el email pero lo acortamos
                    const email = user.email;
                    const atIndex = email.indexOf('@');
                    displayName = atIndex > 0 ? email.substring(0, atIndex) : email;
                } else {
                    displayName = 'Usuario';
                }
                
                userDisplayName.textContent = displayName;
                console.log('Nombre de usuario actualizado:', displayName);
            } else {
                userDisplayName.textContent = 'Invitado';
                console.log('No hay usuario disponible');
            }
        } catch (error) {
            console.error('Error al actualizar nombre de usuario:', error);
            userDisplayName.textContent = 'Usuario';
        }
    }

    /**
     * Obtiene la información del usuario actual
     */
    getCurrentUser() {
        if (window.authService) {
            return window.authService.getUser();
        } else {
            try {
                const userJson = localStorage.getItem('user');
                return userJson ? JSON.parse(userJson) : null;
            } catch (error) {
                console.error('Error al obtener usuario actual:', error);
                return null;
            }
        }
    }

    /**
     * Obtiene el nombre a mostrar del usuario con formato optimizado
     */
    getDisplayName(user) {
        if (!user) return 'Usuario';

        let displayName;
        if (user.firstName && user.lastName) {
            const fullName = `${user.firstName} ${user.lastName}`;
            // Si el nombre completo es muy largo, mostramos solo el primer nombre y la inicial del apellido
            if (fullName.length > 20) {
                displayName = `${user.firstName} ${user.lastName.charAt(0)}.`;
            } else {
                displayName = fullName;
            }
        } else if (user.email) {
            // Si no hay nombre, usamos el email pero lo acortamos
            const email = user.email;
            const atIndex = email.indexOf('@');
            displayName = atIndex > 0 ? email.substring(0, atIndex) : email;
        } else {
            displayName = 'Usuario';
        }
        
        return displayName;
    }

    /**
     * Verifica si el usuario es administrador
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
}
