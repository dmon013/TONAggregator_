# backend/utils/image_utils.py

import uuid
from firebase_service import bucket
from werkzeug.utils import secure_filename

def upload_image_to_storage(file, destination_path: str) -> str:
    """
    Загружает файл в Firebase Storage и возвращает публичную ссылку.
    :param file: Файл из request.files.
    :param destination_path: Папка в Storage (например, 'app_icons/').
    :return: Публичная URL-ссылка на загруженный файл.
    """
    if not file:
        raise ValueError("Файл для загрузки не предоставлен.")

    # Генерируем безопасное и уникальное имя файла
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    blob_path = f"{destination_path}{unique_filename}"

    blob = bucket.blob(blob_path)

    # Загружаем файл
    blob.upload_from_file(file.stream, content_type=file.content_type)

    # Делаем файл публично доступным
    blob.make_public()

    return blob.public_url