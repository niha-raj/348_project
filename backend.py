import datetime
import sqlite3


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
    return results