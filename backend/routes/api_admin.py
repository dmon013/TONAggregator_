# backend/routes/api_admin.py

from flask import Blueprint, jsonify, request
from firebase_service import db, firestore
from utils.auth_utils import admin_required
from utils.image_utils import upload_image_to_storage
import datetime
import uuid

api_admin_bp = Blueprint('api_admin_bp', __name__)

@api_admin_bp.route('/apps', methods=['POST'])
@admin_required
def add_app():
    """Добавление нового приложения администратором."""
    try:
        # Данные из формы
        title = request.form.get('title')
        short_description = request.form.get('short_description') # <--- НОВОЕ
        long_description = request.form.get('long_description')   # <--- НОВОЕ
        app_url = request.form.get('app_url')
        category_id = request.form.get('category_id')

        # Файл иконки
        icon_file = request.files.get('icon')

        if not all([title, short_description, long_description, app_url, category_id, icon_file]):
            return jsonify({"error": "Missing required form data or icon file"}), 400

        # Загружаем иконку
        icon_url = upload_image_to_storage(icon_file, 'app_icons/')
        
        # Готовим данные для сохранения в Firestore
        app_id = str(uuid.uuid4())
        new_app_data = {
            "id": app_id,
            "title": title,
            "title_lowercase": title.lower() if title else "",
            "short_description": short_description, # <--- НОВОЕ
            "long_description": long_description,   # <--- НОВОЕ
            "app_url": app_url,
            "category_id": category_id,
            "icon_url": icon_url,
            "collection_ids": ["new"], # По умолчанию добавляем в "Новое"
            "is_approved": True, # Админ добавляет сразу одобренное приложение
            "created_at": datetime.datetime.utcnow()
        }
        
        # Сохраняем приложение
        db.collection('apps').document(app_id).set(new_app_data)
        
        # Добавляем ID приложения в коллекцию 'new'
        new_collection_ref = db.collection('collections').document('new')
        new_collection_ref.update({"apps": firestore.ArrayUnion([app_id])})

        return jsonify(new_app_data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_admin_bp.route('/news', methods=['POST'])
@admin_required
def add_news():
    """Добавление новости администратором."""
    try:
        title = request.form.get('title')
        content = request.form.get('content') # HTML контент
        preview_image = request.files.get('preview_image')

        if not all([title, content, preview_image]):
            return jsonify({"error": "Missing required form data or preview image"}), 400

        preview_url = upload_image_to_storage(preview_image, 'news_previews/')
        
        news_id = str(uuid.uuid4())
        new_news_data = {
            "id": news_id,
            "title": title,
            "content": content,
            "preview_url": preview_url,
            "created_at": datetime.datetime.utcnow()
        }
        
        db.collection('news').document(news_id).set(new_news_data)
        return jsonify(new_news_data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_admin_bp.route('/submissions', methods=['GET'])
@admin_required
def get_submissions():
    """Получение списка заявок от пользователей на добавление приложений."""
    try:
        # Получаем заявки, которые еще не рассмотрены
        subs_ref = db.collection('app_submissions').where('status', '==', 'pending').stream()
        submissions = [sub.to_dict() for sub in subs_ref]
        return jsonify(submissions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500