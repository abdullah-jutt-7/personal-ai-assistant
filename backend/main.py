import sys
import os
from flask import Flask, send_from_directory
from flask_cors import CORS

# Add ai_engine and database to path
sys.path.append(os.path.join(os.path.dirname(__file__), "ai_engine"))
sys.path.append(os.path.join(os.path.dirname(__file__), "database"))
sys.path.append(os.path.join(os.path.dirname(__file__), "api"))

from routes import api  # import our API blueprint

app = Flask(__name__)
CORS(app)  # allow frontend JS to call backend
app.register_blueprint(api, url_prefix="/api")

# Serve frontend files
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)

if __name__ == "__main__":
    app.run(debug=True)
print("Starting main.py...")