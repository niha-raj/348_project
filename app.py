from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

import datetime
import os
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Configure SQLAlchemy
base_dir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(base_dir, "tbrlist.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# ================ ORM Models (SQLAlchemy) ================

class Author(db.Model):
    __tablename__ = 'Authors'
    author_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    books = db.relationship('Book', backref='author', lazy=True)

class Genre(db.Model):
    __tablename__ = 'Genres'
    genre_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    genre = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100))
    books = db.relationship('Book', backref='genre_rel', lazy=True)

class ReadingStatus(db.Model):
    __tablename__ = 'Reading Status'
    status_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(db.String(50), nullable=False)
    tbr_items = db.relationship('TBRList', backref='status', lazy=True)

class Book(db.Model):
    __tablename__ = 'Books'
    book_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('Authors.author_id'), nullable=False)
    genre_id = db.Column(db.Integer, db.ForeignKey('Genres.genre_id'), nullable=False)
    page_count = db.Column(db.Integer)
    publication_year = db.Column(db.Integer)
    rating = db.Column(db.Integer)
    tbr_items = db.relationship('TBRList', backref='book', lazy=True, cascade="all, delete-orphan")

class TBRList(db.Model):
    __tablename__ = 'TBRlist'
    tbr_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_id = db.Column(db.Integer, db.ForeignKey('Books.book_id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('Reading Status.status_id'), nullable=False)
    priority = db.Column(db.Integer, default=5)
    date_added = db.Column(db.String(20))
    date_completed = db.Column(db.String(20))

class UserSettings(db.Model):
    __tablename__ = 'UserSettings'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    theme = db.Column(db.String(20), default='light')
    card_layout = db.Column(db.String(20), default='grid')
    show_priority = db.Column(db.Integer, default=1)  # SQLite boolean as integer
    default_sort = db.Column(db.String(20), default='priority')
    notifications = db.Column(db.Integer, default=1)
    auto_backup = db.Column(db.Integer, default=0)

class ReadingGoal(db.Model):
    __tablename__ = 'ReadingGoals'
    goal_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, default=1)
    goal_type = db.Column(db.String(50), nullable=False)
    target_value = db.Column(db.Integer)
    target_book_id = db.Column(db.Integer, db.ForeignKey('Books.book_id'))
    target_genre_id = db.Column(db.Integer, db.ForeignKey('Genres.genre_id'))
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=False)
    completed = db.Column(db.Integer, default=0)
    progress = db.Column(db.Integer, default=0)

# ================ ORM Data Access Functions ================

def add_book_orm(title, author_name, genre_name, category=None, page_count=None, 
              publication_year=None, priority=5, status_id=3):
    """Add a book using SQLAlchemy ORM"""
    print(f"Adding book via ORM: {title} by {author_name}, genre: {genre_name}")
    
    try:
        # Get or create author
        author = Author.query.filter_by(name=author_name).first()
        if not author:
            author = Author(name=author_name)
            db.session.add(author)
            db.session.flush()  # Get the ID without committing
        
        # Get or create genre
        genre = Genre.query.filter_by(genre=genre_name).first()
        if genre:
            if category:
                genre.category = category
        else:
            genre = Genre(genre=genre_name, category=category)
            db.session.add(genre)
            db.session.flush()
        
        # Create new book
        book = Book(
            title=title,
            author_id=author.author_id,
            genre_id=genre.genre_id if genre else None,
            page_count=page_count,
            publication_year=publication_year
        )
        db.session.add(book)
        db.session.flush()
        
        # Add to TBR list
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        tbr_item = TBRList(
            book_id=book.book_id,
            status_id=status_id,
            priority=priority,
            date_added=today
        )
        db.session.add(tbr_item)
        
        db.session.commit()
        return book.book_id
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error adding book via ORM: {str(e)}")
        raise e

def get_authors_orm():
    """Get all authors using ORM"""
    authors = Author.query.order_by(Author.name).all()
    return [{"author_id": a.author_id, "name": a.name} for a in authors]

