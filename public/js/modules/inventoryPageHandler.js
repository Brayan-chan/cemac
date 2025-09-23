/**
 * Manejador de la página de inventario
 * Controla toda la lógica de la interfaz de inventario
 */

class InventoryPageHandler {
    constructor() {
        this.currentPage = 1;
        this.searchTerm = '';
        this.selectedProduct = null;
        this.isModalOpen = false;
    }

    /**
     * Inicializa la página de inventario
     */
    async init() {
        console.log('📦 Inicializando página de inventario...');
        
        // Verificar autenticación
        if (!window.authService?.isAuthenticated()) {
            console.log('❌ Usuario no autenticado');
            window.location.href = '../../index.html';
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar productos
        await this.loadProducts();
        
        console.log('✅ Página de inventario inicializada');
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Botón agregar producto
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddProductModal());
        }

        // Botón limpiar todos los productos
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllProducts());
        }

        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim();
                this.debounceSearch();
            });
        }

        // Modal - cerrar
        const modal = document.getElementById('productModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // Formulario de producto
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Checkbox de stock ilimitado
        const stockUnlimited = document.getElementById('disponible');
        const stockInput = document.getElementById('stock');
        if (stockUnlimited && stockInput) {
            stockUnlimited.addEventListener('change', () => {
                if (stockUnlimited.checked) {
                    stockInput.value = '';
                    stockInput.placeholder = '∞';
                    stockInput.disabled = true;
                } else {
                    stockInput.disabled = false;
                    stockInput.placeholder = '0';
                }
            });
        }

        // Toggle sidebar
        this.setupSidebarToggle();

        console.log('✅ Event listeners configurados');
    }

    /**
     * Carga y muestra los productos
     */
    async loadProducts() {
        try {
            console.log('📥 Cargando productos...');
            
            this.showLoadingState();
            
            const result = await window.inventoryService.getProducts(this.currentPage, this.searchTerm);
            
            this.renderProducts(result.products);
            this.renderPagination(result);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            UIUtils.showAlert('Error cargando productos', 'error');
        }
    }

    /**
     * Renderiza la lista de productos
     * @param {Array} products - Lista de productos
     */
    renderProducts(products) {
        const container = document.getElementById('productsList');
        if (!container) {
            console.error('❌ Contenedor de productos no encontrado');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-400 text-lg">
                        ${this.searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                    </div>
                    <button onclick="inventoryPageHandler.openAddProductModal()" 
                            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Agregar primer producto
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <!-- Imagen del producto -->
                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <i class="fas fa-image text-gray-400 text-2xl"></i>
                </div>
                
                <!-- Información del producto -->
                <div class="space-y-2">
                    <div class="flex justify-between items-start">
                        <h3 class="font-semibold text-gray-900 text-sm">${product.nombre}</h3>
                        <div class="flex space-x-1">
                            <button onclick="inventoryPageHandler.editProduct('${product.id}')" 
                                    class="text-blue-500 hover:text-blue-700 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="inventoryPageHandler.deleteProduct('${product.id}')" 
                                    class="text-red-500 hover:text-red-700 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <p class="text-xs text-gray-600">${product.categoria || 'Sin categoría'}</p>
                    <p class="text-xs text-gray-500 line-clamp-2">${product.descripcion || ''}</p>
                    
                    <div class="flex justify-between items-center pt-2">
                        <div class="text-sm">
                            <span class="font-medium text-green-600">$${product.precio?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="text-xs text-gray-500">
                            ${product.stock === -1 ? '∞ unidades disponibles' : `${product.stock || 0} unidades disponibles`}
                        </div>
                    </div>
                    
                    <div class="text-xs text-gray-400">
                        ${product.codigo || 'Sin código'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderiza la paginación
     * @param {Object} result - Resultado con metadata de paginación
     */
    renderPagination(result) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const { hasPrevious, hasNext, currentPage, totalPages, total } = result;

        // Solo mostrar paginación si hay más de una página
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="flex items-center justify-center space-x-4">
                <button id="prevPageBtn" class="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" ${!hasPrevious ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left mr-2"></i>
                    Previous
                </button>
                
                <span class="text-sm text-gray-500">
                    Página ${currentPage} de ${totalPages}
                </span>
                
                <button id="nextPageBtn" class="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" ${!hasNext ? 'disabled' : ''}>
                    Next
                    <i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        // Agregar event listeners para los botones de paginación
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn && hasPrevious) {
            prevBtn.addEventListener('click', () => {
                this.currentPage--;
                this.loadProducts();
            });
        }

        if (nextBtn && hasNext) {
            nextBtn.addEventListener('click', () => {
                this.currentPage++;
                this.loadProducts();
            });
        }
    }

    /**
     * Muestra estado de carga
     */
    showLoadingState() {
        const container = document.getElementById('productsList');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <div class="text-gray-500 mt-2">Cargando productos...</div>
                </div>
            `;
        }
    }

    /**
     * Búsqueda con debounce
     */
    debounceSearch() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadProducts();
        }, 300);
    }

    /**
     * Abre el modal para agregar producto
     */
    openAddProductModal() {
        this.selectedProduct = null;
        this.openModal('Agregar producto');
        this.clearForm();
    }

    /**
     * Limpia todos los productos (útil para eliminar datos de ejemplo)
     */
    async clearAllProducts() {
        try {
            const confirmed = confirm('¿Estás seguro de que quieres eliminar TODOS los productos? Esta acción no se puede deshacer.');
            if (!confirmed) return;

            await window.inventoryService.clearAllProducts();
            UIUtils.showAlert('Todos los productos han sido eliminados', 'success');
            this.currentPage = 1;
            await this.loadProducts();

        } catch (error) {
            console.error('Error eliminando todos los productos:', error);
            UIUtils.showAlert('Error eliminando productos', 'error');
        }
    }

    /**
     * Configura el toggle del sidebar
     */
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('toggleSidebar');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const paginationContainer = document.getElementById('paginationContainer');
        
        if (!toggleBtn || !sidebar || !mainContent) return;

        // Estado inicial del sidebar (expandido por defecto)
        let isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        // Aplicar estado inicial
        this.updateSidebarState(isCollapsed, sidebar, mainContent, paginationContainer);

        // Toggle button click handler
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            this.updateSidebarState(isCollapsed, sidebar, mainContent, paginationContainer);
        });
    }

    /**
     * Actualiza el estado del sidebar y ajusta la paginación
     */
    updateSidebarState(isCollapsed, sidebar, mainContent, paginationContainer) {
        if (isCollapsed) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            mainContent.classList.remove('main-expanded');
            mainContent.classList.add('main-collapsed');
            if (paginationContainer) {
                paginationContainer.classList.remove('pagination-expanded');
                paginationContainer.classList.add('pagination-collapsed');
            }
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            mainContent.classList.remove('main-collapsed');
            mainContent.classList.add('main-expanded');
            if (paginationContainer) {
                paginationContainer.classList.remove('pagination-collapsed');
                paginationContainer.classList.add('pagination-expanded');
            }
        }
    }

    /**
     * Edita un producto
     * @param {string} productId - ID del producto
     */
    async editProduct(productId) {
        try {
            // Por ahora, simplemente mostrar alerta
            UIUtils.showAlert('Funcionalidad de edición próximamente', 'info');
        } catch (error) {
            console.error('Error editando producto:', error);
            UIUtils.showAlert('Error editando producto', 'error');
        }
    }

    /**
     * Elimina un producto
     * @param {string} productId - ID del producto
     */
    async deleteProduct(productId) {
        try {
            const confirmed = confirm('¿Estás seguro de que quieres eliminar este producto?');
            if (!confirmed) return;

            await window.inventoryService.deleteProduct(productId);
            UIUtils.showAlert('Producto eliminado exitosamente', 'success');
            await this.loadProducts();

        } catch (error) {
            console.error('Error eliminando producto:', error);
            UIUtils.showAlert('Error eliminando producto', 'error');
        }
    }

    /**
     * Abre el modal
     * @param {string} title - Título del modal
     */
    openModal(title) {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
            this.isModalOpen = true;
        }
    }

    /**
     * Cierra el modal
     */
    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.add('hidden');
            this.isModalOpen = false;
            this.selectedProduct = null;
        }
    }

    /**
     * Limpia el formulario
     */
    clearForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            
            // Restaurar estado inicial del checkbox de stock
            const stockUnlimited = document.getElementById('disponible');
            const stockInput = document.getElementById('stock');
            
            if (stockUnlimited && stockInput) {
                stockUnlimited.checked = true;
                stockInput.value = '';
                stockInput.placeholder = '∞';
                stockInput.disabled = true;
            }
        }
    }

    /**
     * Maneja el envío del formulario
     * @param {Event} e - Evento del formulario
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            
            // Validar campos requeridos
            const nombre = formData.get('nombre')?.trim();
            const precio = formData.get('precio');
            const categoria = formData.get('categoria');
            
            if (!nombre) {
                UIUtils.showAlert('El nombre del producto es requerido', 'error');
                return;
            }
            
            if (!precio || precio <= 0) {
                UIUtils.showAlert('El precio debe ser mayor a 0', 'error');
                return;
            }
            
            if (!categoria) {
                UIUtils.showAlert('La categoría es requerida', 'error');
                return;
            }
            
            // Preparar datos del producto
            const stockUnlimited = document.getElementById('disponible').checked;
            const stockValue = formData.get('stock');
            
            const productData = {
                nombre: nombre,
                descripcion: formData.get('descripcion')?.trim() || '',
                categoria: categoria,
                precio: parseFloat(precio),
                stock: stockUnlimited ? -1 : parseInt(stockValue) || 0, // -1 significa ilimitado
                disponible: true, // Por ahora siempre disponible
                fechaCreacion: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString()
            };

            console.log('💾 Guardando producto:', productData);

            // Mostrar estado de carga
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Guardando...';
            submitBtn.disabled = true;

            try {
                if (this.selectedProduct) {
                    productData.fechaActualizacion = new Date().toISOString();
                    await window.inventoryService.updateProduct(this.selectedProduct.id, productData);
                    UIUtils.showAlert('Producto actualizado exitosamente', 'success');
                } else {
                    await window.inventoryService.addProduct(productData);
                    UIUtils.showAlert('Producto agregado exitosamente', 'success');
                    // Ir a la primera página para ver el producto recién agregado
                    this.currentPage = 1;
                }

                this.closeModal();
                await this.loadProducts();
            } finally {
                // Restaurar estado del botón
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }

        } catch (error) {
            console.error('Error guardando producto:', error);
            UIUtils.showAlert('Error guardando producto: ' + error.message, 'error');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Página de inventario cargada');
    
    window.inventoryPageHandler = new InventoryPageHandler();
    await window.inventoryPageHandler.init();
});

export default InventoryPageHandler;