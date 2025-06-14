console.log("ЗАГРУЖЕН ФАЙЛ search.js ВЕРСИЯ 2.0 - с проверкой на дубликаты");
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Делаем функцию асинхронной, чтобы дождаться загрузки текущих приложений
async function renderSearchPage(container, params = {}) {
    const addMode = params.addMode || false;
    const slotIndex = params.slotIndex;
    
    const title = addMode ? `Выбор приложения для ячейки #${slotIndex + 1}` : "Поиск";
    const placeholder = addMode ? "Найти приложение для добавления..." : "Найти приложение...";

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
    
    let currentUserAppIds = []; // Переменная для хранения ID текущих приложений
    if (addMode) {
        setupBackButton(container);
        try {
            const response = await fetch(`${API_BASE_URL}/api/myapps`, {
                headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData }
            });
            const currentUserApps = await response.json();
            // Превращаем объект с приложениями в простой массив их ID
            currentUserAppIds = Object.values(currentUserApps).map(app => app.id);
        } catch (e) { console.error("Could not fetch current user apps"); }
    }

    searchInput.addEventListener('input', debounce((event) => {
        // Передаем массив ID в функцию поиска
        performSearch(event.target.value, resultsContainer, addMode, slotIndex, currentUserAppIds);
    }, 300));
}

// Добавляем currentUserAppIds в параметры функции
async function performSearch(query, resultsContainer, addMode, slotIndex, currentUserAppIds = []) {
    query = query.trim().toLowerCase();

    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    resultsContainer.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Ошибка поиска');
        
        const results = await response.json();
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="hint-text">Ничего не найдено.</p>';
            return;
        }

        results.forEach(app => {
            // Передаем массив ID дальше в функцию создания карточки
            const appCard = addMode 
                ? createAppCardForAddMode(app, slotIndex, currentUserAppIds) 
                : createAppCard(app);
            resultsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = '<p class="error-text">Ошибка поиска. Попробуйте снова.</p>';
    }
}

// Добавляем currentUserAppIds в параметры и используем его
function createAppCardForAddMode(app, slotIndex, currentUserAppIds) {
    const card = document.createElement('div');
    card.className = 'app-card';

    // Проверяем, есть ли ID текущего приложения в списке уже добавленных
    const isAlreadyAdded = currentUserAppIds.includes(app.id);

    card.innerHTML = `
        <img src="${app.icon_url}" alt="${app.title}" class="app-icon">
        <div class="app-info">
            <h3 class="app-title">${app.title}</h3>
            <p class="app-description">${app.short_description}</p>
        </div>
        <button class="add-app-button">Добавить</button>
    `;

    const addButton = card.querySelector('.add-app-button');
    
    // Если приложение уже добавлено, делаем кнопку неактивной
    if (isAlreadyAdded) {
        addButton.disabled = true;
        addButton.textContent = 'Добавлено';
        addButton.classList.add('disabled');
    } else {
        addButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tg = window.Telegram.WebApp;
            
            addButton.disabled = true;
            addButton.textContent = '...';

            try {
                const response = await fetch(`${API_BASE_URL}/api/myapps/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                    body: JSON.stringify({ slotIndex, app_id: app.id })
                });
                if (!response.ok) throw new Error('Не удалось добавить');
                
                tg.HapticFeedback.notificationOccurred('success');
                navigateTo('myapps');
            } catch (error) {
                // Если бэкенд вернул ошибку (например, 409), покажем ее
                const errorData = await error.response?.json();
                tg.showAlert(errorData?.error || 'Ошибка при добавлении.');
                addButton.disabled = false;
                addButton.textContent = 'Добавить';
            }
        });
    }
    return card;
}


routes.search = renderSearchPage;