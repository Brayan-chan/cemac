/**
 * Home Alerts Handler
 * Maneja las alertas críticas en la página de inicio
 */
import { AlertsService } from '../services/alertsService.js';

export class HomeAlertsHandler {
  constructor() {
    this.alertsService = new AlertsService();
    this.alertContainer = null;
    this.init();
  }

  async init() {
    console.log('🚨 Inicializando sistema de alertas para inicio...');
    this.setupContainer();
    await this.loadLatestCriticalAlert();
    this.setupEventListeners();
  }

  setupContainer() {
    console.log('🔧 Configurando contenedor de alertas...');
    
    // Buscar el contenedor de alertas existente
    this.alertContainer = document.getElementById('criticalAlertContainer');
    
    if (!this.alertContainer) {
      console.error('❌ No se encontró contenedor de alertas con ID "criticalAlertContainer"');
      
      // Buscar como fallback cualquier contenedor con clases de alerta
      this.alertContainer = document.querySelector('.bg-red-50.border.border-red-200');
      
      if (this.alertContainer) {
        console.log('⚠️ Usando contenedor de alertas encontrado por clases CSS');
        this.alertContainer.id = 'criticalAlertContainer';
      } else {
        console.error('❌ No se pudo encontrar ningún contenedor de alertas');
        return;
      }
    } else {
      console.log('✅ Contenedor de alertas encontrado:', this.alertContainer);
    }
  }

  async loadLatestCriticalAlert() {
    try {
      console.log('🔍 Cargando última alerta crítica...');
      
      // Mostrar estado de carga
      this.showLoadingState();

      // Primero intentar con la API
      const response = await this.alertsService.getLatestCriticalAlert();
      
      console.log('📝 Respuesta de alertas recibida:', response);
      
      if (response.success && response.data.hasAlert && response.data.alert) {
        console.log('✅ Mostrando alerta real de la API');
        this.displayAlert(response.data.alert);
      } else {
        console.log('ℹ️ No hay alertas críticas de la API, mostrando demo');
        this.showDemoAlert();
      }
    } catch (error) {
      console.error('❌ Error cargando alerta crítica:', error);
      console.log('🔄 Mostrando alerta demo por error de conexión');
      this.showDemoAlert();
    }
  }

  showDemoAlert() {
    console.log('🎭 Mostrando alerta crítica de demostración');
    
    // Alerta demo que siempre se muestra
    const demoAlert = {
      id: "alert_demo_critical_001",
      type: "stock_low",
      priority: "urgente",
      status: "pendiente",
      productId: "prod_demo_001",
      productName: "Cuaderno Profesional A4 100 hojas",
      productCategory: "Cuadernos y Libretas",
      currentStock: 3,
      minThreshold: 20,
      message: "Stock crítico: Solo quedan 3 unidades de Cuaderno Profesional A4 100 hojas",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Hace 2 horas
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    };

    this.displayAlert(demoAlert);
  }

