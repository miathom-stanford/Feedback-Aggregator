# Feedback Aggregator

A product feedback aggregation and analysis tool built on Cloudflare's Developer Platform. This tool helps product managers aggregate feedback from multiple sources (GitHub, Discord, Email, Twitter, etc.) and extract meaningful insights including themes, urgency, value, and sentiment.

## Architecture Overview

This solution leverages multiple Cloudflare Developer Platform products to create a comprehensive feedback analysis system:

### Cloudflare Products Used

1. **Cloudflare Workers** (Primary Platform)
   - Hosts the REST API backend
   - Handles feedback ingestion, analysis, and retrieval
   - Provides serverless compute at the edge for low latency

2. **Cloudflare AI** (AI Analysis)
   - Uses `@cf/huggingface/distilbert-sst-2-int8` model for sentiment analysis
   - Automatically analyzes incoming feedback to determine sentiment
   - Enables real-time AI-powered insights without external API dependencies

3. **Cloudflare D1** (Database)
   - SQLite database for storing all feedback data
   - Enables persistent storage with edge-optimized queries
   - Stores feedback metadata, analysis results, and raw data

4. **Cloudflare Pages** (Frontend Hosting)
   - Hosts the dashboard UI as a static site
   - Provides fast global CDN delivery for the dashboard
   - Enables easy deployment and updates

## Features

- **Multi-Source Aggregation**: Collect feedback from GitHub, Discord, Email, Twitter, and more
- **AI-Powered Analysis**: Automatic sentiment analysis using Cloudflare AI
- **Smart Categorization**: Extracts themes, urgency levels, and value scores
- **Interactive Dashboard**: Visual analytics with charts and filters
- **Real-time Insights**: Get immediate analysis when feedback is submitted

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a D1 database:
```bash
npm run db:create
```

3. Update `wrangler.toml` with your database ID (from step 2)

4. Run database migrations:
```bash
npm run db:migrate
```

5. Seed the database with mock data:
```bash
npm run db:seed
```

6. Deploy the Worker:
```bash
npm run deploy
```

7. Deploy the dashboard to Cloudflare Pages:
   - Go to Cloudflare Dashboard > Pages
   - Create a new project
   - Connect your repository or upload the `public` folder
   - Set build command: (none, static site)
   - Set output directory: `public`

### Development

Run locally:
```bash
npm run dev
```

The Worker will be available at `http://localhost:8787`

## API Endpoints

- `GET /` - Health check and API information
- `POST /api/feedback` - Submit new feedback
- `POST /api/analyze` - Analyze feedback content
- `GET /api/feedback` - Get all feedback (supports filters: ?source=, ?sentiment=, ?urgency=)
- `GET /api/stats` - Get aggregated statistics
- `GET /api/themes` - Get top themes

## Example Usage

### Submit Feedback

```bash
curl -X POST https://your-worker.workers.dev/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "content": "The API rate limiting is too strict. We keep hitting 429 errors.",
    "author": "dev_user_123"
  }'
```

### Get Statistics

```bash
curl https://your-worker.workers.dev/api/stats
```

## Dashboard

The dashboard provides:
- Real-time statistics (total feedback, average value score)
- Visual charts for sentiment, urgency, and source distribution
- Filterable feedback list with themes and badges
- Responsive design for mobile and desktop

To use the dashboard:
1. Deploy it to Cloudflare Pages
2. Enter your Worker URL in the configuration section
3. Click "Load Dashboard" to view analytics

## License

MIT
