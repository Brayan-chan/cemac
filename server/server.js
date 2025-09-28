import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from '../routes/authRoutes.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Servimos la carpeta 'public' para archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use('/auth', authRoutes);

// Definimos la ruta principal index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para cualquier página del dashboard
app.get("/views/dashboard/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.join(__dirname, `../public/views/dashboard/${fileName}`));
});

// Ruta para verificar el estado del servidor
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor CEMAC funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        routes: {
            auth: '/auth/*',
            frontend: '/',
            dashboard: '/views/dashboard/*',
            status: '/api/status'
        }
    });
});

// Manejador de errores 404 - debe ir al final
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor CEMAC corriendo en: http://localhost:${PORT}`);
    console.log(`📡 API backend externa: https://cemac-api.vercel.app/`);
    console.log(`🔗 Rutas disponibles:`);
    console.log(`   - GET  /                    - Página de login`);
    console.log(`   - POST /auth/login          - Autenticación de usuarios`);
    console.log(`   - GET  /auth/status         - Estado del sistema auth`);
    console.log(`   - GET  /api/status          - Estado del servidor`);
    console.log(`   - GET  /views/dashboard/*   - Páginas del dashboard`);
    console.log(`📁 Archivos estáticos servidos desde: ./public/`);
});