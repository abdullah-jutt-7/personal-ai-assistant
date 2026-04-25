import mysql.connector

# MySQL connection
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "personal_ai"  # Make sure this database exists
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def save_message(conversation_id, sender, message):
    conn = get_connection()
    cursor = conn.cursor()
    query = "INSERT INTO messages (conversation_id, sender, message) VALUES (%s, %s, %s)"
    cursor.execute(query, (conversation_id, sender, message))
    conn.commit()
    cursor.close()
    conn.close()

def get_conversation(conversation_id):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT sender, message FROM messages WHERE conversation_id=%s ORDER BY id"
    cursor.execute(query, (conversation_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"sender": row[0], "message": row[1]} for row in rows]
