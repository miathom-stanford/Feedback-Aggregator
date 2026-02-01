import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  AI: any;
  DB: D1Database;
}

interface Feedback {
  id?: number;
  source: string;
  content: string;
  author?: string;
  timestamp?: string;
  sentiment?: string;
  urgency?: string;
  value_score?: number;
  themes?: string;
  raw_data?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('/*', cors());

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Feedback Aggregator API',
    version: '1.0.0',
    endpoints: {
      feedback: '/api/feedback',
      analyze: '/api/analyze',
      stats: '/api/stats',
      themes: '/api/themes'
    }
  });
});

// Submit new feedback
app.post('/api/feedback', async (c) => {
  try {
    const body: Feedback = await c.req.json();
    
    if (!body.source || !body.content) {
      return c.json({ error: 'Source and content are required' }, 400);
    }

    // Analyze the feedback using AI
    const analysis = await analyzeFeedback(c.env.AI, body.content);
    
    // Insert into database
    const result = await c.env.DB.prepare(
      `INSERT INTO feedback (source, content, author, sentiment, urgency, value_score, themes, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.source,
      body.content,
      body.author || null,
      analysis.sentiment,
      analysis.urgency,
      analysis.value_score,
      analysis.themes.join(', '),
      body.raw_data ? JSON.stringify(body.raw_data) : null
    ).run();

    return c.json({
      success: true,
      id: result.meta.last_row_id,
      analysis
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Analyze feedback using AI
app.post('/api/analyze', async (c) => {
  try {
    const { content } = await c.req.json();
    
    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const analysis = await analyzeFeedback(c.env.AI, content);
    
    return c.json(analysis);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get all feedback with optional filters
app.get('/api/feedback', async (c) => {
  try {
    const source = c.req.query('source');
    const sentiment = c.req.query('sentiment');
    const urgency = c.req.query('urgency');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = 'SELECT * FROM feedback WHERE 1=1';
    const params: any[] = [];

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    if (sentiment) {
      query += ' AND sentiment = ?';
      params.push(sentiment);
    }
    if (urgency) {
      query += ' AND urgency = ?';
      params.push(urgency);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      feedback: result.results,
      total: result.results.length,
      limit,
      offset
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get statistics
app.get('/api/stats', async (c) => {
  try {
    // Get sentiment distribution
    const sentimentStats = await c.env.DB.prepare(
      'SELECT sentiment, COUNT(*) as count FROM feedback GROUP BY sentiment'
    ).all();

    // Get urgency distribution
    const urgencyStats = await c.env.DB.prepare(
      'SELECT urgency, COUNT(*) as count FROM feedback GROUP BY urgency'
    ).all();

    // Get source distribution
    const sourceStats = await c.env.DB.prepare(
      'SELECT source, COUNT(*) as count FROM feedback GROUP BY source'
    ).all();

    // Get average value score
    const avgValue = await c.env.DB.prepare(
      'SELECT AVG(value_score) as avg FROM feedback WHERE value_score IS NOT NULL'
    ).first();

    // Get total count
    const totalCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM feedback'
    ).first();

    return c.json({
      total: (totalCount as any)?.count || 0,
      average_value_score: (avgValue as any)?.avg || 0,
      sentiment: sentimentStats.results,
      urgency: urgencyStats.results,
      sources: sourceStats.results
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get theme analysis
app.get('/api/themes', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    // Get all themes and count occurrences
    const allFeedback = await c.env.DB.prepare(
      'SELECT themes FROM feedback WHERE themes IS NOT NULL'
    ).all();

    const themeCounts: Record<string, number> = {};
    
    (allFeedback.results as any[]).forEach((item: any) => {
      if (item.themes) {
        const themes = item.themes.split(',').map((t: string) => t.trim());
        themes.forEach((theme: string) => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    // Sort by count and return top themes
    const topThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([theme, count]) => ({ theme, count }));

    return c.json({ themes: topThemes });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// AI-powered feedback analysis
async function analyzeFeedback(ai: any, content: string) {
  try {
    // Use Cloudflare AI to analyze sentiment
    const sentimentResponse = await ai.run('@cf/huggingface/distilbert-sst-2-int8', {
      text: content
    });

    // Determine sentiment
    let sentiment = 'neutral';
    if (sentimentResponse && Array.isArray(sentimentResponse) && sentimentResponse.length > 0) {
      const result = sentimentResponse[0];
      if (result.label === 'POSITIVE' && result.score > 0.7) {
        sentiment = 'positive';
      } else if (result.label === 'NEGATIVE' && result.score > 0.7) {
        sentiment = 'negative';
      }
    }

    // Analyze urgency based on keywords
    const urgencyKeywords = {
      critical: ['critical', 'urgent', 'immediately', 'asap', 'emergency', 'vulnerability', 'security', 'crash', 'down'],
      high: ['important', 'soon', 'priority', 'fix', 'broken', 'error', 'bug', 'issue'],
      medium: ['could', 'should', 'would', 'suggestion', 'improve', 'better'],
      low: ['nice to have', 'feature', 'enhancement', 'optional']
    };

    const lowerContent = content.toLowerCase();
    let urgency = 'low';
    let urgencyScore = 0;

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      const matches = keywords.filter(kw => lowerContent.includes(kw)).length;
      if (matches > urgencyScore) {
        urgencyScore = matches;
        urgency = level;
      }
    }

    // Calculate value score (1-10, lower is better/more valuable)
    // Based on sentiment (negative = higher value to fix) and urgency
    let value_score = 5; // default
    if (sentiment === 'negative' && urgency === 'critical') {
      value_score = 10;
    } else if (sentiment === 'negative' && urgency === 'high') {
      value_score = 8;
    } else if (sentiment === 'negative' && urgency === 'medium') {
      value_score = 6;
    } else if (sentiment === 'positive') {
      value_score = 2;
    } else if (urgency === 'high') {
      value_score = 7;
    } else if (urgency === 'medium') {
      value_score = 5;
    } else {
      value_score = 3;
    }

    // Extract themes using keyword matching
    const themeKeywords: Record<string, string[]> = {
      'API': ['api', 'endpoint', 'rate limit', 'request'],
      'UI/UX': ['ui', 'ux', 'interface', 'design', 'dashboard', 'theme', 'dark mode'],
      'Performance': ['slow', 'fast', 'performance', 'speed', 'latency'],
      'Bugs': ['bug', 'crash', 'error', 'broken', 'issue', 'problem'],
      'Security': ['security', 'vulnerability', 'auth', 'authentication', 'secure'],
      'Documentation': ['docs', 'documentation', 'guide', 'tutorial'],
      'Feature Request': ['feature', 'request', 'add', 'support', 'webhook'],
      'Mobile': ['mobile', 'app', 'ios', 'android'],
      'Integrations': ['integration', 'webhook', 'api', 'connect'],
      'Onboarding': ['onboarding', 'getting started', 'new user']
    };

    const themes: string[] = [];
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        themes.push(theme);
      }
    }

    // If no themes found, add a generic one
    if (themes.length === 0) {
      themes.push('General');
    }

    return {
      sentiment,
      urgency,
      value_score,
      themes: themes.slice(0, 3) // Limit to top 3 themes
    };
  } catch (error) {
    // Fallback analysis if AI fails
    console.error('AI analysis error:', error);
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      value_score: 5,
      themes: ['General']
    };
  }
}

export default app;
