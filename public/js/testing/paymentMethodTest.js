/**
 * Tests para verificar la funcionalidad del método de pago
 */
async function testPaymentMethods() {
  console.log("💳 === TEST DE MÉTODOS DE PAGO ===")
  
  if (typeof salesHandler === 'undefined') {
    console.error("❌ salesHandler no está disponible")
    return
  }
  
  try {
    console.log("1️⃣ Verificando elementos DOM...")
    const paymentButtons = document.querySelectorAll(".payment-method-btn")
    const selectedMethodDisplay = document.getElementById("selectedPaymentMethod")
    const notesTextarea = document.getElementById("saleNotes")
    
    console.log("   Botones de pago encontrados:", paymentButtons.length)
    console.log("   Display de método seleccionado:", selectedMethodDisplay ? "✅" : "❌")
    console.log("   Textarea de notas:", notesTextarea ? "✅" : "❌")
    
    // Listar métodos disponibles
    const methods = Array.from(paymentButtons).map(btn => btn.dataset.method)
    console.log("   Métodos disponibles:", methods)
    
    console.log("2️⃣ Estado inicial...")
    console.log("   Método por defecto:", salesHandler.currentSale.paymentMethod)
    console.log("   Notas iniciales:", salesHandler.currentSale.notes || "(vacías)")
    
    console.log("3️⃣ Probando cambios de método de pago...")
    const testMethods = ["tarjeta", "transferencia", "digital", "efectivo"]
    
    for (let i = 0; i < testMethods.length; i++) {
      const method = testMethods[i]
      const button = document.querySelector(`[data-method="${method}"]`)
      
      if (button) {
        console.log(`   Probando ${method}...`)
        
        // Simular clic
        button.click()
        
        // Verificar cambio
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log(`     Estado interno: ${salesHandler.currentSale.paymentMethod}`)
        console.log(`     Display UI: ${selectedMethodDisplay?.textContent}`)
        console.log(`     Botón activo: ${button.classList.contains('active') ? '✅' : '❌'}`)
        
        // Verificar que solo este botón está activo
        const activeButtons = document.querySelectorAll(".payment-method-btn.active")
        console.log(`     Botones activos: ${activeButtons.length} (debería ser 1)`)
        
      } else {
        console.log(`   ❌ Botón para ${method} no encontrado`)
      }
    }
    
    console.log("4️⃣ Probando notas...")
    if (notesTextarea) {
      const testNote = "Nota de prueba - Cliente frecuente"
      notesTextarea.value = testNote
      notesTextarea.dispatchEvent(new Event('input'))
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log("   Nota ingresada:", testNote)
      console.log("   Estado interno:", salesHandler.currentSale.notes)
      console.log("   ✅", salesHandler.currentSale.notes === testNote ? "CORRECTO" : "ERROR")
    }
    
    console.log("5️⃣ Probando reseteo...")
    salesHandler.resetSale()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log("   Método después del reset:", salesHandler.currentSale.paymentMethod)
    console.log("   Notas después del reset:", salesHandler.currentSale.notes || "(vacías)")
    console.log("   Display después del reset:", selectedMethodDisplay?.textContent)
    
    // Verificar que efectivo esté activo (por defecto)
    const efectivoBtn = document.querySelector('[data-method="efectivo"]')
    console.log("   Efectivo activo después del reset:", efectivoBtn?.classList.contains('active') ? '✅' : '❌')
    
    console.log("✅ Test de métodos de pago completado")
    
  } catch (error) {
    console.error("❌ Error en test de métodos de pago:", error)
  }
}

/**
 * Test de integración: método de pago en una venta completa
 */
async function testPaymentMethodInSale() {
  console.log("🛒 === TEST DE MÉTODO DE PAGO EN VENTA ===")
  
  if (typeof salesHandler === 'undefined') {
    console.error("❌ salesHandler no está disponible")
    return
  }
  
  try {
    console.log("1️⃣ Configurando venta de prueba...")
    
    // Limpiar venta actual
    salesHandler.resetSale()
    
    // Agregar producto ficticio
    const testProduct = {
      id: "test_prod_payment",
      name: "Producto para Test de Pago",
      price: 150.00,
      quantity: 1
    }
    
    salesHandler.currentSale.products.push(testProduct)
    salesHandler.updateProductTable()
    console.log("   Producto agregado: $150.00")
    
    // Configurar descuento e IVA
    salesHandler.currentSale.descuento = 10
    salesHandler.currentSale.iva = 16
    salesHandler.updateTotals()
    console.log("   Descuento 10% e IVA 16% aplicados")
    
    console.log("2️⃣ Probando diferentes métodos de pago...")
    const paymentMethods = ["efectivo", "tarjeta", "transferencia", "digital"]
    
    for (const method of paymentMethods) {
      console.log(`   Configurando método: ${method}`)
      
      // Simular selección de método
      const button = document.querySelector(`[data-method="${method}"]`)
      if (button) {
        button.click()
      }
      
      // Agregar nota específica
      const methodNote = `Venta con ${method} - Cliente ${method === 'efectivo' ? 'en mostrador' : 'corporativo'}`
      salesHandler.currentSale.notes = methodNote
      
      // Mostrar datos que se enviarían a la API
      const saleData = {
        cliente: salesHandler.currentSale.cliente || "Cliente General",
        vendedor: salesHandler.currentSale.vendedor || "No asignado",
        products: salesHandler.currentSale.products,
        descuento: salesHandler.currentSale.descuento,
        iva: salesHandler.currentSale.iva,
        paymentMethod: salesHandler.currentSale.paymentMethod,
        notes: salesHandler.currentSale.notes
      }
      
      console.log(`   📄 Datos de venta con ${method}:`)
      console.log("     Método de pago:", saleData.paymentMethod)
      console.log("     Notas:", saleData.notes)
      console.log("     Total productos:", saleData.products.length)
      console.log("")
    }
    
    console.log("✅ Test de integración completado")
    
  } catch (error) {
    console.error("❌ Error en test de integración:", error)
  }
}

/**
 * Mostrar resumen del estado actual del método de pago
 */
function showPaymentMethodStatus() {
  console.log("📊 === ESTADO ACTUAL MÉTODO DE PAGO ===")
  
  if (typeof salesHandler === 'undefined') {
    console.error("❌ salesHandler no está disponible")
    return
  }
  
  const paymentButtons = document.querySelectorAll(".payment-method-btn")
  const selectedMethodDisplay = document.getElementById("selectedPaymentMethod")
  const notesTextarea = document.getElementById("saleNotes")
  
  console.log("Estado interno:")
  console.log("  Método:", salesHandler.currentSale.paymentMethod)
  console.log("  Notas:", salesHandler.currentSale.notes || "(vacías)")
  console.log("")
  
  console.log("Estado UI:")
  console.log("  Display método:", selectedMethodDisplay?.textContent)
  console.log("  Valor notas:", notesTextarea?.value || "(vacías)")
  console.log("")
  
  console.log("Botones disponibles:")
  paymentButtons.forEach(btn => {
    const method = btn.dataset.method
    const isActive = btn.classList.contains('active')
    console.log(`  ${method}: ${isActive ? '✅ ACTIVO' : '⚪ inactivo'}`)
  })
}

console.log("💳 Funciones de testing de métodos de pago disponibles:")
console.log("   testPaymentMethods() - Test básico de controles")
console.log("   testPaymentMethodInSale() - Test en venta completa") 
console.log("   showPaymentMethodStatus() - Mostrar estado actual")