/**
 * Отрисовывает страницу профиля пользователя.
 * @param {HTMLElement} container - Элемент для рендеринга
 */
function renderProfilePage(container) {
    const tg = window.Telegram.WebApp;
    // Данные пользователя берем напрямую из Telegram для мгновенного отображения
    const user = tg.initDataUnsafe.user;

    // Формируем базовый HTML страницы без списка избранного
    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${user?.photo_url || 'assets/default-avatar.png'}" alt="Avatar" class="profile-avatar" onerror="this.src='assets/default-avatar.png';">
                <h1 class="profile-username">${user?.first_name || 'User'} ${user?.last_name || ''}</h1>
                <p class="profile-telegram-id">@${user?.username || 'username'}</p>
            </div>

            <div class="profile-actions">
                <button id="submit-app-button" class="action-button">Предложить приложение</button>
                </div>
        </div>
    `;
    
    // Вызываем отдельную функцию для проверки статуса администратора
    checkAndAddAdminButton();

    // Навешиваем событие на кнопку предложения приложения
    document.getElementById('submit-app-button').addEventListener('click', () => {
        showSubmissionModal();
    });
}

/**
 * Делает запрос к API, чтобы проверить, является ли пользователь админом,
 * и если да, то добавляет кнопку входа в админ-панель.
 */
async function checkAndAddAdminButton() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData }
        });
        if (!response.ok) return;
        const userData = await response.json();
        
        const profileActions = document.querySelector('.profile-actions');
        const submitButton = document.getElementById('submit-app-button');

        if (userData.is_admin) {
            // Если пользователь - админ, скрываем кнопку "Предложить"
            if (submitButton) submitButton.style.display = 'none';

            // И добавляем кнопку админ-панели, если ее еще нет
            if (profileActions && !document.getElementById('admin-panel-button')) {
                const adminButton = document.createElement('button');
                // ... (остальной код добавления админ-кнопки без изменений) ...
            }
        }
    } catch (error) {
        console.error("Failed to check admin status:", error);
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