def get_genres_orm():
    """Get all genres using ORM"""
    genres = Genre.query.order_by(Genre.genre).all()
    return [{"genre_id": g.genre_id, "genre": g.genre} for g in genres]

def get_statuses_orm():
    """Get all reading statuses using ORM"""
    statuses = ReadingStatus.query.all()
    return [{"status_id": s.status_id, "status": s.status} for s in statuses]

def update_status_orm(tbr_id, status_id):
    """Update book reading status using ORM"""
    try:
        tbr_item = TBRList.query.get(tbr_id)
        if not tbr_item:
            raise Exception(f"No TBR item found with id {tbr_id}")
        
        tbr_item.status_id = status_id
        
        # If status is "Completed", add completion date
        if status_id == 1:  # Assuming 1 is "Completed"
            tbr_item.date_completed = datetime.datetime.now().strftime("%Y-%m-%d")
        else:
            tbr_item.date_completed = None
            
        db.session.commit()
        return True
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error updating status via ORM: {str(e)}")
        raise e

def update_rating_orm(tbr_id, rating):
    """Update book rating using ORM"""
    try:
        tbr_item = TBRList.query.get(tbr_id)
        if not tbr_item:
            raise Exception(f"No TBR item found with id {tbr_id}")
            
        book = Book.query.get(tbr_item.book_id)
        if not book:
            raise Exception(f"No book found with id {tbr_item.book_id}")
            
        book.rating = rating
        db.session.commit()
        return True
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error updating rating via ORM: {str(e)}")
        raise e

def get_user_settings_orm():
    """Get user settings using ORM"""
    settings = UserSettings.query.first()
    if not settings:
        # Create default settings
        settings = UserSettings()
        db.session.add(settings)
        db.session.commit()
    
    # Convert SQLite integers to Python booleans for JSON response
    return {
        "id": settings.id,
        "theme": settings.theme,
        "card_layout": settings.card_layout,
        "show_priority": bool(settings.show_priority),
        "default_sort": settings.default_sort,
        "notifications": bool(settings.notifications),
        "auto_backup": bool(settings.auto_backup)
    }

def update_user_settings_orm(settings_data):
    """Update user settings using ORM"""
    try:
        settings = UserSettings.query.first()
        if not settings:
            settings = UserSettings()
            db.session.add(settings)
        
        # Update settings from dictionary
        if 'theme' in settings_data:
            settings.theme = settings_data['theme']
        if 'cardLayout' in settings_data:
            settings.card_layout = settings_data['cardLayout']
        if 'show_priority' in settings_data:
            settings.show_priority = 1 if settings_data['show_priority'] else 0
        if 'default_sort' in settings_data:
            settings.default_sort = settings_data['default_sort']
        if 'notifications' in settings_data:
            settings.notifications = 1 if settings_data['notifications'] else 0
        if 'auto_backup' in settings_data:
            settings.auto_backup = 1 if settings_data['auto_backup'] else 0
            
        db.session.commit()
        return True
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error updating settings via ORM: {str(e)}")
        raise e

# ================ PREPARED STATEMENTS Functions ================

def get_tbr_list_prepared():
    """Get TBR list using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # SQL with parameters (prepared statement)
    sql = """
        SELECT t.tbr_id, b.book_id, b.title, a.name as author, g.genre as genre, 
        g.category as category, rs.status, t.priority, t.date_added, t.date_completed,
        b.page_count, b.publication_year, b.rating
        FROM TBRlist t
        JOIN Books b ON t.book_id = b.book_id
        JOIN Authors a ON b.author_id = a.author_id
        JOIN Genres g ON b.genre_id = g.genre_id
        JOIN [Reading Status] rs ON t.status_id = rs.status_id
        ORDER BY t.priority DESC, t.date_added DESC
    """
    
    cursor.execute(sql)
    books = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return books

def delete_book_prepared(book_id):
    """Delete a book using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # Delete from TBRlist first (foreign key constraints)
        cursor.execute("DELETE FROM TBRlist WHERE book_id = ?", (book_id,))
        
        # Delete the book
        cursor.execute("DELETE FROM Books WHERE book_id = ?", (book_id,))
        
        # Cleanup orphaned authors
        cursor.execute("DELETE FROM Authors WHERE author_id NOT IN (SELECT author_id FROM Books)")
        
        # Cleanup orphaned genres
        cursor.execute("DELETE FROM Genres WHERE genre_id NOT IN (SELECT genre_id FROM Books)")
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error deleting book with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

