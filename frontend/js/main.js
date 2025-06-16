// frontend/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#17212b');
    tg.setBackgroundColor(tg.themeParams.bg_color || '#232e3c');
    
    const appContainer = document.getElementById('app-container');
    const navButtons = document.querySelectorAll('.nav-button');
    initRouter(appContainer, navButtons);

    const startParam = tg.initDataUnsafe.start_param;
    if (startParam) {
        const [routeName, paramId] = startParam.split('__');
        if (routeName === 'app-detail' && paramId) {
            navigateTo('app-detail', { id: paramId });
        } else {
            navigateTo('home');
        }
    } else {
        navigateTo('home');
    }
    console.log("TON Aggregator Frontend Initialized");
});