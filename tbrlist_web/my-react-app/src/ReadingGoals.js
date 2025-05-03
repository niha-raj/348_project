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
      const response = await fetch('http://localhost:5002/api/goals');
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
  
  // Fetch goals on component mount with proper dependencies
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);
  
  const handleCreateGoal = async (goalData) => {
    try {
      // Log the incoming data
      console.log('Received goal data:', goalData);
      
      // Make sure all required fields are present
      if (!goalData.goal_type || goalData.goal_type.trim() === '') {
        console.error('Missing or empty goal_type:', goalData.goal_type);
        showNotification('Goal type is required', 'error');
        return;
      }
      
      console.log('Sending validated goal data to API:', goalData);
      
      const response = await fetch('http://localhost:5002/api/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Goal created successfully:', result);
        showNotification('Goal created successfully!', 'success');
        setShowNewGoalForm(false);
        fetchGoals();
      } else {
        let errorMessage = 'Failed to create goal';
        try {
          const errorData = await response.json();
          errorMessage = `Failed to create goal: ${errorData.error || 'Unknown error'}`;
          console.error('Server error:', errorData);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error creating goal', 'error');
    }
  };
  
  const handleUpdateGoal = async (goalId, updates) => {
    try {
      console.log(`Updating goal ${goalId} with:`, updates);
      
      const response = await fetch(`http://localhost:5002/api/goal/${goalId}`, {
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
        let errorMessage = 'Failed to update goal';
        try {
          const errorData = await response.json();
          errorMessage = `Failed to update goal: ${errorData.error || 'Unknown error'}`;
          console.error('Server error:', errorData);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error updating goal', 'error');
    }
  };
  
  const handleDeleteGoal = async (goalId) => {
    try {
      console.log(`Deleting goal ${goalId}`);
      
      const response = await fetch(`http://localhost:5002/api/goal/${goalId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification('Goal deleted successfully!', 'success');
        fetchGoals(); 
      } else {
        let errorMessage = 'Failed to delete goal';
        try {
          const errorData = await response.json();
          errorMessage = `Failed to delete goal: ${errorData.error || 'Unknown error'}`;
          console.error('Server error:', errorData);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        showNotification(errorMessage, 'error');
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