def update_book_prepared(book_id, title, author_name, genre_name, category=None, 
                         page_count=None, publication_year=None, priority=None):
    """Update a book using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # First, ensure the author exists or add a new one
        cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (author_name,))
        author = cursor.fetchone()
        if author:
            author_id = author[0]
        else:
            cursor.execute("INSERT INTO Authors (name) VALUES (?)", (author_name,))
            author_id = cursor.lastrowid
        
        # Next, ensure the genre exists or add a new one
        cursor.execute("SELECT genre_id FROM Genres WHERE genre = ?", (genre_name,))
        genre_row = cursor.fetchone()
        if genre_row:
            genre_id = genre_row[0]
            # Update category if provided
            if category:
                cursor.execute("UPDATE Genres SET category = ? WHERE genre_id = ?", 
                              (category, genre_id))
        else:
            cursor.execute("INSERT INTO Genres (genre, category) VALUES (?, ?)", 
                          (genre_name, category))
            genre_id = cursor.lastrowid
        
        # Update the book data
        cursor.execute("""
        UPDATE Books    
        SET title = ?, author_id = ?, genre_id = ?, page_count = ?, publication_year = ?
        WHERE book_id = ?
        """, (title, author_id, genre_id, page_count, publication_year, book_id))
        
        # Update the priority in the TBR list if provided
        if priority is not None:
            cursor.execute("""
            UPDATE TBRlist 
            SET priority = ? 
            WHERE book_id = ?
            """, (priority, book_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating book with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

def create_reading_goal_prepared(goal_type, target_value=None, target_book_id=None, 
                                target_genre_id=None, start_date=None, end_date=None):
    """Create a reading goal using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # Set default end date to end of year if not provided
        if not end_date:
            end_date = datetime.datetime(datetime.datetime.now().year, 12, 31).strftime("%Y-%m-%d")
        
        cursor.execute("""
        INSERT INTO ReadingGoals (
            goal_type, target_value, target_book_id, target_genre_id,
            start_date, end_date, progress
        ) VALUES (?, ?, ?, ?, ?, ?, 0)
        """, (goal_type, target_value, target_book_id, target_genre_id, 
              start_date, end_date))
        
        goal_id = cursor.lastrowid
        conn.commit()
        return goal_id
    
    except Exception as e:
        conn.rollback()
        print(f"Error creating reading goal with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

def get_reading_goals_prepared():
    """Get all reading goals with detailed information using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        SELECT 
            g.goal_id, g.goal_type, g.target_value, g.target_book_id, 
            g.target_genre_id, g.start_date, g.end_date,
            g.completed, g.progress,
            b.title as book_title, a.name as author_name,
            ge.genre as genre_name
        FROM ReadingGoals g
        LEFT JOIN Books b ON g.target_book_id = b.book_id
        LEFT JOIN Authors a ON b.author_id = a.author_id
        LEFT JOIN Genres ge ON g.target_genre_id = ge.genre_id
        ORDER BY g.end_date ASC
        """)
        
        goals = [dict(row) for row in cursor.fetchall()]
        
        # Calculate days remaining for each goal
        for goal in goals:
            try:
                end_date = datetime.datetime.strptime(goal['end_date'], "%Y-%m-%d")
                today = datetime.datetime.now()
                goal['days_remaining'] = (end_date - today).days
                
                # Calculate percentage completion
                if goal['target_value'] and goal['target_value'] > 0:
                    goal['percentage'] = min(100, int((goal['progress'] / goal['target_value']) * 100))
                else:
                    goal['percentage'] = 0 if goal['completed'] == 0 else 100
                    
            except Exception as e:
                print(f"Error calculating goal metrics: {str(e)}")
                goal['days_remaining'] = 0
                goal['percentage'] = 0
        
        return goals
    
    except Exception as e:
        print(f"Error retrieving reading goals with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

def update_goal_progress_prepared(goal_id, progress=None, completed=None):
    """Update a goal's progress or completion status using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        # Build the update query based on provided parameters
        update_parts = []
        params = []
        
        # Fetch the current goal details if we have progress update
        # to check if completion status should change automatically
        if progress is not None and completed is None:
            cursor.execute(
                "SELECT goal_type, target_value FROM ReadingGoals WHERE goal_id = ?", 
                (goal_id,)
            )
            goal_info = cursor.fetchone()
            
            if goal_info and goal_info[0] != 'specific_book' and goal_info[1]:
                # Auto mark as completed if progress meets or exceeds target
                # (but only for goal types with numeric targets)
                is_complete = 1 if progress >= goal_info[1] else 0
                update_parts.append("completed = ?")
                params.append(is_complete)
        
        # Always add progress update if provided
        if progress is not None:
            update_parts.append("progress = ?")
            params.append(progress)
            
        # Explicit completion status takes precedence over automatic
        if completed is not None:
            update_parts.append("completed = ?")
            params.append(1 if completed else 0)
            
        if not update_parts:
            return False  # Nothing to update
            
        # Add the goal_id to the parameters
        params.append(goal_id)
        
        cursor.execute(
            f"UPDATE ReadingGoals SET {', '.join(update_parts)} WHERE goal_id = ?", 
            params
        )
        
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating goal progress with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

def delete_reading_goal_prepared(goal_id):
    """Delete a reading goal using prepared statements"""
    conn = sqlite3.connect('tbrlist.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM ReadingGoals WHERE goal_id = ?", (goal_id,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error deleting reading goal with prepared statement: {str(e)}")
        raise e
    finally:
        conn.close()

# ================ API Routes ================

@app.route('/api/book', methods=['POST'])
def api_add_book():
    try:
        data = request.json
        print(f"Received book data: {data}")
        
        # Using ORM for adding books
        book_id = add_book_orm(
            title=data['title'],
            author_name=data['author_name'],
            genre_name=data['genre'],
            category=data.get('category'),  
            page_count=data.get('page_count'),
            publication_year=data.get('publication_year'),
            priority=data.get('priority', 5),
            status_id=data.get('status_id', 3)
        )
        
        return jsonify({"success": True, "book_id": book_id})
    except Exception as e:
        print(f"Error in API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tbr', methods=['GET'])
def api_get_tbr():
    try:
        # Using prepared statements for complex join query
        books = get_tbr_list_prepared()
        return jsonify(books)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/authors', methods=['GET'])
def api_get_authors():
    try:
        # Using ORM for simple query
        authors = get_authors_orm()
        return jsonify(authors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/genres', methods=['GET'])
def api_get_genres():
    try:
        # Using ORM for simple query
        genres = get_genres_orm()
        return jsonify(genres)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/statuses', methods=['GET'])
def api_get_statuses():
    try:
        # Using ORM for simple query
        statuses = get_statuses_orm()
        return jsonify(statuses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rating', methods=['PUT'])
def api_update_rating():
    try:
        data = request.json
        # Using ORM for update
        success = update_rating_orm(data['tbr_id'], data['rating'])
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['PUT'])
def api_update_status():
    try:
        data = request.json
        # Using ORM for update
        success = update_status_orm(data['tbr_id'], data['status_id'])
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/clear_tbr', methods=['DELETE'])
def api_clear_tbr():
    try:
        # Using raw SQL since this is a batch operation
        with db.engine.connect() as connection:
            connection.execute(text("DELETE FROM TBRlist"))
            connection.execute(text("DELETE FROM Books"))
            connection.execute(text("DELETE FROM Authors"))
            connection.execute(text("DELETE FROM Genres"))
            connection.commit()
            
        return jsonify({"success": True, "message": "TBR list cleared successfully."})
    except Exception as e:
        print(f"Error clearing TBR list: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/book/<int:book_id>', methods=['DELETE'])
def api_delete_book(book_id):
    try:
        # Using prepared statements for complex delete
        success = delete_book_prepared(book_id)
        return jsonify({"success": success, "message": f"Book with ID {book_id} deleted successfully."})
    except Exception as e:
        print(f"Error deleting book: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/book/<int:book_id>', methods=['PUT'])
def api_update_book(book_id):
    try:
        data = request.json
        # Using prepared statements for complex update
        success = update_book_prepared(
            book_id=book_id,
            title=data['title'],
            author_name=data['author_name'],
            genre_name=data['genre'],
            category=data.get('category'),
            page_count=data.get('page_count'),
            publication_year=data.get('publication_year'),
            priority=data.get('priority')
        )
        
        return jsonify({"success": success, "message": f"Book with ID {book_id} updated successfully."})
    except Exception as e:
        print(f"Error updating book: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/settings', methods=['GET'])
def api_get_settings():
    try:
        # Using ORM for simple query
        settings = get_user_settings_orm()
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def api_update_settings():
    try:
        data = request.json
        # Using ORM for update
        success = update_user_settings_orm(data)
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export', methods=['GET'])
def api_export_data():
    try:
        # Get all book data using prepared statements (complex join)
        books = get_tbr_list_prepared()
        
        # Create a formatted text output
        formatted_output = "MY READING JOURNAL\n"
        formatted_output += "=================\n\n"
        formatted_output += f"Exported on: {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n\n"
        
        # Group books by status
        books_by_status = {}
        for book in books:
            status = book['status']
            if status not in books_by_status:
                books_by_status[status] = []
            books_by_status[status].append(book)
        
        # Format each status section
        for status, status_books in books_by_status.items():
            formatted_output += f"== {status.upper()} BOOKS ({len(status_books)}) ==\n\n"
            
            for book in status_books:
                formatted_output += f"Title: {book['title']}\n"
                formatted_output += f"Author: {book['author']}\n"
                formatted_output += f"Genre: {book['genre']}"
                if book['category']:
                    formatted_output += f" ({book['category']})"
                formatted_output += "\n"
                
                if book['page_count']:
                    formatted_output += f"Pages: {book['page_count']}\n"
                if book['publication_year']:
                    formatted_output += f"Published: {book['publication_year']}\n"
                if book['rating']:
                    formatted_output += f"Rating: {book['rating']}/5\n"
                
                formatted_output += f"Priority: {book['priority']}/10\n"
                formatted_output += f"Added: {book['date_added']}\n"
                
                if book['date_completed']:
                    formatted_output += f"Completed: {book['date_completed']}\n"
                
                formatted_output += "\n"
            
            formatted_output += "\n"
        
        return jsonify({
            "success": True, 
            "data": formatted_output,
            "filename": f"reading_journal_{datetime.datetime.now().strftime('%Y%m%d')}.txt"
        })
    except Exception as e:
        print(f"Error exporting data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/goal', methods=['POST'])
def api_create_goal():
    try:
        data = request.json
        print(f"Received goal data: {data}")
        
        # Using prepared statements for goal creation
        goal_id = create_reading_goal_prepared(
            goal_type=data.get('goal_type'),
            target_value=data.get('target_value'),
            target_book_id=data.get('target_book_id'),
            target_genre_id=data.get('target_genre_id'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date')
        )
        
        return jsonify({"success": True, "goal_id": goal_id})
    except Exception as e:
        print(f"Error creating reading goal: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/goals', methods=['GET'])
def api_get_goals():
    try:
        # Using prepared statements for complex goal query
        goals = get_reading_goals_prepared()
        return jsonify(goals)
    except Exception as e:
        print(f"Error retrieving reading goals: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/goal/<int:goal_id>', methods=['PUT'])
def api_update_goal_progress(goal_id):
    try:
        data = request.json
        
        # Using prepared statements for goal update
        success = update_goal_progress_prepared(
            goal_id=goal_id,
            progress=data.get('progress'),
            completed=data.get('completed')
        )
        
        return jsonify({"success": success})
    except Exception as e:
        print(f"Error updating goal progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/goal/<int:goal_id>', methods=['DELETE'])
def api_delete_goal(goal_id):
    try:
        # Using prepared statements for goal deletion
        success = delete_reading_goal_prepared(goal_id)
        return jsonify({"success": success, "message": f"Goal with ID {goal_id} deleted successfully."})
    except Exception as e:
        print(f"Error deleting goal: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def api_get_stats():
    try:
        conn = sqlite3.connect('tbrlist.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        stats = {}
        
        # Total books count
        cursor.execute("SELECT COUNT(*) as total FROM Books")
        stats['total_books'] = cursor.fetchone()[0]
        
        # Books by status
        cursor.execute("""
            SELECT rs.status, COUNT(*) as count 
            FROM TBRlist t
            JOIN [Reading Status] rs ON t.status_id = rs.status_id
            GROUP BY rs.status
        """)
        stats['books_by_status'] = {row['status']: row['count'] for row in cursor.fetchall()}
        
        # Books by genre
        cursor.execute("""
            SELECT g.genre, COUNT(*) as count 
            FROM Books b
            JOIN Genres g ON b.genre_id = g.genre_id
            GROUP BY g.genre
            ORDER BY count DESC
            LIMIT 5
        """)
        stats['top_genres'] = {row['genre']: row['count'] for row in cursor.fetchall()}
        
        # Average rating
        cursor.execute("""
            SELECT AVG(rating) as avg_rating 
            FROM Books 
            WHERE rating IS NOT NULL
        """)
        stats['average_rating'] = round(cursor.fetchone()[0] or 0, 1)
        
        # Reading progress
        cursor.execute("""
            SELECT COUNT(*) as completed_this_year
            FROM TBRlist
            WHERE date_completed LIKE ? AND status_id = 1
        """, (f"{datetime.datetime.now().year}%",))
        stats['completed_this_year'] = cursor.fetchone()[0]
        
        # Pages read (for books with page counts)
        cursor.execute("""
            SELECT SUM(b.page_count) as pages_read
            FROM TBRlist t
            JOIN Books b ON t.book_id = b.book_id
            WHERE t.status_id = 1 AND b.page_count IS NOT NULL
        """)
        stats['total_pages_read'] = cursor.fetchone()[0] or 0
        
        conn.close()
        return jsonify(stats)
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def api_search_books():
    try:
        query = request.args.get('q', '')
        if not query or len(query) < 2:
            return jsonify([])
            
        conn = sqlite3.connect('tbrlist.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        search_param = f"%{query}%"
        cursor.execute("""
            SELECT t.tbr_id, b.book_id, b.title, a.name as author, g.genre, rs.status
            FROM TBRlist t
            JOIN Books b ON t.book_id = b.book_id
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Genres g ON b.genre_id = g.genre_id
            JOIN [Reading Status] rs ON t.status_id = rs.status_id
            WHERE b.title LIKE ? OR a.name LIKE ? OR g.genre LIKE ?
            ORDER BY t.priority DESC
            LIMIT 10
        """, (search_param, search_param, search_param))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(results)
    except Exception as e:
        print(f"Error searching books: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/backup', methods=['GET'])
def api_backup_database():
    try:
        # Create a timestamp for the backup file
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"tbrlist_backup_{timestamp}.db"
        
        # Create a copy of the database file
        conn_source = sqlite3.connect('tbrlist.db')
        conn_dest = sqlite3.connect(backup_file)
        
        conn_source.backup(conn_dest)
        
        conn_source.close()
        conn_dest.close()
        
        # Return the backup filename to the client
        return jsonify({
            "success": True,
            "backup_file": backup_file,
            "message": f"Database backup created successfully: {backup_file}"
        })
    except Exception as e:
        print(f"Error creating database backup: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommendations', methods=['GET'])
def api_get_recommendations():
    try:
        conn = sqlite3.connect('tbrlist.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get the user's favorite genres (based on highest rated books)
        cursor.execute("""
            SELECT g.genre, AVG(b.rating) as avg_rating, COUNT(*) as count
            FROM Books b
            JOIN Genres g ON b.genre_id = g.genre_id
            WHERE b.rating IS NOT NULL AND b.rating > 3
            GROUP BY g.genre
            HAVING count > 1
            ORDER BY avg_rating DESC
            LIMIT 3
        """)
        favorite_genres = [row['genre'] for row in cursor.fetchall()]
        
        # Get the user's favorite authors (based on highest rated books)
        cursor.execute("""
            SELECT a.name, AVG(b.rating) as avg_rating, COUNT(*) as count
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            WHERE b.rating IS NOT NULL AND b.rating > 3
            GROUP BY a.name
            HAVING count > 1
            ORDER BY avg_rating DESC
            LIMIT 3
        """)
        favorite_authors = [row['name'] for row in cursor.fetchall()]
        
        # Get books in user's favorite genres that they haven't read yet
        genre_recommendations = []
        if favorite_genres:
            placeholders = ','.join(['?' for _ in favorite_genres])
            cursor.execute(f"""
                SELECT b.book_id, b.title, a.name as author, g.genre, 
                       t.priority, t.tbr_id
                FROM Books b
                JOIN Authors a ON b.author_id = a.author_id
                JOIN Genres g ON b.genre_id = g.genre_id
                JOIN TBRlist t ON b.book_id = t.book_id
                WHERE g.genre IN ({placeholders})
                AND t.status_id = 3  -- "To Read" status
                ORDER BY t.priority DESC
                LIMIT 5
            """, favorite_genres)
            genre_recommendations = [dict(row) for row in cursor.fetchall()]
        
        # Get books by user's favorite authors that they haven't read yet
        author_recommendations = []
        if favorite_authors:
            placeholders = ','.join(['?' for _ in favorite_authors])
            cursor.execute(f"""
                SELECT b.book_id, b.title, a.name as author, g.genre, 
                       t.priority, t.tbr_id
                FROM Books b
                JOIN Authors a ON b.author_id = a.author_id
                JOIN Genres g ON b.genre_id = g.genre_id
                JOIN TBRlist t ON b.book_id = t.book_id
                WHERE a.name IN ({placeholders})
                AND t.status_id = 3  -- "To Read" status
                ORDER BY t.priority DESC
                LIMIT 5
            """, favorite_authors)
            author_recommendations = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            "favorite_genres": favorite_genres,
            "favorite_authors": favorite_authors,
            "genre_recommendations": genre_recommendations,
            "author_recommendations": author_recommendations
        })
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ================ Database Initialization ================

def initialize_database():
    """Initialize the database with tables and default data if needed"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if default reading statuses exist
        status_count = ReadingStatus.query.count()
        if status_count == 0:
            # Add default reading statuses
            statuses = [
                ReadingStatus(status="Completed"),
                ReadingStatus(status="Currently Reading"),
                ReadingStatus(status="To Read"),
                ReadingStatus(status="Did Not Finish")
            ]
            db.session.add_all(statuses)
            db.session.commit()
            print("Default reading statuses added")
        
        # Check if user settings exist
        settings = UserSettings.query.first()
        if not settings:
            # Add default user settings
            default_settings = UserSettings()
            db.session.add(default_settings)
            db.session.commit()
            print("Default user settings added")

# ================ Main Application ================

if __name__ == '__main__':
    # Initialize the database
    initialize_database()
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5002)
    