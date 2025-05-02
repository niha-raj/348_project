import React, { useState, useEffect, useCallback } from 'react';
import NewGoalForm from './NewGoalForm';
import GoalCard from './GoalCard';
import GoalSummary from './GoalSummary';
import './ReadingGoals.css';

const ReadingGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [reminders, setReminders] = useState([]);
  
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    // Auto hide notification after 6 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 6000);
  }, []);
  
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        console.error('Failed to fetch goals');
        showNotification('Failed to fetch goals', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error loading goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);
  
  const checkReminders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/goals/reminders');
      if (response.ok) {
        const data = await response.json();
        if (data.reminders_count > 0) {
          setReminders(data.reminders);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }, []);
  
  // Fetch goals on component mount with proper dependencies
  useEffect(() => {
    fetchGoals();
    checkReminders();
  }, [fetchGoals, checkReminders]);
  
  const handleCreateGoal = async (goalData) => {
    try {
      const response = await fetch('http://localhost:5001/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });
      
      if (response.ok) {
        showNotification('Goal created successfully!', 'success');
        setShowNewGoalForm(false);
        fetchGoals();
      } else {
        showNotification('Failed to create goal', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error creating goal', 'error');
    }
  };
  
  const handleUpdateGoal = async (goalId, updates) => {
    try {
      const response = await fetch(`http://localhost:5001/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        showNotification('Goal updated successfully!', 'success');
        fetchGoals();
      } else {
        showNotification('Failed to update goal', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error updating goal', 'error');
    }
  };
  
  const handleDeleteGoal = async (goalId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification('Goal deleted successfully!', 'success');
        fetchGoals(); 
      } else {
        showNotification('Failed to delete goal', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error deleting goal', 'error');
    }
  };
  
  return (
    <div className="reading-goals">
      <div className="goals-header">
        <h2>Reading Goals</h2>
        <button 
          className={showNewGoalForm ? "btn-outline" : "btn-primary"}
          onClick={() => setShowNewGoalForm(!showNewGoalForm)}
        >
          {showNewGoalForm ? 'Cancel' : 'Create New Goal'}
        </button>
      </div>
      
      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="reminders-container">
          <h3>Reminders</h3>
          <div className="reminders-list">
            {reminders.map(reminder => (
              <div className="reminder" key={reminder.goal_id}>
                {reminder.goal_type === 'books' && 
                  `Remember your goal to read ${reminder.target_value} books by ${reminder.end_date}. ` +
                  `Current progress: ${reminder.progress} books (${
                    Math.round((reminder.progress / reminder.target_value) * 100)
                  }%).`
                }
                {reminder.goal_type === 'pages' && 
                  `Remember your goal to read ${reminder.target_value} pages by ${reminder.end_date}. ` +
                  `Current progress: ${reminder.progress} pages (${
                    Math.round((reminder.progress / reminder.target_value) * 100)
                  }%).`
                }
                {reminder.goal_type === 'specific_book' && 
                  `Remember your goal to read "${reminder.book_title}" by ${reminder.end_date}.`
                }
                {reminder.goal_type === 'genre' && 
                  `Remember your goal to focus on the "${reminder.genre_name}" genre by ${reminder.end_date}.`
                }
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Goal Summary */}
      {goals.length > 0 && (
        <GoalSummary goals={goals} />
      )}
      
      {/* New Goal Form */}
      {showNewGoalForm && (
        <div className="new-goal-container">
          <NewGoalForm 
            onSubmit={handleCreateGoal}
            onCancel={() => setShowNewGoalForm(false)}
          />
        </div>
      )}
      
      {/* Goals List */}
      {loading ? (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <span>Loading goals...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <h3>You don't have any reading goals yet. Create one to get started!</h3>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(goal => (
            <GoalCard 
              key={goal.goal_id}
              goal={goal} 
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}
      
      {/* Notifications */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ReadingGoals;