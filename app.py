from flask import Flask, request, jsonify
from flask_cors import CORS

import datetime
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Database functions
def add_book(title, author_name, genre, category=None, page_count=None, publication_year=None, priority=5, status_id=3):
    print(f"Adding book: {title} by {author_name}, genre: {genre}")
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (author_name,))
        author = cursor.fetchone()
        if author:
            author_id = author[0]
        else:
            cursor.execute("INSERT INTO Authors (name) VALUES (?)", (author_name,))
            author_id = cursor.lastrowid
        
        cursor.execute("SELECT genre_id FROM Genres WHERE genre = ?", (genre,))
        genre_row = cursor.fetchone()
        if genre_row:
            genre_id = genre_row[0]
            if category:
                cursor.execute("UPDATE Genres SET category = ? WHERE genre_id = ?", (category, genre_id))
        else:
            cursor.execute("INSERT INTO Genres (genre, category) VALUES (?, ?)", (genre, category))
            genre_id = cursor.lastrowid
        
        cursor.execute("""
        INSERT INTO Books (title, author_id, genre_id, page_count, publication_year) 
        VALUES (?, ?, ?, ?, ?)
        """, (title, author_id, genre_id, page_count, publication_year))
        book_id = cursor.lastrowid
        
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
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT t.tbr_id, b.book_id, b.title, a.name as author, g.genre as genre, 
       g.category as category, rs.status, t.priority, t.date_added, t.date_completed,
       b.page_count, b.publication_year, b.rating
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
            data.get('category'),  
            data.get('page_count'),
            data.get('publication_year'),
            data.get('priority', 5),
            data.get('status_id', 3)
        )
        return jsonify({"success": True, "book_id": book_id})
    except Exception as e:
        print(f"Error in API: {str(e)}")
        return jsonify({"error": str(e)}), 500
