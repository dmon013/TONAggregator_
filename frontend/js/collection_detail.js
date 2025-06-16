// frontend/js/collection_detail.js

/**
 * Отрисовывает страницу со всеми приложениями из одной подборки.
 * @param {HTMLElement} container - Элемент для рендеринга.
 * @param {object} params - Параметры из роутера, включая collectionId и collectionName.
 */
async function renderCollectionDetailPage(container, params = {}) {
    const { collectionId, collectionName } = params;
    if (!collectionId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID подборки.</p>';
        return;
    }

    // Показываем заголовок и лоадер
    container.innerHTML = `
        <div class="page-content">
            <h1 class="page-title">${collectionName || 'Подборка'}</h1>
            <div id="collection-apps-container" class="cards-container">
                <div class="loader"></div>
            </div>
        </div>
    `;
    setupBackButton(container); // Сразу настраиваем кнопку "Назад"

    const appsContainer = document.getElementById('collection-apps-container');

    try {
        // Запрашиваем ВСЕ приложения для этой подборки
        const response = await fetch(`${API_BASE_URL}/api/collection-apps/${collectionId}`);
        if (!response.ok) throw new Error('Не удалось загрузить приложения.');
        
        const apps = await response.json();
        appsContainer.innerHTML = ''; // Убираем лоадер

        if (apps.length === 0) {
            appsContainer.innerHTML = '<p class="hint-text">В этой подборке пока нет приложений.</p>';
            return;
        }

        // Рендерим все приложения в виде вертикального списка
        apps.forEach(app => {
            const appCard = createAppCard(app); // Используем нашу универсальную карточку
            appsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error(`Failed to load apps for collection ${collectionId}:`, error);
        appsContainer.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
}

// Регистрируем новый маршрут
routes['collection-detail'] = renderCollectionDetailPage;