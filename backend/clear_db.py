import firebase_admin
from firebase_admin import credentials, firestore

# --- ИНИЦИАЛИЗАЦИЯ FIREBASE ---
CREDENTIALS_PATH = 'serviceAccountKey.json'
try:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin SDK успешно инициализирован.")
except Exception as e:
    print(f"❌ Ошибка инициализации Firebase: {e}")
    exit()

db = firestore.client()

# Список коллекций, которые мы хотим очистить
COLLECTIONS_TO_DELETE = [
    'apps',
    'news',
    'users',
    'categories',
    'collections',
    'app_submissions'
]

def delete_collection(coll_ref, batch_size):
    """Удаляет все документы в коллекции порциями."""
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f'Удаление документа {doc.id} из коллекции...')
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def clear_database():
    """Основная функция для очистки базы данных."""
    
    print("\n" + "="*50)
    print("ВНИМАНИЕ! Этот скрипт безвозвратно удалит все данные")
    print("из следующих коллекций в вашей базе данных Firestore:")
    for col in COLLECTIONS_TO_DELETE:
        print(f"  - {col}")
    print("="*50 + "\n")
    
    confirm = input('Вы абсолютно уверены, что хотите продолжить? Введите "да" для подтверждения: ')
    
    if confirm.lower() != 'да':
        print("\nОтмена операции. Данные не были удалены.")
        return

    print("\nНачинаем очистку базы данных...")
    
    for collection_name in COLLECTIONS_TO_DELETE:
        try:
            coll_ref = db.collection(collection_name)
            # Firestore не позволяет удалять коллекции напрямую через Admin SDK,
            # поэтому мы удаляем все документы внутри них.
            print(f"\nОчистка коллекции '{collection_name}'...")
            # Удаление документов батчами по 100 штук
            docs = coll_ref.limit(100).stream()
            deleted_count = 0
            while True:
                batch = db.batch()
                doc_count_in_batch = 0
                for doc in docs:
                    batch.delete(doc.reference)
                    doc_count_in_batch += 1
                
                if doc_count_in_batch == 0:
                    break # Коллекция пуста
                
                batch.commit()
                deleted_count += doc_count_in_batch
                print(f"  Удалено {deleted_count} документов...")
                # Запрашиваем следующую порцию
                docs = coll_ref.limit(100).stream()
                
            print(f"✅ Коллекция '{collection_name}' успешно очищена.")

        except Exception as e:
            print(f"❌ Ошибка при очистке коллекции {collection_name}: {e}")
            
    print("\n🎉 Очистка базы данных завершена.")


if __name__ == '__main__':
    clear_database()