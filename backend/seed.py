# backend/seed.py

import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from datetime import datetime

# --- ИНИЦИАЛИЗАЦИЯ FIREBASE ---
# Убедитесь, что путь к вашему ключу правильный
CREDENTIALS_PATH = 'serviceAccountKey.json'
try:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin SDK успешно инициализирован для сидинга.")
except Exception as e:
    print(f"❌ Ошибка инициализации Firebase: {e}")
    exit()

db = firestore.client()

# --- ТЕСТОВЫЕ ДАННЫЕ ---

def get_test_data():
    """Возвращает структурированные тестовые данные."""
    
    # 1. Категории
    categories = [
        {'id': 'games', 'name': '🎮 Игры'},
        {'id': 'tools', 'name': '🛠️ Инструменты'},
        {'id': 'finance', 'name': '💰 Финансы'},
        {'id': 'social', 'name': '💬 Социальные'}
    ]

    # 2. Приложения
    apps = [
        {'title': 'Catizen', 'short_description': 'Увлекательная игра с котиками.', 'long_description': 'Полное описание игры Catizen, где вы можете выращивать, скрещивать и коллекционировать разнообразных котиков. Участвуйте в ивентах и получайте награды!', 'app_url': 'https://t.me/catizenbot/game', 'category_id': 'games', 'icon_url': 'https://placehold.co/128x128/orange/white?text=C'},
        {'title': 'PixelTap', 'short_description': 'Кликер-баттлер от ByBit.', 'long_description': 'PixelTap - это захватывающий кликер-баттлер в пиксельной вселенной от криптобиржи ByBit. Сражайтесь с другими игроками и прокачивайте своего персонажа.', 'app_url': 'https://t.me/pixelversexyzbot', 'category_id': 'games', 'icon_url': 'https://placehold.co/128x128/blue/white?text=P'},
        {'title': 'TON Wallet', 'short_description': 'Официальный кошелек для хранения TON и других токенов.', 'long_description': 'Полное описание TON Wallet, где вы можете безопасно хранить свои токены и управлять ими.', 'app_url': 'https://t.me/wallet', 'category_id': 'finance', 'icon_url': 'https://placehold.co/128x128/2AABEE/white?text=W'},
        {'title': 'Durov\'s Chat', 'short_description': 'Общайтесь в зашифрованном чате на блокчейне.', 'long_description': 'Полное описание Durov\'s Chat, где вы можете общаться с друзьями в безопасном и анонимном чате.', 'app_url': 'https://t.me/durovschat', 'category_id': 'social', 'icon_url': 'https://placehold.co/128x128/grey/white?text=D'},
        {'title': 'ImageTool', 'short_description': 'Простой инструмент для редактирования изображений.', 'long_description': 'Полное описание ImageTool, где вы можете легко редактировать свои изображения и фотографии.', 'app_url': 'https://t.me/imagetool', 'category_id': 'tools', 'icon_url': 'https://placehold.co/128x128/purple/white?text=I'},
        {'title': 'Notcoin', 'short_description': 'Легендарный кликер, который познакомил всех с Web3.', 'long_description': 'Полное описание Notcoin, где вы можете узнать о Web3 и попробовать свои силы в кликере.', 'app_url': 'https://t.me/notcoin_bot', 'category_id': 'games', 'icon_url': 'https://placehold.co/128x128/black/yellow?text=N'},
    ]

    # 3. Новости
    news = [
        {'title': 'Запуск TON Aggregator!', 'content': '<h1>Добро пожаловать!</h1><p>Наш новый агрегатор приложений на TON официально запущен. Находите лучшие Web3-приложения в одном месте.</p>', 'preview_url': 'https://placehold.co/800x400/2AABEE/white?text=Welcome!'},
        {'title': 'Интеграция с Wallet Pay', 'content': '<h2>Новые возможности</h2><p>Теперь вы можете использовать Wallet Pay для прямых оплат внутри приложений. Это делает экосистему еще удобнее.</p>', 'preview_url': 'https://placehold.co/800x400/333/white?text=Wallet+Pay'},
    ]
    
    # 4. Пользователи
    users = [
        # Пользователь-администратор
        {'id': '123456789', 'telegram_id': 123456789, 'username': 'admin_user', 'photo_url': 'https://placehold.co/128x128/red/white?text=A', 'is_admin': True, 'my_apps': {}},
        # Обычный пользователь
        {'id': '987654321', 'telegram_id': 987654321, 'username': 'test_user', 'photo_url': 'https://placehold.co/128x128/green/white?text=U', 'is_admin': False, 'my_apps': {}},
    ]

    return categories, apps, news, users


