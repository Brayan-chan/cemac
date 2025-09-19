/**
 * Rutas de autenticación
 * Define todas las rutas relacionadas con autenticación y las conecta con sus controladores
 */

import express from 'express';
import { login, logout, verifyAuth, register, wakeUp } from '../controllers/authController.js';
import { logAuthRequests, authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware para logging en todas las rutas de auth
router.use(logAuthRequests);

/**
 * POST /auth/login
 * Ruta para iniciar sesión
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * POST /auth/logout  
 * Ruta para cerrar sesión
 * Requiere autenticación
 */
router.post('/logout', authenticateToken, logout);

/**
 * GET /auth/verify
 * Ruta para verificar si el usuario está autenticado
 * Requiere autenticación
 */
router.get('/verify', authenticateToken, verifyAuth);

/**
 * POST /auth/register
 * Ruta para registrar nuevos usuarios
 * Body: { email, password, firstName, lastName }
 */
router.post('/register', register);

/**
 * GET /auth/wakeup
 * Ruta para despertar la API externa
 */
router.get('/wakeup', wakeUp);

/**
 * GET /auth/status
 * Ruta para obtener el estado del sistema de autenticación
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema de autenticación funcionando',
        timestamp: new Date().toISOString(),
        routes: {
            login: 'POST /auth/login',
            logout: 'POST /auth/logout',
            verify: 'GET /auth/verify', 
            register: 'POST /auth/register',
            status: 'GET /auth/status'
        }
    });
});

export default router;