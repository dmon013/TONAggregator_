from flask import Blueprint, jsonify, request, g
from firebase_service import db # <--- Убрали firestore отсюда
from google.cloud.firestore_v1.transforms import DELETE_FIELD # <--- И импортировали его правильно отсюда
from utils.auth_utils import auth_required
import json

api_user_bp = Blueprint('api_user_bp', __name__)

@api_user_bp.route('/user', methods=['GET'])
@auth_required
def get_user_data():
    """Получение данных пользователя. Если пользователя нет в БД, он создается."""
    try:
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))
        
        if not user_id:
            return jsonify({"error": "User ID not found in initData"}), 400

        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        if user_doc.exists:
            return jsonify(user_doc.to_dict()), 200
        else:
            new_user_data = {
                "id": user_id,
                "telegram_id": int(user_id),
                "username": user_info.get('username', 'N/A'),
                "photo_url": user_info.get('photo_url', ''),
                "my_apps": {}, # Создаем с пустой сеткой
                "is_admin": False
            }
            user_ref.set(new_user_data)
            return jsonify(new_user_data), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@api_user_bp.route('/myapps', methods=['GET'])
@auth_required
def get_my_apps():
    """Получает сетку приложений пользователя вместе с их данными (иконка, url)."""
    try:
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            return jsonify({}), 200

        my_apps_map = user_doc.to_dict().get('my_apps', {})
        app_ids = list(my_apps_map.values())

        if not app_ids:
            return jsonify({}), 200

        # Получаем данные всех приложений пользователя одним запросом
        apps_docs = db.collection('apps').where('id', 'in', app_ids).stream()
        apps_data = {doc.id: doc.to_dict() for doc in apps_docs}

        # Собираем финальный результат, где ключ - слот, а значение - данные приложения
        result = {}
        for slot, app_id in my_apps_map.items():
            if app_id in apps_data:
                result[slot] = apps_data[app_id]
                
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@api_user_bp.route('/myapps/update', methods=['POST'])
@auth_required
def update_my_apps_slot():
    try:
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))
        
        data = request.get_json()
        slot_index = data.get('slotIndex')
        app_id = data.get('app_id') # Может быть None, если нужно очистить слот

        # Преобразуем в строку для совместимости с ключами Firestore
        slot_index_str = str(slot_index)

        if slot_index is None or not (0 <= int(slot_index) < 16):
            return jsonify({"error": "Invalid slot index"}), 400

        user_ref = db.collection('users').document(user_id)
        
        # Используем "точечную нотацию" для обновления конкретного ключа в объекте
        field_path = f'my_apps.{slot_index_str}'
        
        if app_id: # --- НАЧАЛО ИЗМЕНЕНИЙ (только для логики добавления) ---
            user_doc = user_ref.get()
            if user_doc.exists:
                my_apps_map = user_doc.to_dict().get('my_apps', {})
                if app_id in my_apps_map.values():
                    # Возвращаем ошибку 409 Conflict, если приложение уже есть
                    return jsonify({"error": "Это приложение уже есть в вашей сетке."}), 409
            # --- КОНЕЦ ИЗМЕНЕНИЙ ---

        if app_id:
            # Добавляем/обновляем приложение в слоте
            user_ref.update({field_path: app_id})
            return jsonify({"status": "success", "message": f"App {app_id} added to slot {slot_index_str}"}), 200
        else:
            # Удаляем приложение из слота
            user_ref.update({field_path: DELETE_FIELD})
            return jsonify({"status": "success", "message": f"Slot {slot_index_str} cleared"}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500