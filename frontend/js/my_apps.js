console.log("ЗАГРУЖЕН ФАЙЛ my_apps.js ВЕРСИЯ 2.0 - с кнопкой 'Изменить'");
/**
 * Отрисовывает страницу "Мои TApps" с сеткой 4x4.
 * @param {HTMLElement} container - Элемент, в который будет рендериться контент.
 */
// frontend/js/my_apps.js (заменить функцию renderMyAppsPage)

async function renderMyAppsPage(container) {
    // Эта HTML-структура теперь включает шапку с заголовком и кнопкой
    container.innerHTML = `<div class="my-apps-page">
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

    // Обработчик для кнопки "Изменить/Готово"
    editButton.addEventListener('click', () => {
        gridContainer.classList.toggle('edit-mode');
        if (gridContainer.classList.contains('edit-mode')) {
            editButton.textContent = 'Готово';
            editButton.classList.add('active');
        } else {
            editButton.textContent = 'Изменить';
            editButton.classList.remove('active');
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/myapps`, { headers: { 'X-Telegram-Init-Data': tg.initData } });
        if (!response.ok) throw new Error('Не удалось загрузить приложения');
        const myApps = await response.json();

        gridContainer.innerHTML = '';

        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            slot.className = 'grid-slot';
            const app = myApps[i];

            if (app) {
                slot.classList.add('filled');
                // Добавляем крестик для удаления
                slot.innerHTML = `
                    <button class="delete-slot-button">×</button>
                    <img src="${app.icon_url}" alt="${app.title}" class="slot-icon">
                `;
                slot.addEventListener('click', () => {
                    // В режиме редактирования клик не открывает ссылку
                    if (!gridContainer.classList.contains('edit-mode')) {
                        tg.openLink(app.app_url);
                    }
                });
                // Обработчик для кнопки удаления
                slot.querySelector('.delete-slot-button').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await fetch(`${API_BASE_URL}/api/myapps/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                        body: JSON.stringify({ slotIndex: i, app_id: null }) // app_id: null для удаления
                    });
                    // Перезагружаем всю страницу, чтобы обновить состояние
                    renderMyAppsPage(container);
                });
            } else {
                // Логика для пустой ячейки
                slot.innerHTML = `<div class="plus-icon">+</div>`;
                slot.addEventListener('click', () => {
                    if (!gridContainer.classList.contains('edit-mode')) {
                        navigateTo('search', { addMode: true, slotIndex: i });
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

// Регистрируем новый маршрут в нашем роутере
routes.myapps = renderMyAppsPage;