/**
 * Controlador de autenticación
 * Maneja todas las operaciones relacionadas con login, logout, registro, etc.
 */

const API_BASE_URL = 'https://cemac-api.onrender.com';

/**
 * Controlador para el login de usuarios
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        console.log(`[AUTH CONTROLLER] Intentando login para: ${email}`);

        // Configurar timeout para la petición
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        try {
            // Hacer la petición a la API externa con timeout
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok && data.token) {
                console.log(`[AUTH CONTROLLER] Login exitoso para: ${email}`);
                return res.status(200).json({
                    success: true,
                    message: data.message || 'Login exitoso',
                    token: data.token,
                    user: data.user
                });
            } else {
                console.log(`[AUTH CONTROLLER] Login fallido para: ${email} - ${data.error}`);
                return res.status(401).json({
                    success: false,
                    error: data.error || data.message || 'Credenciales inválidas'
                });
            }
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.log(`[AUTH CONTROLLER] Timeout en login para: ${email}`);
                return res.status(408).json({
                    success: false,
                    error: 'La petición tardó demasiado. La API externa puede estar inactiva.'
                });
            }
            throw fetchError; // Re-lanzar otros errores para que los maneje el catch principal
        }

    } catch (error) {
        console.error('[AUTH CONTROLLER] Error en login:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

/**
 * Controlador para el logout de usuarios
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const logout = async (req, res) => {
    try {
        // En este caso simple, el logout es manejado por el frontend
        // removiendo el token del localStorage
        console.log('[AUTH CONTROLLER] Logout solicitado');
        
        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('[AUTH CONTROLLER] Error en logout:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al cerrar sesión'
        });
    }
};

/**
 * Controlador para verificar el estado de autenticación
 * @param {Object} req - Objeto de solicitud de Express  
 * @param {Object} res - Objeto de respuesta de Express
 */
const verifyAuth = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        // Aquí verificarías el token con la API externa si fuera necesario
        // Por ahora, simplemente devolvemos que está autenticado
        return res.status(200).json({
            success: true,
            message: 'Usuario autenticado',
            authenticated: true
        });

    } catch (error) {
        console.error('[AUTH CONTROLLER] Error en verificación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al verificar autenticación'
        });
    }
};

/**
 * Controlador para registrar nuevos usuarios
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validaciones básicas
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        console.log(`[AUTH CONTROLLER] Intentando registro para: ${email}`);

        // Aquí harías la petición a la API externa para registrar el usuario
        // Por ahora, devolvemos un mensaje indicando que no está implementado
        return res.status(501).json({
            success: false,
            error: 'Registro de usuarios no implementado aún'
        });

    } catch (error) {
        console.error('[AUTH CONTROLLER] Error en registro:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

export { 
    login, 
    logout, 
    verifyAuth, 
    register
};