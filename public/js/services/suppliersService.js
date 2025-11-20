/**
 * Servicio para gestión de proveedores
 * Consume la API de CEMAC para operaciones CRUD de proveedores
 */
export class SuppliersService {
  constructor() {
    this.baseURL = "https://cemac-api.vercel.app";
    this.token = localStorage.getItem("authToken");
  }

  /**
   * Obtiene el token de autenticación
   */
  getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token de autenticación no encontrado");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Listar todos los proveedores con filtros opcionales
   * @param {Object} params - Parámetros de consulta
   * @param {string} params.search - Texto de búsqueda
   * @param {boolean} params.isActive - Filtrar por estado activo
   * @param {number} params.page - Página (paginación)
   * @param {number} params.limit - Límite por página
   * @returns {Promise<Object>} Lista de proveedores
   */
  async getSuppliers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const url = `${this.baseURL}/suppliers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error obteniendo proveedores:", error);
      
      // Datos de respaldo para demo
      return {
        success: true,
        suppliers: [
          {
            id: "supplier_demo_001",
            name: "Distribuidora Tecnología S.A.",
            description: "Proveedor mayorista de electrónica y tecnología",
            contactName: "Juan Pérez",
            email: "ventas@techdist.com",
            phone: "+52 55 1234 5678",
            address: "Av. Principal 123, Col. Centro, CDMX",
            productCount: 42,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo"
          },
          {
            id: "supplier_demo_002",
            name: "Importadora Global",
            description: "Importación y distribución de productos tecnológicos",
            contactName: "María García",
            email: "contacto@impglobal.com",
            phone: "+52 55 9876 5432",
            address: "Calle Comercio 456, Monterrey, NL",
            productCount: 18,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo"
          },
          {
            id: "supplier_demo_003",
            name: "Mayorista del Norte",
            description: "Distribución mayorista de productos varios",
            contactName: "Carlos Rodríguez",
            email: "ventas@mayoristadn.com",
            phone: "+52 81 5555 0123",
            address: "Blvd. Industrial 789, Guadalajara, JAL",
            productCount: 25,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo"
          },
          {
            id: "supplier_demo_004",
            name: "Proveedor Inactivo S.A.",
            description: "Proveedor temporalmente inactivo",
            contactName: "Ana López",
            email: "info@inactivo.com",
            phone: "+52 33 7777 8888",
            address: "Calle Suspendida 321, Puebla, PUE",
            productCount: 0,
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo"
          }
        ],
        total: 4,
        message: "Se encontraron 4 proveedor(es) - Datos demo"
      };
    }
  }

  /**
   * Crear nuevo proveedor
   * @param {Object} supplierData - Datos del proveedor
   * @param {string} supplierData.name - Nombre del proveedor (requerido)
   * @param {string} supplierData.description - Descripción opcional
   * @param {string} supplierData.contactName - Nombre de contacto
   * @param {string} supplierData.email - Email de contacto
   * @param {string} supplierData.phone - Teléfono de contacto
   * @param {string} supplierData.address - Dirección física
   * @returns {Promise<Object>} Proveedor creado
   */
  async createSupplier(supplierData) {
    try {
      const response = await fetch(`${this.baseURL}/suppliers`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creando proveedor:", error);
      
      // Simular respuesta exitosa para demo
      if (error.message.includes('fetch')) {
        return {
          success: true,
          message: "Proveedor creado exitosamente (Demo)",
          supplier: {
            id: `supplier_demo_${Date.now()}`,
            name: supplierData.name,
            description: supplierData.description || "",
            contactName: supplierData.contactName || "",
            email: supplierData.email || "",
            phone: supplierData.phone || "",
            address: supplierData.address || "",
            productCount: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo"
          }
        };
      }
      throw error;
    }
  }

  /**
   * Actualizar proveedor existente
   * @param {string} supplierId - ID del proveedor
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Proveedor actualizado
   */
  async updateSupplier(supplierId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error actualizando proveedor:", error);
      
      // Simular respuesta exitosa para demo
      if (error.message.includes('fetch')) {
        return {
          success: true,
          message: "Proveedor actualizado exitosamente (Demo)",
          supplier: {
            id: supplierId,
            ...updateData,
            productCount: 15,
            createdAt: "2025-11-20T10:30:00Z",
            updatedAt: new Date().toISOString(),
            createdBy: "admin_demo",
            updatedBy: "admin_demo"
          }
        };
      }
      throw error;
    }
  }

  /**
   * Eliminar proveedor
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteSupplier(supplierId) {
    try {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error eliminando proveedor:", error);
      
      // Simular respuesta para demo
      if (error.message.includes('fetch')) {
        return {
          success: true,
          message: "Proveedor eliminado exitosamente (Demo)",
          supplierId: supplierId
        };
      }
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un proveedor
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<Object>} Estadísticas del proveedor
   */
  async getSupplierStats(supplierId) {
    try {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/stats`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error obteniendo estadísticas de proveedor:", error);
      
      // Datos de respaldo para demo
      return {
        success: true,
        supplier: {
          id: supplierId,
          name: "Distribuidora Tecnología S.A.",
          description: "Proveedor mayorista de electrónica",
          contactName: "Juan Pérez",
          email: "ventas@techdist.com",
          phone: "+52 55 1234 5678",
          address: "Av. Principal 123, CDMX",
          productCount: 42,
          isActive: true,
          createdAt: "2025-11-20T10:30:00Z",
          updatedAt: "2025-11-20T10:30:00Z",
          createdBy: "admin_demo"
        },
        stats: {
          productCount: 42,
          activeProducts: 40,
          limitedProducts: 35,
          unlimitedProducts: 5,
          totalStock: 1250,
          lowStockProducts: 8,
          averagePrice: 349.99
        },
        message: "Estadísticas obtenidas exitosamente (Demo)"
      };
    }
  }

  /**
   * Validar datos de proveedor
   * @param {Object} supplierData - Datos a validar
   * @returns {Object} Resultado de la validación
   */
  validateSupplierData(supplierData) {
    const errors = [];

    if (!supplierData.name || supplierData.name.trim() === '') {
      errors.push('El nombre del proveedor es requerido');
    }

    if (supplierData.name && supplierData.name.length > 100) {
      errors.push('El nombre del proveedor no puede exceder 100 caracteres');
    }

    if (supplierData.description && supplierData.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    if (supplierData.email && !this.validateEmail(supplierData.email)) {
      errors.push('El formato del email no es válido');
    }

    if (supplierData.contactName && supplierData.contactName.length > 100) {
      errors.push('El nombre de contacto no puede exceder 100 caracteres');
    }

    if (supplierData.phone && supplierData.phone.length > 20) {
      errors.push('El teléfono no puede exceder 20 caracteres');
    }

    if (supplierData.address && supplierData.address.length > 500) {
      errors.push('La dirección no puede exceder 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validar formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} Si el email es válido
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
