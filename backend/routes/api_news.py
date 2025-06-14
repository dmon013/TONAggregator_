# backend/routes/api_news.py

from flask import Blueprint, jsonify
from firebase_service import db

api_news_bp = Blueprint('api_news_bp', __name__)

@api_news_bp.route('/news', methods=['GET'])
def get_all_news():
    """Получение списка всех новостей."""
    try:
        news_ref = db.collection('news').order_by('created_at', direction='DESCENDING').limit(20).stream()
        news_list = [news.to_dict() for news in news_ref]
        return jsonify(news_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_news_bp.route('/news/<string:news_id>', methods=['GET'])
def get_news_details(news_id):
    """Получение деталей конкретной новости."""
    try:
        news_ref = db.collection('news').document(news_id)
        news_doc = news_ref.get()
        if news_doc.exists:
            return jsonify(news_doc.to_dict()), 200
        else:
            return jsonify({"error": "News not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500