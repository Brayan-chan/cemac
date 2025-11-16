/**
 * Herramienta de diagnóstico para la API de Customers
 */
export class ApiDiagnostic {
  constructor() {
    this.baseURL = "https://cemac-api.vercel.app"
  }

  /**
   * Verificar si el token existe y es válido
   */
  checkAuthToken() {
    const token = localStorage.getItem("authToken")
    console.log("🔍 Verificación del token:")
    console.log("  - Token existe:", !!token)
    if (token) {
      console.log("  - Longitud del token:", token.length)
      console.log("  - Primeros 20 chars:", token.substring(0, 20) + "...")
      
      try {
        // Intentar decodificar si es JWT
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          console.log("  - Payload JWT:", payload)
          console.log("  - Expiración:", new Date(payload.exp * 1000))
        }
      } catch (e) {
        console.log("  - No es un JWT válido:", e.message)
      }
    }
    return !!token
  }

  /**
   * Probar conectividad básica con la API
   */
  async testAPIConnectivity() {
    console.log("🌐 Probando conectividad con la API...")
    
    try {
      // Test básico sin autenticación
      const response = await fetch(`${this.baseURL}/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      })
      
      console.log("  - Status:", response.status)
      console.log("  - API disponible:", response.ok)
      
      return response.ok
    } catch (error) {
      console.error("  - Error de conectividad:", error)
      return false
    }
  }

  /**
   * Probar endpoint de customers específicamente
   */
  async testCustomersEndpoint() {
    console.log("👥 Probando endpoint de customers...")
    
    const token = localStorage.getItem("authToken")
    if (!token) {
      console.error("  - No hay token de autenticación")
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/customers?limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      })

      console.log("  - Status:", response.status)
      console.log("  - Headers:", Object.fromEntries(response.headers))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("  - Error response:", errorText)
        return false
      }

      const data = await response.json()
      console.log("  - Response data:", data)
      return true
    } catch (error) {
      console.error("  - Error en la petición:", error)
      return false
    }
  }

  /**
   * Probar endpoint de búsqueda de customers
   */
  async testCustomersSearchEndpoint() {
    console.log("🔍 Probando endpoint de búsqueda de customers...")
    
    const token = localStorage.getItem("authToken")
    if (!token) {
      console.error("  - No hay token de autenticación")
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/customers/search?q=test`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      })

      console.log("  - Status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("  - Error response:", errorText)
        return false
      }

      const data = await response.json()
      console.log("  - Response data:", data)
      return true
    } catch (error) {
      console.error("  - Error en la petición:", error)
      return false
    }
  }

  /**
   * Ejecutar todas las pruebas de diagnóstico
   */
  async runFullDiagnostic() {
    console.log("🔬 === DIAGNÓSTICO COMPLETO DE LA API ===")
    
    const results = {
      tokenExists: this.checkAuthToken(),
      apiConnectivity: await this.testAPIConnectivity(),
      customersEndpoint: await this.testCustomersEndpoint(),
      customersSearchEndpoint: await this.testCustomersSearchEndpoint()
    }

    console.log("📊 === RESUMEN DE RESULTADOS ===")
    Object.entries(results).forEach(([test, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${test}:`, result)
    })

    // Recomendaciones
    console.log("💡 === RECOMENDACIONES ===")
    if (!results.tokenExists) {
      console.log("  - Debes hacer login primero para obtener un token válido")
    }
    if (!results.apiConnectivity) {
      console.log("  - Verifica tu conexión a internet y que la API esté disponible")
    }
    if (!results.customersEndpoint) {
      console.log("  - El endpoint de customers no está disponible o tu token no es válido")
    }
    if (!results.customersSearchEndpoint) {
      console.log("  - El endpoint de búsqueda de customers no está disponible")
    }

    return results
  }
}

// Hacer disponible globalmente para debugging
window.ApiDiagnostic = ApiDiagnostic