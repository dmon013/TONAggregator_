import requests
import os

# Получаем наш API ключ из переменных окружения
IMGBB_API_KEY = os.getenv('IMGBB_API_KEY')
UPLOAD_URL = "https://api.imgbb.com/1/upload"

def upload_image_to_storage(file, destination_path: str) -> str:
    """
    Загружает файл в ImgBB и возвращает прямую ссылку на изображение.
    :param file: Файл из request.files.
    :param destination_path: Не используется в ImgBB, но оставлен для совместимости.
    :return: Публичная URL-ссылка на загруженный файл.
    """
    if not IMGBB_API_KEY:
        raise ValueError("IMGBB_API_KEY не найден в .env файле.")

    if not file:
        raise ValueError("Файл для загрузки не предоставлен.")

    try:
        # Полезная нагрузка для запроса
        payload = {
            "key": IMGBB_API_KEY,
        }
        
        # Файл для отправки
        files = {
            'image': (file.filename, file.read(), file.content_type)
        }

        # Отправляем POST-запрос на сервер ImgBB
        response = requests.post(UPLOAD_URL, params=payload, files=files)
        
        # Проверяем, что запрос прошел успешно
        response.raise_for_status()
        
        # Разбираем JSON-ответ от сервера
        data = response.json()
        
        if "error" in data:
             raise Exception(f"ImgBB API Error: {data['error']['message']}")

        # Извлекаем прямую ссылку на изображение
        image_url = data['data']['url']
        
        print(f"✅ Файл успешно загружен в ImgBB. URL: {image_url}")
        return image_url

    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка сети при загрузке в ImgBB: {e}")
        if e.response:
            print(f"   Ответ сервера: {e.response.text}")
        raise e
    except Exception as e:
        print(f"❌ Неизвестная ошибка при загрузке в ImgBB: {e}")
        raise e