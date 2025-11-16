/**
 * User Menu Handler
 * Maneja la lógica interactiva del user menu en todas las páginas
 */

import { UserMenuComponent } from '../components/userMenuComponent.js';

export class UserMenuHandler {
    constructor(containerSelector = '#userMenuContainer') {
        console.log('[v0] Inicializando UserMenuHandler...');
        
        this.component = new UserMenuComponent();
        this.elements = this.component.mount(containerSelector);
        
        if (this.elements) {
            this.initializeEventListeners();
            console.log('[v0] UserMenuHandler inicializado correctamente');
        }
    }

    /**
     * Inicializa los event listeners del dropdown
     */
    initializeEventListeners() {
        const { userMenuBtn, userDropdown, viewProfileLink, manageUsersLink, logoutLink } = this.elements;

        // Toggle dropdown al hacer clic en el botón
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                console.log('[v0] Click en userMenuBtn');
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
        }

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.add('hidden');
                console.log('[v0] Dropdown cerrado por click externo');
            }
        });

        // Ver perfil
        if (viewProfileLink) {
            viewProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[v0] Acción: Ver perfil');
                // TODO: Implementar página de perfil
                userDropdown.classList.add('hidden');
            });
        }

        // Gestionar usuarios
        if (manageUsersLink) {
            manageUsersLink.addEventListener('click', (e) => {
                e.preventDefault();
                const user = this.component.getCurrentUser();
                console.log('[v0] Acción: Gestionar usuarios');
                
                // Solo administradores pueden gestionar usuarios
                if (this.component.isAdmin()) {
                    window.location.href = '/views/admin/users.html';
                } else {
                    alert('Solo administradores pueden gestionar usuarios');
                }
                userDropdown.classList.add('hidden');
            });
        }

        // Cerrar sesión
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[v0] Acción: Cerrar sesión');
                this.logout();
            });
        }
    }

    /**
     * Cierra la sesión del usuario
     */
    logout() {
        console.log('[v0] Cerrando sesión...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }

    /**
     * Actualiza dinámicamente el nombre del usuario (útil si cambia durante la sesión)
     */
    updateUserDisplay() {
        this.component.updateUserDisplayName();
    }

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser() {
        return this.component.getCurrentUser();
    }

    /**
     * Verifica si es administrador
     */
    isAdmin() {
        return this.component.isAdmin();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[v0] Inicializando UserMenuHandler desde el módulo...');
    
    // Verificar que no se haya inicializado ya
    if (!window.userMenuInitialized) {
        new UserMenuHandler('#userMenuContainer');
        window.userMenuInitialized = true;
    }
});
