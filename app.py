from flask import Flask, request, jsonify
from flask_cors import CORS

import datetime
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Database functions
def add_book(title, author_name, genre, page_count=None, publication_year=None, priority=5, status_id=3):
    print(f"Adding book: {title} by {author_name}, genre: {genre}")
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # Ensure author exists or add new one
        cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (author_name,))
        author = cursor.fetchone()
        if author:
            author_id = author[0]
        else:
            cursor.execute("INSERT INTO Authors (name) VALUES (?)", (author_name,))
            author_id = cursor.lastrowid
        
        # Ensure genre exists or add new one
        cursor.execute("SELECT genre_id FROM Genres WHERE genre = ?", (genre,))
        genre_row = cursor.fetchone()
        if genre_row:
            genre_id = genre_row[0]
        else:
            cursor.execute("INSERT INTO Genres (genre) VALUES (?)", (genre,))
            genre_id = cursor.lastrowid
        
        # Add the book
        cursor.execute("""
        INSERT INTO Books (title, author_id, genre_id, page_count, publication_year) 
        VALUES (?, ?, ?, ?, ?)
        """, (title, author_id, genre_id, page_count, publication_year))
        book_id = cursor.lastrowid
        
        # Add to TBR list
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
        INSERT INTO TBRlist (book_id, status_id, priority, date_added) 
        VALUES (?, ?, ?, ?)
        """, (book_id, status_id, priority, today))
        
        conn.commit()
        print(f"Book added successfully with ID: {book_id}")
        return book_id
    except Exception as e:
        conn.rollback()
        print(f"Error adding book: {str(e)}")
        raise e
    finally:
        conn.close()

def get_tbr_list():
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT t.tbr_id, b.book_id, b.title, a.name as author, g.genre as genre, 
           rs.status, t.priority, t.date_added, t.date_completed
    FROM TBRlist t
    JOIN Books b ON t.book_id = b.book_id
    JOIN Authors a ON b.author_id = a.author_id
    JOIN Genres g ON b.genre_id = g.genre_id
    JOIN [Reading Status] rs ON t.status_id = rs.status_id
    ORDER BY t.priority DESC, t.date_added DESC
    """)
    
    books = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return books

def get_authors():
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT author_id, name FROM Authors ORDER BY name")
    authors = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return authors

def get_genres():
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT genre_id, genre FROM Genres ORDER BY genre")
    genres = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return genres

def get_statuses():
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT status_id, status FROM [Reading Status]")
    statuses = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return statuses

def update_status(tbr_id, status_id):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # If status is "Completed", add completion date
        if status_id == 1:  # Assuming 1 is "Completed"
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            cursor.execute("""
            UPDATE TBRlist SET status_id = ?, date_completed = ?
            WHERE tbr_id = ?
            """, (status_id, today, tbr_id))
        else:
            cursor.execute("""
            UPDATE TBRlist SET status_id = ?, date_completed = NULL
            WHERE tbr_id = ?
            """, (status_id, tbr_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating status: {str(e)}")
        raise e
    finally:
        conn.close()

# API Routes
@app.route('/api/book', methods=['POST'])
def api_add_book():
    try:
        data = request.json
        print(f"Received book data: {data}")
        book_id = add_book(
            data['title'],
            data['author_name'],
            data['genre'],
            data.get('page_count'),
            data.get('publication_year'),
            data.get('priority', 5),
            data.get('status_id', 3)
        )
        return jsonify({"success": True, "book_id": book_id})
    except Exception as e:
        print(f"Error in API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tbr', methods=['GET'])
def api_get_tbr():
    try:
        books = get_tbr_list()
        return jsonify(books)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/authors', methods=['GET'])
def api_get_authors():
    try:
        authors = get_authors()
        return jsonify(authors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/genres', methods=['GET'])
def api_get_genres():
    try:
        genres = get_genres()
        return jsonify(genres)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/statuses', methods=['GET'])
def api_get_statuses():
    try:
        statuses = get_statuses()
        return jsonify(statuses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['PUT'])
def api_update_status():
    try:
        data = request.json
        success = update_status(data['tbr_id'], data['status_id'])
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/clear_tbr', methods=['DELETE'])
def api_clear_tbr():
    try:
        conn = sqlite3.connect('tbrlist.db')
        cursor = conn.cursor()

        # Delete all entries from the TBRlist
        cursor.execute("DELETE FROM TBRlist")
        cursor.execute("DELETE FROM Books")
        cursor.execute("DELETE FROM Authors")
        cursor.execute("DELETE FROM Genres")
                
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "TBR list cleared successfully."})
    except Exception as e:
        print(f"Error clearing TBR list: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/book/<int:book_id>', methods=['DELETE'])
def api_delete_book(book_id):
    try:
        conn = sqlite3.connect('tbrlist.db')
        cursor = conn.cursor()
        
        # First, delete the entry from the TBRlist table
        cursor.execute("DELETE FROM TBRlist WHERE book_id = ?", (book_id,))
        
        # Optionally, delete the book from the Books table if no other references exist
        cursor.execute("DELETE FROM Books WHERE book_id = ?", (book_id,))
        
        # You can also delete the author and genre if they are no longer used
        cursor.execute("""
        DELETE FROM Authors WHERE author_id NOT IN (SELECT author_id FROM Books)
        """)
        cursor.execute("""
        DELETE FROM Genres WHERE genre_id NOT IN (SELECT genre_id FROM Books)
        """)
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": f"Book with ID {book_id} deleted successfully."})
    except Exception as e:
        print(f"Error deleting book: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/book/<int:book_id>', methods=['PUT'])
def api_update_book(book_id):
    try:
        data = request.json
        conn = sqlite3.connect('tbrlist.db')
        cursor = conn.cursor()
        
        # First, ensure the author exists or add a new one
        cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (data['author_name'],))
        author = cursor.fetchone()
        if author:
            author_id = author[0]
        else:
            cursor.execute("INSERT INTO Authors (name) VALUES (?)", (data['author_name'],))
            author_id = cursor.lastrowid
        
        # Next, ensure the genre exists or add a new one
        cursor.execute("SELECT genre_id FROM Genres WHERE genre = ?", (data['genre'],))
        genre_row = cursor.fetchone()
        if genre_row:
            genre_id = genre_row[0]
        else:
            cursor.execute("INSERT INTO Genres (genre) VALUES (?)", (data['genre'],))
            genre_id = cursor.lastrowid
        
        # Update the book data
        cursor.execute("""
        UPDATE Books 
        SET title = ?, author_id = ?, genre_id = ? 
        WHERE book_id = ?
        """, (data['title'], author_id, genre_id, book_id))
        
        # Update the priority in the TBR list
        if 'priority' in data:
            cursor.execute("""
            UPDATE TBRlist 
            SET priority = ? 
            WHERE book_id = ?
            """, (data['priority'], book_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": f"Book with ID {book_id} updated successfully."})
    except Exception as e:
        print(f"Error updating book: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')

