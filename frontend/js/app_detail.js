// frontend/js/app_detail.js
async function renderAppDetailPage(container, params) {
    const appId = params.id;
    if (!appId) { container.innerHTML = '<p class="error-text">Ошибка: не указан ID приложения.</p>'; return; }

    container.innerHTML = '<div class="loader"></div>';
    setupBackButton(container);

    try {
        const response = await fetch(`${API_BASE_URL}/api/apps/${appId}`);
        if (!response.ok) throw new Error('Не удалось загрузить данные приложения.');
        const app = await response.json();

        const screenshotsHtml = app.screenshots && app.screenshots.length > 0 ? `
            <div class="app-detail-section">
                <h2 class="section-title">Скриншоты</h2>
                <div class="screenshots-container">
                    ${app.screenshots.map(url => `<img src="${url}" class="screenshot-image" alt="screenshot">`).join('')}
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="app-detail-page">
                <div class="app-detail-header-new">
                    <img src="${app.icon_url}" alt="${app.title}" class="app-detail-icon-new">
                    <div class="app-detail-header-info">
                        <h1 class="app-detail-title">${app.title}</h1>
                        <p class="app-detail-short-description">${app.short_description}</p>
                        <div class="app-detail-header-buttons">
                            <button id="open-app-main-button" class="action-button-small">Открыть</button>
                            <button id="share-app-button" class="action-button-icon">↗️</button>
                        </div>
                    </div>
                </div>
                ${screenshotsHtml}
                <div class="app-detail-section">
                    <h2 class="section-title">Описание</h2>
                    <p class="app-detail-description">${app.long_description.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;

        const tg = window.Telegram.WebApp;
        document.getElementById('open-app-main-button').addEventListener('click', () => tg.openLink(app.app_url));
        
        document.getElementById('share-app-button').addEventListener('click', () => {
            const startParam = `app-detail__${app.id}`;
            const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?startapp=${startParam}`;
            const shareText = `Посмотри на приложение ${app.title} в TON Aggregator!`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(shareText)}`;
            tg.openTelegramLink(shareUrl);
        });
        
        setupBackButton(container);
    } catch (error) {
        console.error("Ошибка на странице деталей:", error);
        container.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
}
routes['app-detail'] = renderAppDetailPage;