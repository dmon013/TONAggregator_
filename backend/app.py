# backend/app.py (САМАЯ ПОСЛЕДНЯЯ ВЕРСИЯ С ИСПРАВЛЕНИЕМ)

from dotenv import load_dotenv
load_dotenv() 

from flask import Flask, jsonify, request as flask_request
from flask_cors import CORS
import requests
import json
import os
import traceback
import uuid
import datetime

from firebase_service import db
from routes.api_apps import api_apps_bp
from routes.api_news import api_news_bp
from routes.api_user import api_user_bp
from routes.api_admin import api_admin_bp
from routes.api_search import api_search_bp

app = Flask(__name__)
CORS(app, expose_headers=["X-Telegram-Init-Data"])

app.register_blueprint(api_apps_bp, url_prefix='/api')
app.register_blueprint(api_news_bp, url_prefix='/api')
app.register_blueprint(api_user_bp, url_prefix='/api')
app.register_blueprint(api_admin_bp, url_prefix='/admin')
app.register_blueprint(api_search_bp, url_prefix='/api')

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEB_APP_URL = os.getenv('WEB_APP_URL')

@app.route('/webhook', methods=['POST'])
def webhook():
    update = flask_request.get_json()
    if "message" in update and "chat" in update["message"] and "id" in update["message"]["chat"]:
        chat_id = update["message"]["chat"]["id"]
        if update["message"].get("text") == "/start":
            send_welcome_message(chat_id)
    return jsonify({"status": "ok"}), 200

def send_welcome_message(chat_id):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    if not WEB_APP_URL:
        print("WEB_APP_URL not set in .env!")
        return
    web_app_button = {"text": "🚀 Открыть Агрегатор", "web_app": {"url": WEB_APP_URL}}
    reply_markup = {"inline_keyboard": [[web_app_button]]}
    payload = {
        "chat_id": chat_id,
        "text": "Добро пожаловать в TON Aggregator!\n\nНажмите кнопку ниже, чтобы начать.",
        "reply_markup": json.dumps(reply_markup)
    }
    try:
        api_response = requests.post(url, data=payload)
        api_response.raise_for_status()
        print(f"✅ Приветственное сообщение отправлено пользователю {chat_id}")
    except Exception as e:
        print(f"❌ Ошибка отправки сообщения: {e}")

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "TONAggregator backend is running!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)