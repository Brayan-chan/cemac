/**
 * Testing de flujo completo de ventas
 * Permite probar desde la consola todo el proceso de venta
 */
window.testSalesFlow = {
  
  /**
   * Test completo del flujo de ventas
   */
  async testFullSalesFlow() {
    console.log("🧪 === INICIANDO TEST COMPLETO DE VENTAS ===")
    
    try {
      // 1. Verificar estado inicial
      console.log("1️⃣ Verificando estado inicial...")
      console.log("  - Productos en venta actual:", window.salesHandler.currentSale.products.length)
      console.log("  - Cliente seleccionado:", window.customerHandler.selectedCustomer?.firstName || "Ninguno")
      
      // 2. Simular selección de cliente (usar Raul Salinas de la imagen)
      console.log("2️⃣ Simulando selección de cliente...")
      if (window.customerHandler.allCustomers.length > 0) {
        const testCustomer = window.customerHandler.allCustomers[0]
        window.customerHandler.selectCustomer(testCustomer)
        console.log("  ✅ Cliente seleccionado:", testCustomer.firstName)
      } else {
        console.log("  ❌ No hay clientes disponibles")
        return false
      }
      
      // 3. Buscar y seleccionar producto
      console.log("3️⃣ Simulando búsqueda de productos...")
      const searchResults = await window.salesHandler.searchProducts("producto")
      console.log("  - Productos encontrados:", searchResults.length)
      
      if (searchResults.length > 0) {
        const testProduct = searchResults[0]
        console.log("  - Seleccionando producto:", testProduct.name)
        window.salesHandler.selectProduct(testProduct)
        console.log("  ✅ Producto agregado")
      } else {
        console.log("  ❌ No se encontraron productos")
        return false
      }
      
      // 4. Verificar que el producto se agregó
      console.log("4️⃣ Verificando productos en venta...")
      const productCount = window.salesHandler.currentSale.products.length
      console.log("  - Total productos:", productCount)
      
      if (productCount === 0) {
        console.log("  ❌ ERROR: No se agregó ningún producto")
        return false
      }
      
      // 5. Mostrar estado antes de procesar venta
      console.log("5️⃣ Estado antes de procesar venta:")
      console.log("  - Cliente:", window.salesHandler.currentSale.cliente)
      console.log("  - Productos:", window.salesHandler.currentSale.products)
      console.log("  - Estadísticas cliente antes:", {
        compras: window.customerHandler.selectedCustomer?.totalPurchases || 0,
        gastado: window.customerHandler.selectedCustomer?.totalSpent || 0
      })
      
      // 6. NO ejecutar la venta real, solo validar que podría funcionar
      console.log("6️⃣ Validación final (sin ejecutar venta real):")
      
      if (window.salesHandler.currentSale.products.length > 0) {
        console.log("  ✅ La venta PASARÍA la validación de productos")
      } else {
        console.log("  ❌ La venta FALLARÍA por falta de productos")
      }
      
      if (window.salesHandler.currentSale.cliente) {
        console.log("  ✅ La venta PASARÍA la validación de cliente")
      } else {
        console.log("  ❌ La venta FALLARÍA por falta de cliente")
      }
      
      console.log("🎉 === TEST COMPLETADO EXITOSAMENTE ===")
      return true
      
    } catch (error) {
      console.error("❌ Error en test de flujo de ventas:", error)
      return false
    }
  },

  /**
   * Test específico de agregar producto
   */
  async testAddProduct() {
    console.log("🧪 Testing agregar producto...")
    
    try {
      // Buscar productos
      const results = await window.salesHandler.searchProducts("test")
      console.log("Productos encontrados:", results.length)
      
      if (results.length > 0) {
        const beforeCount = window.salesHandler.currentSale.products.length
        console.log("Productos antes:", beforeCount)
        
        window.salesHandler.selectProduct(results[0])
        
        const afterCount = window.salesHandler.currentSale.products.length
        console.log("Productos después:", afterCount)
        
        if (afterCount > beforeCount) {
          console.log("✅ Producto agregado exitosamente")
          return true
        } else {
          console.log("❌ El producto NO se agregó")
          return false
        }
      } else {
        console.log("❌ No hay productos para probar")
        return false
      }
    } catch (error) {
      console.error("❌ Error agregando producto:", error)
      return false
    }
  },

  /**
   * Mostrar estado actual del sistema
   */
  showCurrentState() {
    console.log("📊 === ESTADO ACTUAL DEL SISTEMA ===")
    console.log("Cliente seleccionado:", window.customerHandler.selectedCustomer)
    console.log("Productos en venta:", window.salesHandler.currentSale.products)
    console.log("Total productos:", window.salesHandler.currentSale.products.length)
    console.log("Total clientes cargados:", window.customerHandler.allCustomers.length)
  },

  /**
   * Limpiar venta actual
   */
  clearCurrentSale() {
    console.log("🧹 Limpiando venta actual...")
    window.salesHandler.resetSale(false)
    window.customerHandler.clearCustomer()
    console.log("✅ Venta limpiada")
  },

  /**
   * Debug de contadores
   */
  debugCounters() {
    window.salesHandler.debugCounters()
  }
}

console.log("🧪 Sales Testing Tools cargadas. Usa:")
console.log("  - testSalesFlow.testFullSalesFlow() - Test completo")
console.log("  - testSalesFlow.testAddProduct() - Test agregar producto")
console.log("  - testSalesFlow.showCurrentState() - Ver estado actual")
console.log("  - testSalesFlow.clearCurrentSale() - Limpiar venta")
console.log("  - testSalesFlow.debugCounters() - Debug contadores")