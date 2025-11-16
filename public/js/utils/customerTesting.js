/**
 * Utilidad de testing para clientes
 * Permite probar la funcionalidad desde la consola del navegador
 */
window.testCustomerAPI = {
  
  /**
   * Probar creación de cliente directamente
   */
  async testCreateCustomer(firstName = "Test", lastName = "Usuario") {
    console.log("🧪 Probando creación de cliente...")
    
    try {
      const customerService = window.customerHandler.customerService
      
      const testData = {
        firstName: firstName,
        lastName: lastName,
        phone: "+58 424 1234567",
        notes: "Cliente de prueba creado desde testing"
      }
      
      console.log("📤 Enviando datos:", testData)
      const response = await customerService.createCustomer(testData)
      console.log("📨 Respuesta recibida:", response)
      
      return response
    } catch (error) {
      console.error("❌ Error en test:", error)
      throw error
    }
  },

  /**
   * Mostrar estructura de un cliente existente
   */
  showExistingCustomer() {
    const customers = window.customerHandler.allCustomers
    if (customers && customers.length > 0) {
      console.log("📋 Ejemplo de cliente existente:", customers[0])
      return customers[0]
    } else {
      console.log("📭 No hay clientes cargados")
      return null
    }
  },

  /**
   * Probar búsqueda de clientes
   */
  async testSearchCustomers(query = "test") {
    console.log("🔍 Probando búsqueda de clientes...")
    
    try {
      const customerService = window.customerHandler.customerService
      const results = await customerService.searchCustomers(query)
      console.log("📋 Resultados de búsqueda:", results)
      return results
    } catch (error) {
      console.error("❌ Error en búsqueda:", error)
      throw error
    }
  }
}

console.log("🧪 Testing utils cargadas. Usa:")
console.log("  - testCustomerAPI.testCreateCustomer('Nombre', 'Apellido')")
console.log("  - testCustomerAPI.showExistingCustomer()")
console.log("  - testCustomerAPI.testSearchCustomers('query')")