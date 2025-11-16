/**
 * Sidebar Preloader
 * Script que se ejecuta inmediatamente para evitar parpadeo del sidebar
 * Debe cargarse ANTES que el DOM esté completamente listo
 */

(function() {
    'use strict';
    
    console.log('[SidebarPreloader] Inicializando...');
    
    // Función para aplicar el estado inmediatamente
    function applyInitialSidebarState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        // Función que aplicará las clases una vez que los elementos estén disponibles
        function applySidebarClasses() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            if (sidebar && mainContent) {
                console.log('[SidebarPreloader] Aplicando estado inicial:', isCollapsed ? 'colapsado' : 'expandido');
                
                if (isCollapsed) {
                    sidebar.classList.remove('sidebar-expanded');
                    sidebar.classList.add('sidebar-collapsed');
                    mainContent.classList.remove('main-expanded');
                    mainContent.classList.add('main-collapsed');
                } else {
                    sidebar.classList.remove('sidebar-collapsed');
                    sidebar.classList.add('sidebar-expanded');
                    mainContent.classList.remove('main-collapsed');
                    mainContent.classList.add('main-expanded');
                }
                
                return true; // Éxito
            }
            return false; // Elementos no encontrados
        }
        
        // Intentar aplicar inmediatamente
        if (applySidebarClasses()) {
            return;
        }
        
        // Si no funcionó, esperar un poco y volver a intentar
        const observer = new MutationObserver(function(mutations) {
            if (applySidebarClasses()) {
                observer.disconnect();
                console.log('[SidebarPreloader] Estado aplicado con observer');
            }
        });
        
        // Observar cambios en el DOM
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        // Timeout de seguridad para desconectar el observer
        setTimeout(() => {
            observer.disconnect();
            console.log('[SidebarPreloader] Observer desconectado por timeout');
        }, 2000);
    }
    
    // Ejecutar inmediatamente si el documento ya está cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyInitialSidebarState);
    } else {
        applyInitialSidebarState();
    }
    
    console.log('[SidebarPreloader] Configurado correctamente');
})();