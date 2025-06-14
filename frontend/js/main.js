// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // 1. Инициализация приложения
    tg.ready();
    tg.expand(); // Раскрываем приложение на весь экран

    // 2. Настройка темы
    // Приложение будет использовать цветовую схему из клиента Telegram
    tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#17212b');
    tg.setBackgroundColor(tg.themeParams.bg_color || '#222F37');
    
    const appContainer = document.getElementById('app-container');
    const navButtons = document.querySelectorAll('.nav-button');

    // 3. Инициализация роутера
    // Функция `initRouter` будет в файле router.js
    // Она принимает контейнер для контента и кнопки навигации
    initRouter(appContainer, navButtons);

    // 4. Загрузка начальной страницы
    // По умолчанию открываем 'home'
    navigateTo('home');

    console.log("TON Aggregator Frontend Initialized");
    console.log("Telegram User Data:", tg.initDataUnsafe.user);
});