def update_rating(tbr_id, rating):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # First, get the book_id from the tbr_id
        cursor.execute("SELECT book_id FROM TBRlist WHERE tbr_id = ?", (tbr_id,))
        result = cursor.fetchone()
        if not result:
            raise Exception(f"No TBR entry found with id {tbr_id}")
            
        book_id = result[0]
        
        # Update the rating in the Books table
        cursor.execute("""
        UPDATE Books SET rating = ?
        WHERE book_id = ?
        """, (rating, book_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating rating: {str(e)}")
        raise e
    finally:
        conn.close()

def get_user_settings():
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Ensure there's at least one settings row
    cursor.execute("SELECT COUNT(*) FROM UserSettings")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("""
        INSERT INTO UserSettings (theme, card_layout, show_priority, default_sort, notifications, auto_backup)
        VALUES ('light', 'grid', 1, 'priority', 1, 0)
        """)
        conn.commit()
    
    cursor.execute("SELECT * FROM UserSettings LIMIT 1")
    settings = dict(cursor.fetchone())
    
    # Convert boolean fields from SQLite INTEGER to Python bool
    settings['show_priority'] = bool(settings['show_priority'])
    settings['notifications'] = bool(settings['notifications'])
    settings['auto_backup'] = bool(settings['auto_backup'])
    
    conn.close()
    return settings

def update_user_settings(settings):
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # Convert Python bool to SQLite INTEGER
        show_priority = 1 if settings.get('show_priority') else 0
        notifications = 1 if settings.get('notifications') else 0
        auto_backup = 1 if settings.get('auto_backup') else 0
        
        cursor.execute("""
        UPDATE UserSettings SET
        theme = ?,
        card_layout = ?,
        show_priority = ?,
        default_sort = ?,
        notifications = ?,
        auto_backup = ?
        """, (
            settings.get('theme', 'light'),
            settings.get('cardLayout', 'grid'),
            show_priority,
            settings.get('defaultSort', 'priority'),
            notifications,
            auto_backup
        ))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating settings: {str(e)}")
        raise e
    finally:
        conn.close()

def parse_exported_text(text):
    """Parse the formatted export text back into book data"""
    books = []
    current_status = None
    lines = text.split('\n')
    
    book_data = {}
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Debug output
        print(f"Processing line: '{line}'")
        
        # Look for status headers
        if line.startswith('## '):
            status_header = line[3:].strip()
            print(f"Found status header: {status_header}")
            
            # Handle different status formats
            if status_header.startswith('COMPLETE'):
                current_status = 'Complete'
            elif status_header.startswith('NOT STARTED'):
                current_status = 'Not Started'
            elif status_header.startswith('READING'):
                current_status = 'In-Progress'
            else:
                # Extract just the first word in case there's a count in parentheses
                current_status = status_header.split(' ')[0].strip().capitalize()
                
            print(f"Set current_status to: {current_status}")
            i += 1
            continue
            
        # Look for book entries
        if line.startswith('* '):
            # Save previous book if exists
            if book_data and 'title' in book_data:
                print(f"Saving completed book: {book_data}")
                books.append(book_data)
            
            # Start a new book
            book_data = {'status': current_status}
            
            # Parse title and author
            title_author = line[2:].strip()
            if ' by ' in title_author:
                book_data['title'] = title_author.split(' by ')[0].strip()
                book_data['author'] = title_author.split(' by ')[1].strip()
            else:
                book_data['title'] = title_author
                book_data['author'] = ''
                
        # Parse book details - FIXED: now looking for lines starting with '- ' instead of '  - '
        elif line.startswith('- '):  # Changed from '  - ' to '- '
            detail_line = line[2:].strip()  # Extract the detail content
            print(f"Found detail line: '{detail_line}'")
            
            if detail_line.startswith('Genre: '):
                genre_text = detail_line[7:]
                if '(' in genre_text and ')' in genre_text:
                    book_data['genre'] = genre_text.split('(')[0].strip()
                    book_data['category'] = genre_text.split('(')[1].split(')')[0].strip()
                else:
                    book_data['genre'] = genre_text
                    book_data['category'] = ''
                print(f"Set genre: {book_data.get('genre')}, category: {book_data.get('category')}")
                    
            elif detail_line.startswith('Priority: '):
                # Count Unicode stars (★)
                book_data['priority'] = detail_line.count('★')
                print(f"Set priority: {book_data.get('priority')}")
                
            elif detail_line.startswith('Pages: '):
                try:
                    book_data['page_count'] = int(detail_line[7:])
                    print(f"Set page_count: {book_data.get('page_count')}")
                except:
                    book_data['page_count'] = 0
                    
            elif detail_line.startswith('Published: '):
                try:
                    book_data['publication_year'] = int(detail_line[11:])
                    print(f"Set publication_year: {book_data.get('publication_year')}")
                except:
                    book_data['publication_year'] = 0
                    
            elif detail_line.startswith('Rating: '):
                # Count Unicode stars (★)
                book_data['rating'] = detail_line.count('★')
                print(f"Set rating: {book_data.get('rating')}")
                
            elif detail_line.startswith('Added on: '):
                book_data['date_added'] = detail_line[10:]
                print(f"Set date_added: {book_data.get('date_added')}")
                
            elif detail_line.startswith('Completed on: '):
                book_data['date_completed'] = detail_line[14:]
                print(f"Set date_completed: {book_data.get('date_completed')}")
        
        # Empty line might indicate end of a book entry
        elif line == '' and book_data and 'title' in book_data and i < len(lines) - 1 and not lines[i+1].startswith('- '):  # Changed from '  - ' to '- '
            print(f"End of book data detected, saving: {book_data}")
            books.append(book_data)
            book_data = {}
            
        i += 1
    
    # Add the last book if there is one
    if book_data and 'title' in book_data:
        print(f"Adding final book: {book_data}")
        books.append(book_data)
        
    # Final debug output
    print(f"Total books parsed: {len(books)}")
    for idx, book in enumerate(books):
        print(f"Book {idx+1}: {book}")
        
    return books

def save_imported_books(imported_books):
    """
    Save the imported books to the database using the existing add_book function
    and update ratings for existing books if needed
    """
    # Get existing books to check for duplicates
    existing_books = get_tbr_list()
    
    # Create a dictionary of existing books for quick lookup
    existing_books_dict = {}
    for book in existing_books:
        key = (book['title'].lower(), book['author'].lower())
        existing_books_dict[key] = book
    
    new_books_added = 0
    updates_made = 0
    skipped_books = 0
    
    for book in imported_books:
        # Print the book data for debugging
        print(f"Processing imported book: {book}")
        
        title = book['title']
        author = book.get('author', '')
        lookup_key = (title.lower(), author.lower())
        
        if lookup_key in existing_books_dict:
            # Book exists - check if we need to update rating or other fields
            existing_book = existing_books_dict[lookup_key]
            
            # Update rating if it exists and is different
            if 'rating' in book and book['rating'] and (existing_book.get('rating', 0) != book['rating']):
                try:
                    # Update the rating if it's different
                    update_rating(existing_book['tbr_id'], book['rating'])
                    updates_made += 1
                except Exception as e:
                    print(f"Error updating rating for {title}: {str(e)}")
            else:
                skipped_books += 1
        else:
            # New book - add it to the database
            try:
                # Map status to status_id
                status_mapping = {
                    'Not Started': 3,
                    'In-Progress': 2,
                    'Complete': 1
                }
                status_id = status_mapping.get(book.get('status'), 3)  # Default to "To Read"
                
                # Convert values to appropriate types
                page_count = int(book.get('page_count', 0)) if book.get('page_count') else None
                publication_year = int(book.get('publication_year', 0)) if book.get('publication_year') else None
                priority = int(book.get('priority', 5))
                genre = book.get('genre', '')
                category = book.get('category', '')
                
                # Print the parameters being passed to add_book
                print(f"Adding book with: title={title}, author={author}, genre={genre}, category={category}, pages={page_count}, year={publication_year}, priority={priority}")
                
                # Add the book
                book_id = add_book(
                    title=title,
                    author_name=author,
                    genre=genre,
                    category=category,
                    page_count=page_count,
                    publication_year=publication_year,
                    priority=priority,
                    status_id=status_id
                )
                
                # If the book has a rating, update it
                if 'rating' in book and book['rating']:
                    # We need to get the tbr_id first
                    conn = sqlite3.connect('tbrlist.db')
                    cursor = conn.cursor()
                    cursor.execute("SELECT tbr_id FROM TBRlist WHERE book_id = ?", (book_id,))
                    tbr_result = cursor.fetchone()
                    conn.close()
                    
                    if tbr_result:
                        tbr_id = tbr_result[0]
                        update_rating(tbr_id, book['rating'])
                
                new_books_added += 1
            except Exception as e:
                print(f"Error adding book {title}: {str(e)}")
                skipped_books += 1
    
    return {
        "total_imported": len(imported_books),
        "new_books_added": new_books_added,
        "updates_made": updates_made,
        "skipped_books": skipped_books
    }


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

@app.route('/api/rating', methods=['PUT'])
def api_update_rating():
    try:
        data = request.json
        success = update_rating(data['tbr_id'], data['rating'])
        return jsonify({"success": success})
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
        cursor.execute("DELETE FROM TBRlist WHERE book_id = ?", (book_id,))
        cursor.execute("DELETE FROM Books WHERE book_id = ?", (book_id,))
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
            # Update category if provided
            if 'category' in data:
                cursor.execute("UPDATE Genres SET category = ? WHERE genre_id = ?", 
                              (data['category'], genre_id))
        else:
            cursor.execute("INSERT INTO Genres (genre, category) VALUES (?, ?)", 
                          (data['genre'], data.get('category')))
            genre_id = cursor.lastrowid
        
        # Update the book data
        # Update the book data
        cursor.execute("""
        UPDATE Books    
        SET title = ?, author_id = ?, genre_id = ?, page_count = ?, publication_year = ?
        WHERE book_id = ?
        """, (data['title'], author_id, genre_id, data.get('page_count'), data.get('publication_year'), book_id))
        
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
    
@app.route('/api/settings', methods=['GET'])
def api_get_settings():
    try:
        settings = get_user_settings()
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def api_update_settings():
    try:
        data = request.json
        success = update_user_settings(data)
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')

@app.route('/api/export', methods=['GET'])
def api_export_data():
    try:
        # Get all book data
        books = get_tbr_list()
        
        # Create a formatted text output
        formatted_output = "MY READING JOURNAL\n"
        formatted_output += "=================\n\n"
        formatted_output += f"Exported on: {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n\n"
        
        # Group books by status
        status_groups = {}
        for book in books:
            status = book['status']
            if status not in status_groups:
                status_groups[status] = []
            status_groups[status].append(book)
        
        # Add each status section
        for status, book_list in status_groups.items():
            formatted_output += f"## {status.upper()} ({len(book_list)} books)\n\n"
            
            for book in book_list:
                # Book title and author
                formatted_output += f"* {book['title']} by {book['author']}\n"
                
                # Book details indented
                if book['genre']:
                    formatted_output += f"  - Genre: {book['genre']}"
                    if book['category']:
                        formatted_output += f" ({book['category']})"
                    formatted_output += "\n"
                
                if book['priority']:
                    priority_text = "★" * book['priority']
                    formatted_output += f"  - Priority: {priority_text}\n"
                
                if book['page_count']:
                    formatted_output += f"  - Pages: {book['page_count']}\n"
                
                if book['publication_year']:
                    formatted_output += f"  - Published: {book['publication_year']}\n"
                
                if book['rating'] and book['rating'] > 0:
                    rating_text = "★" * book['rating']
                    formatted_output += f"  - Rating: {rating_text}\n"
                
                if book['date_added']:
                    formatted_output += f"  - Added on: {book['date_added']}\n"
                
                if book['date_completed']:
                    formatted_output += f"  - Completed on: {book['date_completed']}\n"
                
                formatted_output += "\n"
            
            formatted_output += "\n"
        
        # Add a footer with some stats
        formatted_output += "READING STATS\n"
        formatted_output += "=============\n\n"
        total_books = len(books)
        completed_books = len([b for b in books if b['status'] == 'Completed'])
        reading_books = len([b for b in books if b['status'] == 'Reading'])
        tbr_books = len([b for b in books if b['status'] == 'To Read'])
        
        formatted_output += f"Total books: {total_books}\n"
        formatted_output += f"Completed: {completed_books}\n"
        formatted_output += f"Currently reading: {reading_books}\n"
        formatted_output += f"To be read: {tbr_books}\n\n"
        
        if completed_books > 0:
            avg_rating = sum(b['rating'] or 0 for b in books if b['status'] == 'Completed') / completed_books
            formatted_output += f"Average rating for completed books: {avg_rating:.1f} stars\n"
        
        # Add a note about importing
        formatted_output += "\n---\n"
        formatted_output += "Note: This file is meant for human readability. "
        formatted_output += "To import this data back into the app, you'll need to use the original JSON export.\n"
        
        # Create the response with the formatted text
        response = app.response_class(
            response=formatted_output,
            status=200,
            mimetype='text/plain'
        )
        return response
    except Exception as e:
        print(f"Error exporting data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/import', methods=['POST'])
def api_import_data():
    try:
        # Get the uploaded file from the request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        # Read the file content
        content = file.read().decode('utf-8')
        
        # Parse the formatted text back into book data
        imported_books = parse_exported_text(content)
        
        # Save the imported books
        save_result = save_imported_books(imported_books)
        
        return jsonify({
            "success": True, 
            "message": f"Successfully imported {len(imported_books)} books",
            "details": save_result,
            "books": imported_books
        }), 200
        
    except Exception as e:
        print(f"Error importing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

