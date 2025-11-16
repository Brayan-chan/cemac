// Debug script para verificar el estado de la página de alertas
console.log("🔍 Debug script cargado")

// Verificar token
const token = localStorage.getItem("authToken")
if (!token) {
  console.log("❌ No hay token en localStorage")
  // Crear un token de prueba
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBjZW1hYy5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTE0MDAwMDB9.test-signature"
  localStorage.setItem("authToken", testToken)
  console.log("✅ Token de prueba creado")
  location.reload()
} else {
  console.log("✅ Token encontrado:", token.substring(0, 20) + "...")
}

// Verificar si AlertsHandler se está cargando
setTimeout(() => {
  if (window.alertsHandler) {
    console.log("✅ AlertsHandler está disponible")
  } else {
    console.log("❌ AlertsHandler no está disponible")
  }
}, 2000)