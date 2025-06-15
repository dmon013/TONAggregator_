// frontend/js/admin.js (ПОЛНАЯ ИТОГОВАЯ ВЕРСИЯ)

/**
 * Главная функция отрисовки страницы администратора.
 * Сначала проверяет права доступа.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 */
async function renderAdminPage(container) {
    const tg = window.Telegram.WebApp;
    container.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { 'X-Telegram-Init-Data': tg.initData }
        });
        const userData = await response.json();

        if (!response.ok || !userData.is_admin) {
            container.innerHTML = '<h1 class="page-title">Доступ запрещен</h1><p class="hint-text">Эта страница доступна только администраторам.</p>';
            return;
        }

        // Если пользователь админ, рисуем панель с вкладками
        container.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Панель администратора</h1>
                <div class="admin-tabs">
                    <button class="admin-tab-button active" data-tab="add-app">Добавить App</button>
                    <button class="admin-tab-button" data-tab="add-news">Добавить Новость</button>
                    <button class="admin-tab-button" data-tab="submissions">Заявки</button>
                    <button class="admin-tab-button" data-tab="collections">Подборки</button>
                </div>
                <div id="admin-content" class="admin-content"></div>
            </div>
        `;
        
        const adminContent = document.getElementById('admin-content');
        const tabs = document.querySelectorAll('.admin-tab-button');

        const renderTabContent = (tabName) => {
            switch (tabName) {
                case 'add-app':
                    renderAddAppForm(adminContent);
                    break;
                case 'add-news':
                    renderAddNewsForm(adminContent);
                    break;
                case 'submissions':
                    renderSubmissions(adminContent);
                    break;
                case 'collections':
                    renderCollectionsAdmin(adminContent);
                    break;
            }
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderTabContent(tab.dataset.tab);
            });
        });

        // По умолчанию открываем первую вкладку
        renderTabContent('add-app');

    } catch (error) {
        container.innerHTML = '<p class="error-text">Ошибка проверки прав доступа.</p>';
    }
}

/**
 * Функция для отрисовки вкладки "Добавить App".
 * @param {HTMLElement} container 
 */
function renderAddAppForm(container) {
    container.innerHTML = `
        <form id="add-app-form" class="admin-form">
            <h2>Новое приложение</h2>
            <input type="text" name="title" placeholder="Название" required>
            <input type="url" name="app_url" placeholder="Ссылка на Web App" required>
            <textarea name="short_description" placeholder="Краткое описание (для карточек)" rows="3" required></textarea>
            <textarea name="long_description" placeholder="Полное описание (для страницы приложения)" rows="6" required></textarea>
            <input type="text" name="category_id" placeholder="ID Категории (например, games)" required>
            <label for="icon-file">Иконка приложения (PNG/JPG):</label>
            <input type="file" name="icon" id="icon-file" accept="image/png, image/jpeg" required>
            <button type="submit">Добавить приложение</button>
        </form>
    `;

    document.getElementById('add-app-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button');
        button.disabled = true;
        button.textContent = 'Загрузка...';

        const formData = new FormData(form);
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/apps`, {
                method: 'POST',
                headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData },
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }
            window.Telegram.WebApp.showAlert('Приложение успешно добавлено!');
            form.reset();
        } catch (error) {
            window.Telegram.WebApp.showAlert(`Ошибка: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Добавить приложение';
        }
    });
}

/**
 * Функция для отрисовки вкладки "Добавить Новость".
 * @param {HTMLElement} container 
 */
function renderAddNewsForm(container) {
    container.innerHTML = `
        <form id="add-news-form" class="admin-form">
            <h2>Новая новость</h2>
            <input type="text" name="title" placeholder="Заголовок" required>
            <textarea name="excerpt" placeholder="Краткое описание (для списка новостей)" rows="3" required></textarea>
            <textarea name="content" placeholder="Полный текст новости (можно использовать HTML-теги)" rows="10" required></textarea>
            <label for="preview-image">Превью новости (PNG/JPG):</label>
            <input type="file" name="preview_image" id="preview-image" accept="image/png, image/jpeg" required>
            <button type="submit">Опубликовать новость</button>
        </form>
    `;
    
    document.getElementById('add-news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button');
        button.disabled = true;
        button.textContent = 'Публикация...';

        const formData = new FormData(form);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/news`, {
                method: 'POST',
                headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData },
                body: formData
            });
            if (!response.ok) throw new Error('Ошибка сервера');
            window.Telegram.WebApp.showAlert('Новость успешно опубликована!');
            form.reset();
        } catch (error) {
            window.Telegram.WebApp.showAlert('Ошибка при публикации новости.');
        } finally {
            button.disabled = false;
            button.textContent = 'Опубликовать новость';
        }
    });
}

