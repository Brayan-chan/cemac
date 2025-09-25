class LoginHandler {
    constructor() {
        this.emailInput = null;
        this.passwordInput = null;
        this.submitButton = null;
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupElements() {
        this.emailInput = document.getElementById('usuario');
        this.passwordInput = document.getElementById('contrasena');
        this.submitButton = document.querySelector('button[type="submit"]');

        if (!this.emailInput || !this.passwordInput || !this.submitButton) {
            console.error('Elementos del formulario no encontrados');
            return false;
        }

        console.log('Elementos del login configurados');
        return true;
    }

    setupEventListeners() {
        if (!this.submitButton) return;

        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin();
                    }
                });
            }
        });
    }

    async handleLogin() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!email || !password) {
            this.showError('Por favor, completa todos los campos');
            return;
        }

        this.setLoadingState(true);

        try {
            console.log('🔐 Iniciando proceso de login con API...');
            
            // Mostrar mensaje de wake up si estamos en producción
            const hostname = window.location.hostname;
            const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
            
            if (isProduction) {
                this.showInfo('Despertando servidor... esto puede tomar unos momentos');
            }
            
            const result = await window.authService.login(email, password);

            if (result.success) {
                this.showSuccess('¡Login exitoso! Redirigiendo...');
                
                setTimeout(() => {
                    window.location.href = '/views/dashboard/inicio.html';
                }, 1500);
            } else {
                this.showError(result.error || 'Error de autenticación');
            }
        } catch (error) {
            console.error('❌ Error en handleLogin:', error);
            this.showError('Error de conexión. Verifica tu conexión a internet.');
        } finally {
            this.setLoadingState(false);
        }
    }

    checkAuthStatus() {
        if (window.authService && window.authService.isAuthenticated()) {
            window.location.href = '/views/dashboard/inicio.html';
        }
    }

    setLoadingState(loading) {
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            this.submitButton.textContent = loading ? 'Ingresando...' : 'Ingresar';
        }
        
        [this.emailInput, this.passwordInput].forEach(input => {
            if (input) input.disabled = loading;
        });
    }

    showSuccess(message) {
        console.log('Exito:', message);
        this.showMessage(message, 'success');
    }

    showError(message) {
        console.error('Error:', message);
        this.showMessage(message, 'error');
    }

    showInfo(message) {
        console.log('Info:', message);
        this.showMessage(message, 'info');
    }

    showMessage(message, type) {
        let messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(messageContainer);
        }

        const messageEl = document.createElement('div');
        let bgClass;
        
        switch(type) {
            case 'success':
                bgClass = 'bg-green-100 border border-green-400 text-green-700';
                break;
            case 'error':
                bgClass = 'bg-red-100 border border-red-400 text-red-700';
                break;
            case 'info':
                bgClass = 'bg-blue-100 border border-blue-400 text-blue-700';
                break;
            default:
                bgClass = 'bg-gray-100 border border-gray-400 text-gray-700';
        }
        
        messageEl.className = 'px-4 py-3 rounded-lg shadow-lg mb-2 ' + bgClass;
        messageEl.textContent = message;

        messageContainer.appendChild(messageEl);

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, type === 'info' ? 8000 : 5000); // Info messages last longer
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginHandler = new LoginHandler();
    loginHandler.init();
});

export default LoginHandler;
