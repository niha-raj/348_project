import React, { useState } from 'react';
import './GoalCard.css';

const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(goal.progress || 0);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getGoalTitle = () => {
    switch (goal.goal_type) {
      case 'book_count':
        return `Read ${goal.target_value} books`;
      case 'page_count':
        return `Read ${goal.target_value} pages`;
      case 'specific_book':
        return `Finish "${goal.book_title}"`;
      case 'genre_focus':
        return `Focus on ${goal.genre_name} books`;
      default:
        return 'Reading Goal';
    }
  };

  const handleSaveProgress = () => {
    onUpdate(goal.goal_id, { progress: parseInt(progress) });
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    onUpdate(goal.goal_id, { completed: !goal.completed });
  };

  const handleDelete = () => {
    if (showConfirmDelete) {
      onDelete(goal.goal_id);
    } else {
      setShowConfirmDelete(true);
      setTimeout(() => setShowConfirmDelete(false), 5000);
    }
  };

  const progressPercentage = goal.percentage || 0;

  const getStatusClass = () => {
    if (goal.completed) return 'success';
    if (goal.days_remaining < 0) return 'error';
    if (goal.days_remaining < 7 && progressPercentage < 80) return 'warning';
    return 'primary';
  };

  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
      <div className="goal-header">
        <h3 className="goal-title">{getGoalTitle()}</h3>
        <div className="goal-actions">
          <button className="action-button edit-button" onClick={() => setIsEditing(!isEditing)}>
            Edit
          </button>
          <button 
            className="action-button delete-button" 
            onClick={handleDelete}
          >
            {showConfirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="goal-dates">
        <span>From {formatDate(goal.start_date)} To {formatDate(goal.end_date)}</span>
      </div>

      <div className="goal-progress">
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${getStatusClass()}`} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {(goal.goal_type !== 'specific_book' && goal.goal_type !== 'genre_focus') && (
            <span>{goal.progress || 0} of {goal.target_value} • {progressPercentage}% complete</span>
          )}
          {(goal.goal_type === 'specific_book' || goal.goal_type === 'genre_focus') && (
            <span>{progressPercentage}% complete</span>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="edit-progress">
          <input
            type="number"
            min="0"
            max={goal.target_value}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
          />
          <button className="btn-small" onClick={handleSaveProgress}>
            Save
          </button>
        </div>
      )}
<div className="goal-footer">
  <div className="footer-status">
    <div className={goal.days_remaining >= 0 ? "days-remaining" : "days-overdue"}>
      {goal.days_remaining >= 0
        ? `${goal.days_remaining} days remaining`
        : `Overdue by ${Math.abs(goal.days_remaining)} days`}
    </div>
    <label className="checkbox-container">
      Completed
      <input
        type="checkbox"
        checked={goal.completed}
        onChange={handleToggleComplete}
      />
      <span className="checkmark"></span>
    </label>
  </div>
</div>
    </div>
  );
};

export default GoalCard;