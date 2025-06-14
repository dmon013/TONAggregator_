from dotenv import load_dotenv
load_dotenv()
from flask import Flask, jsonify
from flask_cors import CORS


# Важно: импортируем наши сервисы, чтобы убедиться, что Firebase инициализирован при старте
from firebase_service import db, bucket

# --- Импорт маршрутов (Blueprints) ---
# Мы создадим эти файлы на следующем шаге.
# Пока они закомментированы, чтобы не вызывать ошибку.
from routes.api_apps import api_apps_bp
from routes.api_news import api_news_bp
from routes.api_user import api_user_bp
from routes.api_admin import api_admin_bp
from routes.api_search import api_search_bp

# Создаем экземпляр приложения Flask
app = Flask(__name__)

# Включаем CORS для всех маршрутов, чтобы разрешить запросы с фронтенда
CORS(app, expose_headers=["X-Telegram-Init-Data"])

# --- Регистрация Blueprints ---
# После создания файлов с маршрутами, мы раскомментируем эти строки
app.register_blueprint(api_apps_bp, url_prefix='/api')
app.register_blueprint(api_news_bp, url_prefix='/api')
app.register_blueprint(api_user_bp, url_prefix='/api')
app.register_blueprint(api_search_bp, url_prefix='/api')

# Отдельный префикс /admin для админских маршрутов
app.register_blueprint(api_admin_bp, url_prefix='/admin')

# Простой маршрут для проверки работоспособности сервера
@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "TONAggregator backend is running!"})

# Запуск приложения
if __name__ == '__main__':
    # В режиме разработки используем debug=True для автоматической перезагрузки
    app.run(host='0.0.0.0', port=5001, debug=True)