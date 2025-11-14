/**
 * Servicio de autenticación del frontend
 * Maneja todas las comunicaciones con la API de autenticación externa
 */

class AuthService {
    constructor() {
        this.configureAPIEndpoint();
    }

    /**
     * Configura el endpoint de la API según el entorno
     */
    configureAPIEndpoint() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        
        if (isLocalhost) {
            // Desarrollo local: usar el servidor proxy local
            this.baseURL = window.location.origin;
            this.isDirectAPI = false;
            this.environment = 'development';
            console.log('🔧 Modo desarrollo: usando servidor proxy local');
        } else {
            // Producción: usar API desplegada en Vercel
            this.baseURL = 'https://cemac-api.vercel.app';
            this.isDirectAPI = true;
            this.environment = 'production';
            console.log('🌐 Modo producción: usando API desplegada en Vercel');
        }
        
        console.log('📡 API Base URL:', this.baseURL);
        console.log('🌍 Environment:', this.environment);
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
            console.log('  - Environment:', this.environment);
            console.log('  - API URL:', `${this.baseURL}/auth/login`);
            
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({ email, password })
            };

            // Solo incluir credentials en desarrollo local
            if (this.environment === 'development') {
                requestOptions.credentials = 'include';
            }

            const response = await fetch(`${this.baseURL}/auth/login`, requestOptions);

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);

            if (!response.ok) {
                // Intentar parsear respuesta JSON para obtener un mensaje amigable
                try {
                    const errorData = await response.json();
                    const friendly = errorData.error || errorData.message || (`Error ${response.status}`);
                    return { success: false, error: friendly, status: response.status };
                } catch (parseErr) {
                    // Si no es JSON, leer texto plano
                    const errorText = await response.text();
                    const friendly = errorText || (`Error ${response.status}`);
                    return { success: false, error: friendly, status: response.status };
                }
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            // Verificar si el login fue exitoso: debe tener token Y message de éxito O success true
            const isLoginSuccessful = data.token && (
                data.success === true || 
                (data.message && data.message.toLowerCase().includes('exitoso'))
            );

            if (isLoginSuccessful) {
                // Guardar token y datos del usuario
                this.setToken(data.token);
                if (data.user) {
                    this.setUser(data.user);
                }
                return { success: true, ...data };
            } else {
                return { 
                    success: false, 
                    error: data.error || data.message || 'Error de autenticación' 
                };
            }
        } catch (error) {
            console.error('❌ Error en AuthService.login:', error);
            return { 
                success: false, 
                error: error.message || 'Error de conexión con la API' 
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
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    mode: 'cors'
                };

                // Solo incluir credentials en desarrollo local
                if (this.environment === 'development') {
                    requestOptions.credentials = 'include';
                }

                await fetch(`${this.baseURL}/auth/logout`, requestOptions);
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
     * Solicita un restablecimiento de contraseña
     * @param {string} email - Email del usuario
     * @param {boolean} isAdmin - Indica si es una solicitud de admin
     * @returns {Promise} Resultado de la solicitud
     */
    async requestPasswordReset(email, isAdmin = false) {
        try {
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({ email, isAdmin })
            };

            if (this.environment === 'development') {
                requestOptions.credentials = 'include';
            }

            const response = await fetch(`${this.baseURL}/auth/recover`, requestOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al solicitar el restablecimiento de contraseña');
            }

            return data;
        } catch (error) {
            console.error('Error en requestPasswordReset:', error);
            throw error;
        }
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

            const requestOptions = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                mode: 'cors'
            };

            // Solo incluir credentials en desarrollo local
            if (this.environment === 'development') {
                requestOptions.credentials = 'include';
            }

            const response = await fetch(`${this.baseURL}/auth/verify`, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

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

export { AuthService };
export default AuthService;