// frontend/js/router.js (ОБНОВЛЕННАЯ ВЕРСИЯ)

const routes = {};

let appContainerElement;
let navigationButtons;
let historyStack = ['home']; // Стек для хранения истории, начинаем с главной

// Новая функция для навигации назад
function navigateBack() {
    if (historyStack.length > 1) {
        historyStack.pop(); // Удаляем текущую страницу из истории
        const previousRoute = historyStack[historyStack.length - 1];
        // Переходим на предыдущую страницу без добавления в историю
        navigateTo(previousRoute, {}, true);
    } else {
        navigateTo('home'); // Если истории нет, переходим на главную
    }
}

function initRouter(container, navButtons) {
    appContainerElement = container;
    navigationButtons = Array.from(navButtons);

    navigationButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const route = event.currentTarget.dataset.route;
            navigateTo(route);
        });
    });
}

function navigateTo(routeName, params = {}, isNavigatingBack = false) {
    const renderFunction = routes[routeName];

    if (!appContainerElement) {
        console.error("Router not initialized. Call initRouter() first.");
        return;
    }

    appContainerElement.innerHTML = '';
    window.Telegram.WebApp.BackButton.hide();

    if (!isNavigatingBack && routeName !== historyStack[historyStack.length - 1]) {
        historyStack.push(routeName);
    }
    // Ограничим размер истории, чтобы не занимать много памяти
    if (historyStack.length > 10) {
        historyStack.shift();
    }

    if (renderFunction) {
        renderFunction(appContainerElement, params);
    } else {
        appContainerElement.innerHTML = `<h2>Страница не найдена: ${routeName}</h2>`;
        console.warn(`No route found for: ${routeName}`);
    }

    const isNavRoute = Array.from(navigationButtons).some(b => b.dataset.route === routeName);
    if (isNavRoute) {
        navigationButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.route === routeName);
        });
    } else {
        navigationButtons.forEach(button => button.classList.remove('active'));
    }
}

/**
 * Устанавливает кнопку "Назад", используя нативную кнопку Telegram, если возможно,
 * или создавая HTML-кнопку в качестве запасного варианта.
 * @param {HTMLElement} container - Контейнер страницы, куда можно добавить HTML-кнопку.
 */
function setupBackButton(container) {
    const tg = window.Telegram.WebApp;

    if (tg.isVersionAtLeast('6.1')) { // Проверяем, поддерживает ли клиент кнопку
        tg.BackButton.show();
        // Удаляем старые обработчики перед добавлением нового, чтобы избежать дублирования
        tg.BackButton.offClick(navigateBack); 
        tg.BackButton.onClick(navigateBack);
    } else {
        // Запасной вариант для браузера или старых клиентов
        const fallbackButton = document.createElement('button');
        fallbackButton.textContent = '← Назад';
        fallbackButton.className = 'fallback-back-button';
        fallbackButton.addEventListener('click', navigateBack);
        // Вставляем кнопку в начало контейнера страницы
        container.prepend(fallbackButton);
    }
}