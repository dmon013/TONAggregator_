# backend/firebase_service.py

import firebase_admin
from firebase_admin import credentials, firestore, storage

# ВАЖНО: Укажи здесь путь к своему файлу serviceAccountKey.json
# Рекомендуется хранить путь в переменных окружения для безопасности.
CREDENTIALS_PATH = 'serviceAccountKey.json'

try:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'tonaggregator-your-project-id.appspot.com' # <-- ЗАМЕНИ НА СВОЙ BUCKET
    })
    print("✅ Firebase Admin SDK успешно инициализирован.")
except Exception as e:
    print(f"❌ Ошибка инициализации Firebase: {e}")
    # В реальном приложении здесь лучше остановить запуск или обработать ошибку иначе
    
# Экземпляр клиента Firestore для работы с базой данных
db = firestore.client()

# Экземпляр клиента Storage для работы с файлами
bucket = storage.bucket()