# backend/utils/auth_utils.py

import os
import hmac
import hashlib
from urllib.parse import unquote, parse_qsl
from functools import wraps
from flask import request, jsonify, g

# вот эти две штуки снизу нужны или нет?
from functools import wraps
from google.cloud.firestore_v1.field_path import FieldPath

def get_bot_token() -> str:
    """
    Получает токен бота из переменных окружения.
    Гарантированно возвращает строку или вызывает ошибку.
    """
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        raise ValueError("Переменная TELEGRAM_BOT_TOKEN не найдена! Убедись, что она прописана в backend/.env файле и ты перезапустил сервер.")
    return token

# Получаем токен при запуске
BOT_TOKEN = get_bot_token()

from typing import Tuple

def validate_init_data(init_data: str, bot_token: str) -> Tuple[bool, dict]:
    """Проверяет подлинность данных, полученных от Telegram Web App."""
    try:
        parsed_data = dict(parse_qsl(unquote(init_data)))
    except Exception:
        return False, {}

    if "hash" not in parsed_data:
        return False, {}

    telegram_hash = parsed_data.pop('hash')
    
    # Сортируем ключи и формируем строку для проверки
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
    
    # Генерируем хэш на нашей стороне
    secret_key = hmac.new("WebAppData".encode(), bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    # Сравниваем хэши
    if calculated_hash == telegram_hash:
        return True, parsed_data
        
    return False, {}

def auth_required(f):
    """Декоратор для защиты маршрутов, требующих аутентификации."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        init_data = request.headers.get('X-Telegram-Init-Data')
        
        if not init_data:
            return jsonify({"error": "Authentication required. Missing initData."}), 401

        is_valid, user_data = validate_init_data(init_data, BOT_TOKEN)
        
        if not is_valid:
            return jsonify({"error": "Invalid initData."}), 403

        # Сохраняем данные пользователя в глобальном контексте запроса (g)
        # Это позволяет получить к ним доступ внутри защищенной функции
        g.user_data = user_data
        
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Декоратор для защиты админских маршрутов."""
    @wraps(f)
    @auth_required # Сначала проверяем общую аутентификацию
    def decorated_function(*args, **kwargs):
        from firebase_service import db
        import json

        # user_data приходит в виде строки json
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))

        if not user_id:
             return jsonify({"error": "User ID not found in initData"}), 403

        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists or not user_doc.to_dict().get('is_admin', False):
            return jsonify({"error": "Admin access required."}), 403
        
        return f(*args, **kwargs)
    return decorated_function