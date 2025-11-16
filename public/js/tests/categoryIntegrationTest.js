// Archivo de pruebas para el sistema de categorías
// Ejecutar en la consola del navegador para probar funcionalidad

console.log("🏷️ Iniciando pruebas del sistema de categorías...");

// Test 1: Verificar carga de CategoryHandler
function testCategoryHandler() {
    console.log("\n📋 Test 1: Verificando CategoryHandler...");
    
    if (window.inventoryHandler && window.inventoryHandler.categoryHandler) {
        console.log("✅ CategoryHandler cargado correctamente");
        console.log("📊 Categorías disponibles:", window.inventoryHandler.categories.length);
        return true;
    } else {
        console.error("❌ CategoryHandler no disponible");
        return false;
    }
}

// Test 2: Verificar UI de categorías
function testCategoryUI() {
    console.log("\n🎨 Test 2: Verificando elementos UI de categorías...");
    
    const elements = {
        manageCategoriesBtn: document.getElementById("manageCategoriesBtn"),
        manageCategoriesModal: document.getElementById("manageCategoriesModal"),
        categoryFormModal: document.getElementById("categoryFormModal"),
        deleteCategoryModal: document.getElementById("deleteCategoryModal"),
        productCategory: document.getElementById("productCategory"),
        categoryFilter: document.getElementById("categoryFilter")
    };
    
    let allPresent = true;
    
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`✅ ${name} encontrado`);
        } else {
            console.error(`❌ ${name} no encontrado`);
            allPresent = false;
        }
    }
    
    return allPresent;
}

// Test 3: Simular creación de categoría
async function testCreateCategory() {
    console.log("\n➕ Test 3: Simulando creación de categoría...");
    
    if (!window.inventoryHandler || !window.inventoryHandler.categoryHandler) {
        console.error("❌ CategoryHandler no disponible");
        return false;
    }
    
    const testCategory = {
        name: `Categoría Test ${Date.now()}`,
        description: "Categoría creada para pruebas automatizadas"
    };
    
    try {
        console.log("📤 Enviando datos de prueba:", testCategory);
        const result = await window.inventoryHandler.categoryHandler.createCategory(testCategory);
        console.log("✅ Categoría creada exitosamente:", result);
        return true;
    } catch (error) {
        console.error("❌ Error al crear categoría:", error.message);
        return false;
    }
}

// Test 4: Verificar filtros de categoría
function testCategoryFilters() {
    console.log("\n🔍 Test 4: Verificando filtros de categoría...");
    
    const categoryFilter = document.getElementById("categoryFilter");
    if (!categoryFilter) {
        console.error("❌ Filtro de categoría no encontrado");
        return false;
    }
    
    const options = categoryFilter.querySelectorAll("option");
    console.log(`✅ Filtro tiene ${options.length} opciones`);
    
    options.forEach((option, index) => {
        console.log(`  ${index}: "${option.textContent}" (valor: "${option.value}")`);
    });
    
    return options.length > 0;
}

// Test 5: Verificar selector de categoría en producto
function testProductCategorySelector() {
    console.log("\n📦 Test 5: Verificando selector de categoría en producto...");
    
    const productCategory = document.getElementById("productCategory");
    if (!productCategory) {
        console.error("❌ Selector de categoría de producto no encontrado");
        return false;
    }
    
    const options = productCategory.querySelectorAll("option");
    console.log(`✅ Selector de producto tiene ${options.length} opciones`);
    
    const addNewBtn = document.getElementById("addNewCategoryBtn");
    if (addNewBtn) {
        console.log("✅ Botón 'Agregar nueva categoría' encontrado");
    } else {
        console.error("❌ Botón 'Agregar nueva categoría' no encontrado");
        return false;
    }
    
    return true;
}

// Test 6: Verificar modales de categorías
function testCategoryModals() {
    console.log("\n🪟 Test 6: Verificando funcionalidad de modales...");
    
    const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");
    if (!manageCategoriesBtn) {
        console.error("❌ Botón de gestionar categorías no encontrado");
        return false;
    }
    
    console.log("✅ Botón de gestionar categorías encontrado");
    console.log("🖱️ Simulando clic en gestionar categorías...");
    
    // Simular clic
    manageCategoriesBtn.click();
    
    setTimeout(() => {
        const modal = document.getElementById("manageCategoriesModal");
        if (modal && !modal.classList.contains("hidden")) {
            console.log("✅ Modal de categorías se abrió correctamente");
        } else {
            console.error("❌ Modal de categorías no se abrió");
        }
    }, 100);
    
    return true;
}

