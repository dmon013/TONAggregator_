// frontend/js/home.js

// Укажи здесь URL своего бэкенда
const API_BASE_URL = 'http://127.0.0.1:5001';

/**
 * Главная функция для отрисовки домашней страницы
 * @param {HTMLElement} container - Элемент, в который будет рендериться контент
 */
function renderHomePage(container) {
    container.innerHTML = `
        <div class="page-content">
            <section id="trending-section" class="app-collection"></section>
            <section id="new-section" class="app-collection"></section>
            <section id="top3-section" class="app-collection"></section>
        </div>
    `;

    // Загружаем и отрисовываем каждую коллекцию
    renderCollection(
        document.getElementById('trending-section'),
        'trending',
        '🔥 В тренде'
    );
    renderCollection(
        document.getElementById('new-section'),
        'new',
        '✨ Новое'
    );
    renderCollection(
        document.getElementById('top3-section'),
        'top3',
        '🏆 Топ 3'
    );
}

/**
 * Загружает и отрисовывает одну коллекцию приложений
 * @param {HTMLElement} sectionElement - Секция для отрисовки
 * @param {string} collectionType - Тип коллекции (trending, new, top3)
 * @param {string} title - Заголовок секции
 */
async function renderCollection(sectionElement, collectionType, title) {
    sectionElement.innerHTML = `
        <h2 class="collection-title">${title}</h2>
        <div class="cards-container">
            <div class="loader"></div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionType}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apps = await response.json();
        
        const cardsContainer = sectionElement.querySelector('.cards-container');
        cardsContainer.innerHTML = ''; // Очищаем лоадер

        if (apps.length === 0) {
            cardsContainer.innerHTML = '<p class="hint-text">Здесь пока пусто.</p>';
            return;
        }

        apps.forEach(app => {
            const appCard = createAppCard(app);
            cardsContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error(`Failed to load collection ${collectionType}:`, error);
        const cardsContainer = sectionElement.querySelector('.cards-container');
        cardsContainer.innerHTML = '<p class="error-text">Не удалось загрузить приложения. Попробуйте позже.</p>';
    }
}

// --- Стили для новых элементов (добавь в styles.css или оставь здесь в <style>) ---
// Для удобства можно добавить этот блок в твой основной CSS файл.
const homePageStyles = `
.collection-title {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 12px;
}
.app-collection {
    margin-bottom: 24px;
}
.cards-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.app-card {
    background: var(--card-bg-color, rgba(222, 239, 247, 0.08));
    border-radius: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}
.app-card:hover {
    background-color: rgba(222, 239, 247, 0.15);
}
.app-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    object-fit: cover;
}
.app-info {
    flex-grow: 1;
}
.app-title {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
}
.app-description {
    font-size: 14px;
    color: var(--tg-theme-hint-color);
    margin: 4px 0 0;
}
.open-app-button {
    background-color: var(--tg-theme-button-color);
    color: var(--tg-theme-button-text-color);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: filter 0.2s;
}
.open-app-button:hover {
    filter: brightness(1.1);
}
.loader {
    width: 24px;
    height: 24px;
    border: 3px solid var(--tg-theme-hint-color);
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
    margin: 20px auto;
}
.hint-text, .error-text {
    color: var(--tg-theme-hint-color);
    text-align: center;
    padding: 20px;
}

@keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Добавляем стили на страницу (лучше перенести в css/styles.css)
document.head.appendChild(document.createElement('style')).innerHTML = homePageStyles;


// Регистрируем функцию отрисовки в нашем роутере
routes.home = renderHomePage;