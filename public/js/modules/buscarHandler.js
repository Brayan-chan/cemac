class BuscarHandler {
  constructor() {
    this.proveedoresData = []
    this.historicalData = [] // Added to store historical price data
    this.filteredResults = []
    this.currentSearchTerm = ""

    this.initializeElements()
    this.initializeEventListeners()
    this.loadProveedoresData()
  }

  initializeElements() {
    this.elements = {
      // Left column search
      leftSearchInput: document.querySelector('.grid > div:first-child input[type="text"]'),
      leftResultsContainer: document.querySelector(".grid > div:first-child .space-y-4"),

      // Right column search (for comparison)
      rightSearchInput: document.querySelector('.grid > div:last-child input[type="text"]'),
      rightResultsContainer: document.querySelector(".grid > div:last-child .space-y-4"),
    }

    console.log("[v0] Elements initialized:", this.elements)
  }

  initializeEventListeners() {
    // Left search input
    if (this.elements.leftSearchInput) {
      this.elements.leftSearchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value, "left")
      })
    }

    // Right search input
    if (this.elements.rightSearchInput) {
      this.elements.rightSearchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value, "right")
      })
    }

    // Show empty state initially
    this.showEmptyState("left")
    this.showEmptyState("right")
  }

  async loadProveedoresData() {
    try {
      const response = await fetch("big-data/proveedores.txt")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()
      this.parseProveedoresData(text)
      console.log(`[v0] ✅ Cargados ${this.proveedoresData.length} registros de proveedores`)
      console.log(`[v0] ✅ Cargados ${this.historicalData.length} registros históricos`)
    } catch (error) {
      console.error("[v0] Error cargando datos de proveedores:", error)
      this.showError("No se pudieron cargar los datos de proveedores")
    }
  }

  parseProveedoresData(text) {
    const lines = text.split("\n")
    this.proveedoresData = []
    this.historicalData = [] // Store all historical entries

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parse CSV line (handling quoted values)
      const values = this.parseCSVLine(line)

      if (values.length < 3) continue

      const id = values[0]
      const producto = values[1]
      const categoria = values[2]
      const unidad = values[3]
      const fecha = values[11] || new Date().toISOString().split("T")[0] // Extract date

      // Parse prices from different suppliers
      const precioTonyMenudeo = this.parsePrice(values[4])
      const precioTonyMayoreo = this.parsePrice(values[5])
      const precioKymMenudeo = this.parsePrice(values[6])
      const precioKymMayoreo = this.parsePrice(values[7])
      const precioDIPATH = this.parsePrice(values[8])
      const precioDepositoPapelero = this.parsePrice(values[9])
      const precioColorprinter = this.parsePrice(values[10])

      const addHistoricalEntry = (precio, proveedor, tipo) => {
        if (precio) {
          this.historicalData.push({
            id,
            producto,
            categoria,
            unidad,
            precio,
            proveedor,
            tipo,
            fecha,
          })
        }
      }

      // Add entries for each supplier that has a price
      if (precioTonyMenudeo) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioTonyMenudeo,
          proveedor: "Tony (Menudeo)",
          tipo: "menudeo",
        })
        addHistoricalEntry(precioTonyMenudeo, "Tony (Menudeo)", "menudeo")
      }

      if (precioTonyMayoreo) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioTonyMayoreo,
          proveedor: "Tony (Mayoreo)",
          tipo: "mayoreo",
        })
        addHistoricalEntry(precioTonyMayoreo, "Tony (Mayoreo)", "mayoreo")
      }

      if (precioKymMenudeo) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioKymMenudeo,
          proveedor: "Kym (Menudeo)",
          tipo: "menudeo",
        })
        addHistoricalEntry(precioKymMenudeo, "Kym (Menudeo)", "menudeo")
      }

      if (precioKymMayoreo) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioKymMayoreo,
          proveedor: "Kym (Mayoreo)",
          tipo: "mayoreo",
        })
        addHistoricalEntry(precioKymMayoreo, "Kym (Mayoreo)", "mayoreo")
      }

      if (precioDIPATH) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioDIPATH,
          proveedor: "DIPATH",
          tipo: "general",
        })
        addHistoricalEntry(precioDIPATH, "DIPATH", "general")
      }

      if (precioDepositoPapelero) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioDepositoPapelero,
          proveedor: "Depósito Papelero",
          tipo: "general",
        })
        addHistoricalEntry(precioDepositoPapelero, "Depósito Papelero", "general")
      }

      if (precioColorprinter) {
        this.proveedoresData.push({
          id,
          producto,
          categoria,
          unidad,
          precio: precioColorprinter,
          proveedor: "Colorprinter",
          tipo: "general",
        })
        addHistoricalEntry(precioColorprinter, "Colorprinter", "general")
      }
    }
  }

  parseCSVLine(line) {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr.trim() === "" || priceStr === ".") return null
    const cleaned = priceStr.replace(/[,$]/g, "").trim()
    const price = Number.parseFloat(cleaned)
    return isNaN(price) ? null : price
  }

  handleSearch(searchTerm, column) {
    this.currentSearchTerm = searchTerm.toLowerCase()

    if (!searchTerm.trim()) {
      this.showEmptyState(column)
      return
    }

    // Filter products by search term
    const results = this.proveedoresData.filter((item) => item.producto.toLowerCase().includes(this.currentSearchTerm))

    // Group by product name and find best prices
    const groupedResults = this.groupAndCompareProducts(results)

    // Display results
    this.displayResults(groupedResults, column)
  }

  groupAndCompareProducts(results) {
    const grouped = {}

    results.forEach((item) => {
      const productKey = item.producto.toLowerCase()
      if (!grouped[productKey]) {
        grouped[productKey] = {
          producto: item.producto,
          categoria: item.categoria,
          ofertas: [],
        }
      }
      grouped[productKey].ofertas.push({
        proveedor: item.proveedor,
        precio: item.precio,
      })
    })

    // Sort offers by price and calculate savings
    Object.values(grouped).forEach((product) => {
      product.ofertas.sort((a, b) => a.precio - b.precio)

      if (product.ofertas.length > 1) {
        const precioMasBajo = product.ofertas[0].precio
        const precioMasAlto = product.ofertas[product.ofertas.length - 1].precio
        product.ahorroPotencial = precioMasAlto - precioMasBajo
        product.porcentajeAhorro = ((product.ahorroPotencial / precioMasAlto) * 100).toFixed(1)
      }
    })

    return Object.values(grouped)
  }

  displayResults(results, column) {
    const container = column === "left" ? this.elements.leftResultsContainer : this.elements.rightResultsContainer

    if (!container) return

    if (results.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-lg p-8 text-center">
          <i class="fas fa-search text-gray-300 text-4xl mb-4"></i>
          <p class="text-gray-500">No se encontraron productos</p>
          <p class="text-sm text-gray-400 mt-2">Intenta con otro término de búsqueda</p>
        </div>
      `
      return
    }

    container.innerHTML = results
      .map((product) => {
        const mejorOferta = product.ofertas[0]
        const tieneMultiplesOfertas = product.ofertas.length > 1

        return `
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div class="flex items-start">
            <div class="w-12 h-12 bg-gradient-to-br from-[#8B7EC7] to-[#7A6DB8] rounded-lg mr-4 flex items-center justify-center">
              <i class="fas fa-box text-white text-xl"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-gray-900">${product.producto}</h3>
              <p class="text-sm text-gray-500">
                ${product.categoria} • ${product.ofertas.length} proveedor${product.ofertas.length > 1 ? "es" : ""}
                ${tieneMultiplesOfertas ? ` • Ahorra hasta ${product.porcentajeAhorro}%` : ""}
              </p>
               
              <div class="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-green-700 font-medium">Mejor precio</p>
                    <p class="text-sm font-semibold text-green-900">${mejorOferta.proveedor}</p>
                  </div>
                  <p class="text-lg font-bold text-green-700">$${mejorOferta.precio.toFixed(2)}</p>
                </div>
              </div>

              ${
                tieneMultiplesOfertas
                  ? `
                <div class="mt-2 space-y-1">
                  ${product.ofertas
                    .slice(1, 3)
                    .map(
                      (oferta) => `
                    <div class="flex items-center justify-between text-xs text-gray-600 p-1">
                      <span>${oferta.proveedor}</span>
                      <span class="font-medium">$${oferta.precio.toFixed(2)}</span>
                    </div>
                  `,
                    )
                    .join("")}
                  ${
                    product.ofertas.length > 3
                      ? `
                    <button onclick="buscarHandler.showAllOffers('${product.producto.replace(/'/g, "\\'")}');" 
                            class="text-xs text-[#8B7EC7] hover:text-[#7A6DB8] font-medium">
                      Ver ${product.ofertas.length - 3} más...
                    </button>
                  `
                      : ""
                  }
                </div>
              `
                  : ""
              }

              <div class="mt-3 flex items-center space-x-2">
                <button onclick="buscarHandler.compareProduct('${product.producto.replace(/'/g, "\\'")}');" 
                        class="text-xs bg-[#8B7EC7] text-white px-3 py-1 rounded-lg hover:bg-[#7A6DB8] transition-colors">
                  <i class="fas fa-balance-scale mr-1"></i>
                  Comparar
                </button>
                <button onclick="buscarHandler.showPriceHistory('${product.producto.replace(/'/g, "\\'")}');" 
                        class="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                  <i class="fas fa-chart-line mr-1"></i>
                  Ver historial
                </button>
              </div>
            </div>
          </div>
        </div>
      `
      })
      .join("")
  }

  showEmptyState(column) {
    const container = column === "left" ? this.elements.leftResultsContainer : this.elements.rightResultsContainer

    if (!container) return

    container.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <i class="fas fa-search text-gray-300 text-4xl mb-4"></i>
        <p class="text-gray-500">Busca productos para comparar precios</p>
        <p class="text-sm text-gray-400 mt-2">Escribe el nombre de un producto en el campo de búsqueda</p>
      </div>
    `
  }

  showAllOffers(productName) {
    const product = this.groupAndCompareProducts(
      this.proveedoresData.filter((item) => item.producto === productName),
    )[0]

    if (!product) return

    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">${product.producto}</h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <p class="text-sm text-gray-600 mb-4">
          Comparación de precios entre ${product.ofertas.length} proveedores
        </p>

        <div class="space-y-2">
          ${product.ofertas
            .map(
              (oferta, index) => `
            <div class="flex items-center justify-between p-3 rounded-lg ${index === 0 ? "bg-green-50 border border-green-200" : "bg-gray-50"}">
              <div class="flex items-center space-x-3">
                ${index === 0 ? '<i class="fas fa-trophy text-green-600"></i>' : `<span class="text-gray-400">${index + 1}</span>`}
                <span class="font-medium ${index === 0 ? "text-green-900" : "text-gray-700"}">${oferta.proveedor}</span>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold ${index === 0 ? "text-green-700" : "text-gray-900"}">$${oferta.precio.toFixed(2)}</p>
                ${index > 0 ? `<p class="text-xs text-red-600">+$${(oferta.precio - product.ofertas[0].precio).toFixed(2)}</p>` : ""}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-900">
            <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
            <strong>Ahorro potencial:</strong> Comprando con ${product.ofertas[0].proveedor} ahorras 
            $${product.ahorroPotencial.toFixed(2)} (${product.porcentajeAhorro}%) comparado con el precio más alto.
          </p>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  showPriceHistory(productName) {
    const historicalEntries = this.historicalData.filter((item) => item.producto === productName)

    if (historicalEntries.length === 0) {
      alert("No hay datos históricos disponibles para este producto")
      return
    }

    // Group by supplier and sort by date
    const bySupplier = {}
    historicalEntries.forEach((entry) => {
      if (!bySupplier[entry.proveedor]) {
        bySupplier[entry.proveedor] = []
      }
      bySupplier[entry.proveedor].push(entry)
    })

    // Sort each supplier's entries by date
    Object.keys(bySupplier).forEach((supplier) => {
      bySupplier[supplier].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    })

    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">
            <i class="fas fa-chart-line text-[#8B7EC7] mr-2"></i>
            Historial de Precios
          </h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="mb-4 p-3 bg-[#8B7EC7]/10 rounded-lg">
          <p class="font-medium text-[#8B7EC7]">${productName}</p>
          <p class="text-sm text-gray-600">${historicalEntries.length} registros históricos</p>
        </div>

        ${Object.keys(bySupplier)
          .map((supplier) => {
            const entries = bySupplier[supplier]
            const firstPrice = entries[0].precio
            const lastPrice = entries[entries.length - 1].precio
            const priceChange = lastPrice - firstPrice
            const percentChange = ((priceChange / firstPrice) * 100).toFixed(1)

            return `
            <div class="mb-6 border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-gray-900">${supplier}</h3>
                <div class="text-right">
                  <p class="text-sm text-gray-600">Cambio total</p>
                  <p class="font-bold ${priceChange >= 0 ? "text-red-600" : "text-green-600"}">
                    ${priceChange >= 0 ? "+" : ""}$${priceChange.toFixed(2)} (${percentChange}%)
                  </p>
                </div>
              </div>
              
              <div class="space-y-2">
                ${entries
                  .map((entry, index) => {
                    const prevPrice = index > 0 ? entries[index - 1].precio : entry.precio
                    const change = entry.precio - prevPrice

                    return `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div class="flex items-center space-x-3">
                        <span class="text-xs text-gray-500">${entry.fecha}</span>
                        ${
                          index > 0 && change !== 0
                            ? `
                          <span class="text-xs ${change > 0 ? "text-red-600" : "text-green-600"}">
                            ${change > 0 ? "↑" : "↓"} $${Math.abs(change).toFixed(2)}
                          </span>
                        `
                            : ""
                        }
                      </div>
                      <span class="font-medium">$${entry.precio.toFixed(2)}</span>
                    </div>
                  `
                  })
                  .join("")}
              </div>
            </div>
          `
          })
          .join("")}

        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-900">
            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
            <strong>Análisis:</strong> Los datos históricos muestran la evolución de precios de cada proveedor a lo largo del tiempo.
            Usa esta información para identificar tendencias y tomar mejores decisiones de compra.
          </p>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  compareProduct(productName) {
    // Get all offers for this product from all suppliers
    const allOffers = this.proveedoresData.filter((item) => item.producto === productName)

    if (allOffers.length === 0) {
      this.showError("No se encontraron ofertas para este producto")
      return
    }

    // Group and analyze the offers
    const productData = this.groupAndCompareProducts(allOffers)[0]

    // Display detailed comparison in the right column
    this.displayDetailedComparison(productData)
  }

  displayDetailedComparison(productData) {
    const container = this.elements.rightResultsContainer
    if (!container) return

    // Calculate statistics
    const precios = productData.ofertas.map((o) => o.precio)
    const precioMinimo = Math.min(...precios)
    const precioMaximo = Math.max(...precios)
    const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length
    const ahorro = precioMaximo - precioMinimo
    const porcentajeAhorro = ((ahorro / precioMaximo) * 100).toFixed(1)

    // Sort offers by price
    const ofertasOrdenadas = [...productData.ofertas].sort((a, b) => a.precio - b.precio)
    const mejorOferta = ofertasOrdenadas[0]
    const peorOferta = ofertasOrdenadas[ofertasOrdenadas.length - 1]

    const historicalEntries = this.historicalData.filter((item) => item.producto === productData.producto)
    const hasHistory = historicalEntries.length > 0

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg border-2 border-[#8B7EC7] overflow-hidden">

        <div class="bg-gradient-to-r from-[#8B7EC7] to-[#7A6DB8] p-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-white font-bold text-lg">${productData.producto}</h2>
              <p class="text-white/80 text-sm">${productData.categoria}</p>
            </div>
            <button onclick="buscarHandler.clearComparison()" class="text-white/80 hover:text-white">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div class="p-4 bg-gray-50 grid grid-cols-2 gap-3">
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">Mejor Precio</p>
            <p class="text-2xl font-bold text-green-600">$${precioMinimo.toFixed(2)}</p>
            <p class="text-xs text-gray-600 mt-1">${mejorOferta.proveedor}</p>
          </div>
          
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">Peor Precio</p>
            <p class="text-2xl font-bold text-red-600">$${precioMaximo.toFixed(2)}</p>
            <p class="text-xs text-gray-600 mt-1">${peorOferta.proveedor}</p>
          </div>
          
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">Precio Promedio</p>
            <p class="text-2xl font-bold text-blue-600">$${precioPromedio.toFixed(2)}</p>
          </div>
          
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">Ahorro Potencial</p>
            <p class="text-2xl font-bold text-purple-600">${porcentajeAhorro}%</p>
            <p class="text-xs text-gray-600 mt-1">$${ahorro.toFixed(2)}</p>
          </div>
        </div>

        <div class="p-4 bg-green-50 border-y border-green-200">
          <div class="flex items-center">
            <i class="fas fa-trophy text-green-600 text-2xl mr-3"></i>
            <div class="flex-1">
              <p class="text-sm font-medium text-green-900">🎯 Mejor Oferta</p>
              <p class="text-lg font-bold text-green-700">${mejorOferta.proveedor} - $${mejorOferta.precio.toFixed(2)}</p>
            </div>
            ${
              hasHistory
                ? `
              <button onclick="buscarHandler.showPriceHistory('${productData.producto.replace(/'/g, "\\'")}');" 
                      class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                <i class="fas fa-chart-line mr-1"></i>
                Ver historial
              </button>
            `
                : ""
            }
          </div>
        </div>

        <div class="p-4">
          <h3 class="font-bold text-gray-900 mb-3 flex items-center">
            <i class="fas fa-list-ul text-[#8B7EC7] mr-2"></i>
            Comparación Detallada (${ofertasOrdenadas.length} proveedores)
          </h3>
          
          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${ofertasOrdenadas
              .map((oferta, index) => {
                const diferencia = oferta.precio - precioMinimo
                const porcentajeDiferencia = precioMinimo > 0 ? ((diferencia / precioMinimo) * 100).toFixed(1) : 0
                const esMejor = index === 0
                const esPeor = index === ofertasOrdenadas.length - 1

                return `
                <div class="flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-md
                            ${esMejor ? "bg-green-50 border-green-300" : esPeor ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}">
                  <div class="flex items-center space-x-3 flex-1">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold
                                ${esMejor ? "bg-green-600 text-white" : esPeor ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"}">
                      ${esMejor ? "👑" : index + 1}
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold ${esMejor ? "text-green-900" : esPeor ? "text-red-900" : "text-gray-900"}">
                        ${oferta.proveedor}
                      </p>
                      ${
                        diferencia > 0
                          ? `
                        <p class="text-xs ${esPeor ? "text-red-600" : "text-orange-600"}">
                          +$${diferencia.toFixed(2)} más caro (+${porcentajeDiferencia}%)
                        </p>
                      `
                          : `
                        <p class="text-xs text-green-600 font-medium">
                          ✓ Precio más bajo
                        </p>
                      `
                      }
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-bold ${esMejor ? "text-green-700" : esPeor ? "text-red-700" : "text-gray-900"}">
                      $${oferta.precio.toFixed(2)}
                    </p>
                  </div>
                </div>
              `
              })
              .join("")}
          </div>
        </div>

        <div class="p-4 bg-blue-50 border-t border-blue-200">
          <h3 class="font-bold text-blue-900 mb-2 flex items-center">
            <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
            Recomendaciones de Compra
          </h3>
          <ul class="space-y-2 text-sm text-blue-900">
            <li class="flex items-start">
              <i class="fas fa-check-circle text-blue-600 mr-2 mt-0.5"></i>
              <span>Comprando con <strong>${mejorOferta.proveedor}</strong> ahorras <strong>$${ahorro.toFixed(2)}</strong> (${porcentajeAhorro}%) vs el precio más alto</span>
            </li>
            ${
              ofertasOrdenadas.length > 2
                ? `
              <li class="flex items-start">
                <i class="fas fa-chart-line text-blue-600 mr-2 mt-0.5"></i>
                <span>Hay <strong>${ofertasOrdenadas.length}</strong> opciones disponibles. Considera negociar con proveedores de precio medio.</span>
              </li>
            `
                : ""
            }
            ${
              porcentajeAhorro > 20
                ? `
              <li class="flex items-start">
                <i class="fas fa-exclamation-triangle text-orange-600 mr-2 mt-0.5"></i>
                <span>La diferencia de precios es significativa (${porcentajeAhorro}%). Verifica calidad y condiciones de entrega.</span>
              </li>
            `
                : ""
            }
            <li class="flex items-start">
              <i class="fas fa-calculator text-blue-600 mr-2 mt-0.5"></i>
              <span>Precio promedio del mercado: <strong>$${precioPromedio.toFixed(2)}</strong></span>
            </li>
            ${
              hasHistory
                ? `
              <li class="flex items-start">
                <i class="fas fa-history text-blue-600 mr-2 mt-0.5"></i>
                <span>Hay datos históricos disponibles. <button onclick="buscarHandler.showPriceHistory('${productData.producto.replace(/'/g, "\\'")}');" class="text-[#8B7EC7] hover:underline font-medium">Ver evolución de precios</button></span>
              </li>
            `
                : ""
            }
          </ul>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button onclick="buscarHandler.clearComparison()" 
                  class="text-gray-600 hover:text-gray-800 transition-colors text-sm">
            <i class="fas fa-arrow-left mr-1"></i>
            Nueva búsqueda
          </button>
          <button onclick="buscarHandler.exportComparison('${productData.producto.replace(/'/g, "\\'")}');" 
                  class="bg-[#8B7EC7] text-white px-4 py-2 rounded-lg hover:bg-[#7A6DB8] transition-colors text-sm">
            <i class="fas fa-download mr-1"></i>
            Exportar comparación
          </button>
        </div>
      </div>
    `
  }

  clearComparison() {
    if (this.elements.rightSearchInput) {
      this.elements.rightSearchInput.value = ""
    }
    this.showEmptyState("right")
  }

  exportComparison(productName) {
    const allOffers = this.proveedoresData.filter((item) => item.producto === productName)
    const productData = this.groupAndCompareProducts(allOffers)[0]

    const precios = productData.ofertas.map((o) => o.precio)
    const precioMinimo = Math.min(...precios)
    const precioMaximo = Math.max(...precios)
    const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length
    const ahorro = precioMaximo - precioMinimo
    const porcentajeAhorro = ((ahorro / precioMaximo) * 100).toFixed(1)

    const ofertasOrdenadas = [...productData.ofertas].sort((a, b) => a.precio - b.precio)

    let exportText = `COMPARACIÓN DE PRECIOS - ${productData.producto}\n`
    exportText += `Categoría: ${productData.categoria}\n`
    exportText += `Fecha: ${new Date().toLocaleDateString("es-MX")}\n`
    exportText += `\n${"=".repeat(60)}\n\n`

    exportText += `RESUMEN:\n`
    exportText += `- Mejor precio: $${precioMinimo.toFixed(2)} (${ofertasOrdenadas[0].proveedor})\n`
    exportText += `- Peor precio: $${precioMaximo.toFixed(2)} (${ofertasOrdenadas[ofertasOrdenadas.length - 1].proveedor})\n`
    exportText += `- Precio promedio: $${precioPromedio.toFixed(2)}\n`
    exportText += `- Ahorro potencial: $${ahorro.toFixed(2)} (${porcentajeAhorro}%)\n`
    exportText += `\n${"=".repeat(60)}\n\n`

    exportText += `COMPARACIÓN DETALLADA (${ofertasOrdenadas.length} proveedores):\n\n`
    ofertasOrdenadas.forEach((oferta, index) => {
      const diferencia = oferta.precio - precioMinimo
      exportText += `${index + 1}. ${oferta.proveedor}\n`
      exportText += `   Precio: $${oferta.precio.toFixed(2)}`
      if (diferencia > 0) {
        exportText += ` (+$${diferencia.toFixed(2)})`
      } else {
        exportText += ` ✓ MEJOR PRECIO`
      }
      exportText += `\n\n`
    })

    // Create download
    const blob = new Blob([exportText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparacion-${productName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  showError(message) {
    console.error("[v0]", message)
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Inicializando BuscarHandler...")
  window.buscarHandler = new BuscarHandler()
})