// Test 7: Verificar servicios de categoría
async function testCategoryService() {
    console.log("\n🌐 Test 7: Verificando servicios de categoría...");
    
    if (!window.inventoryHandler || !window.inventoryHandler.categoryHandler) {
        console.error("❌ CategoryHandler no disponible");
        return false;
    }
    
    try {
        console.log("📡 Intentando cargar categorías...");
        const categories = await window.inventoryHandler.categoryHandler.loadCategories();
        console.log("✅ Categorías cargadas:", categories.length);
        console.log("📋 Lista de categorías:", categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            productCount: cat.productCount
        })));
        return true;
    } catch (error) {
        console.error("❌ Error al cargar categorías:", error.message);
        return false;
    }
}

// Función principal para ejecutar todas las pruebas
async function runAllCategoryTests() {
    console.log("🚀 Ejecutando suite completa de pruebas de categorías...\n");
    
    const tests = [
        { name: "CategoryHandler", fn: testCategoryHandler },
        { name: "Category UI", fn: testCategoryUI },
        { name: "Category Service", fn: testCategoryService },
        { name: "Category Filters", fn: testCategoryFilters },
        { name: "Product Category Selector", fn: testProductCategorySelector },
        { name: "Category Modals", fn: testCategoryModals }
        // Comentamos el test de creación para evitar spam en la API
        // { name: "Create Category", fn: testCreateCategory }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name}: PASÓ`);
            } else {
                failed++;
                console.log(`❌ ${test.name}: FALLÓ`);
            }
        } catch (error) {
            failed++;
            console.error(`❌ ${test.name}: ERROR -`, error.message);
        }
    }
    
    console.log(`\n📊 Resultados finales:`);
    console.log(`✅ Pruebas pasadas: ${passed}`);
    console.log(`❌ Pruebas fallidas: ${failed}`);
    console.log(`📈 Tasa de éxito: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log("\n🎉 ¡Todas las pruebas pasaron! Sistema de categorías funcionando correctamente.");
    } else {
        console.log("\n⚠️ Algunas pruebas fallaron. Revisa los errores arriba.");
    }
}

// Función auxiliar para mostrar estadísticas de categorías
function showCategoryStats() {
    console.log("\n📈 Estadísticas del sistema de categorías:");
    
    if (window.inventoryHandler && window.inventoryHandler.categories) {
        const categories = window.inventoryHandler.categories;
        console.log(`📊 Total de categorías: ${categories.length}`);
        
        if (categories.length > 0) {
            console.log("\n📋 Detalles por categoría:");
            categories.forEach(cat => {
                console.log(`  🏷️ ${cat.name}: ${cat.productCount} producto(s)`);
                if (cat.description) {
                    console.log(`     📝 ${cat.description}`);
                }
            });
            
            const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);
            console.log(`\n📦 Total de productos categorizados: ${totalProducts}`);
            console.log(`📊 Promedio de productos por categoría: ${Math.round(totalProducts / categories.length)}`);
        }
    } else {
        console.log("❌ No hay datos de categorías disponibles");
    }
}

// Exportar funciones para uso manual
window.categoryTests = {
    runAllCategoryTests,
    testCategoryHandler,
    testCategoryUI,
    testCreateCategory,
    testCategoryFilters,
    testProductCategorySelector,
    testCategoryModals,
    testCategoryService,
    showCategoryStats
};

console.log("\n💡 Funciones disponibles:");
console.log("- categoryTests.runAllCategoryTests() - Ejecutar todas las pruebas");
console.log("- categoryTests.showCategoryStats() - Mostrar estadísticas");
console.log("- categoryTests.testCategoryHandler() - Probar handler");
console.log("- categoryTests.testCategoryUI() - Probar UI");
console.log("- categoryTests.testCategoryService() - Probar servicios");
console.log("\n🚀 Para empezar, ejecuta: categoryTests.runAllCategoryTests()");