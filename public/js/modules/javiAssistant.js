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

    this.initializeElements()
    this.initializeEventListeners()
    this.loadStoredData()
    this.checkApiKey()
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
  }

  async checkApiKey() {
    const apiKey = localStorage.getItem("javi_api_key")
    if (apiKey) {
      try {
        await this.initializeGemini(apiKey)
        this.elements.apiKeyAlert?.classList.add("hidden")
        this.elements.removeApiKeyBtn?.classList.remove("hidden")
        this.addMessage(
          "system",
          "¡Hola! Soy JAVI, tu asistente inteligente para la papelería. ¿En qué puedo ayudarte hoy?",
        )
      } catch (error) {
        this.showApiKeyAlert()
      }
    } else {
      this.showApiKeyAlert()
    }
  }

  async initializeGemini(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

      this.updateStatus("Conectado", "online")
      return true
    } catch (error) {
      console.error("Error initializing Gemini:", error)
      this.updateStatus("Error de conexión", "error")
      throw new Error("API Key inválida o error de inicialización")
    }
  }

  updateStatus(text, status) {
    if (this.elements.javiStatusText) {
      this.elements.javiStatusText.textContent = text
    }

    if (this.elements.javiStatusIndicator) {
      this.elements.javiStatusIndicator.className =
        "w-3 h-3 rounded-full " +
        (status === "online" ? "bg-green-400" : status === "error" ? "bg-red-400" : "bg-gray-400")
    }
  }

  showApiKeyAlert() {
    this.elements.apiKeyAlert?.classList.remove("hidden")
    this.updateStatus("API Key requerida", "error")
  }

  showSettings() {
    this.elements.settingsModal?.classList.remove("hidden")
  }

  hideSettings() {
    this.elements.settingsModal?.classList.add("hidden")
  }

  async saveApiKey() {
    const apiKey = this.elements.apiKeyInput?.value.trim()
    if (!apiKey) {
      alert("Por favor ingresa una API Key válida.")
      return
    }

    try {
      await this.initializeGemini(apiKey)
      localStorage.setItem("javi_api_key", apiKey)
      this.elements.removeApiKeyBtn?.classList.remove("hidden")
      this.elements.apiKeyAlert?.classList.add("hidden")
      this.hideSettings()
      this.addMessage("system", "✅ API Key guardada correctamente. ¡Comencemos a analizar tu negocio!")
    } catch (error) {
      alert("Error: API Key inválida. Por favor verifica tu clave.")
    }
  }

  removeApiKey() {
    if (confirm("¿Seguro que quieres eliminar la API Key?")) {
      localStorage.removeItem("javi_api_key")
      this.elements.apiKeyInput.value = ""
      this.elements.removeApiKeyBtn?.classList.add("hidden")
      this.geminiModel = null
      this.showApiKeyAlert()
      this.elements.chatMessages.innerHTML = ""
    }
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
    return `Eres JAVI, un asistente inteligente especializado en gestión de papelerías. Tu rol es analizar datos de inventario, ventas y precios para dar recomendaciones estratégicas.

CONTEXTO ACTUAL DEL NEGOCIO:
${context}

INSTRUCCIONES:
- Analiza los datos proporcionados
- Da recomendaciones específicas y accionables
- Enfócate en optimización de inventario, precios competitivos y estrategias de restock
- Usa un tono profesional pero amigable
- Incluye números y datos específicos cuando sea relevante

PREGUNTA DEL USUARIO: ${message}

Responde de manera clara y estructurada:`
  }

  async buildContext() {
    try {
      const [products, sales] = await Promise.all([
        this.inventoryService.getProducts().catch(() => []),
        this.salesService.getSales({ limit: 50 }).catch(() => ({ sales: [] })),
      ])

      const inventoryData = this.analyzeInventoryData(products)
      const salesData = this.analyzeSalesData(sales.sales || [])

      return `
INVENTARIO ACTUAL:
- Total de productos: ${products.length}
- Productos con stock bajo (≤10): ${inventoryData.lowStock}
- Productos agotados: ${inventoryData.outOfStock}
- Valor total del inventario: $${inventoryData.totalValue.toFixed(2)}
- Categorías principales: ${inventoryData.topCategories.join(", ")}

DATOS DE VENTAS:
- Ventas recientes: ${salesData.totalSales}
- Ingresos totales: $${salesData.totalRevenue.toFixed(2)}
- Productos más vendidos: ${salesData.topProducts.join(", ")}
- Tendencia de ventas: ${salesData.trend}

ALERTAS IMPORTANTES:
${inventoryData.alerts.join("\n")}
            `
    } catch (error) {
      console.error("Error building context:", error)
      return "Datos de contexto no disponibles temporalmente."
    }
  }

  analyzeInventoryData(products) {
    const data = {
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      topCategories: [],
      alerts: [],
    }

    const categoryCount = {}

    products.forEach((product) => {
      const stock = product.stock || 0
      const price = product.price || 0

      if (stock === 0) {
        data.outOfStock++
        data.alerts.push(`⚠️ ${product.name} está agotado`)
      } else if (stock <= 10) {
        data.lowStock++
        data.alerts.push(`📉 ${product.name} tiene stock bajo (${stock} unidades)`)
      }

      data.totalValue += stock * price

      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
      }
    })

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
    }

    const productSales = {}

    sales.forEach((sale) => {
      data.totalRevenue += sale.total || 0

      if (sale.items) {
        sale.items.forEach((item) => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity
        })
      }
    })

    data.topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([product]) => product)

    return data
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

  async generateRecommendations() {
    if (!this.geminiModel) {
      alert("Configura tu API Key primero")
      return
    }

    try {
      const context = await this.buildContext()
      const prompt = `Basándote en estos datos de la papelería, genera 3 recomendaciones estratégicas específicas:

${context}

Formato de respuesta:
1. **Título de recomendación**: Descripción breve y acción específica
2. **Título de recomendación**: Descripción breve y acción específica  
3. **Título de recomendación**: Descripción breve y acción específica

Enfócate en: optimización de inventario, estrategias de precios, y oportunidades de crecimiento.`

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
    if (!this.elements.recommendationsGrid) return

    const recommendationItems = recommendations.split(/\d+\./).filter((item) => item.trim())

    this.elements.recommendationsGrid.innerHTML = recommendationItems
      .map((item, index) => {
        const [title, ...descParts] = item.split(":")
        const description = descParts.join(":").trim()

        return `
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div class="flex items-start space-x-3">
                        <div class="w-8 h-8 bg-[#8B7EC7] text-white rounded-full flex items-center justify-center text-sm font-medium">
                            ${index + 1}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-medium text-gray-900 mb-2">${title.replace(/\*\*/g, "").trim()}</h3>
                            <p class="text-sm text-gray-600">${description}</p>
                            <div class="mt-3 flex items-center justify-between">
                                <span class="text-xs text-gray-500">Generado por JAVI</span>
                                <button class="text-xs text-[#8B7EC7] hover:text-[#7A6DB8] font-medium">
                                    Ver detalles
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
      })
      .join("")
  }

  saveConversation() {
    localStorage.setItem("javi_conversation", JSON.stringify(this.conversationHistory))
  }

  saveRecommendations(recommendations) {
    const timestamp = new Date().toISOString()
    const savedRecommendations = JSON.parse(localStorage.getItem("javi_recommendations") || "[]")
    savedRecommendations.unshift({ timestamp, content: recommendations })

    // Keep only last 10 recommendations
    if (savedRecommendations.length > 10) {
      savedRecommendations.splice(10)
    }

    localStorage.setItem("javi_recommendations", JSON.stringify(savedRecommendations))
  }

  loadStoredData() {
    // Load conversation history
    const conversation = localStorage.getItem("javi_conversation")
    if (conversation) {
      this.conversationHistory = JSON.parse(conversation)
    }

    // Load and display recent recommendations
    const recommendations = localStorage.getItem("javi_recommendations")
    if (recommendations) {
      const parsed = JSON.parse(recommendations)
      if (parsed.length > 0) {
        this.displayRecommendations(parsed[0].content)
      }
    }
  }
}

// Initialize JAVI when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.javiAssistant = new JAVIAssistant()
})
