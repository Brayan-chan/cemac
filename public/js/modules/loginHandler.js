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
            const result = await window.authService.login(email, password);

            if (result.success) {
                this.showSuccess('Login exitoso! Redirigiendo...');
                
                setTimeout(() => {
                    window.location.href = '/views/dashboard/inicio.html';
                }, 1500);
            } else {
                this.showError(result.error || 'Error de autenticacion');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error inesperado. Intenta de nuevo.');
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

    showMessage(message, type) {
        let messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(messageContainer);
        }

        const messageEl = document.createElement('div');
        const bgClass = type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700';
        
        messageEl.className = 'px-4 py-3 rounded-lg shadow-lg mb-2 ' + bgClass;
        messageEl.textContent = message;

        messageContainer.appendChild(messageEl);

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginHandler = new LoginHandler();
    loginHandler.init();
});

export default LoginHandler;
