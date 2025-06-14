# backend/routes/api_apps.py

from flask import Blueprint, jsonify
from firebase_service import db

# Создаем Blueprint
api_apps_bp = Blueprint('api_apps_bp', __name__)

@api_apps_bp.route('/apps', methods=['GET'])
def get_all_apps():
    """Получение всех одобренных приложений."""
    try:
        apps_ref = db.collection('apps').where('is_approved', '==', True).order_by('created_at', direction='DESCENDING').stream()
        apps_list = [app.to_dict() for app in apps_ref]
        return jsonify(apps_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_apps_bp.route('/apps/<string:app_id>', methods=['GET'])
def get_app_details(app_id):
    """Получение деталей конкретного приложения."""
    try:
        app_ref = db.collection('apps').document(app_id)
        app_doc = app_ref.get()
        if app_doc.exists:
            return jsonify(app_doc.to_dict()), 200
        else:
            return jsonify({"error": "App not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_apps_bp.route('/collections/<string:collection_type>', methods=['GET'])
def get_collection(collection_type):
    """Получение подборок (new, trending, top3)."""
    try:
        # 1. Получаем документ коллекции (например, 'trending')
        collection_ref = db.collection('collections').document(collection_type)
        collection_doc = collection_ref.get()
        
        if not collection_doc.exists:
            return jsonify({"error": "Collection not found"}), 404

        app_ids = collection_doc.to_dict().get('apps', [])
        if not app_ids:
            return jsonify([]), 200 # Возвращаем пустой список, если в подборке нет приложений
            
        # 2. Получаем все приложения из этой коллекции одним эффективным запросом
        apps_ref = db.collection('apps').where('id', 'in', app_ids).where('is_approved', '==', True).stream()
        
        # Создаем словарь для быстрого доступа к данным приложения по его ID
        apps_map = {app.id: app.to_dict() for app in apps_ref}

        # 3. Восстанавливаем оригинальный порядок приложений из документа коллекции
        ordered_apps = [apps_map[app_id] for app_id in app_ids if app_id in apps_map]
        
        return jsonify(ordered_apps), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500