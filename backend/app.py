# backend/app.py (ПОЛНАЯ ФИНАЛЬНАЯ ВЕРСИЯ)

# Загружаем переменные из .env файла в самом начале
from dotenv import load_dotenv
load_dotenv()

# --- Все необходимые импорты ---
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
import json
import os
import traceback
import uuid
import datetime

# --- Сервисы и роуты ---
from firebase_service import db, bucket
from routes.api_apps import api_apps_bp
from routes.api_news import api_news_bp
from routes.api_user import api_user_bp
from routes.api_admin import api_admin_bp
from routes.api_search import api_search_bp

# --- Создание и конфигурация приложения ---
app = Flask(__name__)
CORS(app, expose_headers=["X-Telegram-Init-Data"])

# --- Регистрация Blueprints ---
app.register_blueprint(api_apps_bp, url_prefix='/api')
app.register_blueprint(api_news_bp, url_prefix='/api')
app.register_blueprint(api_user_bp, url_prefix='/api')
app.register_blueprint(api_admin_bp, url_prefix='/admin')
app.register_blueprint(api_search_bp, url_prefix='/api')

# --- Обработка команд бота через Webhook ---
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEB_APP_URL = os.getenv('WEB_APP_URL')

@app.route('/webhook', methods=['POST'])
def webhook():
    """Этот эндпоинт будет принимать обновления от Telegram."""
    update = request.get_json()
    
    if "message" in update and "chat" in update["message"]:
        chat_id = update["message"]["chat"]["id"]
        message_text = update["message"].get("text", "")

        if message_text == "/start":
            send_welcome_message(chat_id)
            
    return jsonify({"status": "ok"}), 200

def send_welcome_message(chat_id):
    """Отправляет приветственное сообщение с кнопкой для открытия Web App."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    if not WEB_APP_URL:
        print("❌ WEB_APP_URL не задан в .env файле! Не могу отправить кнопку.")
        return

    web_app_button = {"text": "🚀 Открыть Агрегатор", "web_app": {"url": WEB_APP_URL}}
    reply_markup = {"inline_keyboard": [[web_app_button]]}
    
    payload = {
        "chat_id": chat_id,
        "text": "Добро пожаловать в TON Aggregator!\n\nНажмите кнопку ниже, чтобы начать.",
        "reply_markup": json.dumps(reply_markup)
    }
    
    try:
        requests.post(url, data=payload)
        print(f"✅ Приветственное сообщение отправлено пользователю {chat_id}")
    except Exception as e:
        print(f"❌ Ошибка отправки сообщения: {e}")

# --- Тестовый корневой маршрут ---
@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "TONAggregator backend is running!"})

# --- Запуск приложения ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)