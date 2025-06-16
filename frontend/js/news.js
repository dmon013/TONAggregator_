// frontend/js/news.js (ФИНАЛЬНАЯ ПРОВЕРЕННАЯ ВЕРСИЯ)

async function renderNewsListPage(container) {
    container.innerHTML = `<div class="news-list-page"><h1 class="page-title">Новости</h1><div id="news-list-container" class="cards-container"><div class="loader"></div></div></div>`;
    const newsListContainer = document.getElementById('news-list-container');
    
    try {
        const [newsResponse, userResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/news`),
            fetch(`${API_BASE_URL}/api/user`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } })
        ]);
        
        if (!newsResponse.ok) throw new Error('Failed to fetch news');
        const newsList = await newsResponse.json();
        const user = userResponse.ok ? await userResponse.json() : null;
        const isAdmin = user?.is_admin || false;

        newsListContainer.innerHTML = '';
        if (newsList.length === 0) {
            newsListContainer.innerHTML = '<p class="hint-text">Новостей пока нет.</p>';
            return;
        }

        newsList.forEach(newsItem => {
            const newsCard = createNewsCard(newsItem, isAdmin);
            newsListContainer.appendChild(newsCard);
        });
    } catch (error) {
        console.error("Ошибка при рендеринге списка новостей:", error);
        newsListContainer.innerHTML = '<p class="error-text">Не удалось загрузить новости.</p>';
    }
}

function createNewsCard(newsItem, isAdmin) {
    const card = document.createElement('div');
    card.className = 'news-card';
    const tg = window.Telegram.WebApp;

    const date = new Date(newsItem.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const excerptHtml = newsItem.excerpt ? `<p class="news-card-excerpt">${newsItem.excerpt}</p>` : '';
    const adminDeleteBtnHtml = isAdmin ? `<button class="delete-news-btn" data-id="${newsItem.id}" data-title="${newsItem.title}">Удалить</button>` : '';

    card.innerHTML = `
        <img src="${newsItem.preview_url}" alt="${newsItem.title}" class="news-card-image">
        <div class="news-card-content">
            <h3 class="news-card-title">${newsItem.title}</h3>
            ${excerptHtml}
            <p class="news-card-date">${date}</p>
        </div>
        ${adminDeleteBtnHtml}
    `;

    if (isAdmin) {
        const deleteButton = card.querySelector('.delete-news-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const { id, title } = e.currentTarget.dataset;
                tg.showConfirm(`Вы уверены, что хотите удалить новость "${title}"?`, async (isConfirmed) => {
                    if (isConfirmed) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
                                method: 'DELETE',
                                headers: { 'X-Telegram-Init-Data': tg.initData }
                            });
                            if (!response.ok) throw new Error('Server error on delete');
                            card.remove();
                        } catch (err) {
                            tg.showAlert('Не удалось удалить новость.');
                        }
                    }
                });
            });
        }
    }

    card.addEventListener('click', (e) => {
        // Убеждаемся, что клик был не по кнопке удаления
        if (e.target.classList.contains('delete-news-btn')) {
            return;
        }
        navigateTo('news-detail', { id: newsItem.id });
    });

    return card;
}


async function renderNewsDetailPage(container, params) {
    const newsId = params.id;
    if (!newsId) {
        container.innerHTML = '<p class="error-text">Ошибка: не указан ID новости.</p>';
        return;
    }
    
    container.innerHTML = '<div class="loader"></div>';
    setupBackButton(container);

    try {
        const response = await fetch(`${API_BASE_URL}/api/news/${newsId}`);
        if (!response.ok) throw new Error('Не удалось загрузить новость.');
        
        const news = await response.json();
        container.innerHTML = `
            <div class="news-detail-page">
                <img src="${news.preview_url}" alt="${news.title}" class="news-detail-image">
                <div class="news-detail-content">
                    <h1 class="news-detail-title">${news.title}</h1>
                    <p class="news-detail-date">${new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
                    <div class="news-detail-body">${news.content}</div>
                </div>
            </div>
        `;
        setupBackButton(container);

    } catch (error) {
        console.error("Ошибка при рендеринге деталей новости:", error);
        container.innerHTML = `<p class="error-text">${error.message}</p>`;
        setupBackButton(container);
    }
}

routes.news = renderNewsListPage;
routes['news-detail'] = renderNewsDetailPage;