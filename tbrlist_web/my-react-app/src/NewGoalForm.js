import React, { useState, useEffect } from 'react';
import './NewGoalForm.css'; // We'll create this CSS file

const NewGoalForm = ({ onSubmit, onCancel }) => {
  const [goalType, setGoalType] = useState('books');
  const [targetValue, setTargetValue] = useState('');
  const [targetBookId, setTargetBookId] = useState('');
  const [targetGenreId, setTargetGenreId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  );
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Fetch books and genres on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch books
        const booksResponse = await fetch('http://localhost:5001/api/tbr');
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        }
        
        // Fetch genres
        const genresResponse = await fetch('http://localhost:5001/api/genres');
        if (genresResponse.ok) {
          const genresData = await genresResponse.json();
          setGenres(genresData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  const validate = () => {
    const newErrors = {};
    
    if (goalType === 'books' || goalType === 'pages') {
      if (!targetValue || targetValue <= 0) {
        newErrors.targetValue = 'Please enter a valid number';
      }
    } else if (goalType === 'specific_book' && !targetBookId) {
      newErrors.targetBookId = 'Please select a book';
    } else if (goalType === 'genre' && !targetGenreId) {
      newErrors.targetGenreId = 'Please select a genre';
    }
    
    if (!startDate) {
      newErrors.startDate = 'Please select a start date';
    }
    
    if (!endDate) {
      newErrors.endDate = 'Please select an end date';
    } else if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const goalData = {
      goal_type: goalType,
      reminder_frequency: reminderFrequency,
      start_date: startDate,
      end_date: endDate
    };
    
    if (goalType === 'books' || goalType === 'pages') {
      goalData.target_value = parseInt(targetValue);
    } else if (goalType === 'specific_book') {
      goalData.target_book_id = parseInt(targetBookId);
    } else if (goalType === 'genre') {
      goalData.target_genre_id = parseInt(targetGenreId);
    }
    
    onSubmit(goalData);
  };
  
  return (
    <div className="new-goal-form">
      <h2>Create New Reading Goal</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="goalType">Goal Type</label>
            <select
              id="goalType"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="form-select"
            >
              <option value="books">Read a number of books</option>
              <option value="pages">Read a number of pages</option>
              <option value="specific_book">Read a specific book</option>
              <option value="genre">Focus on a genre</option>
            </select>
            <small className="form-helper">Select what type of reading goal you want to set</small>
          </div>
          
          <div className="form-group">
            {(goalType === 'books' || goalType === 'pages') && (
              <>
                <label htmlFor="targetValue">
                  {goalType === 'books' ? 'Number of Books' : 'Number of Pages'}
                </label>
                <input
                  id="targetValue"
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  min="1"
                  className={`form-input ${errors.targetValue ? 'error' : ''}`}
                />
                {errors.targetValue && (
                  <small className="error-message">{errors.targetValue}</small>
                )}
              </>
            )}
            
            {goalType === 'specific_book' && (
              <>
                <label htmlFor="targetBookId">Book</label>
                <select
                  id="targetBookId"
                  value={targetBookId}
                  onChange={(e) => setTargetBookId(e.target.value)}
                  className={`form-select ${errors.targetBookId ? 'error' : ''}`}
                >
                  <option value="">Select a book</option>
                  {books.map(book => (
                    <option key={book.book_id} value={book.book_id}>
                      {book.title} by {book.author}
                    </option>
                  ))}
                </select>
                {errors.targetBookId ? (
                  <small className="error-message">{errors.targetBookId}</small>
                ) : (
                  <small className="form-helper">Select the book you want to read</small>
                )}
              </>
            )}
            
            {goalType === 'genre' && (
              <>
                <label htmlFor="targetGenreId">Genre</label>
                <select
                  id="targetGenreId"
                  value={targetGenreId}
                  onChange={(e) => setTargetGenreId(e.target.value)}
                  className={`form-select ${errors.targetGenreId ? 'error' : ''}`}
                >
                  <option value="">Select a genre</option>
                  {genres.map(genre => (
                    <option key={genre.genre_id} value={genre.genre_id}>
                      {genre.genre}
                    </option>
                  ))}
                </select>
                {errors.targetGenreId ? (
                  <small className="error-message">{errors.targetGenreId}</small>
                ) : (
                  <small className="form-helper">Select the genre you want to focus on</small>
                )}
              </>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`form-input ${errors.startDate ? 'error' : ''}`}
            />
            {errors.startDate && (
              <small className="error-message">{errors.startDate}</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`form-input ${errors.endDate ? 'error' : ''}`}
            />
            {errors.endDate && (
              <small className="error-message">{errors.endDate}</small>
            )}
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="reminderFrequency">Reminder Frequency</label>
            <select
              id="reminderFrequency"
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value)}
              className="form-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="none">No Reminders</option>
            </select>
            <small className="form-helper">How often do you want to be reminded of your goal?</small>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
          >
            Create Goal
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewGoalForm;