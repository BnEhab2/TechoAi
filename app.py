import os
import sys
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env file (for local dev; on HF Spaces use Secrets instead)
load_dotenv()

# Ensure UTF-8 output encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

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
    try:
        data = request.json or {}
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')

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
            api_key = api_key.strip('"').strip("'")

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://huggingface.co/spaces",
                "X-Title": "Techo AI - SUTech"
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

            print(f"[API] Sending to OpenRouter: '{user_message[:50]}'", flush=True)
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=20
            )

            print(f"[API] OpenRouter response status: {r.status_code}", flush=True)

            if r.status_code == 200:
                res_json = r.json()
                reply_text = res_json['choices'][0]['message']['content']
                conversation_history[session_id].append({"role": "assistant", "content": reply_text})
                return jsonify({'reply': reply_text})
            else:
                print(f"[API] OpenRouter error: {r.text[:300]}", flush=True)

        # ── API Fail Fallback ──
        print("[WARN] No API key or API failed", flush=True)
        return jsonify({'reply': 'عذراً يا صديقي، حصل مشكلة في الاتصال بالـ AI. تأكد من إعداد الـ API Key وجرب تاني!'}), 503

    except Exception as e:
        print(f"[ERROR] Error in /api/chat: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({'reply': 'حصل مشكلة بسيطة في الاتصال، جرب تبعت الرسالة تاني يا فنان!'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860))  # HF Spaces default port
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip('"').strip("'")
    print("=" * 60)
    print(f"  [START] Techo AI running on port {port}")
    print(f"  [API]   OpenRouter Key: {'✅ Set (' + api_key[:8] + '...)' if api_key else '❌ NOT SET'}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
