import React, { useState, useEffect } from 'react';

function Stats({ books }) {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byGenre: {},
    completionRate: 0,
    averagePriority: 0
  });

  useEffect(() => {
    if (!books.length) return;

    // Calculate stats
    const byStatus = {};
    const byGenre = {};
    let completed = 0;
    let totalPriority = 0;

    books.forEach(book => {
      // Count by status
      byStatus[book.status] = (byStatus[book.status] || 0) + 1;
      
      // Count by genre
      byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
      
      // Count completed books
      if (book.status === 'Complete') {
        completed++;
      }
      
      // Sum priorities
      totalPriority += book.priority || 0;
    });

    setStats({
      total: books.length,
      byStatus,
      byGenre,
      completionRate: Math.round((completed / books.length) * 100),
      averagePriority: Math.round((totalPriority / books.length) * 10) / 10
    });
  }, [books]);

  if (!books.length) {
    return (
      <div className="stats-empty">
        <h2>Reading Statistics</h2>
        <p>Add books to your reading list to see statistics here.</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h2>Reading Statistics</h2>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Overview</h3>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Books</div>
          <div className="stat-info">
            <div className="completion-bar">
              <div 
                className="completion-progress" 
                style={{width: `${stats.completionRate}%`}}
              ></div>
            </div>
            <div className="completion-text">{stats.completionRate}% Complete</div>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Status Breakdown</h3>
          <div className="status-chart">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="status-item">
                <div className="status-label">{status}</div>
                <div className="status-bar-container">
                  <div 
                    className="status-bar" 
                    style={{
                      width: `${(count / stats.total) * 100}%`,
                      backgroundColor: status === 'Complete' ? '#81C784' : 
                                     status === 'In Progress' ? '#64B5F6' : '#BDBDBD'
                    }}
                  ></div>
                </div>
                <div className="status-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Genres</h3>
          <div className="genres-list">
            {Object.entries(stats.byGenre)
              .sort((a, b) => b[1] - a[1])
              .map(([genre, count]) => (
                <div key={genre} className="genre-item">
                  <div className="genre-name">{genre}</div>
                  <div className="genre-count">{count}</div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Reading Priority</h3>
          <div className="priority-stat">
            <div className="stat-number">{stats.averagePriority}</div>
            <div className="stat-label">Average Priority</div>
          </div>
          <div className="priority-scale">
            <div className="scale-label">Low</div>
            <div className="scale-bar">
              <div 
                className="scale-indicator" 
                style={{left: `${(stats.averagePriority / 10) * 100}%`}}
              ></div>
            </div>
            <div className="scale-label">High</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;