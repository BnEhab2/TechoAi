import os
import sys
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Ensure UTF-8 output encoding for Windows terminal compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import webbrowser
from threading import Timer

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Conversation memory (per session, lightweight) ──
conversation_history = {}

SYSTEM_PROMPT = """You are Techo (تيكو), a smart, cool, and knowledgeable student guide and friend at SUTech (Elsewedy University of Technology).

Tone & Persona:
- Talk naturally like a helpful, smart Egyptian friend (use words like "يا فنان", "يا صديقي", "منور", "يا غالي").
- Be ultra-flexible: feel free to answer ANYTHING the user asks (academic, programming, study tips, casual conversation, general knowledge, jokes, or advice).
- NEVER sound like a robotic customer service bot or say "I am an AI model". Sound like a real, knowledgeable companion.
- Adapt seamlessly to the user's language: if they speak Arabic, reply in friendly Egyptian Arabic; if they speak English, reply in clear, natural English.

Bidi & Formatting Rules:
- When replying in Egyptian Arabic, keep technical terms, code keywords, and academic terms in English as-is (e.g. GPA, loop, database, credits, API, array, query).
- Structure mixed sentences cleanly so RTL (Arabic) and LTR (English) text flow naturally without breaking."""

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api_debug.log")
    try:
        data = request.json or {}
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')

        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n--- Chat Request: Session={session_id}, Message='{user_message}' ---\n")

        if not user_message:
            return jsonify({'reply': 'يا فنان اكتبلي رسالتك عشان اقدر أساعدك!'}), 400

        # Initialize conversation history for this session
        if session_id not in conversation_history:
            conversation_history[session_id] = []

        # Add user message to history
        conversation_history[session_id].append({"role": "user", "content": user_message})

        # Keep only last 20 messages to avoid token overflow
        if len(conversation_history[session_id]) > 20:
            conversation_history[session_id] = conversation_history[session_id][-20:]

        # ── OpenRouter API Call ──
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if api_key:
            # Strip quotes if present from .env
            api_key = api_key.strip('"').strip("'")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "Techo AI"
            }
            payload = {
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *conversation_history[session_id]
                ],
                "temperature": 0.8,
                "max_tokens": 1024
            }

            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"Sending to OpenRouter. Key preview: {api_key[:12]}...\n")

            print(f"[API] Sending to OpenRouter: '{user_message[:50]}...'", flush=True)
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=20
            )

            print(f"[API] OpenRouter response status: {r.status_code}", flush=True)
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"OpenRouter response status: {r.status_code}\n")

            if r.status_code == 200:
                res_json = r.json()
                reply_text = res_json['choices'][0]['message']['content']
                # Save assistant reply to history
                conversation_history[session_id].append({"role": "assistant", "content": reply_text})
                
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(f"Success! Reply: '{reply_text[:100]}...'\n")
                return jsonify({'reply': reply_text})
            else:
                print(f"[API] OpenRouter error body: {r.text[:300]}", flush=True)
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(f"Failed! Status: {r.status_code}, Body: {r.text}\n")

        # ── API Fail Fallback ──
        print("[WARN] No API key or API failed", flush=True)
        with open(log_file, "a", encoding="utf-8") as f:
            f.write("API Key missing or API request failed\n")
        return jsonify({'reply': 'عذراً يا صديقي، حصل مشكلة في الاتصال بالـ AI. تأكد من إعداد الـ API Key وجرب تاني!'}), 503

    except Exception as e:
        print(f"[ERROR] Error in /api/chat: {e}", flush=True)
        import traceback
        traceback.print_exc()
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"Exception: {str(e)}\n{traceback.format_exc()}\n")
        return jsonify({'reply': 'حصل مشكلة بسيطة في الاتصال، جرب تبعت الرسالة تاني يا فنان!'}), 500


@app.route('/api/health', methods=['GET'])
def health():
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip('"').strip("'")
    return jsonify({
        'status': 'ok',
        'api_key_set': bool(api_key),
        'api_key_preview': f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else 'too_short'
    })

def open_browser():
    try:
        webbrowser.open_new('http://localhost:5000')
    except Exception:
        pass

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip('"').strip("'")
    print("=" * 60)
    print(f"  [START] Techo AI Full App running on http://localhost:{port}")
    print(f"  [API]   OpenRouter Key: {'✅ Set (' + api_key[:8] + '...)' if api_key else '❌ NOT SET'}")
    print("=" * 60)
    Timer(1.2, open_browser).start()
    app.run(host='0.0.0.0', port=port, debug=False)
