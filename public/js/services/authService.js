/**
 * Servicio de autenticación del frontend
 * Maneja todas las comunicaciones con la API de autenticación
 */

class AuthService {
    constructor() {
        // Detectar si estamos en producción (Vercel) o desarrollo local
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        if (isProduction) {
            // En producción, llamar directamente a la API externa
            this.baseURL = 'https://cemac-api.onrender.com';
        } else {
            // En desarrollo, usar el servidor local (proxy)
            this.baseURL = window.location.origin;
        }
        
        console.log(`🌍 Modo: ${isProduction ? 'Producción' : 'Desarrollo'}`);
        console.log(`🔗 API URL: ${this.baseURL}`);
    }

    /**
     * Realiza el login del usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Object} Resultado del login
     */
    async login(email, password) {
        try {
            console.log('🔐 AuthService: Iniciando login');
            console.log('  - Email:', email);
            console.log('  - API URL:', `${this.baseURL}/auth/login`);
            
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            
            // Configurar timeout más largo para producción (API externa puede estar dormida)
            const timeoutMs = isProduction ? 30000 : 10000; // 30s en producción, 10s en desarrollo
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📥 Response status:', response.status);
            
            const data = await response.json();
            console.log('📥 Response data:', data);

            if (data.success && data.token) {
                // Guardar token y datos del usuario
                this.setToken(data.token);
                if (data.user) {
                    this.setUser(data.user);
                }
                return { success: true, ...data };
            } else {
                return { 
                    success: false, 
                    error: data.error || 'Error de autenticación' 
                };
            }
        } catch (error) {
            console.error('❌ Error en AuthService.login:', error);
            
            // Manejo específico para diferentes tipos de errores
            if (error.name === 'AbortError') {
                return { 
                    success: false, 
                    error: 'Timeout: El servidor tardó demasiado en responder. Inténtalo de nuevo.' 
                };
            }
            
            return { 
                success: false, 
                error: 'Error de conexión con el servidor' 
            };
        }
    }

    /**
     * Realiza el logout del usuario
     */
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                // Solo intentar logout en el servidor si estamos en desarrollo
                const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                if (!isProduction) {
                    await fetch(`${this.baseURL}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar datos locales independientemente del resultado
            this.clearSession();
            window.location.href = '/';
        }
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} True si está autenticado
     */
    isAuthenticated() {
        return this.getToken() !== null;
    }

    /**
     * Obtiene el token de autenticación
     * @returns {string|null} Token o null si no existe
     */
    getToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Guarda el token de autenticación
     * @param {string} token - Token a guardar
     */
    setToken(token) {
        localStorage.setItem('authToken', token);
    }

    /**
     * Obtiene los datos del usuario
     * @returns {Object|null} Datos del usuario o null
     */
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Guarda los datos del usuario
     * @param {Object} user - Datos del usuario
     */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Limpia toda la sesión
     */
    clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    /**
     * Verifica el estado de autenticación con el servidor
     * @returns {Object} Resultado de la verificación
     */
    async verifyAuth() {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, error: 'No hay token' };
            }

            // Solo verificar en desarrollo donde tenemos el endpoint
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            if (isProduction) {
                // En producción, solo verificamos que el token exista localmente
                return { success: true, message: 'Token válido localmente' };
            }

            const response = await fetch(`${this.baseURL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return { success: false, error: 'Error de verificación' };
        }
    }
}

// Crear instancia global
window.authService = new AuthService();

export default AuthService;