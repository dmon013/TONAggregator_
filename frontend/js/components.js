// frontend/js/components.js

/**
 * Создает HTML-элемент карточки приложения.
 * Эта функция теперь будет использоваться на всех экранах, где есть приложения.
 * @param {object} app - Объект с данными приложения
 * @returns {HTMLElement}
 */
function createAppCard(app) {
    const tg = window.Telegram.WebApp;

    const card = document.createElement('div');
    card.className = 'app-card';

    // ... (innerHTML код без изменений) ...
    card.innerHTML = `
        <img src="${app.icon_url}" alt="${app.title} icon" class="app-icon">
        <div class="app-info">
            <h3 class="app-title">${app.title}</h3>
            <p class="app-description">${app.short_description}</p>
        </div>
        <button class="open-app-button">Открыть</button>
    `;


    const openButton = card.querySelector('.open-app-button');
    openButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем срабатывание клика по карточке
        tg.openLink(app.app_url);
    });

    // *** НАЧАЛО ИЗМЕНЕНИЙ ***
    // Клик по самой карточке теперь ведет на страницу с деталями
    card.addEventListener('click', () => {
        navigateTo('app-detail', { id: app.id });
    });
    // *** КОНЕЦ ИЗМЕНЕНИЙ ***

    return card;
}