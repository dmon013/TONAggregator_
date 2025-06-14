// frontend/js/profile.js

/**
 * Отрисовывает страницу профиля пользователя
 * @param {HTMLElement} container - Элемент для рендеринга
 */
function renderProfilePage(container) {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user;

    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${user?.photo_url || ''}" alt="Avatar" class="profile-avatar">
                <h1 class="profile-username">${user?.first_name || 'User'} ${user?.last_name || ''}</h1>
                <p class="profile-telegram-id">@${user?.username || 'username'}</p>
            </div>

            <div class="profile-actions">
                <button id="submit-app-button" class="action-button">Предложить приложение</button>
            </div>

            <div id="favorites-section">
                <h2 class="section-title">Избранное</h2>
                <div id="favorites-container" class="cards-container">
                    <div class="loader"></div>
                </div>
            </div>
        </div>
    `;

    loadUserFavorites(document.getElementById('favorites-container'));

    document.getElementById('submit-app-button').addEventListener('click', () => {
        showSubmissionModal();
    });
}

/**
 * Загружает и отрисовывает избранные приложения пользователя
 * @param {HTMLElement} favoritesContainer - Контейнер для карточек
 */
async function loadUserFavorites(favoritesContainer) {
    const tg = window.Telegram.WebApp;

    try {
        // 1. Получаем данные пользователя
        const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { 'X-Telegram-Init-Data': tg.initData }
        });
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();

        // *** НАЧАЛО ИЗМЕНЕНИЙ ***
        // Проверяем, является ли пользователь админом
        if (userData.is_admin) {
            const profileActions = document.querySelector('.profile-actions');
            const adminButton = document.createElement('button');
            adminButton.id = 'admin-panel-button';
            adminButton.className = 'action-button secondary'; // Добавим другой стиль
            adminButton.textContent = 'Панель администратора';
            adminButton.addEventListener('click', () => navigateTo('admin'));
            
            // Вставляем кнопку админа после кнопки "Предложить приложение"
            profileActions.appendChild(adminButton);
        }
        // *** КОНЕЦ ИЗМЕНЕНИЙ ***

        const favoriteIds = new Set(userData.favorites || []);

        if (favoriteIds.size === 0) {
            favoritesContainer.innerHTML = '<p class="hint-text">Вы еще не добавили ничего в избранное.</p>';
            return;
        }

        // ... остальная часть функции без изменений ...
        const appsResponse = await fetch(`${API_BASE_URL}/api/apps`);
        if (!appsResponse.ok) throw new Error('Failed to fetch apps');
        const allApps = await appsResponse.json();

        const favoriteApps = allApps.filter(app => favoriteIds.has(app.id));
        
        favoritesContainer.innerHTML = ''; 

        if (favoriteApps.length === 0) {
            favoritesContainer.innerHTML = '<p class="hint-text">Здесь пока пусто.</p>';
            return;
        }

        favoriteApps.forEach(app => {
            const appCard = createAppCard(app);
            favoritesContainer.appendChild(appCard);
        });

    } catch (error) {
        console.error(error);
        favoritesContainer.innerHTML = '<p class="error-text">Не удалось загрузить избранное.</p>';
    }
}

/**
 * Показывает модальное окно для отправки заявки
 */
function showSubmissionModal() {
    const modalHtml = `
        <div id="submission-modal-overlay" class="modal-overlay">
            <div class="modal-content">
                <h2>Предложить приложение</h2>
                <form id="submission-form">
                    <div class="form-group">
                        <label for="app-title">Название</label>
                        <input type="text" id="app-title" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="app-url">Ссылка на Web App</label>
                        <input type="url" id="app-url" name="app_url" required placeholder="https://t.me/app_bot/app_name">
                    </div>
                    <div class="form-group">
                        <label for="app-description">Краткое описание</label>
                        <textarea id="app-description" name="description" rows="3" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="cancel-button" class="button-secondary">Отмена</button>
                        <button type="submit" id="submit-button" class="button-primary">Отправить</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay = document.getElementById('submission-modal-overlay');
    const form = document.getElementById('submission-form');
    const cancelButton = document.getElementById('cancel-button');

    // Закрытие модального окна
    const closeModal = () => overlay.remove();
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    cancelButton.addEventListener('click', closeModal);

    // Обработка отправки формы
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(new FormData(form), closeModal);
    });
}

/**
 * Отправляет данные формы на бэкенд
 * @param {FormData} formData - Данные из формы
 * @param {Function} closeModalCallback - Функция для закрытия модального окна
 */
async function handleFormSubmit(formData, closeModalCallback) {
    const tg = window.Telegram.WebApp;
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        app_url: formData.get('app_url')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/submit-app`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': tg.initData
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Произошла ошибка');
        }

        tg.showAlert('Спасибо! Ваша заявка отправлена на рассмотрение.');
        closeModalCallback();

    } catch (error) {
        console.error('Submission failed:', error);
        tg.showAlert(`Ошибка: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Отправить';
    }
}


// Регистрируем страницу профиля в роутере
routes.profile = renderProfilePage;