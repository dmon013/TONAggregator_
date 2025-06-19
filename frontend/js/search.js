// frontend/js/search.js (ФИНАЛЬНАЯ ВЕРСИЯ, КОТОРАЯ РАБОТАЕТ)

let activeCategory = null;

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
        } else {
            title = `Выбор для ячейки #${params.slotIndex + 1}`;
        }
        setupBackButton(container);
    }

    container.innerHTML = `
        <div class="search-page">
            <h1 class="page-title">${title}</h1>
            <div class="search-bar-container"><input type="search" id="search-input" placeholder="${placeholder}" autocomplete="off"></div>
            <div id="category-filters-container" class="category-filters"><div class="loader-small"></div></div>
            <div id="search-results-container" class="cards-container"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const filtersContainer = document.getElementById('category-filters-container');

    const triggerSearch = () => performSearch(searchInput.value, activeCategory, resultsContainer, params);
    
    searchInput.addEventListener('input', debounce(triggerSearch, 300));

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await response.json();
        filtersContainer.innerHTML = '';
        const allBtn = createCategoryButton({ id: null, name: 'Все' }, triggerSearch);
        allBtn.classList.add('active');
        filtersContainer.appendChild(allBtn);
        categories.forEach(category => filtersContainer.appendChild(createCategoryButton(category, triggerSearch)));
    } catch (e) {
        filtersContainer.innerHTML = '<p class="error-text small">Не удалось загрузить категории</p>';
    }
    
    triggerSearch();
}

function createCategoryButton(category, triggerSearch) {
    const button = document.createElement('button');
    button.className = 'category-filter-btn';
    button.textContent = category.name;
    button.dataset.categoryId = category.id;
    button.addEventListener('click', () => {
        document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeCategory = button.dataset.categoryId === 'null' ? null : button.dataset.categoryId;
        triggerSearch();
    });
    return button;
}

async function performSearch(query, categoryId, resultsContainer, params) {
    const addMode = params.addMode || false;
    query = query.trim().toLowerCase();
    resultsContainer.innerHTML = '<div class="loader"></div>';

    const url = new URL(`${API_BASE_URL}/api/search`);
    if (query) url.searchParams.append('query', query);
    if (categoryId) url.searchParams.append('category', categoryId);

    try {
        // Загружаем результаты поиска
        const searchResponse = await fetch(url);
        if (!searchResponse.ok) throw new Error('Ошибка поиска');
        const searchResults = await searchResponse.json();
        
        let existingAppIds = [];
        // Если мы в режиме добавления, загружаем список уже добавленных приложений
        if (addMode) {
            let fetchUrl = '';
            if (params.addTarget === 'my-apps') fetchUrl = `${API_BASE_URL}/api/myapps`;
            else if (params.addTarget === 'collection') fetchUrl = `${API_BASE_URL}/api/collection-apps/${params.collectionId}`;
            
            if(fetchUrl) {
                const existingResponse = await fetch(fetchUrl, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } });
                if(existingResponse.ok) {
                    const apps = await existingResponse.json();
                    existingAppIds = Array.isArray(apps) ? apps.map(a => a.id) : Object.values(apps).map(a => a.id);
                }
            }
        }
        
        resultsContainer.innerHTML = '';
        if (searchResults.length === 0) {
            resultsContainer.innerHTML = '<p class="hint-text">Ничего не найдено.</p>';
            return;
        }
        searchResults.forEach(app => {
            const appCard = addMode ? createAppCardForAddMode(app, params, existingAppIds) : createAppCard(app);
            resultsContainer.appendChild(appCard);
        });
    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = '<p class="error-text">Ошибка поиска. Попробуйте снова.</p>';
    }
}

function createAppCardForAddMode(app, params, existingAppIds) {
    const card = document.createElement('div');
    card.className = 'app-card';
    const tg = window.Telegram.WebApp;
    // Универсальная проверка на дубликаты
    const isAlreadyAdded = existingAppIds.includes(app.id);

    card.innerHTML = `<img src="${app.icon_url}" alt="${app.title}" class="app-icon"><div class="app-info"><h3 class="app-title">${app.title}</h3><p class="app-description">${app.short_description}</p></div><button class="add-app-button">Добавить</button>`;
    
    const addButton = card.querySelector('.add-app-button');
    if (isAlreadyAdded) {
        addButton.disabled = true;
        addButton.textContent = 'Добавлено';
        addButton.classList.add('disabled');
    } else {
        addButton.addEventListener('click', async e => {
            e.stopPropagation();
            let apiUrl = '', body = {}, successRedirectRoute = 'home';
            if (params.addTarget === 'collection') {
                apiUrl = `${API_BASE_URL}/admin/collections/manage`;
                body = { collection_id: params.collectionId, app_id: app.id, action: 'add' };
            } else {
                apiUrl = `${API_BASE_URL}/api/myapps/update`;
                body = { slotIndex: params.slotIndex, app_id: app.id };
                successRedirectRoute = 'myapps';
            }
            addButton.disabled = true;
            addButton.textContent = '...';
            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData }, body: JSON.stringify(body) });
                if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || 'Ошибка'); }
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