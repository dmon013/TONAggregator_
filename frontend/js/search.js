// frontend/js/search.js (ПОЛНАЯ ФИНАЛЬНАЯ ВЕРСИЯ)

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function renderSearchPage(container, params = {}) {
    const addMode = params.addMode || false;

    let title = "Поиск";
    let placeholder = "Найти приложение...";

    if (addMode) {
        if (params.addTarget === 'collection') {
            title = `Добавление в "${params.collectionName || ''}"`;
            placeholder = `Найти для "${params.collectionName || ''}"...`;
        } else { // addTarget === 'my-apps'
            const slotIndex = params.slotIndex;
            title = `Выбор для ячейки #${slotIndex !== undefined ? slotIndex + 1 : '?'}`;
            placeholder = "Найти приложение для добавления...";
        }
        setupBackButton(container);
    }

    container.innerHTML = `
        <div class="search-page">
            <h1 class="page-title">${title}</h1>
            <div class="search-bar-container">
                <input type="search" id="search-input" placeholder="${placeholder}" autocomplete="off">
            </div>
            <div id="search-results-container" class="cards-container"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-container');
    
    let currentUserAppIds = [];
    if (addMode && params.addTarget === 'my-apps') {
        try {
            const response = await fetch(`${API_BASE_URL}/api/myapps`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } });
            if (response.ok) {
                const currentUserApps = await response.json();
                currentUserAppIds = Object.values(currentUserApps).map(app => app.id);
            }
        } catch (e) { console.error("Could not fetch current user apps"); }
    }

    searchInput.addEventListener('input', debounce((event) => {
        performSearch(event.target.value, resultsContainer, params, currentUserAppIds);
    }, 300));
}

async function performSearch(query, resultsContainer, params, currentUserAppIds) {
    const addMode = params.addMode || false;
    query = query.trim().toLowerCase();

    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    resultsContainer.innerHTML = '<div class="loader"></div>';

    try {
        const url = new URL(`${API_BASE_URL}/api/search`);
        if (query) url.searchParams.append('query', query);
        if (params.addTarget === 'collection' && params.collectionId) {
             url.searchParams.append('category', params.collectionId); // Исправлено, чтобы использовать правильный параметр для бэкенда
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка поиска');
        
        const results = await response.json();
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="hint-text">Ничего не найдено.</p>';
            return;
        }

        results.forEach(app => {
            const appCard = addMode 
                ? createAppCardForAddMode(app, params, currentUserAppIds) 
                : createAppCard(app);
            resultsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = '<p class="error-text">Ошибка поиска. Попробуйте снова.</p>';
    }
}

function createAppCardForAddMode(app, params, currentUserAppIds) {
    const card = document.createElement('div');
    card.className = 'app-card';
    const tg = window.Telegram.WebApp;

    const isAlreadyAdded = params.addTarget === 'my-apps' && currentUserAppIds.includes(app.id);

    card.innerHTML = `
        <img src="${app.icon_url}" alt="${app.title}" class="app-icon">
        <div class="app-info">
            <h3 class="app-title">${app.title}</h3>
            <p class="app-description">${app.short_description}</p>
        </div>
        <button class="add-app-button">Добавить</button>
    `;

    const addButton = card.querySelector('.add-app-button');
    
    if (isAlreadyAdded) {
        addButton.disabled = true;
        addButton.textContent = 'Добавлено';
        addButton.classList.add('disabled');
    } else {
        addButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            let apiUrl = '', body = {}, successRedirectRoute = 'home';

            if (params.addTarget === 'collection') {
                apiUrl = `${API_BASE_URL}/admin/collections/manage`;
                body = { collection_id: params.collectionId, app_id: app.id, action: 'add' };
            } else { // 'my-apps'
                apiUrl = `${API_BASE_URL}/api/myapps/update`;
                body = { slotIndex: params.slotIndex, app_id: app.id };
                successRedirectRoute = 'myapps';
            }

            addButton.disabled = true;
            addButton.textContent = '...';

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                    body: JSON.stringify(body)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Не удалось добавить');
                }
                tg.HapticFeedback.notificationOccurred('success');
                navigateTo(successRedirectRoute);
            } catch (error) {
                tg.showAlert(`Ошибка: ${error.message}`);
                addButton.disabled = false;
                addButton.textContent = 'Добавить';
            }
        });
    }
    return card;
}

routes.search = renderSearchPage;