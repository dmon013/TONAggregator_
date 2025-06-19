// frontend/js/router.js (ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ)

const routes = {};
let appContainerElement;
let navigationButtons;

/**
 * Инициализирует роутер, привязывая события к кнопкам навигации.
 */
function initRouter(container, navButtons) {
    appContainerElement = container;
    navigationButtons = Array.from(navButtons);

    navigationButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const route = event.currentTarget.dataset.route;
            navigateTo(route, {}, true); // Принудительно очищаем историю при клике на нижнее меню
        });
    });

    // Обработка системной кнопки "назад" браузера
    window.onpopstate = (event) => {
        if (event.state) {
            navigateTo(event.state.routeName, event.state.params, true);
        } else {
            navigateTo('home', {}, true);
        }
    };
}

/**
 * Главная функция навигации.
 * @param {string} routeName - Имя маршрута.
 * @param {object} params - Параметры для страницы.
 * @param {boolean} fromNav - Флаг, указывающий, что это навигация из главного меню.
 */
function navigateTo(routeName, params = {}, fromNav = false) {
    const renderFunction = routes[routeName];
    
    if (!appContainerElement) {
        console.error("Router not initialized. Call initRouter() first.");
        return;
    }

    // Управляем историей браузера для работы стрелок "вперед/назад"
    if (!fromNav) {
        const url = `#${routeName}`;
        history.pushState({ routeName, params }, '', url);
    } else {
        history.replaceState({ routeName, params }, '', `#${routeName}`);
    }

    // Очищаем контейнер и прячем системную кнопку "Назад" перед отрисовкой
    appContainerElement.innerHTML = '';
    window.Telegram.WebApp.BackButton.hide();
    
    // Вызываем функцию отрисовки для нужной страницы
    if (renderFunction) {
        renderFunction(appContainerElement, params);
    } else {
        appContainerElement.innerHTML = `<h2>Страница не найдена: ${routeName}</h2>`;
        console.warn(`No route found for: ${routeName}`);
    }

    // Обновляем активное состояние кнопок в нижней навигационной панели
    navigationButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.route === routeName);
    });
}

/**
 * Устанавливает кнопку "Назад", используя нативную кнопку Telegram или HTML-аналог.
 */
function setupBackButton(container) {
    const tg = window.Telegram.WebApp;
    
    // Функция для возврата назад
    const goBack = () => window.history.back();

    if (tg.BackButton.isVisible) {
        // Если уже видима, просто обновляем обработчик
        tg.BackButton.offClick(goBack);
        tg.BackButton.onClick(goBack);
    } else {
        if (tg.isVersionAtLeast('6.1')) {
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        } else {
            // Запасной вариант для браузера
            const fallbackButton = document.createElement('button');
            fallbackButton.textContent = '← Назад';
            fallbackButton.className = 'fallback-back-button';
            fallbackButton.addEventListener('click', goBack);
            container.prepend(fallbackButton);
        }
    }
}

// Первоначальная загрузка
document.addEventListener('DOMContentLoaded', () => {
    // ... (код из main.js будет здесь, но для ясности оставим его там)
});