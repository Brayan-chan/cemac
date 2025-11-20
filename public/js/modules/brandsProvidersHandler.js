/**
 * Manejador de marcas y proveedores
 * Gestiona la interfaz y funcionalidades de marcas y proveedores
 */
import { BrandsService } from '../services/brandsService.js';
import { SuppliersService } from '../services/suppliersService.js';

export class BrandsProvidersHandler {
  constructor() {
    this.brandsService = new BrandsService();
    this.suppliersService = new SuppliersService();
    this.currentView = 'brands'; // 'brands' o 'suppliers'
    this.currentBrands = [];
    this.currentSuppliers = [];
    this.searchTimeout = null;
    
    this.init();
  }

  async init() {
    console.log('🏭 Inicializando gestor de marcas y proveedores...');
    this.setupEventListeners();
    await this.loadInitialData();
  }

  setupEventListeners() {
    // Navegación entre pestañas
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-tab]')) {
        this.switchTab(e.target.dataset.tab);
      }

      // Botones de acción
      if (e.target.matches('[data-action]')) {
        this.handleAction(e.target.dataset.action, e.target);
      }

      // Botones específicos
      if (e.target.id === 'addBrandBtn') this.showBrandModal();
      if (e.target.id === 'addSupplierBtn') this.showSupplierModal();
    });

    // Búsqueda en tiempo real
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-search]')) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value, e.target.dataset.search);
        }, 500);
      }
    });

    // Submit de formularios
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'brandForm') {
        e.preventDefault();
        this.handleBrandSubmit(e.target);
      }
      if (e.target.id === 'supplierForm') {
        e.preventDefault();
        this.handleSupplierSubmit(e.target);
      }
    });
  }

  async loadInitialData() {
    await Promise.all([
      this.loadBrands(),
      this.loadSuppliers()
    ]);
  }

  switchTab(tabName) {
    // Actualizar estado de pestañas
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Mostrar/ocultar contenido
    document.querySelectorAll('[data-content]').forEach(content => {
      content.style.display = content.dataset.content === tabName ? 'block' : 'none';
    });

    this.currentView = tabName;
    console.log(`📋 Cambiando a vista: ${tabName}`);
  }

  async handleSearch(query, type) {
    console.log(`🔍 Buscando ${type}:`, query);
    
    if (type === 'brands') {
      await this.loadBrands({ search: query });
    } else if (type === 'suppliers') {
      await this.loadSuppliers({ search: query });
    }
  }

  async loadBrands(params = {}) {
    try {
      console.log('📦 Cargando marcas...', params);
      const container = document.getElementById('brandsContainer');
      if (!container) return;

      // Mostrar loading
      container.innerHTML = this.getLoadingHTML('Cargando marcas...');

      const response = await this.brandsService.getBrands(params);
      
      if (response.success) {
        this.currentBrands = response.brands;
        this.renderBrands(response.brands);
        this.updateBrandsStats(response);
      } else {
        container.innerHTML = this.getErrorHTML('Error cargando marcas');
      }
    } catch (error) {
      console.error('Error cargando marcas:', error);
      document.getElementById('brandsContainer').innerHTML = 
        this.getErrorHTML('Error de conexión al cargar marcas');
    }
  }

  async loadSuppliers(params = {}) {
    try {
      console.log('🚚 Cargando proveedores...', params);
      const container = document.getElementById('suppliersContainer');
      if (!container) return;

      // Mostrar loading
      container.innerHTML = this.getLoadingHTML('Cargando proveedores...');

      const response = await this.suppliersService.getSuppliers(params);
      
      if (response.success) {
        this.currentSuppliers = response.suppliers;
        this.renderSuppliers(response.suppliers);
        this.updateSuppliersStats(response);
      } else {
        container.innerHTML = this.getErrorHTML('Error cargando proveedores');
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      document.getElementById('suppliersContainer').innerHTML = 
        this.getErrorHTML('Error de conexión al cargar proveedores');
    }
  }

  renderBrands(brands) {
    const container = document.getElementById('brandsContainer');
    if (!container) return;

    if (brands.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('marcas', 'No se encontraron marcas');
      return;
    }

    container.innerHTML = brands.map(brand => `
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 text-lg mb-2">${brand.name}</h3>
            ${brand.description ? `<p class="text-gray-600 text-sm mb-3">${brand.description}</p>` : ''}
            <div class="flex items-center text-sm text-gray-500 space-x-4">
              <span class="flex items-center">
                <i class="fas fa-box mr-1"></i>
                ${brand.productCount} productos
              </span>
              <span class="flex items-center">
                <i class="fas fa-calendar mr-1"></i>
                ${this.formatDate(brand.createdAt)}
              </span>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button 
              data-action="viewBrandStats" 
              data-id="${brand.id}"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver estadísticas">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button 
              data-action="editBrand" 
              data-id="${brand.id}"
              class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Editar marca">
              <i class="fas fa-edit"></i>
            </button>
            <button 
              data-action="deleteBrand" 
              data-id="${brand.id}"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar marca"
              ${brand.productCount > 0 ? 'disabled' : ''}>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderSuppliers(suppliers) {
    const container = document.getElementById('suppliersContainer');
    if (!container) return;

    if (suppliers.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('proveedores', 'No se encontraron proveedores');
      return;
    }

    container.innerHTML = suppliers.map(supplier => `
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <h3 class="font-semibold text-gray-900 text-lg mr-3">${supplier.name}</h3>
              <span class="px-2 py-1 text-xs rounded-full ${supplier.isActive ? 
                'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${supplier.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            ${supplier.description ? `<p class="text-gray-600 text-sm mb-3">${supplier.description}</p>` : ''}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              ${supplier.contactName ? `
                <div class="flex items-center">
                  <i class="fas fa-user mr-2 w-4"></i>
                  <span>${supplier.contactName}</span>
                </div>
              ` : ''}
              ${supplier.email ? `
                <div class="flex items-center">
                  <i class="fas fa-envelope mr-2 w-4"></i>
                  <a href="mailto:${supplier.email}" class="text-blue-600 hover:underline">${supplier.email}</a>
                </div>
              ` : ''}
              ${supplier.phone ? `
                <div class="flex items-center">
                  <i class="fas fa-phone mr-2 w-4"></i>
                  <a href="tel:${supplier.phone}" class="text-blue-600 hover:underline">${supplier.phone}</a>
                </div>
              ` : ''}
              ${supplier.address ? `
                <div class="flex items-center">
                  <i class="fas fa-map-marker-alt mr-2 w-4"></i>
                  <span>${supplier.address}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="flex items-center text-sm text-gray-500 space-x-4 mt-3">
              <span class="flex items-center">
                <i class="fas fa-box mr-1"></i>
                ${supplier.productCount} productos
              </span>
              <span class="flex items-center">
                <i class="fas fa-calendar mr-1"></i>
                ${this.formatDate(supplier.createdAt)}
              </span>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button 
              data-action="viewSupplierStats" 
              data-id="${supplier.id}"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver estadísticas">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button 
              data-action="editSupplier" 
              data-id="${supplier.id}"
              class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Editar proveedor">
              <i class="fas fa-edit"></i>
            </button>
            <button 
              data-action="deleteSupplier" 
              data-id="${supplier.id}"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar proveedor"
              ${supplier.productCount > 0 ? 'disabled' : ''}>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async handleAction(action, element) {
    const id = element.dataset.id;
    
    try {
      switch (action) {
        case 'viewBrandStats':
          await this.viewBrandStats(id);
          break;
        case 'editBrand':
          await this.editBrand(id);
          break;
        case 'deleteBrand':
          await this.deleteBrand(id);
          break;
        case 'viewSupplierStats':
          await this.viewSupplierStats(id);
          break;
        case 'editSupplier':
          await this.editSupplier(id);
          break;
        case 'deleteSupplier':
          await this.deleteSupplier(id);
          break;
      }
    } catch (error) {
      console.error(`Error ejecutando acción ${action}:`, error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  async viewBrandStats(brandId) {
    console.log('📊 Mostrando estadísticas de marca:', brandId);
    try {
      const response = await this.brandsService.getBrandStats(brandId);
      if (response.success) {
        this.showStatsModal('brand', response);
      }
    } catch (error) {
      this.showNotification('Error cargando estadísticas', 'error');
    }
  }

  async viewSupplierStats(supplierId) {
    console.log('📊 Mostrando estadísticas de proveedor:', supplierId);
    try {
      const response = await this.suppliersService.getSupplierStats(supplierId);
      if (response.success) {
        this.showStatsModal('supplier', response);
      }
    } catch (error) {
      this.showNotification('Error cargando estadísticas', 'error');
    }
  }

  showStatsModal(type, data) {
    const entity = type === 'brand' ? data.brand : data.supplier;
    const stats = data.stats;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Estadísticas de ${entity.name}</h3>
          <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${stats.productCount}</div>
            <div class="text-sm text-blue-700">Total Productos</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${stats.activeProducts}</div>
            <div class="text-sm text-green-700">Productos Activos</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">${stats.totalStock}</div>
            <div class="text-sm text-yellow-700">Stock Total</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">$${stats.averagePrice}</div>
            <div class="text-sm text-purple-700">Precio Promedio</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-red-600">${stats.lowStockProducts}</div>
            <div class="text-sm text-red-700">Stock Bajo</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-gray-600">${stats.limitedProducts}/${stats.unlimitedProducts}</div>
            <div class="text-sm text-gray-700">Limitado/Ilimitado</div>
          </div>
        </div>
        
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-3">Información General</h4>
          <div class="space-y-2 text-sm">
            <div><strong>Creado:</strong> ${this.formatDate(entity.createdAt)}</div>
            <div><strong>Última actualización:</strong> ${this.formatDate(entity.updatedAt)}</div>
            ${entity.description ? `<div><strong>Descripción:</strong> ${entity.description}</div>` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  updateBrandsStats(response) {
    const statsContainer = document.getElementById('brandsStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="text-sm text-gray-600">
          Total: ${response.total} marcas encontradas
        </div>
      `;
    }
  }

  updateSuppliersStats(response) {
    const statsContainer = document.getElementById('suppliersStats');
    if (statsContainer) {
      const activeCount = response.suppliers.filter(s => s.isActive).length;
      const inactiveCount = response.total - activeCount;
      
      statsContainer.innerHTML = `
        <div class="text-sm text-gray-600">
          Total: ${response.total} proveedores 
          (${activeCount} activos, ${inactiveCount} inactivos)
        </div>
      `;
    }
  }

  getLoadingHTML(message) {
    return `
      <div class="flex items-center justify-center p-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600">${message}</p>
        </div>
      </div>
    `;
  }

  getErrorHTML(message) {
    return `
      <div class="flex items-center justify-center p-12">
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-600">${message}</p>
        </div>
      </div>
    `;
  }

  getEmptyStateHTML(type, message) {
    return `
      <div class="flex items-center justify-center p-12">
        <div class="text-center">
          <i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600 mb-4">${message}</p>
          <button class="btn-primary" onclick="window.brandsProvidersHandler.show${type.charAt(0).toUpperCase() + type.slice(1, -1)}Modal()">
            Agregar ${type.slice(0, -1)}
          </button>
        </div>
      </div>
    `;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    // Aquí puedes implementar un sistema de notificaciones más sofisticado
  }

  // Métodos de modal que serán implementados según las necesidades específicas
  showBrandModal() { console.log('🏭 Mostrar modal de marca'); }
  showSupplierModal() { console.log('🚚 Mostrar modal de proveedor'); }
  editBrand(id) { console.log('✏️ Editar marca:', id); }
  editSupplier(id) { console.log('✏️ Editar proveedor:', id); }
  deleteBrand(id) { console.log('🗑️ Eliminar marca:', id); }
  deleteSupplier(id) { console.log('🗑️ Eliminar proveedor:', id); }
  handleBrandSubmit(form) { console.log('📝 Submit marca'); }
  handleSupplierSubmit(form) { console.log('📝 Submit proveedor'); }
}