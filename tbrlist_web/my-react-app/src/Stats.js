import React, { useState, useEffect } from 'react';

function Stats({ books }) {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byGenre: {},
    byCategory: { Fiction: 0, Nonfiction: 0 },
    completionRate: 0,
    averagePriority: 0,
    ratingStats: {
      averageRating: 0,
      ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      ratedBooksCount: 0
    },
    readingStats: {
      totalPages: 0,
      completedPages: 0,
      totalEstimatedHours: 0,
      completedEstimatedHours: 0,
      pagesByCategory: {},
      completedPagesByCategory: {},
      averagePagesPerBook: 0,
      averagePagesPerCompletedBook: 0
    }
  });

  useEffect(() => {
    if (!books.length) return;

    // Calculate stats
    const byStatus = {};
    const byGenre = {};
    const byCategory = { Fiction: 0, Nonfiction: 0 };
    let completed = 0;
    let totalPriority = 0;
    
    // Rating analysis variables
    let totalRating = 0;
    let ratedBooksCount = 0;
    const ratingDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

    // Reading hours analysis variables
    let totalPages = 0;
    let completedPages = 0;
    let completedBooksCount = 0;
    const pagesByStatus = {};
    const pagesByCategory = {};
    const completedPagesByCategory = {};
    const PAGES_PER_HOUR = 30; // Average reading speed (adjust as needed)

    // For debugging
    console.log("Book statuses:", books.map(book => ({ 
      title: book.title, 
      status: book.status, 
      pages: book.page_count 
    })));

    books.forEach(book => {
      // Count by status
      byStatus[book.status] = (byStatus[book.status] || 0) + 1;
      
      // Count by genre
      byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
      
      // Count by category (Fiction/Nonfiction)
      const category = book.category || 'Uncategorized';
      const normalizedCategory = category.toLowerCase();

      if (normalizedCategory === 'fiction') {
        byCategory['Fiction'] = (byCategory['Fiction'] || 0) + 1;
      } else if (normalizedCategory === 'nonfiction') {
        byCategory['Nonfiction'] = (byCategory['Nonfiction'] || 0) + 1;
      } else {
        byCategory['Uncategorized'] = (byCategory['Uncategorized'] || 0) + 1;
      }
      
      // Count completed books - checking for "Completed" status
      // This checks for both "Completed" and "Complete" to handle potential variations
      const isCompleted = 
        book.status === 'Completed' || 
        book.status === 'Complete' || 
        book.status === 'completed' || 
        book.status === 'complete';
      
      if (isCompleted) {
        completed++;
      }
      
      // Sum priorities
      totalPriority += book.priority || 0;
      
      // Rating analysis
      if (book.rating) {
        const rating = parseInt(book.rating);
        if (rating >= 1 && rating <= 5) {
          totalRating += rating;
          ratedBooksCount++;
          ratingDistribution[rating]++;
        }
      }

      // Reading hours analysis - use page_count from API or pages field
      const pageCount = (book.page_count ? parseInt(book.page_count) : 0) || (book.pages ? parseInt(book.pages) : 0);
      if (pageCount > 0) {
        totalPages += pageCount;
        
        // Track pages by status
        pagesByStatus[book.status] = (pagesByStatus[book.status] || 0) + pageCount;
        
        // Track pages by category
        if (normalizedCategory === 'fiction') {
          pagesByCategory['Fiction'] = (pagesByCategory['Fiction'] || 0) + pageCount;
        } else if (normalizedCategory === 'nonfiction') {
          pagesByCategory['Nonfiction'] = (pagesByCategory['Nonfiction'] || 0) + pageCount;
        } else {
          pagesByCategory['Uncategorized'] = (pagesByCategory['Uncategorized'] || 0) + pageCount;
        }
        
        // Track completed books pages separately
        if (isCompleted) {
          completedPages += pageCount;
          completedBooksCount++;
          
          // Track completed pages by category
          if (normalizedCategory === 'fiction') {
            completedPagesByCategory['Fiction'] = (completedPagesByCategory['Fiction'] || 0) + pageCount;
          } else if (normalizedCategory === 'nonfiction') {
            completedPagesByCategory['Nonfiction'] = (completedPagesByCategory['Nonfiction'] || 0) + pageCount;
          } else {
            completedPagesByCategory['Uncategorized'] = (completedPagesByCategory['Uncategorized'] || 0) + pageCount;
          }
        }
      }
    });

    // Calculate estimated hours (for all books and completed books)
    const totalEstimatedHours = Math.round((totalPages / PAGES_PER_HOUR) * 10) / 10;
    const completedEstimatedHours = Math.round((completedPages / PAGES_PER_HOUR) * 10) / 10;

    // Log completed book information for debugging
    console.log("Completed pages:", completedPages);
    console.log("Completed estimated hours:", completedEstimatedHours);

    setStats({
      total: books.length,
      byStatus,
      byGenre,
      byCategory,
      completionRate: books.length ? Math.round((completed / books.length) * 100) : 0,
      averagePriority: books.length ? Math.round((totalPriority / books.length) * 10) / 10 : 0,
      // Rating statistics
      ratingStats: {
        averageRating: ratedBooksCount ? Math.round((totalRating / ratedBooksCount) * 10) / 10 : 0,
        ratingDistribution,
        ratedBooksCount
      },
      // Reading hours statistics
      readingStats: {
        totalPages,
        completedPages,
        totalEstimatedHours,
        completedEstimatedHours,
        pagesByCategory,
        completedPagesByCategory,
        averagePagesPerBook: books.length ? Math.round(totalPages / books.length) : 0,
        averagePagesPerCompletedBook: completedBooksCount ? Math.round(completedPages / completedBooksCount) : 0
      }
    });
  }, [books]);

  // Helper function to render star ratings
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span 
        key={i} 
        className={`star ${i < rating ? 'filled' : 'empty'}`}
        style={{
          color: i < rating ? '#FFD700' : '#CCCCCC',
          fontSize: '18px',
          marginRight: '2px'
        }}
      >
        ★
      </span>
    ));
  };

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
      
      <div className="stats-grid">
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
        
        {/* Reading Hours Card - Modified to show completed books */}
        <div className="stat-card">
          <h3>Reading Time</h3>
          <div className="reading-time-summary">
            <div className="stat-number">{stats.readingStats.completedEstimatedHours}</div>
            <div className="stat-label">Hours Read</div>
            <div className="pages-info">
              <span className="total-pages">{stats.readingStats.completedPages} completed pages</span>
              {stats.readingStats.averagePagesPerCompletedBook > 0 && (
                <span className="avg-pages">
                  ({stats.readingStats.averagePagesPerCompletedBook} avg per completed book)
                </span>
              )}
            </div>
            <div className="books-info">
              <span className="completed-books">
                {Object.entries(stats.byStatus)
                  .filter(([status, _]) => 
                    status === 'Completed' || 
                    status === 'Complete' || 
                    status === 'completed' || 
                    status === 'complete')
                  .reduce((sum, [_, count]) => sum + count, 0)} books completed
              </span>
            </div>
          </div>
        </div>
        
        {/* Average Rating Card */}
        <div className="stat-card">
          <h3>Average Rating</h3>
          <div className="rating-summary">
            <div className="stat-number">{stats.ratingStats.averageRating}</div>
            <div className="stat-label">Average Rating</div>
            <div className="stars-display">
              {renderStars(Math.round(stats.ratingStats.averageRating))}
            </div>
            <div className="rated-books-info">
              {stats.ratingStats.ratedBooksCount} of {stats.total} books rated
              ({Math.round((stats.ratingStats.ratedBooksCount / stats.total) * 100)}%)
            </div>
          </div>
        </div>
        
        {/* Rating Distribution Card */}
        <div className="stat-card">
          <h3>Rating Distribution</h3>
          <div className="rating-distribution">
            {Object.entries(stats.ratingStats.ratingDistribution).map(([rating, count]) => (
              <div key={rating} className="rating-bar-container">
                <div className="rating-label">{rating} ★</div>
                <div className="rating-bar-wrapper">
                  <div 
                    className="rating-bar" 
                    style={{
                      width: stats.ratingStats.ratedBooksCount ? 
                        `${(count / stats.ratingStats.ratedBooksCount) * 100}%` : '0%',
                      backgroundColor: `hsl(${(rating * 25)}, 70%, 60%)`
                    }}
                  ></div>
                </div>
                <div className="rating-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Fiction vs. Nonfiction</h3>
          <div className="category1-chart">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="category1-item">
                <div className="category1-label">{category}</div>
                <div className="category1-bar-container">
                  <div 
                    className="category1-bar" 
                    style={{
                      width: `${(count / stats.total) * 100}%`,
                      backgroundColor: category === 'Fiction' ? '#FFB74D' : 
                                      category === 'Nonfiction' ? '#4DB6AC' : '#BDBDBD'
                    }}
                  ></div>
                </div>
                <div className="category1-count">{count}</div>
                <div className="category1-percentage">
                  {Math.round((count / stats.total) * 100)}%
                </div>
              </div>
            ))}
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
                      backgroundColor: status === 'Completed' || status === 'Complete' ? '#81C784' : 
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
                style={{right: `${(stats.averagePriority / 10) * 100}%`}}
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