# backend/seed.py (ФИНАЛЬНАЯ ВЕРСИЯ, исправлены все импорты)

import uuid
from datetime import datetime
import firebase_admin
from firebase_admin import credentials
# ИСПРАВЛЕНИЕ: Мы возвращаем импорт 'firestore', он нужен для инициализации
from firebase_admin import firestore
# И при этом оставляем прямой импорт для ArrayUnion, чтобы Pylance был доволен
from google.cloud.firestore_v1.transforms import ArrayUnion

# --- ИНИЦИАЛИЗАЦИЯ FIREBASE ---
CREDENTIALS_PATH = 'serviceAccountKey.json'
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        db_app = firebase_admin.initialize_app(cred)
        # Теперь firestore.client() снова работает
        db = firestore.client(app=db_app)
    else:
        db = firestore.client()
    print("✅ Firebase Admin SDK успешно инициализирован для сидинга.")
except Exception as e:
    print(f"❌ Ошибка инициализации Firebase: {e}")
    exit()


def get_test_data():
    """Возвращает структурированные тестовые данные."""
    # ... (эта функция остается без изменений, я привожу ее для полноты файла)
    categories = [
        {'id': 'games', 'name': '🎮 Игры'},
        {'id': 'tools', 'name': '🛠️ Инструменты'},
        {'id': 'finance', 'name': '💰 Финансы'},
        {'id': 'social', 'name': '💬 Социальные'}
    ]
    apps = [
        {'title': 'Catizen', 'short_description': 'Увлекательная игра про котиков.', 'long_description': 'Вы можете выращивать, скрещивать и коллекционировать разнообразных котиков. Участвуйте в ивентах и получайте награды!', 'app_url': 'https://t.me/catizenbot/game', 'category_id': 'games', 'icon_url': 'https://i.ibb.co/gLQbLqFD/catizen.jpg', 'screenshots': [ 'https://placehold.co/540x960/orange/white?text=Screenshot+1', 'https://placehold.co/540x960/orangered/white?text=Screenshot+2', 'https://placehold.co/540x960/coral/white?text=Screenshot+3',]},
        {'title': 'MemHustle', 'short_description': 'MemHustle', 'long_description': 'Based game for crypto hustlers. Lead memecoins to fight market scam.', 'app_url': 'https://t.me/MemHustle_bot', 'category_id': 'games', 'icon_url': 'https://i.ibb.co/q30fvTVK/mem-Hustle.jpg', 'screenshots': [ 'https://placehold.co/540x960/orange/white?text=Screenshot+1', 'https://placehold.co/540x960/orangered/white?text=Screenshot+2', 'https://placehold.co/540x960/coral/white?text=Screenshot+3',]},
        {'title': 'EGGONOMIC', 'short_description': 'EGGONOMIC', 'long_description': 'Eggonomic — stake Telegram gifts, earn rewards & NFTs. ', 'app_url': 'https://t.me/eggonomicbot', 'category_id': 'tools', 'icon_url': 'https://i.ibb.co/5hFN0jXn/eggonomic.jpg', 'screenshots': [ 'https://placehold.co/540x960/orange/white?text=Screenshot+1', 'https://placehold.co/540x960/orangered/white?text=Screenshot+2', 'https://placehold.co/540x960/coral/white?text=Screenshot+3',]},
        {'title': 'WEB3 Portal', 'short_description': 'Точка входа в TON DNS', 'long_description': 'Вход в экосистему открыт — доступ к WEB3 App, ревардам, связи с командой, приватным каналам и чатам.', 'app_url': 'https://t.me/tondnsclub', 'category_id': 'social', 'icon_url': 'https://i.ibb.co/1YdPdfQK/web3portal.jpg', 'screenshots': [ 'https://placehold.co/540x960/orange/white?text=Screenshot+1', 'https://placehold.co/540x960/orangered/white?text=Screenshot+2', 'https://placehold.co/540x960/coral/white?text=Screenshot+3',]},
        {'title': 'Tonnel Relayer Bot', 'short_description': 'Gifts Market', 'long_description': '#1 Zero-Knowledge Privacy Protocol on TON💎', 'app_url': 'https://t.me/Tonnel_Network_bot', 'category_id': 'finance', 'icon_url': 'https://i.ibb.co/Fky0rnsm/tonnel.jpg', 'screenshots': [ 'https://i.ibb.co/Y726V72R/image.png', 'https://i.ibb.co/QFCkSWhg/image.png', 'https://i.ibb.co/g8yx70k/image.png',]},
    ]
    news = [
        {'title': 'Запуск TON Aggregator!', 'excerpt': 'Наш новый агрегатор приложений на TON официально запущен.', 'content': '<h1>Добро пожаловать!</h1><p>Полный текст новости...</p>', 'preview_url': 'https://placehold.co/800x400/2AABEE/white?text=Welcome!'},
        {'title': 'Интеграция с Wallet Pay', 'excerpt': 'Теперь вы можете использовать Wallet Pay для прямых оплат.', 'content': '<h2>Новые возможности...</h2><p>Мы рады объявить о полной интеграции...</p>', 'preview_url': 'https://placehold.co/800x400/333/white?text=Wallet+Pay'},
    ]
    users = [
        # Твой пользователь
        {
            'id': '605700117',
            'telegram_id': 605700117,
            'username': 'd_monxiii',
            'photo_url': 'https://t.me/i/userpic/320/JBP4MuNa9W3Qh9GJ0AjDOCFCZR--myuB9c9lJFDeFec.svg',
            'is_admin': True,
            'my_apps': {} # Начальная пустая сетка
        },
        # Тестовый админ
        {'id': '123456789', 'telegram_id': 123456789, 'username': 'admin_user', 'photo_url': 'https://placehold.co/128x128/red/white?text=A', 'is_admin': True, 'my_apps': {}},
        # Тестовый пользователь
        {'id': '987654321', 'telegram_id': 987654321, 'username': 'test_user', 'photo_url': 'https://placehold.co/128x128/green/white?text=U', 'is_admin': False, 'my_apps': {}},
    ]
    return categories, apps, news, users


