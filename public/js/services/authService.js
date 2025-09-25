/**
 * Servicio de autenticación básico (Sin API)
 * Maneja autenticación local para demostración
 */

class AuthService {
    constructor() {
        console.log('🔧 AuthService: Modo básico - Sin API');
        this.isDemo = true;
    }

    /**
     * Simula login local para demostración
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Object} Resultado del login
     */
    async login(email, password) {
        try {
            console.log('🔐 AuthService: Login local simulado');
            console.log('  - Email:', email);
            
            // Simulación de credenciales demo
            const demoCredentials = {
                'admin@cemac.com': 'admin123',
                'demo@cemac.com': 'demo123',
                'test@cemac.com': 'test123'
            };

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (demoCredentials[email] && demoCredentials[email] === password) {
                // Usuario demo válido
                const userData = {
                    email: email,
                    name: email.split('@')[0].toUpperCase(),
                    role: email.includes('admin') ? 'admin' : 'user'
                };

                // Guardar sesión local
                this.setUser(userData);
                this.setToken('demo-token-' + Date.now());

                return {
                    success: true,
                    message: 'Login exitoso (modo demo)',
                    user: userData,
                    token: this.getToken()
                };
            } else {
                return {
                    success: false,
                    error: 'Credenciales inválidas. Usa: admin@cemac.com / admin123'
                };
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                error: 'Error en el login'
            };
        }
    }

    /**
     * Logout local
     */
    async logout() {
        try {
            console.log('🚪 AuthService: Logout');
            this.clearSession();
            window.location.href = '/';
        } catch (error) {
            console.error('Error en logout:', error);
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
     * Verifica autenticación local
     * @returns {Object} Resultado de la verificación
     */
    async verifyAuth() {
        const token = this.getToken();
        const user = this.getUser();

        if (token && user) {
            return {
                success: true,
                user: user,
                message: 'Sesión válida (modo demo)'
            };
        } else {
            return {
                success: false,
                error: 'No hay sesión activa'
            };
        }
    }
}

// Crear instancia global
window.authService = new AuthService();

export default AuthService;