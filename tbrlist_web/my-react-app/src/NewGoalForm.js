import React, { useState, useEffect } from 'react';
import './NewGoalForm.css';

const NewGoalForm = ({ onSubmit, onCancel }) => {
  const [goalType, setGoalType] = useState('book_count'); // Set default value
  const [targetValue, setTargetValue] = useState('');
  const [targetBookId, setTargetBookId] = useState('');
  const [targetGenreId, setTargetGenreId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Set default dates on component mount
  useEffect(() => {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    setStartDate(formatDate(today));
    setEndDate(formatDate(oneMonthLater));
    
    // Fetch books and genres for dropdowns
    fetchBooks();
    fetchGenres();
  }, []);
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/tbr');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };
  
  const fetchGenres = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/genres');
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!goalType) {
      newErrors.goalType = 'Goal type is required';
    }
    
    if (goalType === 'book_count' || goalType === 'page_count') {
      if (!targetValue || isNaN(parseInt(targetValue))) {
        newErrors.targetValue = 'Please enter a valid number';
      }
    }
    
    if (goalType === 'specific_book' && !targetBookId) {
      newErrors.targetBookId = 'Please select a book';
    }
    
    if (goalType === 'genre_focus' && !targetGenreId) {
      newErrors.targetGenreId = 'Please select a genre';
    }
    
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    console.log('Current goalType:', goalType);
    
    // Create goal data object
    const goalData = {
      goal_type: goalType, // Make sure this is correctly named
      start_date: startDate,
      end_date: endDate
    };
    
    // Add conditional fields based on goal type
    if (goalType === 'book_count' || goalType === 'page_count') {
      goalData.target_value = parseInt(targetValue);
    }
    
    if (goalType === 'specific_book') {
      goalData.target_book_id = parseInt(targetBookId);
    }
    
    if (goalType === 'genre_focus') {
      goalData.target_genre_id = parseInt(targetGenreId);
    }
    
    console.log('Submitting goal data:', goalData);
    
    // Send data to parent component
    await onSubmit(goalData);
  };
  
  return (
    <div className="goal-form-container">
      <h3>Create New Reading Goal</h3>
      
      <form onSubmit={handleSubmit} className="goal-form">
        <div className="form-group">
          <label htmlFor="goalType">Goal Type:</label>
          <select 
            id="goalType"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className={errors.goalType ? 'error' : ''}
          >
            <option value="book_count">Number of Books to Read</option>
            <option value="page_count">Number of Pages to Read</option>
            <option value="specific_book">Finish a Specific Book</option>
            <option value="genre_focus">Read from a Specific Genre</option>
          </select>
          {errors.goalType && <div className="error-message">{errors.goalType}</div>}
        </div>
        
        {(goalType === 'book_count' || goalType === 'page_count') && (
          <div className="form-group">
            <label htmlFor="targetValue">
              Target {goalType === 'book_count' ? 'Books' : 'Pages'}:
            </label>
            <input
              type="number"
              id="targetValue"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              min="1"
              className={errors.targetValue ? 'error' : ''}
            />
            {errors.targetValue && <div className="error-message">{errors.targetValue}</div>}
          </div>
        )}
        
        {goalType === 'specific_book' && (
          <div className="form-group">
            <label htmlFor="targetBook">Book to Read:</label>
            <select
              id="targetBook"
              value={targetBookId}
              onChange={(e) => setTargetBookId(e.target.value)}
              className={errors.targetBookId ? 'error' : ''}
            >
              <option value="">Select a book</option>
              {books
                .filter(book => book.status === 'To Read')
                .map(book => (
                  <option key={book.book_id} value={book.book_id}>
                    {book.title} by {book.author}
                  </option>
                ))
              }
            </select>
            {errors.targetBookId && <div className="error-message">{errors.targetBookId}</div>}
          </div>
        )}
        
        {goalType === 'genre_focus' && (
          <div className="form-group">
            <label htmlFor="targetGenre">Genre to Focus On:</label>
            <select
              id="targetGenre"
              value={targetGenreId}
              onChange={(e) => setTargetGenreId(e.target.value)}
              className={errors.targetGenreId ? 'error' : ''}
            >
              <option value="">Select a genre</option>
              {genres.map(genre => (
                <option key={genre.genre_id} value={genre.genre_id}>
                  {genre.genre}
                </option>
              ))}
            </select>
            {errors.targetGenreId && <div className="error-message">{errors.targetGenreId}</div>}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && <div className="error-message">{errors.startDate}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={errors.endDate ? 'error' : ''}
          />
          {errors.endDate && <div className="error-message">{errors.endDate}</div>}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Goal
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewGoalForm;