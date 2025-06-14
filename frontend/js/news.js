// frontend/js/news.js

/**
 * Отрисовывает страницу со списком всех новостей
 * @param {HTMLElement} container - Элемент для рендеринга
 */
async function renderNewsListPage(container) {
    container.innerHTML = `
        <div class="news-list-page">
            <h1 class="page-title">Новости</h1>
            <div id="news-list-container" class="cards-container">
                <div class="loader"></div>
            </div>
        </div>
    `;

    const newsListContainer = document.getElementById('news-list-container');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/news`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const news = await response.json();

        newsListContainer.innerHTML = ''; // Очищаем лоадер

        if (news.length === 0) {
            newsListContainer.innerHTML = '<p class="hint-text">Новостей пока нет.</p>';
            return;
        }

        news.forEach(newsItem => {
            const newsCard = createNewsCard(newsItem);
            newsListContainer.appendChild(newsCard);
        });

    } catch (error) {
        console.error(error);
        newsListContainer.innerHTML = '<p class="error-text">Не удалось загрузить новости.</p>';
    }
}

/**
 * Создает карточку для одной новости
 * @param {object} newsItem - Данные одной новости
 * @returns {HTMLElement}
 */
function createNewsCard(newsItem) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // Форматируем дату в читаемый вид
    const date = new Date(newsItem.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    card.innerHTML = `
        <img src="${newsItem.preview_url}" alt="${newsItem.title}" class="news-card-image">
        <div class="news-card-content">
            <h3 class="news-card-title">${newsItem.title}</h3>
            <p class="news-card-date">${date}</p>
        </div>
    `;

    // Добавляем обработчик клика для перехода к деталям
    card.addEventListener('click', () => {
        navigateTo('news-detail', { id: newsItem.id });
    });

    return card;
}

/**
 * Отрисовывает страницу с деталями одной новости
 * @param {HTMLElement} container - Элемент для рендеринга
 * @param {object} params - Параметры маршрута, например { id: '...' }
 */
async function renderNewsDetailPage(container, params) {
    const tg = window.Telegram.WebApp;
    const newsId = params.id;

    container.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/news/${newsId}`);
        if (!response.ok) throw new Error('Failed to fetch news details');
        const news = await response.json();

        container.innerHTML = `
            <div class="news-detail-page">
                <img src="${news.preview_url}" alt="${news.title}" class="news-detail-image">
                <div class="news-detail-content">
                    <h1 class="news-detail-title">${news.title}</h1>
                    <p class="news-detail-date">${new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
                    <div class="news-detail-body">
                        </div>
                </div>
            </div>
        `;

        // Вставляем HTML-контент.
        const bodyContainer = container.querySelector('.news-detail-body');
        bodyContainer.innerHTML = news.content;
        
        // --- Показываем и настраиваем кнопку "Назад" ---
        tg.BackButton.show();
        
        // Создаем функцию-обработчик для кнопки "Назад"
        const onBackButtonClick = () => {
            navigateTo('news');
            // Важно удалить обработчик после использования, чтобы избежать утечек памяти
            tg.BackButton.offClick(onBackButtonClick); 
        };
        
        // Назначаем обработчик
        tg.BackButton.onClick(onBackButtonClick);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="error-text">Не удалось загрузить новость.</p>';
    }
}

// Регистрируем наши новые функции в роутере
routes.news = renderNewsListPage;
routes['news-detail'] = renderNewsDetailPage;