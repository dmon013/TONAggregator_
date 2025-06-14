import firebase_admin
from firebase_admin import credentials, firestore, storage
import os # Импортируем os для доступа к переменным окружения

# Получаем путь к ключу из переменных окружения
CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')
# Получаем имя бакета из переменных окружения
STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET')

if not CREDENTIALS_PATH or not STORAGE_BUCKET:
    raise ValueError("Необходимо установить переменные окружения FIREBASE_CREDENTIALS_PATH и FIREBASE_STORAGE_BUCKET в .env файле")

try:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': STORAGE_BUCKET
    })
    print("✅ Firebase Admin SDK успешно инициализирован.")
except Exception as e:
    print(f"❌ Ошибка инициализации Firebase: {e}")
    
# Экземпляры клиентов остаются без изменений
db = firestore.client()
bucket = storage.bucket()