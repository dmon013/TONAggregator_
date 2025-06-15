// frontend/js/app_detail.js (ПОЛНАЯ НОВАЯ ВЕРСИЯ)

async function renderAppDetailPage(container, params) {
    console.log("1. Запущена renderAppDetailPage. ID:", params.id);
    const appId = params.id;
    if (!appId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID приложения.</p>';
        return;
    }

    container.innerHTML = '<div class="loader"></div>';
    console.log("2. Лоадер отображен.");
    setupBackButton(container);

    try {
        console.log("3. Входим в блок try. Начинаем запросы к API...");
        const [appResponse, userResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/apps/${appId}`),
            fetch(`${API_BASE_URL}/api/user`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } })
        ]);
        console.log("4. Оба запроса к API завершились. Статус appResponse:", appResponse.status, "Статус userResponse:", userResponse.status);

        if (!appResponse.ok) throw new Error(`Не удалось загрузить данные приложения. Статус: ${appResponse.status}`);
        
        const app = await appResponse.json();
        const user = userResponse.ok ? await userResponse.json() : null;
        console.log("5. Данные успешно распарсены (JSON).");

        // ... (HTML-верстка остается без изменений)
        container.innerHTML = `...`; // Этот блок мы пока не трогаем

        // --- Здесь я временно скопирую верстку для полноты картины ---
        const screenshotsHtml = app.screenshots && app.screenshots.length > 0 ? `
            <div class="app-detail-section">
                <h2 class="section-title">Скриншоты</h2>
                <div class="screenshots-container horizontal-scroll">
                    ${app.screenshots.map(url => `<img src="${url}" class="screenshot-image">`).join('')}
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
                <div id="admin-collection-controls" style="margin-top: 30px;"></div>
            </div>
        `;
        console.log("6. Страница успешно отрисована.");

        // Устанавливаем обработчики событий
        const tg = window.Telegram.WebApp;
        document.getElementById('open-app-main-button').addEventListener('click', () => tg.openLink(app.app_url));
        document.getElementById('share-app-button').addEventListener('click', () => {
            const shareText = `Посмотри на это приложение в TON: ${app.title}!`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(app.app_url)}&text=${encodeURIComponent(shareText)}`;
            tg.openTelegramLink(shareUrl);
        });
        console.log("7. Обработчики событий установлены.");

        // Если пользователь - админ, запускаем рендер админских контролов
        if (user && user.is_admin) {
            console.log("8. Пользователь - админ. Запускаем рендер админских контролов.");
            const adminControlsContainer = document.getElementById('admin-collection-controls');
            await renderAdminControls(adminControlsContainer, app);
            console.log("9. Админские контролы отрисованы.");
        }
        
    } catch (error) {
        // Если что-то пойдет не так, мы увидим это сообщение
        console.error("ОШИБКА В БЛОКЕ CATCH:", error);
        container.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
}

async function renderAdminControls(container, app) {
    container.innerHTML = '<h3>Управление подборками (Админ)</h3>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/collections`);
        const collections = await response.json();

        collections.forEach(collection => {
            const isAppInCollection = app.collection_ids && app.collection_ids.includes(collection.id);
            const button = document.createElement('button');
            button.className = isAppInCollection ? 'action-button secondary' : 'action-button';
            button.textContent = isAppInCollection 
                ? `Удалить из "${collection.name}"` 
                : `Добавить в "${collection.name}"`;

            button.addEventListener('click', async () => {
                button.disabled = true;
                button.textContent = '...';
                
                const action = isAppInCollection ? 'remove' : 'add';
                
                await fetch(`${API_BASE_URL}/admin/collections/manage`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': window.Telegram.WebApp.initData 
                    },
                    body: JSON.stringify({
                        collection_id: collection.id,
                        app_id: app.id,
                        action: action
                    })
                });
                
                // Перезагружаем страницу, чтобы увидеть изменения
                navigateTo('app-detail', { id: app.id });
            });
            container.appendChild(button);
        });
    } catch (error) {
        container.innerHTML += '<p class="error-text">Не удалось загрузить подборки.</p>';
    }
}

routes['app-detail'] = renderAppDetailPage;