// frontend/js/collection_edit.js

/**
 * Отрисовывает страницу для редактирования состава подборки.
 * @param {HTMLElement} container - Элемент для рендеринга.
 * @param {object} params - Параметры из роутера, включая collectionId и collectionName.
 */
async function renderCollectionEditPage(container, params = {}) {
    const { collectionId, collectionName } = params;
    if (!collectionId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID подборки.</p>';
        return;
    }

    container.innerHTML = `
        <div class="my-apps-page"> <h1 class="page-title">Изменение состава "${collectionName}"</h1>
            <div id="collection-apps-grid" class="my-apps-grid edit-mode"> <div class="loader"></div>
            </div>
        </div>
    `;
    
    const gridContainer = document.getElementById('collection-apps-grid');
    const tg = window.Telegram.WebApp;
    setupBackButton(container);

    try {
        const response = await fetch(`${API_BASE_URL}/api/collection-apps/${collectionId}`);
        if (!response.ok) throw new Error('Не удалось загрузить приложения');
        const apps = await response.json();

        gridContainer.innerHTML = '';
        if (apps.length === 0) {
            gridContainer.innerHTML = '<p class="hint-text">В этой подборке пока нет приложений.</p>';
            return;
        }

        apps.forEach(app => {
            const slot = document.createElement('div');
            slot.className = 'grid-slot filled'; // Все ячейки заняты
            slot.innerHTML = `
                <button class="delete-slot-button" style="opacity: 1; transform: scale(1);">×</button>
                <img src="${app.icon_url}" alt="${app.title}" class="slot-icon">
                <p class="slot-app-title">${app.title}</p>
            `;
            
            // Обработчик для кнопки удаления
            slot.querySelector('.delete-slot-button').addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Просто убираем карточку с экрана для мгновенной реакции
                slot.style.transition = 'transform 0.3s, opacity 0.3s';
                slot.style.transform = 'scale(0.8)';
                slot.style.opacity = '0';
                
                // Отправляем запрос на бэкенд для реального удаления
                await fetch(`${API_BASE_URL}/admin/collections/manage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                    body: JSON.stringify({ 
                        collection_id: collectionId, 
                        app_id: app.id, 
                        action: 'remove' 
                    })
                });
                // Через 300мс полностью удаляем элемент со страницы
                setTimeout(() => slot.remove(), 300);
            });
            gridContainer.appendChild(slot);
        });

    } catch (error) {
        console.error(error);
        gridContainer.innerHTML = '<p class="error-text">Ошибка загрузки.</p>';
    }
}

// Регистрируем новый маршрут
routes['collection-edit'] = renderCollectionEditPage;