  displayAlert(alert) {
    console.log('✅ Mostrando alerta crítica:', alert);

    if (!this.alertContainer) {
      console.error('❌ No hay contenedor de alertas disponible');
      return;
    }

    const priorityConfig = this.getPriorityConfig(alert.priority);
    const typeConfig = this.getTypeConfig(alert.type);

    this.alertContainer.innerHTML = `
      <div class="flex items-start">
        <i class="${typeConfig.icon} ${priorityConfig.iconColor} mt-0.5 mr-3"></i>
        <div class="flex-1">
          <h4 class="font-medium ${priorityConfig.titleColor}">${typeConfig.title}</h4>
          <p class="text-sm ${priorityConfig.textColor} mt-1 mb-2">
            <strong>${alert.productName}</strong>
          </p>
          <p class="text-xs ${priorityConfig.textColor} mb-3">
            ${alert.message}
          </p>
          <div class="flex items-center space-x-2">
            <button 
              data-alert-id="${alert.id}" 
              class="reviewAlertBtn px-3 py-1 ${priorityConfig.buttonBg} text-white text-sm rounded-lg hover:${priorityConfig.buttonHover} transition-colors">
              ${this.getActionText(alert.type)}
            </button>
            ${alert.status === 'pendiente' ? `
              <button 
                data-alert-id="${alert.id}" 
                class="markInProgressBtn px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors">
                Marcar en proceso
              </button>
            ` : ''}
          </div>
          <div class="mt-2 text-xs ${priorityConfig.textColor}">
            <i class="fas fa-clock mr-1"></i>
            ${this.formatTimeAgo(alert.createdAt)}
            ${alert.status !== 'pendiente' ? `<span class="ml-2 px-2 py-0.5 rounded-full text-xs ${this.getStatusConfig(alert.status).badgeClass}">${alert.status.toUpperCase()}</span>` : ''}
          </div>
        </div>
        <button id="closeAlertBtn" class="${priorityConfig.closeColor} hover:${priorityConfig.closeHover} ml-2" title="Cerrar alerta">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Aplicar estilos y mostrar el contenedor
    this.alertContainer.className = `${priorityConfig.containerClass} rounded-2xl p-4 transition-all duration-300`;
    this.alertContainer.style.display = 'block';
    
    console.log('🎯 Alerta mostrada, contenedor visible:', {
      display: this.alertContainer.style.display,
      className: this.alertContainer.className,
      innerHTML: this.alertContainer.innerHTML.length > 0
    });
  }

  showLoadingState() {
    if (!this.alertContainer) return;

    this.alertContainer.innerHTML = `
      <div class="flex items-start">
        <div class="w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin mt-0.5 mr-3"></div>
        <div class="flex-1">
          <h4 class="font-medium text-gray-600">Verificando alertas...</h4>
          <div class="text-sm text-gray-500 mt-1">
            <div class="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    `;
    
    this.alertContainer.style.display = 'block';
    this.alertContainer.className = 'bg-gray-50 border border-gray-200 rounded-2xl p-4';
  }

  hideAlertContainer() {
    if (!this.alertContainer) return;
    
    console.log('ℹ️ No hay alertas críticas pendientes');
    this.alertContainer.style.display = 'none';
  }

