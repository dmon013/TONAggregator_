# backend/routes/api_admin.py (ПОЛНАЯ ФИНАЛЬНАЯ ВЕРСИЯ)

from flask import Blueprint, jsonify, request
from firebase_service import db
from google.cloud.firestore_v1.transforms import ArrayUnion, ArrayRemove
from utils.auth_utils import admin_required
from utils.image_utils import upload_image_to_storage
import datetime
import uuid
import traceback

api_admin_bp = Blueprint('api_admin_bp', __name__)


# --- Маршруты для приложений ---
@api_admin_bp.route('/apps', methods=['POST'])
@admin_required
def add_app():
    """Добавление нового приложения администратором."""
    try:
        title = request.form.get('title')
        short_description = request.form.get('short_description')
        long_description = request.form.get('long_description')
        app_url = request.form.get('app_url')
        category_id = request.form.get('category_id')
        icon_file = request.files.get('icon')

        if not all([title, short_description, long_description, app_url, category_id, icon_file]):
            return jsonify({"error": "Missing required form data or icon file"}), 400

        icon_url = upload_image_to_storage(icon_file, 'app_icons/')
        app_id = str(uuid.uuid4())
        
        screenshots = [
            request.form.get('screenshot_1', '').strip(),
            request.form.get('screenshot_2', '').strip(),
            request.form.get('screenshot_3', '').strip(),
        ]
        # Убираем пустые строки, если не все поля были заполнены
        screenshots = [url for url in screenshots if url]

        new_app_data = {
            "id": app_id,
            "title": title,
            "title_lowercase": title.lower() if title else "",
            "short_description": short_description,
            "long_description": long_description,
            "screenshots": screenshots, # <--- ДОБАВЛЕНО
            "app_url": app_url,
            "category_id": category_id,
            "icon_url": icon_url,
            "is_approved": True,
            "created_at": datetime.datetime.utcnow(),
            "collection_ids": [], # Новые приложения больше не добавляются в "Новое" автоматически
        }
        
        db.collection('apps').document(app_id).set(new_app_data)
        return jsonify(new_app_data), 201
    except Exception as e:
        print(f"Error in add_app: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --- Маршруты для новостей ---
@api_admin_bp.route('/news', methods=['POST'])
@admin_required
def add_news():
    """Добавление новости администратором."""
    try:
        title = request.form.get('title')
        excerpt = request.form.get('excerpt')
        content = request.form.get('content')
        preview_image = request.files.get('preview_image')

        if not all([title, excerpt, content, preview_image]):
            return jsonify({"error": "Missing required form data or preview image"}), 400

        preview_url = upload_image_to_storage(preview_image, 'news_previews/')
        news_id = str(uuid.uuid4())
        
        new_news_data = {
            "id": news_id,
            "title": title,
            "excerpt": excerpt,
            "content": content,
            "preview_url": preview_url,
            "created_at": datetime.datetime.utcnow()
        }
        
        db.collection('news').document(news_id).set(new_news_data)
        return jsonify(new_news_data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Маршруты для заявок (Submissions) ---
@api_admin_bp.route('/submissions', methods=['GET'])
@admin_required
def get_submissions():
    """Получение списка заявок от пользователей."""
    try:
        subs_ref = db.collection('app_submissions').where('status', '==', 'pending').stream()
        submissions = [sub.to_dict() for sub in subs_ref]
        return jsonify(submissions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_admin_bp.route('/submissions/<string:submission_id>/approve', methods=['POST'])
@admin_required
def approve_submission(submission_id):
    """Одобряет заявку (только меняет ее статус)."""
    try:
        submission_ref = db.collection('app_submissions').document(submission_id)
        if not submission_ref.get().exists:
            return jsonify({"error": "Submission not found"}), 404
        
        # Просто обновляем статус заявки на "одобрено"
        submission_ref.update({"status": "approved"})
        return jsonify({"status": "success", "message": f"Submission {submission_id} approved."}), 200
    except Exception as e:
        print(f"Error in approve_submission: {e}"); traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@api_admin_bp.route('/submissions/<string:submission_id>/reject', methods=['POST'])
@admin_required
def reject_submission(submission_id):
    """Отклоняет заявку."""
    try:
        submission_ref = db.collection('app_submissions').document(submission_id)
        if not submission_ref.get().exists:
            return jsonify({"error": "Submission not found"}), 404
        
        submission_ref.update({"status": "rejected"})
        return jsonify({"status": "success", "message": f"Submission {submission_id} rejected."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Маршруты для подборок (Collections) ---
@api_admin_bp.route('/collections/manage', methods=['POST'])
@admin_required
def manage_collection():
    """Добавляет или удаляет приложение из подборки."""
    try:
        data = request.get_json()
        collection_id, app_id, action = data.get('collection_id'), data.get('app_id'), data.get('action')
        if not all([collection_id, app_id, action]):
            return jsonify({"error": "Missing data"}), 400
        
        collection_ref = db.collection('collections').document(collection_id)
        app_ref = db.collection('apps').document(app_id)

        if action == 'add':
            collection_ref.update({"apps": ArrayUnion([app_id])})
            app_ref.update({"collection_ids": ArrayUnion([collection_id])})
            return jsonify({"status": "success"}), 200
        elif action == 'remove':
            collection_ref.update({"apps": ArrayRemove([app_id])})
            app_ref.update({"collection_ids": ArrayRemove([collection_id])})
            return jsonify({"status": "success"}), 200
        else:
            return jsonify({"error": "Invalid action"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_admin_bp.route('/collections', methods=['POST'])
@admin_required
def create_collection():
    """Создание новой подборки администратором."""
    try:
        data = request.get_json()
        collection_id, collection_name = data.get('id'), data.get('name')
        if not all([collection_id, collection_name]):
            return jsonify({"error": "ID and Name are required"}), 400
        if not collection_id.isidentifier():
            return jsonify({"error": "ID can only contain letters, numbers, and underscores"}), 400
        
        new_collection_data = {
            "id": collection_id, 
            "name": collection_name, 
            "apps": [] 
        }        
        db.collection('collections').document(collection_id).set(new_collection_data)
        return jsonify(new_collection_data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # backend/routes/api_admin.py (добавить в конец файла)

@api_admin_bp.route('/news/<string:news_id>', methods=['DELETE'])
@admin_required
def delete_news(news_id):
    """Удаление новости администратором."""
    try:
        news_ref = db.collection('news').document(news_id)
        if not news_ref.get().exists:
            return jsonify({"error": "News not found"}), 404
        
        news_ref.delete()
        return jsonify({"status": "success", "message": f"News {news_id} deleted."}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_admin_bp.route('/collections/<string:collection_id>', methods=['DELETE'])
@admin_required
def delete_collection(collection_id):
    """Удаление подборки администратором."""
    try:
        # Просто удаляем документ подборки. Приложения в ней останутся,
        # но сама подборка перестанет существовать.
        db.collection('collections').document(collection_id).delete()
        return jsonify({"status": "success", "message": f"Collection {collection_id} deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