/**
 * Функция для отрисовки вкладки "Заявки".
 * @param {HTMLElement} container 
 */
async function renderSubmissions(container) {
    container.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/submissions`, {
            headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData }
        });
        if (!response.ok) throw new Error('Не удалось загрузить заявки');
        const submissions = await response.json();
        
        container.innerHTML = '<h2>Заявки от пользователей</h2>';

        if (submissions.length === 0) {
            container.innerHTML += '<p class="hint-text">Новых заявок нет.</p>';
            return;
        }

        const submissionList = document.createElement('div');
        submissionList.className = 'cards-container';
        submissions.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'submission-card';
            card.id = `submission-${sub.id}`;
            card.innerHTML = `
                <h3>${sub.title}</h3>
                <p><strong>URL:</strong> <a href="${sub.app_url}" target="_blank" rel="noopener noreferrer">${sub.app_url}</a></p>
                <p><strong>Описание:</strong> ${sub.description}</p>
                <p><small>От: @${sub.username || 'unknown'} (${sub.user_id})</small></p>
                <div class="submission-actions">
                    <button class="button-primary approve-btn" data-id="${sub.id}">Одобрить</button>
                    <button class="button-secondary reject-btn" data-id="${sub.id}">Отклонить</button>
                </div>
            `;
            submissionList.appendChild(card);
        });
        container.appendChild(submissionList);

        // Добавляем обработчики событий на все новые кнопки
        container.querySelectorAll('.approve-btn, .reject-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const subId = e.target.dataset.id;
                const isApprove = e.target.classList.contains('approve-btn');
                const action = isApprove ? 'approve' : 'reject';
                
                e.target.textContent = '...';
                e.target.disabled = true;
                e.target.parentElement.querySelectorAll('button').forEach(b => b.disabled = true);

                try {
                    await fetch(`${API_BASE_URL}/admin/submissions/${subId}/${action}`, {
                        method: 'POST',
                        headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData }
                    });
                    document.getElementById(`submission-${subId}`).style.opacity = '0.5';
                    e.target.parentElement.innerHTML = `<p class="hint-text">Заявка обработана.</p>`;
                } catch (err) {
                    window.Telegram.WebApp.showAlert(`Ошибка при выполнении действия: ${action}.`);
                    e.target.textContent = isApprove ? 'Одобрить' : 'Отклонить';
                    e.target.parentElement.querySelectorAll('button').forEach(b => b.disabled = false);
                }
            });
        });

    } catch (error) {
        container.innerHTML = '<p class="error-text">Не удалось загрузить заявки.</p>';
    }
}

// frontend/js/admin.js (добавить в конец файла)

function renderCollectionsAdmin(container) {
    container.innerHTML = `
        <form id="add-collection-form" class="admin-form">
            <h2>Новая подборка</h2>
            <input type="text" name="id" placeholder="ID (например, summer_hits)" required pattern="[a-z0-9_]+">
            <input type="text" name="name" placeholder="Отображаемое название (например, 🔥 Летние хиты)" required>
            <button type="submit">Создать подборку</button>
        </form>
    `;

    document.getElementById('add-collection-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button');
        const data = {
            id: form.querySelector('[name="id"]').value,
            name: form.querySelector('[name="name"]').value,
        };

        button.disabled = true;
        button.textContent = '...';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/collections`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }
            window.Telegram.WebApp.showAlert(`Подборка "${data.name}" успешно создана!`);
            form.reset();
        } catch (error) {
            window.Telegram.WebApp.showAlert(`Ошибка: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Создать подборку';
        }
    });
}

// Регистрируем маршрут для страницы администратора
routes.admin = renderAdminPage;