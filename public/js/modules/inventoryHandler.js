import { InventoryService } from '/js/services/inventoryService.js';

class InventoryHandler {
    constructor() {
        // Verificar autenticación usando el mismo método que authService
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        this.inventoryService = new InventoryService();
        this.currentFilters = {
            category: '',
            price: '',
            availability: '',
            page: 1,
            limit: 10,
            sort: 'createdAt',
            order: 'desc'
        };
        this.totalPages = 1;
        this.products = [];
        
        this.initializeEventListeners();
        this.loadProducts();
    }

    initializeEventListeners() {
        // Filtros
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.loadProducts();
        });

        document.getElementById('priceFilter')?.addEventListener('change', (e) => {
            this.currentFilters.price = e.target.value;
            this.loadProducts();
        });

        document.getElementById('availabilityFilter')?.addEventListener('change', (e) => {
            this.currentFilters.availability = e.target.value;
            this.loadProducts();
        });

        // Botón de añadir producto
        document.getElementById('addProductButton')?.addEventListener('click', () => {
            this.showAddProductModal();
        });

        // Paginación
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentFilters.page > 1) {
                this.currentFilters.page--;
                this.loadProducts();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (this.currentFilters.page < this.totalPages) {
                this.currentFilters.page++;
                this.loadProducts();
            }
        });

        // Formulario de añadir/editar producto
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                category: formData.get('category'),
                price: parseFloat(formData.get('price')),
                promotionalPrice: parseFloat(formData.get('promotionalPrice')) || null,
                stock: parseInt(formData.get('stock')),
                availability: formData.get('availability'),
                image: formData.get('image')
            };

            const productId = formData.get('productId');
            if (productId) {
                this.updateProduct(productId, productData);
            } else {
                this.createProduct(productData);
            }
        });
    }

    async loadProducts() {
        try {
            const products = await this.inventoryService.getProducts(this.currentFilters);
            this.products = products;
            this.renderProducts();
            this.updatePagination();
        } catch (error) {
            console.error('Error al cargar productos:', error);
            if (error.message.includes('401')) {
                // Si el error es de autenticación, redirigir al login
                localStorage.removeItem('authData');
                window.location.href = '/index.html';
            } else {
                this.showError('Error al cargar los productos. Por favor, intenta de nuevo.');
            }
        }
    }

    renderProducts() {
        const productsList = document.getElementById('productsList');
        if (!productsList) return;

        productsList.innerHTML = this.products.map(product => `
            <div class="product-card bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.name}" 
                             class="w-20 h-20 object-cover rounded-lg">
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-medium">${product.name}</h3>
                        <p class="text-sm text-gray-600">${product.description}</p>
                        <div class="mt-2 flex items-center space-x-4">
                            <span class="text-sm font-medium">$${product.price.toFixed(2)}</span>
                            ${product.promotionalPrice ? 
                              `<span class="text-sm text-red-600">$${product.promotionalPrice.toFixed(2)}</span>` : ''}
                            <span class="text-sm ${product.stock > 10 ? 'text-green-600' : 'text-red-600'}">
                                Stock: ${product.stock}
                            </span>
                        </div>
                    </div>
                    <div class="flex-shrink-0">
                        <button onclick="inventoryHandler.showEditProductModal('${product.id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="inventoryHandler.deleteProduct('${product.id}')"
                                class="ml-2 text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = `
            <button id="prevPage" class="pagination-button" ${this.currentFilters.page <= 1 ? 'disabled' : ''}>
                Anterior
            </button>
            <span>Página ${this.currentFilters.page} de ${this.totalPages}</span>
            <button id="nextPage" class="pagination-button" 
                    ${this.currentFilters.page >= this.totalPages ? 'disabled' : ''}>
                Siguiente
            </button>
        `;
    }

    async createProduct(productData) {
        try {
            await this.inventoryService.createProduct(productData);
            this.loadProducts();
            this.hideModal();
            this.showSuccess('Producto creado exitosamente');
        } catch (error) {
            console.error('Error al crear producto:', error);
            this.showError('Error al crear el producto');
        }
    }

    async updateProduct(productId, productData) {
        try {
            await this.inventoryService.updateProduct(productId, productData);
            this.loadProducts();
            this.hideModal();
            this.showSuccess('Producto actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            this.showError('Error al actualizar el producto');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

        try {
            await this.inventoryService.deleteProduct(productId);
            this.loadProducts();
            this.showSuccess('Producto eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            this.showError('Error al eliminar el producto');
        }
    }

    showAddProductModal() {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        if (!modal || !form) return;

        form.reset();
        form.removeAttribute('data-product-id');
        modal.classList.remove('hidden');
    }

    async showEditProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        if (!modal || !form) return;

        form.elements.name.value = product.name;
        form.elements.description.value = product.description;
        form.elements.category.value = product.category;
        form.elements.price.value = product.price;
        form.elements.promotionalPrice.value = product.promotionalPrice || '';
        form.elements.stock.value = product.stock;
        form.elements.availability.value = product.availability;
        form.setAttribute('data-product-id', productId);

        modal.classList.remove('hidden');
    }

    hideModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showSuccess(message) {
        // Implementar notificación de éxito
        alert(message); // Temporal, mejorar con una notificación más elegante
    }

    showError(message) {
        // Implementar notificación de error
        alert(message); // Temporal, mejorar con una notificación más elegante
    }
}

// Inicializar el manejador cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryHandler = new InventoryHandler();
});