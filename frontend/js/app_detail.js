// frontend/js/app_detail.js

/**
 * Отрисовывает страницу с детальной информацией о приложении
 * @param {HTMLElement} container - Элемент для рендеринга
 * @param {object} params - Параметры маршрута, например { id: '...' }
 */
async function renderAppDetailPage(container, params) {
    const tg = window.Telegram.WebApp;
    const appId = params.id;

    if (!appId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID приложения.</p>';
        return;
    }

    container.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/apps/${appId}`);
        if (!response.ok) throw new Error('Не удалось загрузить данные приложения.');
        
        const app = await response.json();

        container.innerHTML = `
            <div class="app-detail-page">
                <div class="app-detail-header">
                    <img src="${app.icon_url}" alt="${app.title}" class="app-detail-icon">
                    <h1 class="app-detail-title">${app.title}</h1>
                </div>
                <div class="app-detail-actions">
                    <button id="open-app-main-button" class="action-button">Открыть приложение</button>
                </div>
                <div class="app-detail-body">
                    <h2 class="section-title">Описание</h2>
                    <p class="app-detail-description">${app.short_description.replace(/\n/g, '<br>')}</p>
                    <p class="app-detail-description">${app.long_description.replace(/\n/g, '<br>')}</p>   
                </div>
            </div>
        `;

        // Добавляем обработчик на главную кнопку "Открыть"
        document.getElementById('open-app-main-button').addEventListener('click', () => {
            tg.openLink(app.app_url);
        });

        // Кнопка "Назад" которая видна в браузере, но не видна если используется нативная кнопка Telegram
        setupBackButton(container);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error-text">${error.message}</p>`;
        setupBackButton(container);
    }
}

// Регистрируем новый маршрут
routes['app-detail'] = renderAppDetailPage;