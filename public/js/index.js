/**
 * Archivo principal del frontend
 * Carga los módulos necesarios y configura la aplicación
 */

// Importar módulos
import AuthService from './services/authService.js';
import UIUtils from './utils/uiUtils.js';
import LoginHandler from './modules/loginHandler.js';

// Configuración global
console.log('� Aplicación CEMAC iniciando...');
console.log('📦 Módulos cargados: AuthService, UIUtils, LoginHandler');

// El resto de la lógica está manejada por LoginHandler
// que se inicializa automáticamente cuando el DOM está listo
