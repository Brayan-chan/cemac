/**
 * Sidebar Handler
 * Maneja la lógica interactiva del sidebar en todas las páginas
 */

import { SidebarComponent } from '../components/sidebarComponent.js';

export class SidebarHandler {
    constructor(containerSelector = '#sidebar') {
        console.log('[SidebarHandler] Inicializando...');
        
        this.component = new SidebarComponent();
        this.elements = this.component.mount(containerSelector);
        
        if (this.elements) {
            this.initializeAdditionalFeatures();
            console.log('[SidebarHandler] Inicializado correctamente');
        }
    }

    /**
     * Inicializa características adicionales del sidebar
     */
    initializeAdditionalFeatures() {
        // Manejar logout
        this.setupLogoutHandler();
        
        // Manejar navegación activa
        this.setupNavigationHighlight();
        
        // Escuchar cambios de ventana para mantener estado
        this.setupWindowListeners();
    }

    /**
     * Configura el manejo del logout
     */
    setupLogoutHandler() {
        const logoutLink = document.querySelector('a[href="/index.html"]');
        
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Limpiar localStorage de autenticación
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                // Mantener el estado del sidebar para futuras sesiones
                
                console.log('[SidebarHandler] Cerrando sesión...');
                window.location.href = '/index.html';
            });
        }
    }

    /**
     * Configura el destacado de navegación
     */
    setupNavigationHighlight() {
        // Esta funcionalidad ya se maneja en el componente
        // pero podemos agregar efectos adicionales aquí
        const navLinks = document.querySelectorAll('nav .sidebar-top a');
        
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                if (!link.classList.contains('bg-white/20')) {
                    link.style.transform = 'translateX(2px)';
                }
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateX(0)';
            });
        });
    }

    /**
     * Configura listeners de ventana
     */
    setupWindowListeners() {
        // Escuchar cambios de foco para sincronizar estado
        window.addEventListener('focus', () => {
            // Recargar estado desde localStorage en caso de cambios en otras pestañas
            const storedState = localStorage.getItem('sidebarCollapsed') === 'true';
            if (storedState !== this.component.isCollapsed) {
                this.component.setState(storedState);
            }
        });

        // Manejar resize de ventana
        window.addEventListener('resize', () => {
            // En pantallas pequeñas, colapsar automáticamente
            if (window.innerWidth < 768 && !this.component.isCollapsed) {
                this.component.toggleSidebar();
            }
        });
    }

    /**
     * Obtiene el estado actual del sidebar
     */
    getState() {
        return this.component.getState();
    }

    /**
     * Establece el estado del sidebar
     * @param {boolean} collapsed - Estado de colapso
     */
    setState(collapsed) {
        this.component.setState(collapsed);
    }

    /**
     * Alterna el estado del sidebar programáticamente
     */
    toggle() {
        this.component.toggleSidebar();
    }

    /**
     * Actualiza la página activa del sidebar
     * @param {string} page - ID de la página activa
     */
    updateActivePage(page) {
        // Re-montar el componente con la nueva página activa
        this.component.mount('#sidebar', page);
        this.initializeAdditionalFeatures();
    }
}

// Auto-inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('[SidebarHandler] Auto-inicializando...');
    
    // Verificar que no se haya inicializado ya
    if (!window.sidebarInitialized) {
        window.sidebarHandler = new SidebarHandler('#sidebar');
        window.sidebarInitialized = true;
    }
});

// Exportar para uso manual si es necesario
export default SidebarHandler;