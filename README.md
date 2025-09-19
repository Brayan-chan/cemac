# CEMAC - Sistema de Gestión de Inventario y Análisis

## 📋 Descripción
CEMAC es una aplicación web moderna para la gestión de inventario y análisis de datos, desarrollada con tecnologías actuales de JavaScript. El sistema permite gestionar inventario, generar alertas, realizar análisis y crear reportes de manera eficiente.

## 🚀 Tecnologías Utilizadas
- **Node.js** - Entorno de ejecución para JavaScript
- **Express** - Framework web para Node.js
- **Firebase** - Plataforma de desarrollo de aplicaciones
  - Authentication
  - Firestore Database
  - Firebase Admin
- **Cors** - Middleware para habilitar CORS
- **dotenv** - Manejo de variables de entorno

## 🛠 Estructura del Proyecto
```
cemac/
├── config/             # Configuración de la base de datos y Firebase
├── controllers/        # Controladores de la aplicación
├── middlewares/       # Middlewares personalizados
├── public/            # Archivos estáticos
│   ├── css/          # Hojas de estilo
│   ├── js/           # Scripts del cliente
│   └── views/        # Vistas HTML
├── routes/            # Rutas de la API
├── server/           # Configuración del servidor
└── utils/            # Utilidades y helpers
```

## ⚙️ Requisitos Previos
- Node.js (versión 18 o superior)
- npm (incluido con Node.js)
- Cuenta en Firebase
- Git

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Brayan-chan/cemac.git
cd cemac
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las siguientes variables:
```env
PORT=3000
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_auth_domain
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_STORAGE_BUCKET=tu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
FIREBASE_APP_ID=tu_app_id
```

## 🚀 Ejecución

Para desarrollo:
```bash
npm run dev
```

Para producción:
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## 📱 Funcionalidades Principales

- **Gestión de Inventario**
  - Control de productos
  - Seguimiento de stock
  - Historial de movimientos

- **Sistema de Alertas**
  - Notificaciones de stock bajo
  - Alertas de vencimiento
  - Notificaciones personalizables

- **Análisis de Datos**
  - Reportes personalizados
  - Gráficos y estadísticas
  - Exportación de datos

- **Panel de Control**
  - Vista general del sistema
  - Métricas importantes
  - Estado del inventario

## 📄 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo usuario

### Inventario
- `GET /api/inventory` - Obtener lista de productos
- `POST /api/inventory` - Añadir nuevo producto
- `PUT /api/inventory/:id` - Actualizar producto
- `DELETE /api/inventory/:id` - Eliminar producto

### Reportes
- `GET /api/reports` - Obtener reportes
- `POST /api/reports/generate` - Generar nuevo reporte

### Alertas
- `GET /api/alerts` - Obtener alertas
- `POST /api/alerts` - Crear nueva alerta
- `PUT /api/alerts/:id` - Actualizar alerta

## 🔐 Seguridad
- Autenticación mediante Firebase Auth
- Middleware de autorización para rutas protegidas
- Validación de datos en endpoints

## 🤝 Contribución
1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👥 Autores
- 🚀Brayan Chan🚀 - Desarrollo inicial

## 📞 Soporte
Para soporte, por favor abre un issue en el repositorio de GitHub.
