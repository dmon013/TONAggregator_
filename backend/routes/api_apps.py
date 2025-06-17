# backend/routes/api_apps.py (ПОЛНАЯ ИТОГОВАЯ ВЕРСИЯ)

from flask import Blueprint, jsonify
from firebase_service import db

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

@api_apps_bp.route('/collections', methods=['GET'])
def get_all_collections():
    """Получение списка всех подборок."""
    try:
        collections_ref = db.collection('collections').stream()
        collections_list = []
        for col in collections_ref:
            col_data = col.to_dict()
            col_data['id'] = col.id
            collections_list.append(col_data)
        return jsonify(collections_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ЭТОТ МАРШРУТ - КЛЮЧ К РЕШЕНИЮ. УБЕДИСЬ, ЧТО ОН ВЫГЛЯДИТ ИМЕННО ТАК.
@api_apps_bp.route('/collection-apps/<string:collection_id>', methods=['GET'])
def get_collection_apps(collection_id):
    """Получение приложений для ОДНОЙ подборки."""
    try:
        collection_ref = db.collection('collections').document(collection_id)
        collection_doc = collection_ref.get()
        if not collection_doc.exists:
            return jsonify({"error": "Collection not found"}), 404

        app_ids = collection_doc.to_dict().get('apps', [])
        if not app_ids:
            return jsonify([]), 200
            
        # Этот запрос требует композитного индекса (is_approved, id)
        apps_ref = db.collection('apps').where('is_approved', '==', True).where('id', 'in', app_ids).stream()
        
        apps_map = {app.id: app.to_dict() for app in apps_ref}
        ordered_apps = [apps_map[app_id] for app_id in app_ids if app_id in apps_map]
        
        return jsonify(ordered_apps), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_apps_bp.route('/categories', methods=['GET'])
def get_all_categories():
    """Получение списка всех категорий."""
    try:
        categories_ref = db.collection('categories').stream()
        categories_list = [cat.to_dict() for cat in categories_ref]
        return jsonify(categories_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500