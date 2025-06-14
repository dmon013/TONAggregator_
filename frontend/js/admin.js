// frontend/js/admin.js

async function renderAdminPage(container) {
    // Сначала проверим права доступа
    const tg = window.Telegram.WebApp;
    container.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { 'X-Telegram-Init-Data': tg.initData }
        });
        const userData = await response.json();

        if (!response.ok || !userData.is_admin) {
            container.innerHTML = '<h1 class="page-title">Доступ запрещен</h1>';
            return;
        }

        // Если пользователь админ, рисуем панель
        container.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Панель администратора</h1>
                <div class="admin-tabs">
                    <button class="admin-tab-button active" data-tab="add-app">Добавить App</button>
                    <button class="admin-tab-button" data-tab="add-news">Добавить Новость</button>
                    <button class="admin-tab-button" data-tab="submissions">Заявки</button>
                </div>
                <div id="admin-content" class="admin-content"></div>
            </div>
        `;
        
        const adminContent = document.getElementById('admin-content');
        const tabs = document.querySelectorAll('.admin-tab-button');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
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
                }
            });
        });

        // По умолчанию открываем первую вкладку
        renderAddAppForm(adminContent);

    } catch (error) {
        container.innerHTML = '<p class="error-text">Ошибка проверки прав доступа.</p>';
    }
}

function renderAddAppForm(container) {
    container.innerHTML = `
        <form id="add-app-form" class="admin-form">
            <h2>Новое приложение</h2>
            <input type="text" name="title" placeholder="Название" required>
            <input type="url" name="app_url" placeholder="Ссылка на Web App" required>
            <textarea name="description" placeholder="Описание" rows="4" required></textarea>
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
            if (!response.ok) throw new Error('Server error');
            window.Telegram.WebApp.showAlert('Приложение успешно добавлено!');
            form.reset();
        } catch (error) {
            window.Telegram.WebApp.showAlert('Ошибка при добавлении приложения.');
        } finally {
            button.disabled = false;
            button.textContent = 'Добавить приложение';
        }
    });
}

function renderAddNewsForm(container) {
    container.innerHTML = `
        <form id="add-news-form" class="admin-form">
            <h2>Новая новость</h2>
            <input type="text" name="title" placeholder="Заголовок" required>
            <textarea name="short_description" placeholder="Краткое описание (для карточки)" rows="2" required></textarea>
            <textarea name="long_description" placeholder="Полное описание (для страницы приложения)" rows="6" required></textarea>
            <label for="preview-image">Превью новости (PNG/JPG):</label>
            <input type="file" name="preview_image" id="preview-image" accept="image/png, image/jpeg" required>
            <button type="submit">Опубликовать новость</button>
        </form>
    `;
    
    document.getElementById('add-news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Логика отправки формы для новостей (аналогична добавлению приложения)
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
            if (!response.ok) throw new Error('Server error');
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

async function renderSubmissions(container) {
    container.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/submissions`, {
            headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData }
        });
        if (!response.ok) throw new Error('Failed to load submissions');
        const submissions = await response.json();
        
        if (submissions.length === 0) {
            container.innerHTML = '<p class="hint-text">Новых заявок нет.</p>';
            return;
        }

        let submissionsHtml = submissions.map(sub => `
            <div class="submission-card">
                <h3>${sub.title}</h3>
                <p><strong>URL:</strong> <a href="${sub.app_url}" target="_blank">${sub.app_url}</a></p>
                <p><strong>Описание:</strong> ${sub.description}</p>
                <p><small>От: @${sub.username} (${sub.user_id})</small></p>
                <div class="submission-actions">
                    <button class="button-primary" disabled>Одобрить</button>
                    <button class="button-secondary" disabled>Отклонить</button>
                </div>
                <p><small><i>Кнопки модерации требуют расширения бэкенда.</i></small></p>
            </div>
        `).join('');
        
        container.innerHTML = `<h2>Заявки от пользователей</h2>${submissionsHtml}`;

    } catch (error) {
        container.innerHTML = '<p class="error-text">Не удалось загрузить заявки.</p>';
    }
}


// Регистрируем страницу администратора
routes.admin = renderAdminPage;