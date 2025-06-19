/**
 * Отрисовывает страницу профиля пользователя.
 * @param {HTMLElement} container - Элемент для рендеринга
 */
// frontend/js/profile.js (заменить функцию renderProfilePage)
function renderProfilePage(container) {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user;
    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

    // Сначала рисуем HTML с ПУСТЫМ блоком .profile-actions
    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${user?.photo_url || ''}" alt="Avatar" class="profile-avatar" onerror="this.onerror=null;this.src='assets/default-avatar.png';">
                <h1 class="profile-username">${displayName || 'User'}</h1>
                <p class="profile-telegram-id">@${user?.username || 'username'}</p>
            </div>
            <div class="profile-actions"></div>
        </div>
    `;
    
    // А теперь вызываем функцию, которая наполнит этот блок правильной кнопкой
    populateProfileActions();
}

/**
 * Делает запрос к API, чтобы проверить, является ли пользователь админом,
 * и если да, то добавляет кнопку входа в админ-панель.
 */
async function populateProfileActions() {
    const profileActions = document.querySelector('.profile-actions');
    if (!profileActions) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/user`, { headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } });
        const userData = response.ok ? await response.json() : null;

        if (userData && userData.is_admin) {
            // Если админ, добавляем кнопку админки
            const adminButton = document.createElement('button');
            adminButton.id = 'admin-panel-button';
            adminButton.className = 'action-button'; // Убираем класс .secondary
            adminButton.textContent = 'Панель администратора';
            adminButton.addEventListener('click', () => navigateTo('admin'));
            profileActions.appendChild(adminButton);
        } else {
            // Если обычный юзер, добавляем кнопку "Предложить"
            const submitButton = document.createElement('button');
            submitButton.id = 'submit-app-button';
            submitButton.className = 'action-button';
            submitButton.textContent = 'Предложить приложение';
            submitButton.addEventListener('click', () => showSubmissionModal());
            profileActions.appendChild(submitButton);
        }
    } catch (error) {
        console.error("Failed to populate profile actions:", error);
    }
}


// Эти функции для модального окна остаются без изменений
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

    const closeModal = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    cancelButton.addEventListener('click', closeModal);
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