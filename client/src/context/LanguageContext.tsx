import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Nav
  'nav.dashboard': { en: 'Dashboard', es: 'Dashboard' },
  'nav.clients': { en: 'Clients', es: 'Clientes' },
  'nav.credits': { en: 'Credits', es: 'Créditos' },
  'nav.payments': { en: 'Payments', es: 'Pagos' },
  'nav.activity': { en: 'Activity', es: 'Actividad' },
  'nav.logout': { en: 'Logout', es: 'Cerrar Sesión' },
  'nav.darkMode': { en: 'Dark Mode', es: 'Modo Oscuro' },
  'nav.lightMode': { en: 'Light Mode', es: 'Modo Claro' },
  'navGroup.general': { en: 'General', es: 'General' },
  'navGroup.management': { en: 'Management', es: 'Gestión' },
  'navGroup.reports': { en: 'Reports', es: 'Reportes' },
  'topbar.welcome': { en: 'Welcome, {name}', es: 'Bienvenido, {name}' },
  'topbar.subtitle': { en: 'Credit Management Dashboard', es: 'Panel de Gestión de Créditos' },
  // Login
  'login.subtitle': { en: 'Credit Management', es: 'Gestión de Créditos' },
  'login.email': { en: 'Email', es: 'Email' },
  'login.name': { en: 'Name', es: 'Nombre' },
  'login.password': { en: 'Password', es: 'Contraseña' },
  'login.login': { en: 'Login', es: 'Iniciar Sesión' },
  'login.register': { en: 'Register', es: 'Registrarse' },
  'login.or': { en: 'or', es: 'o' },
  'login.alreadyAccount': { en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  'login.noAccount': { en: "Don't have an account?", es: '¿No tienes cuenta?' },
  'login.switchToLogin': { en: 'Login', es: 'Iniciar Sesión' },
  'login.switchToRegister': { en: 'Register', es: 'Registrarse' },
  'login.emailPlaceholder': { en: 'admin@kredio.com', es: 'admin@kredio.com' },
  'login.namePlaceholder': { en: 'Your name', es: 'Tu nombre' },
  'login.invalidCredentials': { en: 'Invalid credentials', es: 'Credenciales inválidas' },
  'login.googleError': { en: 'Error logging in with Google', es: 'Error al iniciar sesión con Google' },
  // Dashboard
  'dashboard.title': { en: 'Dashboard', es: 'Dashboard' },
  'dashboard.activeCredits': { en: 'Active Credits', es: 'Créditos Activos' },
  'dashboard.overdue': { en: 'Overdue', es: 'Vencidos' },
  'dashboard.totalPortfolio': { en: 'Total Portfolio', es: 'Portafolio Total' },
  'dashboard.pending': { en: 'Pending', es: 'Pendiente' },
  'dashboard.recentPayments': { en: 'Recent Payments', es: 'Pagos Recientes' },
  'dashboard.noRecentPayments': { en: 'No recent payments', es: 'Sin pagos recientes' },
  'dashboard.upcomingDue': { en: 'Upcoming Due Dates', es: 'Próximos Vencimientos' },
  'dashboard.noUpcomingDue': { en: 'No upcoming due dates', es: 'Sin próximos vencimientos' },
  'dashboard.due': { en: 'Due: {date}', es: 'Vence: {date}' },
  'dashboard.newCredit': { en: '+ New Credit', es: '+ Nuevo Crédito' },
  'dashboard.newClient': { en: '+ New Client', es: '+ Nuevo Cliente' },
  'dashboard.loading': { en: 'Loading...', es: 'Cargando...' },
  // Clients
  'clients.title': { en: 'Clients', es: 'Clientes' },
  'clients.newClient': { en: '+ New Client', es: '+ Nuevo Cliente' },
  'clients.noClients': { en: 'No clients yet', es: 'Sin clientes aún' },
  'clients.noContact': { en: 'No contact', es: 'Sin contacto' },
  'clients.credits': { en: '{count} credits', es: '{count} créditos' },
  // Client Detail
  'clientDetail.loading': { en: 'Loading...', es: 'Cargando...' },
  'clientDetail.backToClients': { en: 'Clients', es: 'Clientes' },
  'clientDetail.newCredit': { en: '+ New Credit', es: '+ Nuevo Crédito' },
  'clientDetail.contactInfo': { en: 'Contact Info', es: 'Información de Contacto' },
  'clientDetail.email': { en: 'Email:', es: 'Email:' },
  'clientDetail.phone': { en: 'Phone:', es: 'Teléfono:' },
  'clientDetail.notes': { en: 'Notes:', es: 'Notas:' },
  'clientDetail.summary': { en: 'Summary', es: 'Resumen' },
  'clientDetail.creditsCount': { en: 'Credits: {count}', es: 'Créditos: {count}' },
  'clientDetail.totalDebt': { en: 'Total Debt: ${amount}', es: 'Deuda Total: ${amount}' },
  'clientDetail.credits': { en: 'Credits', es: 'Créditos' },
  'clientDetail.noCredits': { en: 'No credits', es: 'Sin créditos' },
  'clientDetail.due': { en: 'Due: {date}', es: 'Vence: {date}' },
  // Create Client
  'createClient.title': { en: 'New Client', es: 'Nuevo Cliente' },
  'createClient.name': { en: 'Name *', es: 'Nombre *' },
  'createClient.phone': { en: 'Phone', es: 'Teléfono' },
  'createClient.email': { en: 'Email', es: 'Email' },
  'createClient.notes': { en: 'Notes', es: 'Notas' },
  'createClient.save': { en: 'Save', es: 'Guardar' },
  'createClient.cancel': { en: 'Cancel', es: 'Cancelar' },
  'createClient.nameRequired': { en: 'Name is required', es: 'El nombre es obligatorio' },
  'createClient.error': { en: 'Error creating client', es: 'Error al crear cliente' },
  'createClient.success': { en: 'Client created successfully', es: 'Cliente creado correctamente' },
  // Credits
  'credits.title': { en: 'Credits', es: 'Créditos' },
  'credits.newCredit': { en: '+ New Credit', es: '+ Nuevo Crédito' },
  'credits.noCredits': { en: 'No credits yet', es: 'Sin créditos aún' },
  'credits.unknown': { en: 'Unknown', es: 'Desconocido' },
  'credits.due': { en: 'Due: {date}', es: 'Vence: {date}' },
  'credits.installments': { en: '{count} installments {freq}', es: '{count} cuotas {freq}' },
  'credits.weekly': { en: 'weekly', es: 'semanal' },
  'credits.biweekly': { en: 'biweekly', es: 'quincenal' },
  'credits.monthly': { en: 'monthly', es: 'mensual' },
  // Credit Detail
  'creditDetail.loading': { en: 'Loading...', es: 'Cargando...' },
  'creditDetail.backToCredits': { en: 'Credits', es: 'Créditos' },
  'creditDetail.client': { en: 'Client: {name}', es: 'Cliente: {name}' },
  'creditDetail.total': { en: 'Total', es: 'Total' },
  'creditDetail.balance': { en: 'Balance', es: 'Saldo' },
  'creditDetail.interestRate': { en: 'Interest Rate', es: 'Tasa de Interés' },
  'creditDetail.status': { en: 'Status', es: 'Estado' },
  'creditDetail.payments': { en: 'Payments', es: 'Pagos' },
  'creditDetail.registerPayment': { en: 'Register Payment', es: 'Registrar Pago' },
  'creditDetail.noPayments': { en: 'No payments registered', es: 'Sin pagos registrados' },
  'creditDetail.errorPayment': { en: 'Error registering payment', es: 'Error al registrar pago' },
  'creditDetail.successPayment': { en: 'Payment registered successfully', es: 'Pago registrado correctamente' },
  'creditDetail.amount': { en: 'Amount', es: 'Monto' },
  'creditDetail.note': { en: 'Note', es: 'Nota' },
  'creditDetail.register': { en: 'Register', es: 'Registrar' },
  'creditDetail.cancel': { en: 'Cancel', es: 'Cancelar' },
  // Create Credit
  'createCredit.title': { en: 'New Credit', es: 'Nuevo Crédito' },
  'createCredit.client': { en: 'Client *', es: 'Cliente *' },
  'createCredit.selectClient': { en: 'Select client', es: 'Seleccionar cliente' },
  'createCredit.currency': { en: 'Currency *', es: 'Moneda *' },
  'createCredit.pesos': { en: 'Argentine Pesos', es: 'Pesos Argentinos' },
  'createCredit.dollars': { en: 'US Dollars', es: 'Dólares Americanos' },
  'createCredit.amount': { en: 'Amount *', es: 'Monto *' },
  'createCredit.interestRate': { en: 'Interest Rate (%)', es: 'Tasa de Interés (%)' },
  'createCredit.frequency': { en: 'Payment Frequency *', es: 'Frecuencia de Pago *' },
  'createCredit.weekly': { en: 'Weekly', es: 'Semanal' },
  'createCredit.biweekly': { en: 'Biweekly', es: 'Quincenal' },
  'createCredit.monthly': { en: 'Monthly', es: 'Mensual' },
  'createCredit.installments': { en: 'Number of Installments *', es: 'Número de Cuotas *' },
  'createCredit.dueDate': { en: 'Due Date *', es: 'Fecha de Vencimiento *' },
  'createCredit.description': { en: 'Description', es: 'Descripción' },
  'createCredit.save': { en: 'Save', es: 'Guardar' },
  'createCredit.cancel': { en: 'Cancel', es: 'Cancelar' },
  'createCredit.requiredFields': { en: 'Please fill all required fields', es: 'Completa todos los campos obligatorios' },
  'createCredit.error': { en: 'Error creating credit', es: 'Error al crear crédito' },
  'createCredit.success': { en: 'Credit created successfully. Please verify the details.', es: 'Crédito creado correctamente. Verifica los detalles.' },
  // Payments
  'payments.title': { en: 'Payments', es: 'Pagos' },
  'payments.noPayments': { en: 'No payments registered', es: 'Sin pagos registrados' },
  'payments.unknown': { en: 'Unknown', es: 'Desconocido' },
  // Activity
  'activity.title': { en: 'Activity', es: 'Actividad' },
  'activity.noActivity': { en: 'No activity yet', es: 'Sin actividad aún' },
  'activity.paymentRegistered': { en: 'Payment registered', es: 'Pago registrado' },
  'activity.creditCreated': { en: 'Credit created', es: 'Crédito creado' },
  'activity.clientCreated': { en: 'Client created', es: 'Cliente creado' },
  'activity.forClient': { en: 'for {name}', es: 'para {name}' },
  'activity.amountLabel': { en: '${amount}', es: '${amount}' },
  'activity.today': { en: 'Today', es: 'Hoy' },
  'activity.yesterday': { en: 'Yesterday', es: 'Ayer' },
  'activity.thisWeek': { en: 'This Week', es: 'Esta Semana' },
  'activity.thisMonth': { en: 'This Month', es: 'Este Mes' },
  'activity.earlier': { en: 'Earlier', es: 'Anterior' },
  // Help
  'nav.help': { en: 'Help', es: 'Ayuda' },
  'help.title': { en: 'Help Center', es: 'Centro de Ayuda' },
  'help.subtitle': { en: 'Learn how to use Kredio and find answers to common questions', es: 'Aprende a usar Kredio y encuentra respuestas a preguntas frecuentes' },
  'help.faq': { en: 'Frequently Asked Questions', es: 'Preguntas Frecuentes' },
  'help.faq.whatIs': { en: 'What is Kredio?', es: '¿Qué es Kredio?' },
  'help.faq.whatIsAnswer': { en: 'Kredio is a credit management platform that helps you track loans, payments, clients, and due dates all in one place.', es: 'Kredio es una plataforma de gestión de créditos que te ayuda a rastrear préstamos, pagos, clientes y fechas de vencimiento todo en un solo lugar.' },
  'help.faq.registerClient': { en: 'How do I register a client?', es: '¿Cómo registro un cliente?' },
  'help.faq.registerClientAnswer': { en: 'Go to Clients → click "+ New Client" → fill in the name (required), phone, email, and notes → click "Save".', es: 'Ve a Clientes → haz clic en "+ Nuevo Cliente" → completa el nombre (obligatorio), teléfono, email y notas → haz clic en "Guardar".' },
  'help.faq.createCredit': { en: 'How do I create a credit?', es: '¿Cómo creo un crédito?' },
  'help.faq.createCreditAnswer': { en: 'Go to Credits → click "+ New Credit" → select a client, enter the amount, interest rate, payment frequency, number of installments, and due date → click "Save".', es: 'Ve a Créditos → haz clic en "+ Nuevo Crédito" → selecciona un cliente, ingresa el monto, tasa de interés, frecuencia de pago, número de cuotas y fecha de vencimiento → haz clic en "Guardar".' },
  'help.faq.registerPayment': { en: 'How do I register a payment?', es: '¿Cómo registro un pago?' },
  'help.faq.registerPaymentAnswer': { en: 'Go to the credit detail page → click "Register Payment" → enter the amount and an optional note → click "Register". The balance updates automatically.', es: 'Ve a la página de detalle del crédito → haz clic en "Registrar Pago" → ingresa el monto y una nota opcional → haz clic en "Registrar". El saldo se actualiza automáticamente.' },
  'help.faq.creditStatus': { en: 'What does each credit status mean?', es: '¿Qué significa cada estado del crédito?' },
  'help.faq.creditStatusAnswer': { en: 'Active: currently being paid. Paid: fully paid off. Overdue: past the due date. Cancelled: cancelled before completion. Archived: hidden from the main list for record keeping.', es: 'Activo: se está pagando actualmente. Pagado: completamente pagado. Vencido: pasó la fecha de vencimiento. Cancelado: cancelado antes de completarse. Archivado: oculto de la lista principal para mantenimiento de registros.' },
  'help.faq.edit': { en: 'How do I edit a client or credit?', es: '¿Cómo edito un cliente o crédito?' },
  'help.faq.editAnswer': { en: 'Go to the detail page of the client or credit → click the edit button (pencil icon) → modify the fields → click "Save Changes".', es: 'Ve a la página de detalle del cliente o crédito → haz clic en el botón de editar (icono de lápiz) → modifica los campos → haz clic en "Guardar Cambios".' },
  'help.faq.archive': { en: 'How do I archive a credit?', es: '¿Cómo archivo un crédito?' },
  'help.faq.archiveAnswer': { en: 'Open the credit detail page → click the "Archive" button → confirm the action. The credit will be hidden from the main list but remains accessible from the client detail.', es: 'Abre la página de detalle del crédito → haz clic en el botón "Archivar" → confirma la acción. El crédito se ocultará de la lista principal pero sigue siendo accesible desde el detalle del cliente.' },
  'help.faq.darkMode': { en: 'How do I change the theme or language?', es: '¿Cómo cambio el tema o idioma?' },
  'help.faq.darkModeAnswer': { en: 'Use the sun/moon icon in the sidebar or top bar to toggle between light and dark mode. Use the globe icon to switch between English and Spanish.', es: 'Usa el icono de sol/luna en la barra lateral o superior para alternar entre modo claro y oscuro. Usa el icono del globo para cambiar entre inglés y español.' },
  'help.roadmap': { en: 'Usage Guide', es: 'Guía de Uso' },
  'help.roadmap.subtitle': { en: 'Follow these steps to start managing your credits effectively', es: 'Sigue estos pasos para empezar a gestionar tus créditos de forma efectiva' },
  'help.step1': { en: 'Create a Client', es: 'Crear un Cliente' },
  'help.step1Desc': { en: 'The first step is to register your clients. Go to the Clients section and click "+ New Client". Enter their name, contact information, and any relevant notes. This is the foundation for all credit management.', es: 'El primer paso es registrar tus clientes. Ve a la sección Clientes y haz clic en "+ Nuevo Cliente". Ingresa su nombre, información de contacto y notas relevantes. Esta es la base para toda la gestión de créditos.' },
  'help.step2': { en: 'Create a Credit', es: 'Crear un Crédito' },
  'help.step2Desc': { en: 'Once you have a client, go to Credits → "+ New Credit". Select the client, set the loan amount, interest rate, payment frequency (weekly/biweekly/monthly), number of installments, and first due date. The system will calculate the total amount automatically.', es: 'Una vez que tengas un cliente, ve a Créditos → "+ Nuevo Crédito". Selecciona el cliente, establece el monto del préstamo, tasa de interés, frecuencia de pago (semanal/quincenal/mensual), número de cuotas y primera fecha de vencimiento. El sistema calculará el monto total automáticamente.' },
  'help.step3': { en: 'Register Payments', es: 'Registrar Pagos' },
  'help.step3Desc': { en: 'When a client makes a payment, open the credit detail page and click "Register Payment". Enter the amount received and an optional note. The balance updates automatically, and if the balance reaches zero, the credit is marked as Paid.', es: 'Cuando un cliente realice un pago, abre la página de detalle del crédito y haz clic en "Registrar Pago". Ingresa el monto recibido y una nota opcional. El saldo se actualiza automáticamente, y si el saldo llega a cero, el crédito se marca como Pagado.' },
  'help.step4': { en: 'Monitor the Dashboard', es: 'Monitorea el Dashboard' },
  'help.step4Desc': { en: 'The Dashboard gives you a real-time overview: active credits, overdue credits, total portfolio, pending amounts, recent payments, and upcoming due dates. Use it to stay on top of your business.', es: 'El Dashboard te da una visión general en tiempo real: créditos activos, vencidos, portafolio total, montos pendientes, pagos recientes y próximos vencimientos. Úsalo para mantenerte al tanto de tu negocio.' },
  'help.step5': { en: 'Track Activity', es: 'Da Seguimiento con Actividad' },
  'help.step5Desc': { en: 'The Activity log records every action: new clients, credits created, and payments registered. Use it to audit changes and keep a complete history of your operations.', es: 'El registro de Actividad guarda cada acción: nuevos clientes, créditos creados y pagos registrados. Úsalo para auditar cambios y mantener un historial completo de tus operaciones.' },
  // Table
  'table.noData': { en: 'No data found', es: 'Sin datos' },
  // Status badges
  'status.active': { en: 'Active', es: 'Activo' },
  'status.paid': { en: 'Paid', es: 'Pagado' },
  'status.overdue': { en: 'Overdue', es: 'Vencido' },
  'status.cancelled': { en: 'Cancelled', es: 'Cancelado' },
  'status.archived': { en: 'Archived', es: 'Archivado' },
  // Edit Client
  'editClient.title': { en: 'Edit Client', es: 'Editar Cliente' },
  'editClient.save': { en: 'Save Changes', es: 'Guardar Cambios' },
  'editClient.cancel': { en: 'Cancel', es: 'Cancelar' },
  'editClient.errorLoad': { en: 'Error loading client', es: 'Error al cargar cliente' },
  'editClient.error': { en: 'Error updating client', es: 'Error al actualizar cliente' },
  'editClient.success': { en: 'Client updated successfully', es: 'Cliente actualizado correctamente' },
  'editClient.loading': { en: 'Loading...', es: 'Cargando...' },
  // Edit Credit
  'editCredit.title': { en: 'Edit Credit', es: 'Editar Crédito' },
  'editCredit.save': { en: 'Save Changes', es: 'Guardar Cambios' },
  'editCredit.cancel': { en: 'Cancel', es: 'Cancelar' },
  'editCredit.errorLoad': { en: 'Error loading credit', es: 'Error al cargar crédito' },
  'editCredit.error': { en: 'Error updating credit', es: 'Error al actualizar crédito' },
  'editCredit.success': { en: 'Credit updated successfully', es: 'Crédito actualizado correctamente' },
  'editCredit.loading': { en: 'Loading...', es: 'Cargando...' },
  // Confirm dialogs
  'confirm.deleteClient.title': { en: 'Delete Client', es: 'Eliminar Cliente' },
  'confirm.deleteClient.message': { en: 'This action cannot be undone. All data associated with this client will be permanently deleted.', es: 'Esta acción no se puede deshacer. Todos los datos asociados a este cliente serán eliminados permanentemente.' },
  'confirm.deleteClient.confirm': { en: 'Delete', es: 'Eliminar' },
  'confirm.deleteClient.success': { en: 'Client deleted successfully', es: 'Cliente eliminado correctamente' },
  'confirm.deleteClient.error': { en: 'Error deleting client', es: 'Error al eliminar cliente' },
  'confirm.editClient.title': { en: 'Save Changes', es: 'Guardar Cambios' },
  'confirm.editClient.message': { en: 'Are you sure you want to save the changes for this client?', es: '¿Estás seguro de guardar los cambios de este cliente?' },
  'confirm.editClient.confirm': { en: 'Save', es: 'Guardar' },
  'confirm.editCredit.title': { en: 'Save Changes', es: 'Guardar Cambios' },
  'confirm.editCredit.message': { en: 'Are you sure you want to save the changes for this credit?', es: '¿Estás seguro de guardar los cambios de este crédito?' },
  'confirm.editCredit.confirm': { en: 'Save', es: 'Guardar' },
  'confirm.logout.title': { en: 'Logout', es: 'Cerrar Sesión' },
  'confirm.logout.message': { en: 'Are you sure you want to log out?', es: '¿Estás seguro de cerrar sesión?' },
  'confirm.logout.confirm': { en: 'Logout', es: 'Cerrar Sesión' },
  'login.loginSuccess': { en: 'Login successful', es: 'Inicio de sesión exitoso' },
  'login.registerSuccess': { en: 'Registration successful', es: 'Registro exitoso' },
  'confirm.archiveCredit.title': { en: 'Archive Credit', es: 'Archivar Crédito' },
  'confirm.archiveCredit.message': { en: 'This credit will be archived and hidden from the main list. You can still access it from the client detail.', es: 'Este crédito será archivado y ocultado de la lista principal. Aún puedes acceder a él desde el detalle del cliente.' },
  'confirm.archiveCredit.confirm': { en: 'Archive', es: 'Archivar' },
  'confirm.archiveCredit.success': { en: 'Credit archived successfully', es: 'Crédito archivado correctamente' },
  'confirm.archiveCredit.error': { en: 'Error archiving credit', es: 'Error al archivar crédito' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('kredio-lang');
    if (stored === 'en' || stored === 'es') return stored;
    return 'es';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('kredio-lang', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));

  const t = (key: string): string => {
    return translations[key]?.[language] ?? key;
  };

  return <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
