import { InventoryService } from "/js/services/inventoryService.js"
import { SalesService } from "/js/services/salesService.js"
import { GoogleGenerativeAI } from "@google/generative-ai"

class JAVIAssistant {
  constructor() {
    this.geminiModel = null
    this.inventoryService = new InventoryService()
    this.salesService = new SalesService()
    this.conversationHistory = []
    this.recommendations = []
    this.currentApiKey = null
    this.supplierData = null // Para almacenar datos de proveedores
    this.priceHistory = new Map() // Historial de precios

    this.initializeElements()
    this.initializeEventListeners()
    this.loadStoredData()
    this.loadSupplierData() // Cargar datos de proveedores
    this.initializeRecommendations() // Inicializar recomendaciones
    
    // Inicializar estado
    this.initializeStatus()
    
    this.diagnosticMode() // Modo diagnóstico para debug
  }

  async initializeStatus() {
    // Verificar API key y establecer estado inicial si es necesario
    const hasApiKey = await this.checkApiKey()
    if (!hasApiKey) {
      this.updateStatus("Desconectado", "disconnected")
    }
  }

  initializeElements() {
    this.elements = {
      // Chat elements
      chatMessages: document.getElementById("chatMessages"),
      messageInput: document.getElementById("messageInput"),
      sendMessageBtn: document.getElementById("sendMessageBtn"),

      // Status elements
      javiStatusIndicator: document.getElementById("javiStatusIndicator"),
      javiStatusText: document.getElementById("javiStatusText"),

      // Settings elements
      settingsModal: document.getElementById("settingsModal"),
      settingsBtn: document.getElementById("settingsBtn"),
      showSettingsBtn: document.getElementById("showSettingsBtn"),
      closeSettingsBtn: document.getElementById("closeSettingsBtn"),
      cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
      apiKeyInput: document.getElementById("apiKeyInput"),
      saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
      removeApiKeyBtn: document.getElementById("removeApiKeyBtn"),
      apiKeyAlert: document.getElementById("apiKeyAlert"),

      // Action buttons
      refreshRecommendationsBtn: document.getElementById("refreshRecommendationsBtn"),
      analyzeInventoryBtn: document.getElementById("analyzeInventoryBtn"),
      priceAnalysisBtn: document.getElementById("priceAnalysisBtn"),
      restockSuggestionsBtn: document.getElementById("restockSuggestionsBtn"),
      competitorAnalysisBtn: document.getElementById("competitorAnalysisBtn"),
      systemStatusBtn: document.getElementById("systemStatusBtn"),

      // Recommendations
      recommendationsGrid: document.getElementById("recommendationsGrid"),
    }
  }

