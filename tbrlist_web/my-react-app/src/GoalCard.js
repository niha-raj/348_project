import React, { useState } from 'react';
import './GoalCard.css';

const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(goal.progress || 0);
  
  const getGoalTitle = () => {
    switch (goal.goal_type) {
      case 'books':
        return `Read ${goal.target_value} Books`;
      case 'pages':
        return `Read ${goal.target_value} Pages`;
      case 'specific_book':
        return `Read "${goal.book_title}"`;
      case 'genre':
        return `Read ${goal.genre_name} Books`;
      default:
        return 'Reading Goal';
    }
  };
  
  const getProgressPercentage = () => {
    if (goal.goal_type === 'specific_book') {
      return goal.completed ? 100 : 0;
    }
    
    if (!goal.target_value || goal.target_value === 0) return 0;
    const percentage = (progress / goal.target_value) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };
  
  const handleProgressChange = (e) => {
    setProgress(parseInt(e.target.value) || 0);
  };
  
  const handleProgressSubmit = () => {
    onUpdate(goal.goal_id, { progress });
    setIsEditing(false);
  };
  
  const handleCompleteGoal = () => {
    onUpdate(goal.goal_id, { completed: true });
  };
  
  const handleDeleteGoal = () => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      onDelete(goal.goal_id);
    }
  };
  
  const getDateRange = () => {
    const startDate = new Date(goal.start_date).toLocaleDateString();
    const endDate = new Date(goal.end_date).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };
  
  const isCompleted = goal.completed || getProgressPercentage() >= 100;
  const isOverdue = !isCompleted && new Date(goal.end_date) < new Date();
  
  return (
    <div className={`goal-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="goal-card-header">
        <h3>{getGoalTitle()}</h3>
        <div className="goal-actions">
          <button className="action-btn edit" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Update'}
          </button>
          <button className="action-btn delete" onClick={handleDeleteGoal}>
            Delete
          </button>
        </div>
      </div>
      
      <div className="goal-dates">
        <span className="date-range">{getDateRange()}</span>
        {isOverdue && <span className="overdue-label">Overdue</span>}
        {isCompleted && <span className="completed-label">Completed</span>}
      </div>
      
      <div className="goal-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {goal.goal_type === 'specific_book' ? 
            (isCompleted ? 'Finished' : 'Not completed') : 
            `${progress} / ${goal.target_value} ${goal.goal_type === 'books' ? 'books' : 'pages'} (${Math.round(getProgressPercentage())}%)`
          }
        </span>
      </div>
      
      {isEditing ? (
        <div className="update-progress">
          <label>Update Progress:</label>
          <div className="update-controls">
            <input 
              type="number" 
              value={progress} 
              onChange={handleProgressChange}
              min="0"
              max={goal.target_value}
            />
            <button 
              className="btn-primary"
              onClick={handleProgressSubmit}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        !isCompleted && goal.goal_type === 'specific_book' && (
          <button 
            className="btn-complete"
            onClick={handleCompleteGoal}
          >
            Mark as Completed
          </button>
        )
      )}
      
      {goal.reminder_frequency !== 'none' && (
        <div className="reminder-info">
          <span>Reminders: {goal.reminder_frequency}</span>
        </div>
      )}
    </div>
  );
};

export default GoalCard;