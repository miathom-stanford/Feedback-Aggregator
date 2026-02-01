-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  sentiment TEXT,
  urgency TEXT,
  value_score INTEGER,
  themes TEXT,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_urgency ON feedback(urgency);