  initializeEventListeners() {
    // Chat functionality
    this.elements.sendMessageBtn?.addEventListener("click", () => this.sendMessage())
    this.elements.messageInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage()
    })

    // Settings modal
    this.elements.settingsBtn?.addEventListener("click", () => this.showSettings())
    this.elements.showSettingsBtn?.addEventListener("click", () => this.showSettings())
    this.elements.closeSettingsBtn?.addEventListener("click", () => this.hideSettings())
    this.elements.cancelSettingsBtn?.addEventListener("click", () => this.hideSettings())
    this.elements.saveApiKeyBtn?.addEventListener("click", () => this.saveApiKey())
    this.elements.removeApiKeyBtn?.addEventListener("click", () => this.removeApiKey())

    // Quick actions
    this.elements.refreshRecommendationsBtn?.addEventListener("click", () => this.generateRecommendations())
    this.elements.analyzeInventoryBtn?.addEventListener("click", () => this.analyzeInventory())
    this.elements.priceAnalysisBtn?.addEventListener("click", () => this.analyzePrices())
    this.elements.restockSuggestionsBtn?.addEventListener("click", () => this.generateRestockSuggestions())
    this.elements.competitorAnalysisBtn?.addEventListener("click", () => this.analyzeCompetition())
    this.elements.systemStatusBtn?.addEventListener("click", () => this.checkSystemStatus())
  }

  /**
   * Inicializa las recomendaciones automáticamente
   */
  async initializeRecommendations() {
    try {
      // Verificar si hay recomendaciones guardadas
      const savedRecommendations = localStorage.getItem("javi_recommendations")
      
      if (savedRecommendations) {
        const recommendations = JSON.parse(savedRecommendations)
        if (recommendations.length > 0) {
          const latest = recommendations[recommendations.length - 1]
          this.displayRecommendations(latest.content)
          console.log('✅ Recomendaciones cargadas desde almacenamiento local')
          return
        }
      }
      
      // Si no hay recomendaciones guardadas, generar ejemplos
      console.log('📝 Generando recomendaciones de ejemplo...')
      await this.generateSampleRecommendations()
      
    } catch (error) {
      console.error('Error inicializando recomendaciones:', error)
      await this.generateSampleRecommendations()
    }
  }

  async checkApiKey() {
    try {
      // Intentar obtener la API key del almacenamiento local
      const storedApiKey = localStorage.getItem("javi_api_key")
      
      if (storedApiKey) {
        // Sanitizar la API key almacenada
        const sanitizedApiKey = DOMPurify.sanitize(storedApiKey)
        
        if (this.validateApiKey(sanitizedApiKey)) {
          // Intentar inicializar Gemini
          await this.initializeGemini(sanitizedApiKey)
          
          // Si es exitoso, actualizar el estado
          this.currentApiKey = sanitizedApiKey
          this.elements.apiKeyAlert?.classList.add("hidden")
          this.elements.removeApiKeyBtn?.classList.remove("hidden")
          if (this.elements.apiKeyInput) {
            this.elements.apiKeyInput.value = sanitizedApiKey
          }
          
          // Actualizar estado a conectado
          this.updateStatus("Conectado", "online")
          
          this.addMessage(
            "system",
            "¡Hola! Soy JAVI, tu asistente inteligente para la papelería. ¿En qué puedo ayudarte hoy?",
          )
          return true
        }
      }
      
      // Si no hay key o no es válida, mostrar alerta
      this.showApiKeyAlert()
      this.updateStatus("Desconectado", "disconnected")
      return false
    } catch (error) {
      console.error("Error checking API key:", error)
      this.showApiKeyAlert()
      this.updateStatus("Error de conexión", "error")
      return false
    }
  }

  /**
   * Carga los datos de proveedores desde el archivo big-data
   */
  async loadSupplierData() {
    try {
      console.log('📊 Cargando datos de proveedores...');
      const response = await fetch('/views/dashboard/big-data/proveedores.txt');
      const csvText = await response.text();
      
      this.supplierData = this.parseSupplierCSV(csvText);
      console.log(`✅ Cargados ${this.supplierData.length} productos de proveedores`);
      
      // Crear índice de precios históricos
      this.buildPriceHistory();
    } catch (error) {
      console.error('❌ Error cargando datos de proveedores:', error);
      this.supplierData = [];
    }
  }

  /**
   * Parsea el archivo CSV de proveedores
   */
  parseSupplierCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
        });
        products.push(product);
      }
    }

    return products;
  }

  /**
   * Parsea una línea CSV considerando comillas
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }

  /**
   * Construye el historial de precios para análisis
   */
  buildPriceHistory() {
    if (!this.supplierData) return;

    this.supplierData.forEach(product => {
      const productName = product['Nombre del producto'];
      const prices = {
        tony_menudeo: this.parsePrice(product['Precio Tony (menudeo)']),
        tony_mayoreo: this.parsePrice(product['Precio Tony (mayoreo)']),
        kym_menudeo: this.parsePrice(product['Precio Kym (menudeo)']),
        kym_mayoreo: this.parsePrice(product['Precio Kym (mayoreo)']),
        dipath: this.parsePrice(product['Precio DIPATH']),
        deposito: this.parsePrice(product['Precio Depósito Papelero']),
        colorprinter: this.parsePrice(product['Precio Colorprinter']),
        category: product['Categoría'],
        unit: product['Unidad (pieza, caja, docena)'],
        lastUpdate: product['Última actualización']
      };

      // Filtrar precios válidos
      const validPrices = Object.entries(prices)
        .filter(([key, value]) => key !== 'category' && key !== 'unit' && key !== 'lastUpdate' && value > 0)
        .map(([supplier, price]) => ({ supplier, price }));

      if (validPrices.length > 0) {
        this.priceHistory.set(productName, {
          ...prices,
          minPrice: Math.min(...validPrices.map(p => p.price)),
          maxPrice: Math.max(...validPrices.map(p => p.price)),
          avgPrice: validPrices.reduce((sum, p) => sum + p.price, 0) / validPrices.length,
          suppliers: validPrices
        });
      }
    });

    console.log(`📈 Historial de precios construido para ${this.priceHistory.size} productos`);
  }

  /**
   * Convierte string de precio a número
   */
  parsePrice(priceStr) {
    if (!priceStr || priceStr === '') return 0;
    return parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
  }

  async initializeGemini(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      // Actualizar a Gemini 2.0 Flash
      this.geminiModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })

      this.updateStatus("Conectado", "online")
      console.log("✅ Gemini 2.5 Flash inicializado correctamente")
    } catch (error) {
      console.error("❌ Error inicializando Gemini:", error)
      this.updateStatus("Error de conexión", "error")
      throw error
    }
  }

  updateStatus(text, status) {
    if (this.elements.javiStatusText) {
      this.elements.javiStatusText.textContent = text
    }

    if (this.elements.javiStatusIndicator) {
      let bgColor = "bg-gray-400" // Default
      
      switch (status) {
        case "online":
        case "connected":
          bgColor = "bg-green-400"
          break
        case "thinking":
        case "processing":
          bgColor = "bg-yellow-400 animate-pulse"
          break
        case "error":
        case "disconnected":
          bgColor = "bg-red-400"
          break
        case "warning":
          bgColor = "bg-orange-400"
          break
        default:
          bgColor = "bg-gray-400"
      }
      
      this.elements.javiStatusIndicator.className = `w-3 h-3 rounded-full ${bgColor}`
    }
  }

  showApiKeyAlert() {
    this.elements.apiKeyAlert?.classList.remove("hidden")
    this.updateStatus("API Key requerida", "warning")
  }

  showSettings() {
    this.elements.settingsModal?.classList.remove("hidden")
  }

  hideSettings() {
    this.elements.settingsModal?.classList.add("hidden")
  }

  async saveApiKey() {
    const rawApiKey = this.elements.apiKeyInput?.value.trim()
    if (!rawApiKey) {
      alert("Por favor ingresa una API Key válida.")
      return
    }

    // Sanitizar la API key antes de usarla
    const apiKey = DOMPurify.sanitize(rawApiKey)
    
    try {
      // Validar que la API key tenga el formato correcto (alfanumérico y longitud adecuada)
      if (!this.validateApiKey(apiKey)) {
        throw new Error("Formato de API Key inválido")
      }

      // Intentar inicializar Gemini con la nueva key
      await this.initializeGemini(apiKey)
      
      // Si la inicialización es exitosa, guardar la key
      localStorage.setItem("javi_api_key", apiKey)
      this.currentApiKey = apiKey // Mantener en memoria
      
      // Actualizar UI
      this.elements.removeApiKeyBtn?.classList.remove("hidden")
      this.elements.apiKeyAlert?.classList.add("hidden")
      this.hideSettings()
      this.addMessage("system", "✅ API Key guardada correctamente. ¡Comencemos a analizar tu negocio!")
    } catch (error) {
      console.error("Error saving API key:", error)
      alert("Error: API Key inválida. Por favor verifica tu clave.")
    }
  }

  validateApiKey(apiKey) {
    // Verificar que la key sea alfanumérica y tenga la longitud correcta
    return /^[a-zA-Z0-9_-]{20,}$/.test(apiKey.trim())
  }

  removeApiKey() {
    if (confirm("¿Seguro que quieres eliminar la API Key?")) {
      try {
        // Limpiar almacenamiento local
        localStorage.removeItem("javi_api_key")
        
        // Limpiar estado en memoria
        this.currentApiKey = null
        this.geminiModel = null
        
        // Limpiar UI
        if (this.elements.apiKeyInput) {
          this.elements.apiKeyInput.value = ""
        }
        this.elements.removeApiKeyBtn?.classList.add("hidden")
        this.showApiKeyAlert()
        
        // Limpiar chat
        if (this.elements.chatMessages) {
          this.elements.chatMessages.innerHTML = DOMPurify.sanitize("")
        }
        
        // Reiniciar estado del asistente
        this.conversationHistory = []
        this.recommendations = []
        this.saveConversation() // Actualizar almacenamiento local
        
        return true
      } catch (error) {
        console.error("Error removing API key:", error)
        alert("Error al eliminar la API Key. Por favor intenta de nuevo.")
        return false
      }
    }
    return false
  }

  async sendMessage() {
    const message = this.elements.messageInput?.value.trim()
    if (!message || !this.geminiModel) return

    this.addMessage("user", message)
    this.elements.messageInput.value = ""
    this.updateStatus("Analizando...", "thinking")

    try {
      const context = await this.buildContext()
      const fullPrompt = this.buildPrompt(message, context)

      const result = await this.geminiModel.generateContent(fullPrompt)
      const response = await result.response
      const text = await response.text()

      this.addMessage("assistant", text)
      this.updateStatus("Conectado", "online")

      // Save conversation
      this.conversationHistory.push({ role: "user", content: message }, { role: "assistant", content: text })
      this.saveConversation()
    } catch (error) {
      console.error("Error sending message:", error)
      this.addMessage("system", "Error al procesar tu mensaje. Por favor intenta de nuevo.")
      this.updateStatus("Error", "error")
    }
  }

  buildPrompt(message, context) {
    const dataStatus = context.includes('DATOS EN TIEMPO REAL DISPONIBLES') ? 'DATOS REALES DISPONIBLES' : 
                      context.includes('MODO DE ANÁLISIS LIMITADO') ? 'MODO LIMITADO' : 'ERROR DE DATOS'
    
    const isSystemCheck = message.toLowerCase().includes('sistema') || message.toLowerCase().includes('estado') || 
                         message.toLowerCase().includes('conectividad') || message.toLowerCase().includes('verifica')
    
    let systemPrompt = `Eres JAVI, un asistente inteligente especializado en gestión de papelerías y análisis de negocios.

ESTADO ACTUAL: ${dataStatus}

${context}`

    if (isSystemCheck) {
      systemPrompt += `

🔧 DIAGNÓSTICO DEL SISTEMA:
El usuario está solicitando información sobre el estado del sistema. Proporciona:

1. **Estado de conectividad**: Basado en el contexto actual
2. **Diagnóstico de problemas**: Si hay errores, explica las causas más probables
3. **Soluciones sugeridas**: Pasos específicos para solucionar problemas
4. **Estado de servicios**: Inventario, ventas, datos de proveedores
5. **Recomendaciones de acción**: Qué hacer para restaurar funcionalidad completa

Sé técnico pero claro en el diagnóstico.`
    }

    return systemPrompt + `

CAPACIDADES:
${dataStatus === 'DATOS REALES DISPONIBLES' ? 
  '• Análisis de inventario en tiempo real con alertas de stock\n• Evaluación de rendimiento de ventas y tendencias actuales\n• Comparación de precios con datos históricos de proveedores\n• Recomendaciones precisas basadas en datos reales del negocio\n• Insights sobre competitividad y oportunidades específicas\n• Análisis predictivo basado en patrones actuales' : 
  '• Análisis general de mejores prácticas comerciales\n• Recomendaciones basadas en experiencia del sector\n• Consejos de gestión de inventario y ventas\n• Estrategias generales de precios y marketing\n• Orientación para solucionar problemas técnicos'
}

INSTRUCCIONES:
${dataStatus === 'DATOS REALES DISPONIBLES' ? 
  '- Proporciona análisis específicos basados en los datos reales mostrados\n- Incluye números y porcentajes exactos\n- Sugiere acciones concretas y medibles\n- Prioriza recomendaciones que impacten directamente en rentabilidad\n- Si detectas problemas críticos, menciónales inmediatamente' : 
  '- Indica claramente que estás trabajando sin datos en tiempo real\n- Ofrece consejos generales pero valiosos\n- Sugiere pasos para restaurar la funcionalidad completa\n- Proporciona orientación basada en mejores prácticas del sector'
}
- Usa un tono profesional pero accesible
- Sé honesto sobre las limitaciones actuales del sistema

Consulta del usuario: ${message}

Responde de manera clara, estructurada y fundamentada en los datos disponibles:`
  }

  async diagnosticMode() {
    console.log('🔧 Ejecutando diagnóstico de JAVI...')
    
    try {
      // Test de autenticación
      const token = localStorage.getItem("authToken")
      console.log('🔐 Token disponible:', token ? `Sí (${token.substring(0, 10)}...)` : 'No')
      
      // Verificar validez del token si existe
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]))
          const isExpired = tokenData.exp * 1000 < Date.now()
          console.log('⏰ Token expirado:', isExpired ? 'Sí' : 'No')
          if (isExpired) {
            console.warn('⚠️ Token JWT ha expirado - se requiere nueva autenticación')
          }
        } catch (e) {
          console.warn('⚠️ No se pudo verificar la validez del token')
        }
      }
      
      // Test de servicios
      console.log('🧪 Probando conexión a servicios...')
      
      const inventoryTest = this.inventoryService.getProducts({ limit: 1 })
        .then(result => {
          const count = Array.isArray(result) ? result.length : 0
          console.log('✅ InventoryService: Funcional -', count, 'productos detectados')
          return count > 0
        })
        .catch(error => {
          console.log('❌ InventoryService: Error -', error.message)
          return false
        })
      
      const salesTest = this.salesService.getSales({ limit: 1 })
        .then(result => {
          const count = result?.sales?.length || 0
          console.log('✅ SalesService: Funcional -', count, 'ventas detectadas')
          return count > 0
        })
        .catch(error => {
          console.log('❌ SalesService: Error -', error.message)
          return false
        })
      
      const [inventoryWorking, salesWorking] = await Promise.all([inventoryTest, salesTest])
      
      console.log('📋 Resumen del diagnóstico:')
      console.log('- Inventario:', inventoryWorking ? 'Operativo' : 'Con errores')
      console.log('- Ventas:', salesWorking ? 'Operativo' : 'Con errores')
      console.log('- Datos de proveedores:', this.supplierData ? 'Cargados' : 'No disponibles')
      
      if (!inventoryWorking && !salesWorking) {
        console.warn('⚠️ No hay servicios funcionando - JAVI trabajará en modo limitado')
        this.addMessage("system", "ℹ️ Sistema iniciado en modo limitado. Verificar autenticación para acceso completo a datos.")
      } else {
        console.log('✅ Servicios operativos detectados')
      }
      
    } catch (error) {
      console.error('🚨 Error en diagnóstico:', error)
    }
  }

  async buildContext() {
    try {
      console.log('🔍 Cargando datos para JAVI...')
      
      const [productsResponse, sales] = await Promise.all([
        this.inventoryService.getProducts({ limit: 1000 }).catch(error => {
          console.error('❌ Error cargando productos:', error)
          return { products: [] }
        }),
        this.salesService.getSales({ limit: 100 }).catch(error => {
          console.error('❌ Error cargando ventas:', error)
          return { sales: [] }
        })
      ])
      
      // Extraer productos del response - ajustar para obtener TODOS los productos
      let products = []
      if (Array.isArray(productsResponse)) {
        products = productsResponse
      } else if (productsResponse?.products) {
        // Si viene paginado, necesitamos obtener todos los productos
        if (productsResponse.totalPages > 1) {
          console.log(`📄 Detectado ${productsResponse.totalPages} páginas, obteniendo todos los productos...`)
          try {
            // Hacer una llamada directa para obtener todos los productos
            const allPagesPromises = []
            for (let page = 1; page <= productsResponse.totalPages; page++) {
              allPagesPromises.push(
                this.inventoryService.getProducts({ limit: 1000, page }).catch(() => ({ products: [] }))
              )
            }
            const allPagesResponses = await Promise.all(allPagesPromises)
            products = allPagesResponses.flatMap(response => response.products || [])
            console.log(`✅ Obtenidos ${products.length} productos de todas las páginas`)
          } catch (error) {
            console.error('❌ Error obteniendo todas las páginas:', error)
            products = productsResponse.products || []
          }
        } else {
          products = productsResponse.products || []
        }
      }

      // Validar que los datos sean arrays válidos
      const validProducts = Array.isArray(products) ? products : []
      const validSales = Array.isArray(sales?.sales) ? sales.sales : []
      
      console.log(`📊 Datos cargados: ${validProducts.length} productos, ${validSales.length} ventas`)
      
      // Analizar datos si están disponibles
      const inventoryData = this.analyzeInventoryData(validProducts)
      const salesData = this.analyzeSalesData(validSales)
      const priceAnalysis = this.analyzePriceCompetitiveness(validProducts)
      const supplierInsights = this.getSupplierInsights()
      
      const hasRealData = validProducts.length > 0 || validSales.length > 0
      
      if (!hasRealData) {
        console.warn('⚠️ No se pudieron cargar datos reales - verificando autenticación y conectividad')
      }

      if (hasRealData) {
        // Validar que todas las propiedades existan antes de usar join
        const safeJoin = (arr) => Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "Ninguno"
        
        return `
📊 DATOS EN TIEMPO REAL DISPONIBLES:

INVENTARIO ACTUAL:
- Total de productos: ${validProducts.length}
- Productos con stock bajo (≤10): ${inventoryData.lowStock}
- Productos agotados: ${inventoryData.outOfStock}
- Valor total del inventario: $${inventoryData.totalValue.toFixed(2)}
- Categorías principales: ${safeJoin(inventoryData.topCategories)}
- Productos más rentables: ${safeJoin(inventoryData.highMarginProducts)}

DATOS DE VENTAS:
- Ventas recientes: ${salesData.totalSales}
- Ingresos totales: $${salesData.totalRevenue.toFixed(2)}
- Productos más vendidos: ${safeJoin(salesData.topProducts)}
- Tendencia de ventas: ${salesData.trend}
- Ticket promedio: $${salesData.averageTicket.toFixed(2)}
- Margen bruto promedio: ${salesData.averageMargin.toFixed(1)}%

ANÁLISIS DE PRECIOS Y COMPETITIVIDAD:
- Productos competitivos: ${priceAnalysis.competitive}
- Productos con oportunidades: ${safeJoin(priceAnalysis.opportunities)}
- Análisis de márgenes: ${priceAnalysis.marginAnalysis || 'No disponible'}

INSIGHTS DE PROVEEDORES:
${safeJoin(supplierInsights.insights || [])}
- Recomendaciones de precios: ${safeJoin(supplierInsights.priceRecommendations || [])}
- Tendencias del mercado: ${supplierInsights.marketTrends || 'No disponible'}

ESTADO: ✅ Datos actualizados en tiempo real disponibles.
`
      } else {
        return `
⚠️ MODO DE ANÁLISIS LIMITADO:

ACTUALMENTE NO HAY DATOS EN TIEMPO REAL DISPONIBLES.

Datos obtenidos: ${validProducts.length} productos, ${validSales.length} ventas

Posibles razones:
- Token de autenticación expirado (más común)
- Problemas de conectividad con cemac-api.vercel.app
- Base de datos temporal vacía
- Servicios de backend temporalmente no disponibles
- Permisos de usuario insuficientes

DATOS HISTÓRICOS DE PROVEEDORES:
${supplierInsights.insights.join("\n")}
- Análisis de mercado basado en datos históricos
- Tendencias de precios de proveedores: ${supplierInsights.marketTrends}

RECOMENDACIONES:
1. Verificar conexión a internet
2. Revisar autenticación en el sistema
3. Contactar al administrador si el problema persiste

Modo de consulta: Puedo ayudarte con análisis generales y recomendaciones basadas en buenas prácticas comerciales.
`
      }
    } catch (error) {
      console.error("Error building context:", error)
      return "ERROR AL CARGAR DATOS DEL SISTEMA - Funcionando en modo limitado. Puede ayudar con consejos generales de gestión de inventario y mejores prácticas comerciales."
    }
  }

  analyzeInventoryData(products) {
    const data = {
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      topCategories: [],
      highMarginProducts: [],
      alerts: [],
    }

    if (!Array.isArray(products) || products.length === 0) {
      return data
    }

    const categoryCount = {}
    const productMargins = []

    products.forEach((product, index) => {
      const stock = product.stock || product.quantity || 0
      const price = product.price || product.sellPrice || 0
      const cost = product.cost || product.costPrice || 0
      const productName = product.name || product.title || `Producto ${index + 1}`

      // Debug: imprimir algunos productos para verificar la estructura
      if (index < 3) {
        console.log(`🔍 Producto ${index + 1}:`, { 
          name: productName, 
          stock, 
          price, 
          category: product.category,
          id: product.id 
        })
      }

      if (stock === 0) {
        data.outOfStock++
        data.alerts.push(`Sin stock: ${productName}`)
      } else if (stock <= 10) {
        data.lowStock++
        data.alerts.push(`Stock bajo: ${productName} (${stock} unidades)`)
      }

      data.totalValue += stock * price

      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
      }

      // Calcular margen de ganancia
      if (price > 0 && cost > 0) {
        const margin = ((price - cost) / price) * 100
        productMargins.push({ name: productName, margin, price, stock })
      }
    })

    // Productos con mejor margen
    data.highMarginProducts = productMargins
      .filter(p => p.margin > 30) // Productos con margen > 30%
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 3)
      .map(p => `${p.name} (${p.margin.toFixed(1)}%)`)

    data.topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    return data
  }

  analyzeSalesData(sales) {
    const data = {
      totalSales: sales.length,
      totalRevenue: 0,
      topProducts: [],
      trend: "estable",
      averageTicket: 0,
      averageMargin: 0,
    }

    const productSales = {}
    let totalTickets = 0
    let totalMarginSum = 0
    let marginsCount = 0

    sales.forEach((sale, index) => {
      const saleTotal = sale.total || sale.amount || 0
      data.totalRevenue += saleTotal
      totalTickets++

      // Debug: imprimir algunas ventas para verificar la estructura
      if (index < 3) {
        console.log(`💰 Venta ${index + 1}:`, {
          total: saleTotal,
          items: sale.items?.length || 0,
          date: sale.date,
          id: sale.id
        })
      }

      // Procesar items de la venta
      const items = sale.items || sale.products || []
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const itemName = item.name || item.productName || item.title || 'Producto sin nombre'
          const quantity = item.quantity || item.qty || 1
          
          productSales[itemName] = (productSales[itemName] || 0) + quantity
          
          // Calcular margen si está disponible
          if (item.price && item.cost) {
            const margin = ((item.price - item.cost) / item.price) * 100
            totalMarginSum += margin
            marginsCount++
          }
        })
      }
    })

    // Calcular promedios
    data.averageTicket = totalTickets > 0 ? data.totalRevenue / totalTickets : 0
    data.averageMargin = marginsCount > 0 ? totalMarginSum / marginsCount : 0

    // Analizar tendencia básica (últimas vs primeras ventas)
    if (sales.length >= 10) {
      const recentSales = sales.slice(-5).reduce((sum, sale) => sum + (sale.total || 0), 0)
      const oldSales = sales.slice(0, 5).reduce((sum, sale) => sum + (sale.total || 0), 0)
      
      if (recentSales > oldSales * 1.1) {
        data.trend = "creciente"
      } else if (recentSales < oldSales * 0.9) {
        data.trend = "decreciente"
      }
    }

    data.topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([product]) => product)

    return data
  }

  analyzePriceCompetitiveness(products) {
    const analysis = {
      competitive: 0,
      overpriced: 0,
      underpriced: 0,
      noMarketData: 0,
      opportunities: [],
      competitiveProducts: [],
      overpricedProducts: []
    }

    if (!this.supplierData || !products) {
      return analysis
    }

    products.forEach(product => {
      const productName = product.name?.toLowerCase() || ""
      let marketPrice = null

      // Buscar precio de mercado en datos de proveedores
      for (const supplier of this.supplierData) {
        if (supplier.productName?.toLowerCase().includes(productName) || 
            productName.includes(supplier.productName?.toLowerCase())) {
          marketPrice = parseFloat(supplier.currentPrice) || null
          break
        }
      }

      if (marketPrice) {
        const currentPrice = parseFloat(product.price) || 0
        const priceRatio = currentPrice / marketPrice
        
        if (priceRatio >= 0.9 && priceRatio <= 1.1) {
          analysis.competitive++
          analysis.competitiveProducts.push(product.name)
        } else if (priceRatio > 1.1) {
          analysis.overpriced++
          analysis.overpricedProducts.push(product.name)
          analysis.opportunities.push(`${product.name}: reducir precio de $${currentPrice} a $${(marketPrice * 1.05).toFixed(2)}`)
        } else {
          analysis.underpriced++
          analysis.opportunities.push(`${product.name}: aumentar precio de $${currentPrice} a $${(marketPrice * 0.95).toFixed(2)}`)
        }
      } else {
        analysis.noMarketData++
      }
    })

    // Agregar análisis de márgenes
    analysis.marginAnalysis = analysis.competitive > 0 ? 
      `${analysis.competitive} productos con precios competitivos` : 
      "Revisar estrategia de precios"

    return analysis
  }

  getSupplierInsights() {
    if (!this.supplierData || this.supplierData.length === 0) {
      return {
        topSuppliers: [],
        priceAlerts: [],
        recommendations: ["No hay datos de proveedores disponibles"],
        insights: ["Sin datos históricos de proveedores"],
        priceRecommendations: ["Cargar datos de proveedores para análisis"],
        marketTrends: "No disponible"
      }
    }

    const insights = {
      topSuppliers: [],
      priceAlerts: [],
      recommendations: []
    }

    // Agrupar por proveedor
    const supplierGroups = this.supplierData.reduce((acc, item) => {
      const supplier = item.supplier || "Proveedor Desconocido"
      if (!acc[supplier]) {
        acc[supplier] = []
      }
      acc[supplier].push(item)
      return acc
    }, {})

    // Analizar cada proveedor
    Object.entries(supplierGroups).forEach(([supplier, products]) => {
      const avgPrice = products.reduce((sum, p) => sum + (parseFloat(p.currentPrice) || 0), 0) / products.length
      const priceHistory = products.flatMap(p => p.priceHistory || [])
      const recentChanges = priceHistory.filter(h => {
        const changeDate = new Date(h.date)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return changeDate >= thirtyDaysAgo
      })

      insights.topSuppliers.push({
        name: supplier,
        products: products.length,
        avgPrice: avgPrice.toFixed(2),
        recentChanges: recentChanges.length
      })

      // Detectar aumentos significativos de precio
      if (recentChanges.length > 0) {
        const significantIncreases = recentChanges.filter(change => 
          change.changePercent && change.changePercent > 15
        )
        
        if (significantIncreases.length > 0) {
          insights.priceAlerts.push(`${supplier}: ${significantIncreases.length} aumentos significativos recientes`)
        }
      }
    })

    // Generar recomendaciones
    if (insights.topSuppliers.length > 0) {
      const mostActiveSupplier = insights.topSuppliers.reduce((max, current) => 
        current.products > max.products ? current : max
      )
      
      insights.recommendations.push(`Considerar negociar mejores términos con ${mostActiveSupplier.name} (${mostActiveSupplier.products} productos)`)
      
      if (insights.priceAlerts.length > 0) {
        insights.recommendations.push("Revisar precios de venta debido a aumentos recientes de proveedores")
      }
      
      if (insights.topSuppliers.length > 5) {
        insights.recommendations.push("Evaluar consolidación de proveedores para mejores términos")
      }
    }

    // Agregar propiedades faltantes para el contexto
    insights.insights = insights.recommendations
    insights.priceRecommendations = insights.recommendations
    insights.marketTrends = "Basado en datos históricos de proveedores"

    return insights
  }

  addMessage(role, content) {
    if (!this.elements.chatMessages) return

    const messageDiv = document.createElement("div")
    messageDiv.className = `flex ${role === "user" ? "justify-end" : "justify-start"}`

    const bubbleDiv = document.createElement("div")
    bubbleDiv.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      role === "user"
        ? "bg-[#8B7EC7] text-white"
        : role === "system"
          ? "bg-gray-100 text-gray-700 text-sm"
          : "bg-gray-200 text-gray-800"
    }`

    // Simple markdown-like formatting for assistant messages
    if (role === "assistant") {
      bubbleDiv.innerHTML = this.formatMessage(content)
    } else {
      bubbleDiv.textContent = content
    }

    messageDiv.appendChild(bubbleDiv)
    this.elements.chatMessages.appendChild(messageDiv)
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight
  }

  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/###\s(.*)/g, '<h3 class="font-bold mt-2 mb-1">$1</h3>')
      .replace(/##\s(.*)/g, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>')
      .replace(/#\s(.*)/g, '<h1 class="font-bold text-xl mt-2 mb-1">$1</h1>')
  }

  // Quick action methods
  async analyzeInventory() {
    this.elements.messageInput.value = "Analiza mi inventario actual y dame recomendaciones para optimizarlo"
    this.sendMessage()
  }

  async analyzePrices() {
    this.elements.messageInput.value = "Analiza mis precios actuales y sugiere ajustes para ser más competitivo"
    this.sendMessage()
  }

  async generateRestockSuggestions() {
    this.elements.messageInput.value = "Genera sugerencias de restock basadas en mi inventario y ventas"
    this.sendMessage()
  }

  async analyzeCompetition() {
    this.elements.messageInput.value =
      "Dame estrategias para competir mejor con otras papelerías en precios y productos"
    this.sendMessage()
  }

  async checkSystemStatus() {
    this.elements.messageInput.value = 
      "Verifica el estado de mi sistema y conexión a datos"
    this.sendMessage()
  }

  async generateSampleRecommendations() {
    console.log('🧪 Generando recomendaciones de ejemplo basadas en datos reales...')
    
    try {
      // Generar recomendaciones de ejemplo basadas en el análisis actual
      const context = await this.buildContext()
      
      const sampleRecommendations = `
