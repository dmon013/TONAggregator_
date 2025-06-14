// frontend/js/search.js

/**
 * Функция-декоратор для задержки выполнения другой функции.
 * @param {Function} func - Функция, которую нужно вызывать с задержкой
 * @param {number} delay - Задержка в миллисекундах
 * @returns {Function}
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Отрисовывает страницу поиска
 * @param {HTMLElement} container - Элемент, в который будет рендериться контент
 */
function renderSearchPage(container) {
    container.innerHTML = `
        <div class="search-page">
            <div class="search-bar-container">
                <input type="search" id="search-input" placeholder="Найти приложение..." autocomplete="off">
            </div>
            <div id="search-results-container" class="cards-container">
                <p class="hint-text">Начните вводить название приложения для поиска.</p>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-container');

    // Вызываем поиск с дебаунсом в 300мс
    searchInput.addEventListener('input', debounce((event) => {
        performSearch(event.target.value, resultsContainer);
    }, 300));
}

/**
 * Выполняет поиск и отрисовывает результаты
 * @param {string} query - Поисковый запрос
 * @param {HTMLElement} resultsContainer - Контейнер для результатов
 */
async function performSearch(query, resultsContainer) {
    query = query.trim();

    if (query.length < 2) {
        resultsContainer.innerHTML = '<p class="hint-text">Введите хотя бы 2 символа для начала поиска.</p>';
        return;
    }

    resultsContainer.innerHTML = '<div class="loader"></div>'; // Показываем лоадер

    try {
        const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const results = await response.json();

        resultsContainer.innerHTML = ''; // Очищаем лоадер

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="hint-text">Ничего не найдено.</p>';
            return;
        }

        results.forEach(app => {
            const appCard = createAppCard(app); // Используем общую функцию
            resultsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = '<p class="error-text">Ошибка поиска. Попробуйте снова.</p>';
    }
}


// Регистрируем страницу поиска в роутере
routes.search = renderSearchPage;