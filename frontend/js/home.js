// frontend/js/home.js (ПОЛНАЯ ИТОГОВАЯ ВЕРСИЯ)

/**
 * Главная функция для отрисовки домашней страницы.
 * Динамически загружает подборки и проверяет статус админа.
 * @param {HTMLElement} container - Элемент для рендеринга.
 */
async function renderHomePage(container) {
    container.innerHTML = `<div id="home-content-wrapper"><div class="loader"></div></div>`;
    const wrapper = document.getElementById('home-content-wrapper');

    try {
        // Одновременно запрашиваем и подборки, и данные пользователя
        const [collectionsResponse, userResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/collections`),
            fetch(`${API_BASE_URL}/api/user`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } })
        ]);

        if (!collectionsResponse.ok) throw new Error('Не удалось загрузить подборки');
        
        const collections = await collectionsResponse.json();
        const user = userResponse.ok ? await userResponse.json() : null;
        const isAdmin = user?.is_admin || false;

        // Рендерим полную структуру страницы
        wrapper.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Главная</h1>
                ${isAdmin ? '<button id="manage-collections-btn" class="edit-button">Управлять</button>' : ''}
            </div>
            <div id="collections-container"></div>
        `;

        const collectionsContainer = document.getElementById('collections-container');
        if (collections.length === 0 && !isAdmin) {
            collectionsContainer.innerHTML = '<p class="hint-text">Подборок пока нет.</p>';
        }

        collections.forEach(collection => {
            // Отображаем непустые подборки, или все, если мы админ
            if (isAdmin || (collection.apps && collection.apps.length > 0)) {
                const sectionElement = document.createElement('section');
                sectionElement.className = 'app-collection';
                sectionElement.id = `collection-${collection.id}`;
                collectionsContainer.appendChild(sectionElement);
                renderCollectionContent(sectionElement, collection, isAdmin);
            }
        });

        // Добавляем плейсхолдер для создания новой подборки для админа
        // if (isAdmin) {
        //      const placeholder = document.createElement('div');
        //      placeholder.className = 'add-collection-placeholder';
        //      placeholder.textContent = '+ Создать новую подборку';
        //      placeholder.style.display = 'none'; // По умолчанию скрыт
        //      placeholder.onclick = () => navigateTo('admin', { openTab: 'collections' });
        //      collectionsContainer.appendChild(placeholder);
        // }

        // Добавляем логику для кнопки "Управлять"
        if (isAdmin) {
            const manageButton = document.getElementById('manage-collections-btn');
            const pageContent = document.getElementById('collections-container');
            manageButton.addEventListener('click', () => {
                pageContent.classList.toggle('edit-mode');
                const isInEditMode = pageContent.classList.contains('edit-mode');
                manageButton.textContent = isInEditMode ? 'Готово' : 'Управлять';
                manageButton.classList.toggle('active', isInEditMode);

                const placeholder = document.querySelector('.add-collection-placeholder');
                if (placeholder) {
                    placeholder.style.display = isInEditMode ? 'flex' : 'none';
                }
            });
        }

    } catch (error) {
        console.error('Failed to render home page:', error);
        wrapper.innerHTML = '<p class="error-text">Не удалось загрузить главную страницу.</p>';
    }
}


/**
 * Отрисовывает одну подборку, включая админские кнопки.
 * @param {HTMLElement} sectionElement - HTML-элемент секции.
 * @param {object} collection - Объект подборки.
 * @param {boolean} isAdmin - Является ли пользователь админом.
 */
function renderCollectionContent(sectionElement, collection, isAdmin) {
    const tg = window.Telegram.WebApp;
    const adminControlsHtml = isAdmin ? `
        <div class="collection-admin-buttons">
            <button class="add-to-collection-btn" data-collection-id="${collection.id}" data-collection-name="${collection.name}">Добавить</button>
            <button class="edit-collection-btn" data-collection-id="${collection.id}" data-collection-name="${collection.name}">Изменить состав</button>
            <button class="delete-collection-btn" data-collection-id="${collection.id}" data-collection-name="${collection.name}">Удалить</button>
        </div>
    ` : '';

    sectionElement.innerHTML = `
        <div class="collection-header">
            <h2 class="collection-title">${collection.name}</h2>
            <div class="collection-header-actions">${adminControlsHtml}</div>
        </div>
        <div class="cards-container horizontal-scroll"><div class="loader"></div></div>
    `;

    if (isAdmin) {
        const adminButtons = sectionElement.querySelector('.collection-admin-buttons');
        adminButtons.querySelector('.add-to-collection-btn').addEventListener('click', (e) => {
            const { collectionId, collectionName } = e.currentTarget.dataset;
            navigateTo('search', { addMode: true, addTarget: 'collection', collectionId, collectionName });
        });
        adminButtons.querySelector('.edit-collection-btn').addEventListener('click', (e) => {
            const { collectionId, collectionName } = e.currentTarget.dataset;
            navigateTo('collection-edit', { collectionId, collectionName });
        });
        adminButtons.querySelector('.delete-collection-btn').addEventListener('click', (e) => {
            const { collectionId, collectionName } = e.currentTarget.dataset;
            tg.showConfirm(`Удалить подборку "${collectionName}"? Это действие необратимо.`, async (isConfirmed) => {
                if(isConfirmed) {
                    await fetch(`${API_BASE_URL}/admin/collections/${collectionId}`, {
                        method: 'DELETE',
                        headers: { 'X-Telegram-Init-Data': tg.initData }
                    });
                    sectionElement.remove();
                }
            });
        });
    }
    
    loadAndRenderAppsForCollection(sectionElement, collection.id, collection.name);
}

/**
 * Загружает и отрисовывает приложения для одной подборки.
 * @param {HTMLElement} sectionElement - Секция, куда рендерятся карточки.
 * @param {string} collectionId - ID подборки.
 * @param {string} collectionName - Имя подборки.
 */
async function loadAndRenderAppsForCollection(sectionElement, collectionId, collectionName) {
    const cardsContainer = sectionElement.querySelector('.cards-container');
    const actionsContainer = sectionElement.querySelector('.collection-header-actions');
    const PREVIEW_COUNT = 4;

    try {
        const response = await fetch(`${API_BASE_URL}/api/collection-apps/${collectionId}`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const apps = await response.json();

        cardsContainer.innerHTML = '';
        if (apps.length === 0) {
            cardsContainer.innerHTML = '<p class="hint-text">В этой подборке пока нет приложений.</p>';
            return;
        }

            if (apps.length > PREVIEW_COUNT) {
                const seeAllButton = document.createElement('button');
                seeAllButton.className = 'see-all-button';
                seeAllButton.textContent = 'Смотреть всё';

                seeAllButton.addEventListener('click', () => {
                    // Переходим на новую страницу, передавая ей ID и имя подборки
                    navigateTo('collection-detail', { 
                        collectionId: collectionId,
                        collectionName: collectionName
                    });
                });
            actionsContainer.appendChild(seeAllButton);
        }

        apps.slice(0, PREVIEW_COUNT).forEach(app => cardsContainer.appendChild(createAppCard(app)));
    } catch (error) {
        cardsContainer.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
}

// Регистрируем маршрут главной страницы
routes.home = renderHomePage;