from flask import Blueprint, request, jsonify
import sys
import os
import threading
import time
import json

# Path hack to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai_engine"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "database"))

from chat_engine import get_response
from db_mysql import save_message, get_conversation, get_connection

api = Blueprint("api", __name__)

TRAINING_STATE = {"progress": 0, "status": "Idle", "time_left": ""}

def mock_training_job():
    global TRAINING_STATE
    TRAINING_STATE["status"] = "Preparing dataset..."
    TRAINING_STATE["progress"] = 10
    time.sleep(5)
    
    TRAINING_STATE["status"] = "Training..."
    for i in range(20, 101, 10):
        TRAINING_STATE["progress"] = i
        time_left = f"~ {(100-i)//10 * 10} seconds"
        TRAINING_STATE["time_left"] = time_left
        time.sleep(10)
        
    TRAINING_STATE["status"] = "Completed"
    TRAINING_STATE["progress"] = 100
    TRAINING_STATE["time_left"] = "Done"

@api.route("/upload_dataset", methods=["POST"])
def upload_dataset():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        content = file.read().decode('utf-8')
    except Exception:
        content = str(file.read())
        
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "..", "models", "datasets", "intellitext_chat.jsonl")
    os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
    with open(dataset_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"instruction": f"Knowledge from {file.filename}", "response": content[:1000]}) + "\n")
        
    return jsonify({"success": True})

@api.route("/start_training", methods=["POST"])
def start_training():
    global TRAINING_STATE
    if 0 < TRAINING_STATE["progress"] < 100 and TRAINING_STATE["status"] != "Completed":
        return jsonify({"error": "Training already in progress"}), 400
        
    TRAINING_STATE = {"progress": 0, "status": "Initializing...", "time_left": "Calculated..."}
    thread = threading.Thread(target=mock_training_job)
    thread.daemon = True
    thread.start()
    return jsonify({"success": True})

@api.route("/training_status", methods=["GET"])
def training_status():
    return jsonify(TRAINING_STATE)

# Simple conversation tracker
conversation_counter = 1

# --------- AI Chat Route ----------
@api.route("/chat", methods=["POST"])
def chat():
    global conversation_counter
    user_input = request.json.get("message", "")
    conversation_id = request.json.get("conversation_id", None)

    if conversation_id is None:
        # Create a new conversation directly in DB
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO messages (conversation_id, sender, message) VALUES (NULL, NULL, NULL)")
        conversation_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()

    # Save user message
    save_message(conversation_id, "user", user_input)

    # Get previous messages for context (optional)
    previous = get_conversation(conversation_id)

    context_text = ""
    for msg in previous:
        if msg["sender"] == "user":
            context_text += f"<|user|>\n{msg['message']}</s>\n"
        elif msg["sender"] == "ai":
            context_text += f"<|assistant|>\n{msg['message']}</s>\n"

    prompt = context_text + f"<|user|>\n{user_input}</s>\n"

    # Generate AI response
    ai_response = get_response(prompt)

    # Save AI response
    save_message(conversation_id, "ai", ai_response)

    return jsonify({"response": ai_response})
# --------- List all conversation IDs ----------
@api.route("/conversations", methods=["GET"])
def list_conversations():
    conn = get_connection()
    cursor = conn.cursor()
    # Fetch the very first user message for each conversation to act as the title
    cursor.execute("""
        SELECT conversation_id, message 
        FROM messages 
        WHERE sender = 'user' 
        GROUP BY conversation_id 
        ORDER BY conversation_id
    """)
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        conv_id = row[0]
        full_message = row[1]
        if full_message:
            words = full_message.split()
            title = " ".join(words[:3]) + ("..." if len(words) > 3 else "")
        else:
            title = f"Chat {conv_id}"
            
        result.append({"conversation_id": conv_id, "title": title})

    cursor.close()
    conn.close()
    return jsonify(result)

# --------- Get messages of a specific conversation ----------
@api.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation_api(conversation_id):
    conv = get_conversation(conversation_id)
    return jsonify(conv)

@api.route("/new_conversation", methods=["POST"])
def new_conversation():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (conversation_id, sender, message) VALUES (NULL, NULL, NULL)")
    conversation_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"conversation_id": conversation_id})