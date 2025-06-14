# backend/routes/api_user.py

from flask import Blueprint, jsonify, request, g
from firebase_service import db
from utils.auth_utils import auth_required
import json
from google.cloud.firestore_v1.field_path import FieldPath
from google.cloud import firestore

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
            # Пользователь найден, возвращаем данные
            return jsonify(user_doc.to_dict()), 200
        else:
            # Пользователя нет, создаем нового
            new_user_data = {
                "id": user_id,
                "telegram_id": int(user_id),
                "username": user_info.get('username', 'N/A'),
                "photo_url": user_info.get('photo_url', ''),
                "favorites": [],
                "is_admin": False # Новые пользователи не админы
            }
            user_ref.set(new_user_data)
            return jsonify(new_user_data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_user_bp.route('/favorites', methods=['POST'])
@auth_required
def manage_favorites():
    """Добавление/удаление приложения из избранного."""
    try:
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))
        
        data = request.get_json()
        app_id = data.get('app_id')
        action = data.get('action', 'add') # 'add' или 'remove'

        if not app_id:
            return jsonify({"error": "app_id is required"}), 400
        
        user_ref = db.collection('users').document(user_id)
        
        if action == 'add':
            user_ref.update({"favorites": firestore.ArrayUnion([app_id])})
            return jsonify({"status": "success", "message": f"App {app_id} added to favorites."}), 200
        elif action == 'remove':
            user_ref.update({"favorites": firestore.ArrayRemove([app_id])})
            return jsonify({"status": "success", "message": f"App {app_id} removed from favorites."}), 200
        else:
            return jsonify({"error": "Invalid action. Use 'add' or 'remove'."}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500