import React from 'react';
import './GoalSummary.css';

const GoalSummary = ({ goals }) => {
  // Calculate summary statistics
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter(goal => goal.completed).length || 0;
  const overdueGoals = goals?.filter(goal => !goal.completed && new Date(goal.dueDate) < new Date()).length || 0;
  const inProgressGoals = totalGoals - completedGoals - overdueGoals;
  
  // Calculate overall completion percentage
  const completionPercentage = totalGoals > 0 
    ? Math.round((completedGoals / totalGoals) * 100) 
    : 0;

  return (
    <div className="goal-summary">
      <h2>Reading Goals Summary</h2>
      
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-value">{totalGoals}</div>
          <div className="stat-label">Total Goals</div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-value">{completedGoals}</div>
          <div className="stat-label">Completed</div>
        </div>
        
        <div className="stat-card in-progress">
          <div className="stat-value">{inProgressGoals}</div>
          <div className="stat-label">In Progress</div>
        </div>
        
        <div className="stat-card overdue">
          <div className="stat-value">{overdueGoals}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>
      
      <div className="overall-progress">
        <div className="progress-header">
          <span>Overall Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GoalSummary;