1. **[INVENTARIO] - Optimizar Stock de Productos Críticos**: Detectados productos con stock bajo que requieren reposición inmediata. Aumentar inventario de productos más vendidos para evitar pérdidas de ventas y mantener satisfacción del cliente.

2. **[PRECIOS] - Ajustar Estrategia de Precios Competitivos**: Oportunidades para mejorar márgenes mediante análisis competitivo detallado. Ajustar precios en productos con alta demanda manteniendo balance entre competitividad y rentabilidad.

3. **[VENTAS] - Implementar Estrategias de Cross-selling**: Patrones de compra identificados que pueden aumentar ticket promedio mediante recomendaciones inteligentes de productos complementarios y técnicas de venta cruzada.
      `
      
      this.displayRecommendations(sampleRecommendations)
      this.saveRecommendations(sampleRecommendations)
      
      // Mostrar mensaje de confirmación
      this.addMessage("system", "✅ Se han generado recomendaciones de ejemplo basadas en tus datos. Revisa la sección de recomendaciones y ve a la página de Inicio para verlas también.")
      
    } catch (error) {
      console.error("Error generating sample recommendations:", error)
      this.addMessage("system", "❌ Error al generar recomendaciones de ejemplo")
    }
  }

  async generateRecommendations() {
    if (!this.geminiModel) {
      console.log("⚠️ No hay API Key configurada, generando recomendaciones de ejemplo...")
      await this.generateSampleRecommendations()
      return
    }

    try {
      const context = await this.buildContext()
      const prompt = `Como JAVI, analiza estos datos completos de la papelería y genera 3 recomendaciones estratégicas específicas y accionables:

