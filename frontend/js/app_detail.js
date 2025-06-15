// frontend/js/app_detail.js (ПОЛНАЯ НОВАЯ ВЕРСИЯ)

async function renderAppDetailPage(container, params) {
    const appId = params.id;
    if (!appId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID приложения.</p>';
        return;
    }

    container.innerHTML = '<div class="loader"></div>';
    setupBackButton(container);

    try {
        // Запрашиваем данные приложения и данные пользователя одновременно
        const [appResponse, userResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/apps/${appId}`),
            fetch(`${API_BASE_URL}/api/user`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } })
        ]);

        if (!appResponse.ok) throw new Error('Не удалось загрузить данные приложения.');
        
        const app = await appResponse.json();
        const user = userResponse.ok ? await userResponse.json() : null;

        // Рендерим основную часть страницы
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
                    <p class="app-detail-description">${app.long_description.replace(/\n/g, '<br>')}</p>
                </div>
                <div id="admin-collection-controls" style="margin-top: 30px;"></div>
            </div>
        `;

        document.getElementById('open-app-main-button').addEventListener('click', () => {
            window.Telegram.WebApp.openLink(app.app_url);
        });
        
        setupBackButton(container);

        // Если пользователь - админ, загружаем и рендерим контролы
        if (user && user.is_admin) {
            const adminControlsContainer = document.getElementById('admin-collection-controls');
            renderAdminControls(adminControlsContainer, app);
        }

    } catch (error) {
        console.error(error);
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