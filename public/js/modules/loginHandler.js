/**
 * Manejador del formulario de login
 * Controla la lógica específica de la página de login
 */

class LoginHandler {
    constructor() {
        this.form = null;
        this.emailInput = null;
        this.passwordInput = null;
        this.submitButton = null;
        this.restoreButton = null;
    }

    /**
     * Inicializa el manejador de login
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Configura las referencias a los elementos del DOM
     */
    setupElements() {
        this.emailInput = document.getElementById('usuario');
        this.passwordInput = document.getElementById('contrasena');
        this.submitButton = document.querySelector('button[type="submit"]');
        this.form = this.submitButton?.closest('form');

        if (!this.emailInput || !this.passwordInput || !this.submitButton) {
            console.error('❌ No se encontraron todos los elementos necesarios para el login');
            return false;
        }

        console.log('✅ Elementos del login configurados correctamente');
        return true;
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        if (!this.submitButton) return;

        // Click en el botón de submit
        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Enter en los campos de input
        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin();
                    }
                });

                // Limpiar errores al escribir
                input.addEventListener('input', () => {
                    UIUtils.clearError(input);
                });
            }
        });

        console.log('✅ Event listeners configurados');
    }

    /**
     * Verifica si el usuario ya está autenticado
     */
    checkAuthStatus() {
        if (window.authService?.isAuthenticated()) {
            console.log('✅ Usuario ya autenticado, redirigiendo...');
            this.redirectToDashboard();
        }
    }

    /**
     * Maneja el proceso de login
     */
    async handleLogin() {
        console.log('🚀 Iniciando proceso de login...');

        // Validar elementos
        if (!this.emailInput || !this.passwordInput) {
            UIUtils.showAlert('Error: Elementos del formulario no encontrados', 'error');
            return;
        }

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();

        // Limpiar errores previos
        UIUtils.clearFormErrors(this.form || document);

        // Validaciones
        if (!this.validateInputs(email, password)) {
            return;
        }

        // Detectar si estamos en producción
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        // Mostrar loading con mensaje apropiado
        const loadingMessage = isProduction ? 'Conectando con el servidor...' : 'Iniciando sesión...';
        this.restoreButton = UIUtils.showButtonLoading(this.submitButton, loadingMessage);

        // Mostrar mensaje informativo en producción
        if (isProduction) {
            UIUtils.showAlert('Conectando con el servidor, esto puede tomar unos momentos...', 'info', 3000);
        }

        try {
            // Realizar login
            const result = await window.authService.login(email, password);
            console.log('📋 Resultado del login:', result);

            if (result.success) {
                console.log('🎉 Login exitoso!');
                UIUtils.showAlert('¡Inicio de sesión exitoso!', 'success');
                
                // Redireccionar después de un breve delay
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
            } else {
                console.log('❌ Login fallido:', result.error);
                UIUtils.showAlert(result.error || 'Error al iniciar sesión', 'error');
                this.passwordInput.focus();
            }
        } catch (error) {
            console.error('🚨 Error durante el login:', error);
            UIUtils.showAlert('Error de conexión. Por favor intenta nuevamente.', 'error');
        } finally {
            // Restaurar botón
            if (this.restoreButton) {
                this.restoreButton();
                this.restoreButton = null;
            }
        }
    }

    /**
     * Valida los inputs del formulario
     * @param {string} email - Email ingresado
     * @param {string} password - Contraseña ingresada
     * @returns {boolean} True si es válido
     */
    validateInputs(email, password) {
        let isValid = true;

        // Validar email
        if (!email) {
            UIUtils.showAlert('Por favor ingresa tu email', 'error');
            UIUtils.markAsError(this.emailInput);
            this.emailInput.focus();
            return false;
        }

        if (!UIUtils.isValidEmail(email)) {
            UIUtils.showAlert('Por favor ingresa un email válido', 'error');
            UIUtils.markAsError(this.emailInput);
            this.emailInput.focus();
            return false;
        }

        // Validar contraseña
        if (!password) {
            UIUtils.showAlert('Por favor ingresa tu contraseña', 'error');
            UIUtils.markAsError(this.passwordInput);
            this.passwordInput.focus();
            return false;
        }

        const passwordValidation = UIUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            UIUtils.showAlert(passwordValidation.errors[0], 'error');
            UIUtils.markAsError(this.passwordInput);
            this.passwordInput.focus();
            return false;
        }

        return isValid;
    }

    /**
     * Redirecciona al dashboard
     */
    redirectToDashboard() {
        console.log('🏠 Redirigiendo al dashboard...');
        window.location.href = '/views/dashboard/inicio.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Página de login cargada');
    
    const loginHandler = new LoginHandler();
    loginHandler.init();
    
    // Hacer disponible globalmente para debugging
    window.loginHandler = loginHandler;
});

export default LoginHandler;