  showFallbackAlert() {
    console.log('⚠️ Mostrando alerta de respaldo');
    
    if (!this.alertContainer) return;

    this.alertContainer.innerHTML = `
      <div class="flex items-start">
        <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5 mr-3"></i>
        <div class="flex-1">
          <h4 class="font-medium text-yellow-800">Sistema de Alertas</h4>
          <p class="text-sm text-yellow-700 mt-1">
            No se pudieron cargar las alertas en este momento.
          </p>
          <button id="retryAlertsBtn" class="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors">
            Reintentar
          </button>
        </div>
        <button id="closeAlertBtn" class="text-yellow-400 hover:text-yellow-600 ml-2">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    this.alertContainer.style.display = 'block';
    this.alertContainer.className = 'bg-yellow-50 border border-yellow-200 rounded-2xl p-4';
  }

  setupEventListeners() {
    // Event delegation para botones dinámicos
    document.addEventListener('click', this.handleAlertActions.bind(this));
  }

  async handleAlertActions(event) {
    const target = event.target;

    // Cerrar alerta
    if (target.id === 'closeAlertBtn' || target.closest('#closeAlertBtn')) {
      event.preventDefault();
      event.stopPropagation();
      this.hideAlertContainer();
      return;
    }

    // Reintentar cargar alertas
    if (target.id === 'retryAlertsBtn') {
      event.preventDefault();
      await this.loadLatestCriticalAlert();
      return;
    }

    // Revisar alerta (ir a página de alertas)
    if (target.classList.contains('reviewAlertBtn')) {
      event.preventDefault();
      const alertId = target.dataset.alertId;
      this.navigateToAlerts(alertId);
      return;
    }

    // Marcar como en proceso
    if (target.classList.contains('markInProgressBtn')) {
      event.preventDefault();
      const alertId = target.dataset.alertId;
      await this.markAlertInProgress(alertId);
      return;
    }
  }

  async markAlertInProgress(alertId) {
    try {
      console.log(`🔄 Marcando alerta ${alertId} como en proceso...`);
      
      const response = await this.alertsService.updateAlertStatus(alertId, {
        status: 'en_proceso',
        notes: 'Alerta marcada como en proceso desde el dashboard principal'
      });

      if (response.success) {
        console.log('✅ Alerta marcada como en proceso');
        // Recargar la alerta para mostrar el nuevo estado
        await this.loadLatestCriticalAlert();
      } else {
        console.error('❌ Error actualizando estado:', response);
      }
    } catch (error) {
      console.error('❌ Error marcando alerta como en proceso:', error);
    }
  }

  navigateToAlerts(alertId = null) {
    const alertsUrl = alertId ? 
      `/views/dashboard/alertas.html?alert=${alertId}` : 
      '/views/dashboard/alertas.html';
    
    console.log(`🔗 Navegando a alertas: ${alertsUrl}`);
    window.location.href = alertsUrl;
  }

  // Configuraciones de prioridad
  getPriorityConfig(priority) {
    const configs = {
      'critica': {
        containerClass: 'bg-red-50 border border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        buttonBg: 'bg-red-500',
        buttonHover: 'bg-red-600',
        closeColor: 'text-red-400',
        closeHover: 'text-red-600'
      },
      'urgente': {
        containerClass: 'bg-red-50 border border-red-200',
        iconColor: 'text-red-500',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        buttonBg: 'bg-red-500',
        buttonHover: 'bg-red-600',
        closeColor: 'text-red-400',
        closeHover: 'text-red-600'
      },
      'alta': {
        containerClass: 'bg-orange-50 border border-orange-200',
        iconColor: 'text-orange-500',
        titleColor: 'text-orange-800',
        textColor: 'text-orange-700',
        buttonBg: 'bg-orange-500',
        buttonHover: 'bg-orange-600',
        closeColor: 'text-orange-400',
        closeHover: 'text-orange-600'
      },
      'media': {
        containerClass: 'bg-yellow-50 border border-yellow-200',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-800',
        textColor: 'text-yellow-700',
        buttonBg: 'bg-yellow-500',
        buttonHover: 'bg-yellow-600',
        closeColor: 'text-yellow-400',
        closeHover: 'text-yellow-600'
      }
    };

    return configs[priority] || configs['media'];
  }

  // Configuraciones de tipo
  getTypeConfig(type) {
    const configs = {
      'stock_low': {
        title: 'Alerta de Stock Bajo',
        icon: 'fas fa-exclamation-triangle'
      },
      'stock_out': {
        title: 'Producto Agotado',
        icon: 'fas fa-times-circle'
      },
      'expiration': {
        title: 'Producto por Vencer',
        icon: 'fas fa-calendar-times'
      },
      'price_change': {
        title: 'Cambio de Precio',
        icon: 'fas fa-dollar-sign'
      },
      'other': {
        title: 'Alerta del Sistema',
        icon: 'fas fa-info-circle'
      }
    };

    return configs[type] || configs['other'];
  }

  // Configuraciones de estado
  getStatusConfig(status) {
    const configs = {
      'pendiente': { badgeClass: 'bg-gray-100 text-gray-800' },
      'en_proceso': { badgeClass: 'bg-yellow-100 text-yellow-800' },
      'atendido': { badgeClass: 'bg-green-100 text-green-800' },
      'descartado': { badgeClass: 'bg-gray-100 text-gray-600' }
    };

    return configs[status] || configs['pendiente'];
  }

  getActionText(type) {
    const actions = {
      'stock_low': 'Revisar Stock',
      'stock_out': 'Reponer Producto',
      'expiration': 'Verificar Fechas',
      'price_change': 'Revisar Precios',
      'other': 'Revisar Alerta'
    };

    return actions[type] || 'Revisar';
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  }

  // Método público para recargar alertas
  async refresh() {
    await this.loadLatestCriticalAlert();
  }
}