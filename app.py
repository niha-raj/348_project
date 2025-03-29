from flask import Flask, request, jsonify 
from flask_cors import CORS
import datetime
import sqlite3

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

# Database functions
def add_author(name):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO Authors (name) VALUES (?)", (name,))
    author_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return author_id

def add_genre(genre_name):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO Genres (genre_name) VALUES (?)", (genre_name,))
    genre_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return genre_id

def add_book(title, author_id, genre_id, page_count=None, publication_year=None):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO Book (title, author_id, genre_id, page_count, publication_year) 
    VALUES (?, ?, ?, ?, ?)
    """, (title, author_id, genre_id, page_count, publication_year))
    book_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return book_id

def add_to_tbr(book_id, priority=5, status_id=1):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    today = datetime.datetime.now().strftime("%m/%d/%Y")
    cursor.execute("""
    INSERT INTO TBRlist (book_id, status_id, priority, date_added) 
    VALUES (?, ?, ?, ?)
    """, (book_id, status_id, priority, today))
    tbr_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return tbr_id

def update_status(tbr_id, new_status_id):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    # If marking as completed, add completion date
    completion_date = None
    if new_status_id == 3:  # Completed status
        completion_date = datetime.datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
        UPDATE TBRlist 
        SET status_id = ?, date_completed = ?
        WHERE tbr_id = ?
        """, (new_status_id, completion_date, tbr_id))
    else:
        cursor.execute("""
        UPDATE TBRlist 
        SET status_id = ?
        WHERE tbr_id = ?
        """, (new_status_id, tbr_id))
    
    conn.commit()
    conn.close()

def get_tbr_list():
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("""
    SELECT t.tbr_id, b.title, a.name, g.genre_name, t.priority, rs.status, t.date_added, t.date_completed
    FROM TBRlist t
    JOIN Book b ON t.book_id = b.book_id
    JOIN Authors a ON b.author_id = a.author_id
    JOIN Genres g ON b.genre_id = g.genre_id
    JOIN Reading_Status rs ON t.status_id = rs.status_id
    ORDER BY t.priority, t.date_added
    """)
    results = cursor.fetchall()
    conn.close()
    
    # Convert to list of dictionaries for JSON serialization
    tbr_list = []
    for row in results:
        tbr_list.append({
            'tbr_id': row[0],
            'title': row[1],
            'author': row[2],
            'genre': row[3],
            'priority': row[4],
            'status': row[5],
            'date_added': row[6],
            'date_completed': row[7]
        })
    
    return tbr_list

def get_all_authors():
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("SELECT author_id, name FROM Authors ORDER BY name")
    results = cursor.fetchall()
    conn.close()
    
    authors = []
    for row in results:
        authors.append({
            'author_id': row[0],
            'name': row[1]
        })
    
    return authors

def get_all_genres():
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("SELECT genre_id, genre_name FROM Genres ORDER BY genre_name")
    results = cursor.fetchall()
    conn.close()
    
    genres = []
    for row in results:
        genres.append({
            'genre_id': row[0],
            'genre_name': row[1]
        })
    
    return genres

def get_all_statuses():
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    cursor.execute("SELECT status_id, status FROM Reading_Status")
    results = cursor.fetchall()
    conn.close()
    
    statuses = []
    for row in results:
        statuses.append({
            'status_id': row[0],
            'status': row[1]
        })
    
    return statuses

# API Routes
@app.route('/api/tbr', methods=['GET'])
def api_get_tbr_list():
    try:
        tbr_list = get_tbr_list()
        return jsonify(tbr_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/authors', methods=['GET'])
def api_get_authors():
    try:
        authors = get_all_authors()
        return jsonify(authors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/genres', methods=['GET'])
def api_get_genres():
    try:
        genres = get_all_genres()
        return jsonify(genres)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/statuses', methods=['GET'])
def api_get_statuses():
    try:
        statuses = get_all_statuses()
        return jsonify(statuses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/author', methods=['POST'])
def api_add_author():
    try:
        data = request.json
        author_id = add_author(data['name'])
        return jsonify({"author_id": author_id, "name": data['name']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/genre', methods=['POST'])
def api_add_genre():
    try:
        data = request.json
        genre_id = add_genre(data['genre_name'])
        return jsonify({"genre_id": genre_id, "genre_name": data['genre_name']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/book', methods=['POST'])
def api_add_book():
    try:
        data = request.json
        
        # Handle author (either use existing or create new)
        author_id = data.get('author_id')
        if not author_id and data.get('author_name'):
            author_id = add_author(data['author_name'])
            
        # Handle genre (either use existing or create new)
        genre_id = data.get('genre_id')
        if not genre_id and data.get('genre_name'):
            genre_id = add_genre(data['genre_name'])
            
        # Add the book
        book_id = add_book(
            data['title'], 
            author_id, 
            genre_id, 
            data.get('page_count'), 
            data.get('publication_year')
        )
        
        # Add to TBR list if requested
        tbr_id = None
        if data.get('add_to_tbr', True):
            tbr_id = add_to_tbr(
                book_id, 
                data.get('priority', 5), 
                data.get('status_id', 1)
            )
            
        return jsonify({
            "success": True,
            "book_id": book_id,
            "tbr_id": tbr_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['PUT'])
def api_update_status():
    try:
        data = request.json
        update_status(data['tbr_id'], data['status_id'])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)