// frontend/js/my_apps.js (ПОЛНАЯ ИТОГОВАЯ ВЕРСИЯ)

/**
 * Отрисовывает страницу "Мои TApps" с сеткой 4x4 и режимом редактирования.
 * @param {HTMLElement} container - Элемент, в который будет рендериться контент.
 */
async function renderMyAppsPage(container) {
    // Отображаем базовую структуру страницы с кнопкой "Изменить" и лоадером
    container.innerHTML = `
        <div class="my-apps-page">
            <div class="page-header">
                <h1 class="page-title">Мои TApps</h1>
                <button id="edit-my-apps-button" class="edit-button">Изменить</button>
            </div>
            <p class="page-subtitle">Добавьте сюда свои любимые приложения для быстрого доступа.</p>
            <div id="my-apps-grid" class="my-apps-grid">
                <div class="loader"></div>
            </div>
        </div>`;
    
    const gridContainer = document.getElementById('my-apps-grid');
    const editButton = document.getElementById('edit-my-apps-button');
    const tg = window.Telegram.WebApp;

    // Логика переключения режима редактирования
    editButton.addEventListener('click', () => {
        gridContainer.classList.toggle('edit-mode');
        const isInEditMode = gridContainer.classList.contains('edit-mode');
        editButton.textContent = isInEditMode ? 'Готово' : 'Изменить';
        editButton.classList.toggle('active', isInEditMode);
    });

    try {
        // Загружаем данные о сетке пользователя
        const response = await fetch(`${API_BASE_URL}/api/myapps`, {
            headers: { 'X-Telegram-Init-Data': tg.initData }
        });
        if (!response.ok) throw new Error('Не удалось загрузить приложения');
        
        const myApps = await response.json();

        gridContainer.innerHTML = ''; // Убираем лоадер

        // Создаем 16 ячеек сетки
        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            slot.className = 'grid-slot';
            const app = myApps[i]; // Ищем приложение для текущей ячейки

            if (app) {
                // --- Если ячейка занята ---
                slot.classList.add('filled');
                slot.innerHTML = `
                    <button class="delete-slot-button">×</button>
                    <img src="${app.icon_url}" alt="${app.title}" class="slot-icon">
                `;

                // Клик по всей ячейке открывает приложение (только если не в режиме редактирования)
                slot.addEventListener('click', () => {
                    if (!gridContainer.classList.contains('edit-mode')) {
                        tg.openLink(app.app_url);
                    }
                });

                // Клик по кнопке "удалить"
                slot.querySelector('.delete-slot-button').addEventListener('click', async (e) => {
                    e.stopPropagation(); // Останавливаем клик, чтобы не открылось приложение
                    
                    // Для мгновенной реакции, делаем карточку полупрозрачной
                    slot.style.opacity = '0.5';

                    try {
                        await fetch(`${API_BASE_URL}/api/myapps/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                            body: JSON.stringify({ slotIndex: i, app_id: null }) // app_id: null означает удаление
                        });
                        // Перерисовываем всю сетку, чтобы обновить состояние
                        renderMyAppsPage(container);
                    } catch (error) {
                        tg.showAlert('Не удалось удалить приложение.');
                        slot.style.opacity = '1'; // Возвращаем видимость в случае ошибки
                    }
                });
            } else {
                // --- Если ячейка пуста ---
                slot.innerHTML = `<div class="plus-icon">+</div>`;
                slot.addEventListener('click', () => {
                    // Клик по пустой ячейке ведет на поиск (только если не в режиме редактирования)
                    if (!gridContainer.classList.contains('edit-mode')) {
                        navigateTo('search', { addMode: true, addTarget: 'my-apps', slotIndex: i });
                    }
                });
            }
            gridContainer.appendChild(slot);
        }
    } catch (error) {
        console.error(error);
        gridContainer.innerHTML = '<p class="error-text">Ошибка загрузки. Попробуйте обновить страницу.</p>';
    }
}

// Регистрируем маршрут в роутере
routes.myapps = renderMyAppsPage;