// frontend/js/home.js (ПОЛНАЯ НОВАЯ ДИНАМИЧЕСКАЯ ВЕРСИЯ)

// API_BASE_URL остается без изменений

/**
 * Главная функция для отрисовки домашней страницы.
 * Теперь она сама загружает список всех подборок и рендерит их.
 * @param {HTMLElement} container - Элемент, в который будет рендериться контент
 */
async function renderHomePage(container) {
    container.innerHTML = `
        <div class="page-content" id="home-page-content">
            <div class="loader"></div>
        </div>
    `;
    const homeContent = document.getElementById('home-page-content');

    try {
        // Загружаем список всех существующих подборок
        const response = await fetch(`${API_BASE_URL}/api/collections`);
        if (!response.ok) throw new Error('Не удалось загрузить подборки');
        
        const collections = await response.json();

        homeContent.innerHTML = ''; // Убираем лоадер

        // Для каждой подборки создаем свою секцию и запускаем загрузку приложений
        collections.forEach(collection => {
            // Важное условие: не показываем подборку, если у нее нет поля 'apps' или оно пустое
            if (collection.apps && collection.apps.length > 0) {
                const sectionElement = document.createElement('section');
                sectionElement.id = `collection-${collection.id}`;
                sectionElement.className = 'app-collection';
                homeContent.appendChild(sectionElement);
                
                // Вызываем нашу старую добрую функцию для отрисовки контента этой секции
                renderCollectionContent(sectionElement, collection.id, collection.name);
            }
        });

    } catch (error) {
        console.error('Failed to render home page:', error);
        homeContent.innerHTML = '<p class="error-text">Не удалось загрузить главную страницу.</p>';
    }
}

/**
 * Загружает и отрисовывает ПРИЛОЖЕНИЯ для ОДНОЙ конкретной подборки
 * @param {HTMLElement} sectionElement - Секция для отрисовки
 * @param {string} collectionId - ID подборки (trending, new, summer_hits)
 * @param {string} title - Заголовок секции (🔥 В тренде, ✨ Новое, ☀️ Летние Хиты)
 */
async function renderCollectionContent(sectionElement, collectionId, title) {
    sectionElement.innerHTML = `
        <h2 class="collection-title">${title}</h2>
            <div class="cards-container">
            <div class="loader"></div>
        </div>
    `;

    try {
        // ИЗМЕНЕНИЕ ЗДЕСЬ: Обращаемся к новому маршруту /collection-apps/
        const response = await fetch(`${API_BASE_URL}/api/collection-apps/${collectionId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const apps = await response.json();
        
        const cardsContainer = sectionElement.querySelector('.cards-container');
        cardsContainer.innerHTML = '';

        if (apps.length === 0) {
            sectionElement.style.display = 'none';
            return;
        }

        apps.forEach(app => {
            const appCard = createAppCard(app);
            cardsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error(`Failed to load collection ${collectionId}:`, error);
        sectionElement.innerHTML = `<h2 class="collection-title">${title}</h2><p class="error-text">Не удалось загрузить приложения.</p>`;
    }
}

// Регистрируем маршрут в роутере
routes.home = renderHomePage;