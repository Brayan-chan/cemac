class DashboardHandler {
    constructor() {
        this.userInfo = null;
    }

    async init() {
        console.log('Dashboard inicializando...');
        
        if (!this.checkAuthentication()) {
            return;
        }

        this.loadUserInfo();
        this.setupEventListeners();
        
        console.log('Dashboard inicializado');
    }

    checkAuthentication() {
        if (!window.authService?.isAuthenticated()) {
            console.log('Usuario no autenticado, redirigiendo...');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
            return false;
        }
        return true;
    }

    loadUserInfo() {
        const user = window.authService?.getUser();
        if (user) {
            this.userInfo = user;
            console.log('Usuario cargado:', user);
            this.updateUserDisplay(user);
        }
    }

    updateUserDisplay(user) {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && user.email) {
            userNameElement.textContent = user.name || user.email;
        }
    }

    setupEventListeners() {
        const sidebarLogoutBtn = document.querySelector('a[href="/index.html"]');
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });
    }

    async handleLogout() {
        try {
            console.log('Cerrando sesion...');
            await window.authService?.logout();
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = '/index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const dashboardHandler = new DashboardHandler();
    await dashboardHandler.init();
});

export default DashboardHandler;
