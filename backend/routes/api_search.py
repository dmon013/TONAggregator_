# backend/routes/api_search.py

from flask import Blueprint, jsonify, request, g
from firebase_service import db
from utils.auth_utils import auth_required
import json
import datetime
import uuid
import traceback

api_search_bp = Blueprint('api_search_bp', __name__)

@api_search_bp.route('/search', methods=['GET'])
def search_apps():
    """Поиск приложений по названию с возможностью фильтрации по категории."""
    try:
        query_text = request.args.get('query', '').strip().lower()
        category_id = request.args.get('category', None) # Новый параметр

        # Начинаем строить запрос
        apps_query = db.collection('apps').where('is_approved', '==', True)

        # Если в запросе есть ID категории, добавляем его как фильтр
        if category_id:
            apps_query = apps_query.where('category_id', '==', category_id)

        # Если есть поисковый текст, фильтруем по названию
        if query_text:
            end_at_text = query_text + '\uf8ff'
            apps_query = apps_query.where('title_lowercase', '>=', query_text).where('title_lowercase', '<=', end_at_text)
        
        apps_ref = apps_query.limit(20).stream()
            
        search_results = [app.to_dict() for app in apps_ref]
        return jsonify(search_results), 200

    except Exception as e:
        # ВАЖНО: Если поиск с категорией вызовет ошибку 500, ищи в консоли Flask ссылку на создание нового индекса!
        print(f"Error in search_apps: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_search_bp.route('/submit-app', methods=['POST'])
@auth_required
def submit_app():
    """Отправка заявки на добавление приложения от пользователя."""
    try:
        user_info = json.loads(g.user_data.get('user', '{}'))
        user_id = str(user_info.get('id'))
        
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        app_url = data.get('app_url')

        if not all([title, description, app_url]):
            return jsonify({"error": "Missing required data"}), 400
        
        submission_id = str(uuid.uuid4())
        new_submission = {
            "id": submission_id,
            "user_id": user_id,
            "username": user_info.get('username', 'N/A'),
            "title": title,
            "description": description,
            "app_url": app_url,
            "status": "pending", # 'pending', 'approved', 'rejected'
            "submitted_at": datetime.datetime.utcnow()
        }

        db.collection('app_submissions').document(submission_id).set(new_submission)
        return jsonify({"status": "success", "message": "Your app has been submitted for review."}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500