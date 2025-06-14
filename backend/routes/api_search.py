# backend/routes/api_search.py

from flask import Blueprint, jsonify, request, g
from firebase_service import db
from utils.auth_utils import auth_required
import json
import datetime
import uuid

api_search_bp = Blueprint('api_search_bp', __name__)

@api_search_bp.route('/search', methods=['GET'])
def search_apps():
    """Поиск приложений по названию (нечувствительный к регистру)."""
    try:
        query = request.args.get('query', '').strip().lower() # <--- Сразу приводим к нижнему регистру
        if not query:
            return jsonify([]), 200

        start_at = query
        end_at = query + '\uf8ff'
        
        apps_ref = db.collection('apps') \
            .where('is_approved', '==', True) \
            .where('title_lowercase', '>=', start_at) \
            .where('title_lowercase', '<=', end_at) \
            .limit(15) \
            .stream()
            
        search_results = [app.to_dict() for app in apps_ref]
        return jsonify(search_results), 200

    except Exception as e:
        # Важно! После этого изменения может потребоваться НОВЫЙ индекс.
        # Если снова будет ошибка 500, ищи в консоли Flask новую ссылку на индекс.
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