${context}

CRITERIOS DE ANÁLISIS:
- Prioriza recomendaciones con mayor impacto en rentabilidad
- Considera la competitividad de precios vs. proveedores
- Identifica oportunidades de optimización de inventario
- Evalúa tendencias de ventas y estacionalidad
- Analiza eficiencia de proveedores y costos

FORMATO DE RESPUESTA:
1. **[CATEGORÍA] - Título de recomendación**: Descripción específica con datos numéricos, acciones concretas y impacto esperado
2. **[CATEGORÍA] - Título de recomendación**: Descripción específica con datos numéricos, acciones concretas y impacto esperado  
3. **[CATEGORÍA] - Título de recomendación**: Descripción específica con datos numéricos, acciones concretas y impacto esperado

CATEGORÍAS VÁLIDAS: INVENTARIO, PRECIOS, PROVEEDORES, VENTAS, MÁRGENES, CRECIMIENTO

Incluye números específicos de productos, precios y cantidades. Cada recomendación debe ser inmediatamente implementable.`

      const result = await this.geminiModel.generateContent(prompt)
      const response = await result.response
      const recommendations = await response.text()

      this.displayRecommendations(recommendations)
      this.saveRecommendations(recommendations)
    } catch (error) {
      console.error("Error generating recommendations:", error)
      alert("Error al generar recomendaciones")
    }
  }

  displayRecommendations(recommendations) {
    if (!this.elements.recommendationsGrid || !recommendations) {
      console.warn("No recommendations to display or grid element not found")
      return
    }

    try {
      // Sanitizar las recomendaciones
      const sanitizedRecommendations = DOMPurify.sanitize(recommendations)
      
      // Dividir las recomendaciones en items individuales
      const recommendationItems = sanitizedRecommendations
        .split(/\d+\./)
        .filter(item => item && item.trim())
        .map(item => item.trim())

      if (recommendationItems.length === 0) {
        this.elements.recommendationsGrid.innerHTML = `
          <div class="col-span-full text-center py-8">
            <div class="flex flex-col items-center">
              <i class="fas fa-robot text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 mb-2">No hay recomendaciones disponibles</p>
              <p class="text-sm text-gray-400">Haz clic en "Generar recomendaciones" para obtener insights de JAVI</p>
            </div>
          </div>
        `
        return
      }

      // Categorías con colores y iconos
      const categories = [
        { name: 'INVENTARIO', color: 'blue', icon: 'fas fa-boxes' },
        { name: 'PRECIOS', color: 'green', icon: 'fas fa-dollar-sign' },
        { name: 'VENTAS', color: 'purple', icon: 'fas fa-chart-line' },
        { name: 'MÁRGENES', color: 'orange', icon: 'fas fa-percentage' },
        { name: 'PROVEEDORES', color: 'indigo', icon: 'fas fa-truck' },
        { name: 'CRECIMIENTO', color: 'pink', icon: 'fas fa-rocket' }
      ]
      
      this.elements.recommendationsGrid.innerHTML = recommendationItems
        .map((item, index) => {
          try {
            // Extraer categoría, título y descripción
            let category = 'GENERAL'
            let title = 'Recomendación'
            let description = 'No hay descripción disponible'
            
            // Buscar patrón [CATEGORÍA] - Título: Descripción
            const categoryMatch = item.match(/\[(.*?)\]/)
            if (categoryMatch) {
              category = categoryMatch[1]
              item = item.replace(/\[.*?\]\s*-?\s*/, '')
            }
            
            const parts = item.split(":")
            title = parts[0]?.trim() || "Recomendación"
            description = parts.slice(1).join(":").trim() || "No hay descripción disponible"
            
            // Obtener configuración de categoría
            const categoryConfig = categories.find(cat => 
              category.toUpperCase().includes(cat.name)) || 
              { name: 'GENERAL', color: 'gray', icon: 'fas fa-lightbulb' }
            
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
              green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
              purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
              orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
              indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50',
              pink: 'from-pink-500 to-pink-600 text-pink-600 bg-pink-50',
              gray: 'from-gray-500 to-gray-600 text-gray-600 bg-gray-50'
            }
            
            const colors = colorClasses[categoryConfig.color]
            const [gradientColor, tagColor] = colors.split(' text-')
            
            // Almacenar la recomendación completa para el modal
            if (!window.currentSugerenciasRecommendations) {
              window.currentSugerenciasRecommendations = []
            }
            window.currentSugerenciasRecommendations[index] = {
              category: categoryConfig.name,
              title: title.replace(/\*\*/g, "").trim(),
              description: description, // Descripción completa para el modal
              color: categoryConfig.color,
              icon: categoryConfig.icon
            }
            
            return `
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative hover:shadow-md transition-shadow">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-gradient-to-br ${gradientColor} rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="${categoryConfig.icon} text-white text-lg"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-${tagColor} bg-${tagColor.split('-')[0]}-50 px-2 py-1 rounded-full">
                        ${categoryConfig.name}
                      </span>
                      <div class="flex text-yellow-400">
                        <i class="fas fa-star text-xs"></i>
                        <i class="fas fa-star text-xs"></i>
                        <i class="fas fa-star text-xs"></i>
                        <i class="fas fa-star text-xs"></i>
                        <i class="fas fa-star text-xs"></i>
                      </div>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">${DOMPurify.sanitize(title.replace(/\*\*/g, "").trim())}</h3>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${DOMPurify.sanitize(description.substring(0, 100))}${description.length > 100 ? '...' : ''}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">Generado por JAVI</span>
                      <button class="text-${tagColor} hover:text-${tagColor.replace('600', '700')} text-xs font-medium" 
                              onclick="window.showSugerenciasModal('${index}')">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
          } catch (error) {
            console.error("Error processing recommendation item:", error)
            return ""
          }
        })
        .filter(Boolean) // Eliminar items vacíos
        .join("")

      // Configurar funciones del modal
      this.setupSugerenciasModalFunctions()
    } catch (error) {
      console.error("Error displaying recommendations:", error)
      this.elements.recommendationsGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <div class="flex flex-col items-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
            <p class="text-gray-500">Error al mostrar las recomendaciones</p>
          </div>
        </div>
      `
    }
  }

  saveConversation() {
    localStorage.setItem("javi_conversation", JSON.stringify(this.conversationHistory))
  }

  saveRecommendations(recommendations) {
    const timestamp = new Date().toISOString()
    const savedRecommendations = JSON.parse(localStorage.getItem("javi_recommendations") || "[]")
    
    // Procesar las recomendaciones para el formato de inicio
    const processedRecommendations = this.processRecommendationsForHome(recommendations)
    
    const newRecommendation = { 
      timestamp, 
      content: recommendations,
      processed: processedRecommendations
    }
    
    savedRecommendations.unshift(newRecommendation)

    // Keep only last 10 recommendations
    if (savedRecommendations.length > 10) {
      savedRecommendations.splice(10)
    }

    localStorage.setItem("javi_recommendations", JSON.stringify(savedRecommendations))
    
    // También guardar para la página de inicio
    localStorage.setItem("javi_home_recommendations", JSON.stringify(processedRecommendations))
  }

  processRecommendationsForHome(recommendations) {
    try {
      const sanitizedRecommendations = DOMPurify.sanitize(recommendations)
      const recommendationItems = sanitizedRecommendations
        .split(/\d+\./)
        .filter(item => item && item.trim())
        .map(item => item.trim())

      const categories = [
        { name: 'INVENTARIO', color: 'blue', icon: 'fas fa-boxes' },
        { name: 'PRECIOS', color: 'green', icon: 'fas fa-dollar-sign' },
        { name: 'VENTAS', color: 'purple', icon: 'fas fa-chart-line' },
        { name: 'MÁRGENES', color: 'orange', icon: 'fas fa-percentage' },
        { name: 'PROVEEDORES', color: 'indigo', icon: 'fas fa-truck' },
        { name: 'CRECIMIENTO', color: 'pink', icon: 'fas fa-rocket' }
      ]

      return recommendationItems.slice(0, 3).map((item, index) => {
        let category = 'GENERAL'
        let title = 'Recomendación'
        let description = 'No hay descripción disponible'
        
        const categoryMatch = item.match(/\[(.*?)\]/)
        if (categoryMatch) {
          category = categoryMatch[1]
          item = item.replace(/\[.*?\]\s*-?\s*/, '')
        }
        
        const parts = item.split(":")
        title = parts[0]?.trim() || "Recomendación"
        description = parts.slice(1).join(":").trim() || "No hay descripción disponible"
        
        const categoryConfig = categories.find(cat => 
          category.toUpperCase().includes(cat.name)) || 
          { name: 'GENERAL', color: 'gray', icon: 'fas fa-lightbulb' }

        return {
          id: `javi-rec-${Date.now()}-${index}`,
          category: categoryConfig.name,
          title: title.replace(/\*\*/g, "").trim(),
          description: description.substring(0, 200), // Reducido de 500 a 200
          color: categoryConfig.color,
          icon: categoryConfig.icon,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error("Error processing recommendations for home:", error)
      return []
    }
  }

  loadStoredData() {
    try {
      // Cargar historial de conversación
      const conversation = localStorage.getItem("javi_conversation")
      if (conversation) {
        try {
          const parsedConversation = JSON.parse(conversation)
          if (Array.isArray(parsedConversation)) {
            this.conversationHistory = parsedConversation
          } else {
            console.warn("Invalid conversation history format")
            this.conversationHistory = []
          }
        } catch (error) {
          console.error("Error parsing conversation history:", error)
          this.conversationHistory = []
        }
      }

      // Cargar y mostrar recomendaciones recientes
      const recommendations = localStorage.getItem("javi_recommendations")
      if (recommendations) {
        try {
          const parsed = JSON.parse(recommendations)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
            this.recommendations = parsed
            this.displayRecommendations(parsed[0].content)
          } else {
            console.warn("No valid recommendations found")
            this.recommendations = []
            this.displayRecommendations(null)
          }
        } catch (error) {
          console.error("Error parsing recommendations:", error)
          this.recommendations = []
          this.displayRecommendations(null)
        }
      } else {
        this.displayRecommendations(null)
      }
    } catch (error) {
      console.error("Error loading stored data:", error)
      // Reiniciar estado si hay error
      this.conversationHistory = []
      this.recommendations = []
      this.displayRecommendations(null)
    }
  }

  setupSugerenciasModalFunctions() {
    // Función global para mostrar el modal en sugerencias
    window.showSugerenciasModal = (recommendationIndex) => {
      const recommendation = window.currentSugerenciasRecommendations?.[recommendationIndex]
      if (recommendation) {
        this.showSugerenciasModal(recommendation)
      }
    }

    // Función global para cerrar el modal
    window.closeSugerenciasModal = () => {
      this.hideSugerenciasModal()
    }
  }

  showSugerenciasModal(recommendation) {
    // Crear modal si no existe
    let modal = document.getElementById('sugerenciasModal')
    if (!modal) {
      modal = this.createSugerenciasModal()
      document.body.appendChild(modal)
    }

    // Obtener configuración de categoría
    const categoryConfig = {
      'INVENTARIO': { bgClass: 'bg-blue-100', iconColor: 'text-blue-600', tagClass: 'text-blue-600 bg-blue-50' },
      'PRECIOS': { bgClass: 'bg-green-100', iconColor: 'text-green-600', tagClass: 'text-green-600 bg-green-50' },
      'VENTAS': { bgClass: 'bg-purple-100', iconColor: 'text-purple-600', tagClass: 'text-purple-600 bg-purple-50' },
      'MÁRGENES': { bgClass: 'bg-orange-100', iconColor: 'text-orange-600', tagClass: 'text-orange-600 bg-orange-50' },
      'PROVEEDORES': { bgClass: 'bg-indigo-100', iconColor: 'text-indigo-600', tagClass: 'text-indigo-600 bg-indigo-50' },
      'CRECIMIENTO': { bgClass: 'bg-pink-100', iconColor: 'text-pink-600', tagClass: 'text-pink-600 bg-pink-50' }
    }[recommendation.category] || { bgClass: 'bg-gray-100', iconColor: 'text-gray-600', tagClass: 'text-gray-600 bg-gray-50' }

    // Actualizar contenido del modal
    document.getElementById('sugerenciasModalCategory').textContent = recommendation.category
    document.getElementById('sugerenciasModalCategory').className = `text-sm font-medium px-3 py-1 rounded-full ${categoryConfig.tagClass}`
    document.getElementById('sugerenciasModalCategoryIcon').className = `${recommendation.icon} ${categoryConfig.iconColor}`
    document.getElementById('sugerenciasModalCategoryBg').className = `w-16 h-16 rounded-full flex items-center justify-center ${categoryConfig.bgClass}`
    document.getElementById('sugerenciasModalTitle').textContent = recommendation.title
    document.getElementById('sugerenciasModalDescription').textContent = recommendation.description

    // Mostrar modal
    modal.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }

  hideSugerenciasModal() {
    const modal = document.getElementById('sugerenciasModal')
    if (modal) {
      modal.classList.add('hidden')
      document.body.classList.remove('overflow-hidden')
    }
  }

  createSugerenciasModal() {
    const modal = document.createElement('div')
    modal.id = 'sugerenciasModal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden'
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-4">
                <div id="sugerenciasModalCategoryBg">
                  <i id="sugerenciasModalCategoryIcon"></i>
                </div>
                <div>
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 id="sugerenciasModalTitle" class="text-xl font-bold text-gray-900"></h3>
                    <span id="sugerenciasModalCategory"></span>
                  </div>
                  <p class="text-sm text-gray-500">Recomendación generada por JAVI</p>
                </div>
              </div>
              <button onclick="window.closeSugerenciasModal()" 
                      class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <div class="prose prose-sm max-w-none">
              <p id="sugerenciasModalDescription" class="text-gray-700 leading-relaxed text-base whitespace-pre-wrap"></p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="p-6 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex text-yellow-400">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <span class="ml-2 text-sm text-gray-600">Recomendación de JAVI</span>
              </div>
              <div class="flex space-x-3">
                <button class="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <i class="fas fa-bookmark"></i>
                  <span>Guardar</span>
                </button>
                <button class="flex items-center space-x-2 px-4 py-2 bg-[#8B7EC7] text-white rounded-lg hover:bg-[#7A6DB8] transition-colors">
                  <i class="fas fa-share"></i>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Event listeners para cerrar modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideSugerenciasModal()
      }
    })

    return modal
  }
}

// Initialize JAVI when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.javiAssistant = new JAVIAssistant()
})
