/**
 * Sidebar Component
 * Componente reutilizable que maneja el sidebar y su estado en localStorage
 */

export class SidebarComponent {
    constructor() {
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.currentPath = window.location.pathname;
        
        // Aplicar estado inmediatamente para evitar parpadeo
        this.applyInitialStateToDocument();
        
        console.log('[Sidebar] Inicializando componente, estado:', this.isCollapsed ? 'colapsado' : 'expandido');
    }

    /**
     * Aplica el estado inicial al documento inmediatamente para evitar parpadeo
     */
    applyInitialStateToDocument() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar && mainContent) {
            if (this.isCollapsed) {
                sidebar.classList.remove('sidebar-expanded');
                sidebar.classList.add('sidebar-collapsed');
                mainContent.classList.remove('main-expanded');
                mainContent.classList.add('main-collapsed');
                
                // Ocultar textos si ya existen (aunque esto se aplicará después del mount)
                const sidebarTexts = document.querySelectorAll('.sidebar-text');
                sidebarTexts.forEach(text => text.classList.add('hidden'));
            } else {
                sidebar.classList.remove('sidebar-collapsed');
                sidebar.classList.add('sidebar-expanded');
                mainContent.classList.remove('main-collapsed');
                mainContent.classList.add('main-expanded');
                
                const sidebarTexts = document.querySelectorAll('.sidebar-text');
                sidebarTexts.forEach(text => text.classList.remove('hidden'));
            }
        }
    }

    /**
     * Inyecta el sidebar en un elemento contenedor
     * @param {HTMLElement|string} containerSelector - Elemento o selector CSS donde inyectar
     * @param {string} currentPage - Página actual para marcar como activa
     */
    mount(containerSelector = '#sidebar', currentPage = null) {
        console.log('[Sidebar] Montando componente...');
        
        let container;
        if (typeof containerSelector === 'string') {
            container = document.querySelector(containerSelector);
        } else {
            container = containerSelector;
        }

        if (!container) {
            console.error('[Sidebar] No se encontró el contenedor para el sidebar');
            return;
        }

        // Detectar página actual si no se proporciona
        if (!currentPage) {
            currentPage = this.detectCurrentPage();
        }

        // Generar HTML del sidebar con página activa marcada
        const sidebarHTML = this.generateSidebarHTML(currentPage);
        container.innerHTML = sidebarHTML;

        // Aplicar estado inicial
        this.applyInitialState();

        // Configurar event listeners
        this.setupEventListeners();

        console.log('[Sidebar] Componente montado correctamente');
        
        return {
            sidebar: container,
            mainContent: document.getElementById('mainContent'),
            toggleBtn: document.getElementById('toggleSidebar')
        };
    }

    /**
     * Genera el HTML del sidebar
     * @param {string} currentPage - Página actual
     */
    generateSidebarHTML(currentPage) {
        const menuItems = [
            { id: 'inicio', icon: 'fas fa-home', label: 'Inicio', href: '/views/dashboard/inicio.html' },
            { id: 'ventas', icon: 'fas fa-shopping-cart', label: 'Ventas', href: '/views/dashboard/ventas.html' },
            { id: 'inventario', icon: 'fas fa-boxes', label: 'Inventario', href: '/views/dashboard/inventario.html' },
            { id: 'analisis', icon: 'fas fa-chart-line', label: 'Análisis', href: '/views/dashboard/analisis.html' },
            { id: 'sugerencias', icon: 'fas fa-lightbulb', label: 'Sugerencias', href: '/views/dashboard/sugerencias.html' },
            { id: 'alertas', icon: 'fas fa-bell', label: 'Alertas', href: '/views/dashboard/alertas.html' },
            { id: 'buscar', icon: 'fas fa-search', label: 'Buscar', href: '/views/dashboard/buscar.html' }
        ];

        const menuItemsHTML = menuItems.map(item => {
            const isActive = currentPage === item.id;
            const activeClass = isActive ? 'bg-white/20' : 'text-white/80 hover:bg-white/10';
            const textClass = isActive ? 'text-white font-medium' : '';
            
            return `
                <div class="px-4">
                    <a href="${item.href}" class="flex items-center px-3 py-2 ${activeClass} rounded-lg cursor-pointer transition-colors">
                        <i class="${item.icon} text-white w-5"></i>
                        <span class="sidebar-text ml-3 ${textClass}">${item.label}</span>
                    </a>
                </div>
            `;
        }).join('');

        return `
            <nav class="sidebar-nav">
                <div class="px-4">
                    <button id="toggleSidebar" class="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors">
                        <i class="fas fa-bars text-white text-lg"></i>
                    </button>
                </div>
                
                <div class="sidebar-top">
                    ${menuItemsHTML}
                </div>
                
                <div class="sidebar-bottom">
                    <div class="px-4">
                        <a href="/index.html" class="flex items-center px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                            <i class="fas fa-sign-out-alt text-white w-5"></i>
                            <span class="sidebar-text ml-3">Salir</span>
                        </a>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Detecta la página actual basándose en la URL
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('inicio.html')) return 'inicio';
        if (path.includes('ventas.html')) return 'ventas';
        if (path.includes('inventario.html')) return 'inventario';
        if (path.includes('analisis.html')) return 'analisis';
        if (path.includes('sugerencias.html')) return 'sugerencias';
        if (path.includes('alertas.html')) return 'alertas';
        if (path.includes('buscar.html')) return 'buscar';
        
        return 'inicio'; // Default
    }

    /**
     * Aplica el estado inicial del sidebar basándose en localStorage
     */
    applyInitialState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');

        if (!sidebar || !mainContent) {
            console.error('[Sidebar] No se encontraron elementos principales');
            return;
        }

        // Deshabilitar transiciones temporalmente para evitar animaciones en carga inicial
        sidebar.classList.add('sidebar-no-transition');
        mainContent.classList.add('sidebar-no-transition');

        if (this.isCollapsed) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            mainContent.classList.remove('main-expanded');
            mainContent.classList.add('main-collapsed');
            sidebarTexts.forEach(text => text.classList.add('hidden'));
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            mainContent.classList.remove('main-collapsed');
            mainContent.classList.add('main-expanded');
            sidebarTexts.forEach(text => text.classList.remove('hidden'));
        }

        // Re-habilitar transiciones después de un pequeño delay
        setTimeout(() => {
            sidebar.classList.remove('sidebar-no-transition');
            mainContent.classList.remove('sidebar-no-transition');
        }, 50);

        console.log('[Sidebar] Estado inicial aplicado:', this.isCollapsed ? 'colapsado' : 'expandido');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Event listeners para navegación
        const navItems = document.querySelectorAll('nav .sidebar-top a, nav .sidebar-bottom a');
        navItems.forEach(item => {
            if (!item.href.includes('#')) {
                item.addEventListener('click', (e) => {
                    // Permitir navegación normal, el estado se preservará
                    console.log('[Sidebar] Navegando a:', item.href);
                });
            }
        });

        console.log('[Sidebar] Event listeners configurados');
    }

    /**
     * Alterna el estado del sidebar
     */
    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');

        if (this.isCollapsed) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            mainContent.classList.remove('main-expanded');
            mainContent.classList.add('main-collapsed');
            sidebarTexts.forEach(text => text.classList.add('hidden'));
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            mainContent.classList.remove('main-collapsed');
            mainContent.classList.add('main-expanded');
            sidebarTexts.forEach(text => text.classList.remove('hidden'));
        }

        // Guardar estado en localStorage
        localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());
        
        console.log('[Sidebar] Estado cambiado a:', this.isCollapsed ? 'colapsado' : 'expandido');
    }

    /**
     * Obtiene el estado actual del sidebar
     */
    getState() {
        return {
            isCollapsed: this.isCollapsed,
            currentPage: this.detectCurrentPage()
        };
    }

    /**
     * Establece el estado del sidebar programáticamente
     * @param {boolean} collapsed - Estado de colapso
     */
    setState(collapsed) {
        if (collapsed !== this.isCollapsed) {
            this.toggleSidebar();
        }
    }
}