def seed_database():
    """Основная функция для заполнения базы данных."""
    print("Начинаем заполнение базы данных...")
    
    categories_data, apps_data, news_data, users_data = get_test_data()
    
    # ... (весь код заполнения коллекций остается без изменений, так как он уже правильный) ...
    # 1. Категории
    print("-> Заполняем 'categories'...")
    for category in categories_data:
        db.collection('categories').document(category['id']).set(category)
    print("✅ 'categories' успешно заполнены.")

    # 2. Приложения
    print("-> Заполняем 'apps'...")
    app_ids = []
    for app_info in apps_data:
        app_id = str(uuid.uuid4())
        app_ids.append(app_id)
        
        app_doc = {
            "id": app_id, "title": app_info['title'], "title_lowercase": app_info['title'].lower(),
            "short_description": app_info['short_description'], "long_description": app_info['long_description'],
            "screenshots": app_info.get('screenshots', []), # <--- ДОБАВЬ ЭТУ СТРОКУ
            "app_url": app_info['app_url'], "category_id": app_info['category_id'], "icon_url": app_info['icon_url'],
            "is_approved": True, "created_at": datetime.utcnow(), "collection_ids": []
        }
        db.collection('apps').document(app_id).set(app_doc)
    print("✅ 'apps' успешно заполнены.")

    # 3. Новости
    print("-> Заполняем 'news'...")
    for news_info in news_data:
        news_id = str(uuid.uuid4())
        news_doc = {
            "id": news_id, "title": news_info['title'], "excerpt": news_info['excerpt'],
            "content": news_info['content'], "preview_url": news_info['preview_url'],
            "created_at": datetime.utcnow()
        }
        db.collection('news').document(news_id).set(news_doc)
    print("✅ 'news' успешно заполнены.")

    # 4. Пользователи
    print("-> Заполняем 'users'...")
    users_data[1]['my_apps'] = {
        "0": app_ids[0], "2": app_ids[2], "15": app_ids[4]
    } 
    for user in users_data:
        db.collection('users').document(user['id']).set(user)
    print("✅ 'users' успешно заполнены.")
    
    # 5. Подборки
    print("-> Заполняем 'collections'...")
    collections_data = {
        'new': {'name': '✨ Новое', 'apps': app_ids[::-1][:3]},
        'trending': {'name': '🔥 В тренде', 'apps': [app_ids[1], app_ids[0], app_ids[4]]},
        'top3': {'name': '🏆 Топ 3', 'apps': [app_ids[4], app_ids[2], app_ids[0]]}
    }
    for col_id, col_data in collections_data.items():
        db.collection('collections').document(col_id).set(col_data)
        for app_id in col_data['apps']:
            # Используем ArrayUnion, импортированный напрямую
            db.collection('apps').document(app_id).update({
                'collection_ids': ArrayUnion([col_id])
            })
    print("✅ 'collections' успешно заполнены.")
    print("\n🎉 Все данные успешно загружены в Firestore!")


if __name__ == '__main__':
    seed_database()