/**
 * Middleware de autenticación
 * Verifica tokens y maneja la autenticación de usuarios
 */

/**
 * Middleware para verificar si el usuario está autenticado
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express  
 * @param {Function} next - Función para pasar al siguiente middleware
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Token de acceso requerido' 
        });
    }

    // Aquí verificaríamos el token con tu API externa
    // Por ahora, simplemente verificamos que exista
    req.user = { token }; // Guardar información del usuario en req
    next();
};

/**
 * Middleware para verificar roles de usuario
 * @param {Array} allowedRoles - Roles permitidos para acceder al recurso
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuario no autenticado' 
            });
        }

        // Aquí verificaríamos el rol del usuario
        // Por ahora asumimos que tiene permisos
        next();
    };
};

/**
 * Middleware para logging de requests de autenticación
 */
const logAuthRequests = (req, res, next) => {
    console.log(`[AUTH] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && req.body.email) {
        console.log(`[AUTH] Usuario intentando: ${req.body.email}`);
    }
    next();
};

export { 
    authenticateToken, 
    authorizeRoles, 
    logAuthRequests 
};