/**
 * Servicio de inventario
 * Maneja todas las operaciones CRUD para productos
 */

import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit, 
    startAfter, 
    where 
} from '../config/firebase.js';

class InventoryService {
    constructor() {
        this.collectionName = 'productos';
        this.pageSize = 6; // Como se ve en las imágenes
    }

    /**
     * Obtiene todos los productos con paginación
     * @param {number} page - Número de página
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Object} Lista de productos y metadata
     */
    async getProducts(page = 1, searchTerm = '') {
        try {
            console.log(`📦 Obteniendo productos - Página: ${page}, Búsqueda: "${searchTerm}"`);
            
            // Primero obtener el total de productos para calcular paginación correctamente
            let totalQuery = collection(db, this.collectionName);
            if (searchTerm) {
                totalQuery = query(
                    collection(db, this.collectionName),
                    where('nombre', '>=', searchTerm),
                    where('nombre', '<=', searchTerm + '\uf8ff')
                );
            }
            
            const totalSnapshot = await getDocs(totalQuery);
            const total = totalSnapshot.size;
            const totalPages = Math.ceil(total / this.pageSize);
            
            // Calcular offset para la página actual
            const offset = (page - 1) * this.pageSize;
            
            // Obtener todos los productos y luego hacer slice para simular paginación
            let q = query(
                collection(db, this.collectionName),
                orderBy('fechaCreacion', 'desc') // Ordenar por fecha de creación, más recientes primero
            );

            if (searchTerm) {
                q = query(
                    collection(db, this.collectionName),
                    where('nombre', '>=', searchTerm),
                    where('nombre', '<=', searchTerm + '\uf8ff'),
                    orderBy('nombre')
                );
            }

            const snapshot = await getDocs(q);
            const allProducts = [];
            
            snapshot.forEach((doc) => {
                allProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Aplicar paginación manual
            const products = allProducts.slice(offset, offset + this.pageSize);

            console.log(`✅ Productos obtenidos: ${products.length} de ${total} total`);
            
            return {
                products,
                currentPage: page,
                totalPages,
                total,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
                limit: this.pageSize
            };

        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw error;
        }
    }

    /**
     * Agrega un nuevo producto
     * @param {Object} productData - Datos del producto
     * @returns {string} ID del producto creado
     */
    async addProduct(productData) {
        try {
            console.log('➕ Agregando nuevo producto:', productData);
            
            // Generar código automático si no existe
            if (!productData.codigo) {
                productData.codigo = await this.generateProductCode();
            }

            // Agregar timestamp
            productData.fechaCreacion = new Date().toISOString();
            productData.fechaActualizacion = new Date().toISOString();

            const docRef = await addDoc(collection(db, this.collectionName), productData);
            
            console.log('✅ Producto agregado con ID:', docRef.id);
            return docRef.id;

        } catch (error) {
            console.error('❌ Error agregando producto:', error);
            throw error;
        }
    }

    /**
     * Actualiza un producto existente
     * @param {string} id - ID del producto
     * @param {Object} productData - Datos actualizados
     */
    async updateProduct(id, productData) {
        try {
            console.log('✏️ Actualizando producto:', id, productData);
            
            productData.fechaActualizacion = new Date().toISOString();
            
            await updateDoc(doc(db, this.collectionName, id), productData);
            
            console.log('✅ Producto actualizado exitosamente');

        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            throw error;
        }
    }

    /**
     * Elimina un producto
     * @param {string} id - ID del producto
     */
    async deleteProduct(id) {
        try {
            console.log('🗑️ Eliminando producto:', id);
            
            await deleteDoc(doc(db, this.collectionName, id));
            
            console.log('✅ Producto eliminado exitosamente');

        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            throw error;
        }
    }

    /**
     * Genera un código único para el producto
     * @returns {string} Código del producto
     */
    async generateProductCode() {
        try {
            const snapshot = await getDocs(collection(db, this.collectionName));
            const count = snapshot.size + 1;
            return `CODE${count.toString().padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generando código:', error);
            return `CODE${Date.now()}`;
        }
    }

    /**
     * Inicializa productos de ejemplo si la base está vacía
     */
    /**
     * Elimina todos los productos (para limpiar datos de ejemplo)
     */
    async clearAllProducts() {
        try {
            console.log('🗑️  Eliminando todos los productos...');
            
            const snapshot = await getDocs(collection(db, this.collectionName));
            const deletePromises = [];
            
            snapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, this.collectionName, docSnapshot.id)));
            });
            
            await Promise.all(deletePromises);
            console.log(`✅ ${deletePromises.length} productos eliminados`);
            
        } catch (error) {
            console.error('❌ Error eliminando productos:', error);
            throw error;
        }
    }

    /**
     * Inicializa datos de ejemplo (solo si se llama explícitamente)
     */
    async initializeSampleData() {
        try {
            console.log('📚 Inicializando datos de ejemplo...');
            
            const sampleProducts = [
                {
                    codigo: 'CODE0001',
                    nombre: 'Libretas de cuadros',
                    descripcion: 'Libretas Básicas para útiles escolares',
                    categoria: 'Papelería Básica',
                    precio: 6.0,
                    stock: 20,
                    disponible: true
                },
                {
                    codigo: 'CODE0002',
                    nombre: 'Libretas de cuadros chicos',
                    descripcion: 'Libretas Básicas para útiles escolares',
                    categoria: 'Papelería Básica',
                    precio: 6.0,
                    stock: 20,
                    disponible: true
                },
                {
                    codigo: 'CODE0003',
                    nombre: 'Juego de Geometría',
                    descripcion: 'Juego de geometría Básica para útiles escolares',
                    categoria: 'Escolar',
                    precio: 8.50,
                    stock: 150,
                    disponible: true
                },
                {
                    codigo: 'CODE0004',
                    nombre: 'Paquete de lápiz marca bic',
                    descripcion: 'Paquete de lápiz barca bic multicolor',
                    categoria: 'Oficina',
                    precio: 5.50,
                    stock: 20,
                    disponible: true
                },
                {
                    codigo: 'CODE0005',
                    nombre: 'Paquete de 100 hojas',
                    descripcion: 'Paquete de marca office (hoja delgada)',
                    categoria: 'Oficina',
                    precio: 5200,
                    stock: 220,
                    disponible: true
                },
                {
                    codigo: 'CODE0006',
                    nombre: 'Paquete de colores mapita',
                    descripcion: 'Colores indispensable para padres tacaños',
                    categoria: 'Oficina',
                    precio: 8.45,
                    stock: 200,
                    disponible: true
                }
            ];

            for (const product of sampleProducts) {
                await this.addProduct(product);
            }

            console.log('✅ Datos de ejemplo inicializados');
        } catch (error) {
            console.error('❌ Error inicializando datos:', error);
        }
    }
}

// Crear instancia global
window.inventoryService = new InventoryService();

export default InventoryService;