def seed_database():
    """Основная функция для заполнения базы данных."""
    
    print("Начинаем заполнение базы данных...")
    
    categories_data, apps_data, news_data, users_data = get_test_data()
    
    # 1. Заполняем категории
    print("-> Заполняем 'categories'...")
    for category in categories_data:
        db.collection('categories').document(category['id']).set(category)
    print("✅ 'categories' успешно заполнены.")

    # 2. Заполняем приложения и собираем их ID
    print("-> Заполняем 'apps'...")
    app_ids = []
    for app_info in apps_data:
        app_id = str(uuid.uuid4())
        app_ids.append(app_id)
        
        app_doc = {
            "id": app_id,
            "title": app_info['title'],
            "title_lowercase": app_info['title'].lower(),
            "short_description": app_info['short_description'], # <--- ИЗМЕНЕНО
            "long_description": app_info['long_description'],   # <--- ИЗМЕНЕНО
            "app_url": app_info['app_url'],
            "category_id": app_info['category_id'],
            "icon_url": app_info['icon_url'],
            "is_approved": True,
            "created_at": datetime.utcnow(),
            "collection_ids": []
        }
        db.collection('apps').document(app_id).set(app_doc)
    print("✅ 'apps' успешно заполнены.")

    # 3. Заполняем новости
    print("-> Заполняем 'news'...")
    for news_info in news_data:
        news_id = str(uuid.uuid4())
        news_doc = {
            "id": news_id,
            "title": news_info['title'],
            "content": news_info['content'],
            "preview_url": news_info['preview_url'],
            "created_at": datetime.utcnow()
        }
        db.collection('news').document(news_id).set(news_doc)
    print("✅ 'news' успешно заполнены.")

    # 4. Заполняем пользователей и добавляем им приложения в сетку
    print("-> Заполняем 'users'...")
    # Добавляем обычному юзеру пару приложений в конкретные ячейки
    users_data[1]['my_apps'] = {
        "0": app_ids[0], # Catizen в первой ячейке
        "2": app_ids[2], # TON Wallet в третьей ячейке
        "15": app_ids[5] # Notcoin в последней ячейке
    } 
    for user in users_data:
        db.collection('users').document(user['id']).set(user)
    print("✅ 'users' успешно заполнены.")

    # 5. Заполняем подборки
    print("-> Заполняем 'collections'...")
    collections_data = {
        'new': {'name': '✨ Новое', 'apps': app_ids[::-1][:4]}, # Последние 4 добавленных
        'trending': {'name': '🔥 В тренде', 'apps': [app_ids[1], app_ids[0], app_ids[5], app_ids[2]]}, # Вручную заданный порядок
        'top3': {'name': '🏆 Топ 3', 'apps': [app_ids[5], app_ids[2], app_ids[0]]} # Топ-3
    }
    for col_id, col_data in collections_data.items():
        db.collection('collections').document(col_id).set(col_data)
        # Также обновим collection_ids в самих документах приложений
        for app_id in col_data['apps']:
            db.collection('apps').document(app_id).update({
                'collection_ids': firestore.ArrayUnion([col_id])
            })
    print("✅ 'collections' успешно заполнены.")
    print("\n🎉 Все данные успешно загружены в Firestore!")

if __name__ == '__main__':
    # Эта строка позволяет запускать скрипт напрямую из терминала
    seed_database()