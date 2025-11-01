import AuthService from '/js/services/authService.js';

let authService = null;

class ResetAdminPasswordHandler {
    constructor() {
        authService = new AuthService();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', (e) => this.handleResetRequest(e));
        }
    }

    async handleResetRequest(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('resetEmail');
        const email = emailInput.value.trim();
        
        if (!email) {
            alert('Por favor, ingresa tu correo electrónico de administrador');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Por favor, ingresa un correo electrónico válido');
            return;
        }

        try {
            this.showLoadingOverlay();
            
            // Agregar indicador de que es un admin en el cuerpo de la solicitud
            await authService.requestPasswordReset(email, true);
            
            this.hideLoadingOverlay();
            this.showSuccessModal();
            emailInput.value = ''; // Limpiar el campo
            
        } catch (error) {
            this.hideLoadingOverlay();
            console.error('Error al solicitar el restablecimiento de contraseña:', error);
            alert(error.message || 'Error al procesar la solicitud. Por favor, intenta de nuevo.');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showSuccessModal() {
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
                    <div class="text-green-500 text-5xl mb-4">✓</div>
                    <h3 class="text-xl font-bold mb-2">Correo Enviado</h3>
                    <p class="text-gray-600 mb-6">Se han enviado las instrucciones para restablecer tu contraseña de administrador a tu correo electrónico.</p>
                    <button onclick="window.closeSuccessModal()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Entendido
                    </button>
                </div>
            </div>`;

        const modalElement = document.createElement('div');
        modalElement.id = 'successModal';
        modalElement.innerHTML = modalHtml;
        document.body.appendChild(modalElement);
    }
}

// Cerrar el modal de éxito
window.closeSuccessModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.remove();
    }
};

// Inicializar el manejador cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.resetAdminPasswordHandler = new ResetAdminPasswordHandler();
});

export { ResetAdminPasswordHandler };