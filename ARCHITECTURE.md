# Architecture Overview

## System Architecture

The Feedback Aggregator is built as a serverless application on Cloudflare's Developer Platform, leveraging multiple Cloudflare products to create a comprehensive feedback analysis solution.

```
┌─────────────────┐
│  User/Browser   │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │
    ┌────▼─────────────────────────────────────┐
    │     Cloudflare Pages (Dashboard)        │
    │     - Static HTML/JS/CSS                 │
    │     - Global CDN                        │
    └────┬────────────────────────────────────┘
         │
         │ API Calls
         │
    ┌────▼─────────────────────────────────────┐
    │     Cloudflare Workers (API)            │
    │     - REST API Endpoints                │
    │     - Request Routing                   │
    │     - Business Logic                    │
    └────┬────────────────────────────────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
    ┌────▼─────┐    ┌─────▼──────┐   ┌──────▼──────┐
    │ Cloudflare│    │ Cloudflare │   │ Cloudflare  │
    │    AI     │    │     D1     │   │   (Future)  │
    │           │    │            │   │     KV      │
    │ Sentiment │    │  Database  │   │   Cache     │
    │ Analysis  │    │            │   │             │
    └───────────┘    └────────────┘   └─────────────┘
```

## Component Details

### 1. Cloudflare Workers (Primary Backend)

**Purpose**: Serverless compute platform hosting the REST API

**Why Workers?**
- **Edge Computing**: Runs at Cloudflare's edge locations worldwide, ensuring low latency (< 50ms) for all users
- **Serverless**: No server management, automatic scaling, pay-per-request pricing
- **Integrated**: Native integration with other Cloudflare products (AI, D1, KV)
- **Fast Cold Starts**: Workers start in < 1ms, perfect for API endpoints

**Implementation**:
- Built with Hono framework for fast routing
- RESTful API with endpoints for feedback CRUD operations
- CORS enabled for cross-origin requests
- Error handling and validation

**Endpoints**:
- `GET /` - Health check
- `POST /api/feedback` - Submit and analyze feedback
- `GET /api/feedback` - Retrieve feedback with filters
- `GET /api/stats` - Aggregated statistics
- `GET /api/themes` - Theme analysis
- `POST /api/analyze` - Standalone analysis endpoint

### 2. Cloudflare AI (Sentiment Analysis)

**Purpose**: AI-powered sentiment analysis of feedback content

**Why Cloudflare AI?**
- **On-Edge Inference**: AI models run directly in Workers, no external API calls
- **Low Latency**: Analysis happens in < 100ms
- **Cost Effective**: No per-request costs to external AI services
- **Privacy**: Data never leaves Cloudflare's network
- **No API Keys**: Integrated directly, no external dependencies

**Model Used**: `@cf/huggingface/distilbert-sst-2-int8`
- Pre-trained sentiment analysis model
- Optimized for edge deployment (int8 quantization)
- Returns positive/negative classification with confidence scores

**Analysis Pipeline**:
1. Text input → AI model → Sentiment classification
2. Keyword analysis → Urgency detection
3. Theme extraction → Keyword matching against predefined categories
4. Value score calculation → Based on sentiment + urgency

### 3. Cloudflare D1 (Database)

**Purpose**: Persistent storage for feedback data

**Why D1?**
- **SQLite at the Edge**: Familiar SQL interface with edge-optimized queries
- **Integrated**: Native binding in Workers, no connection pooling needed
- **Simple Schema**: Perfect for structured feedback data
- **Cost Effective**: Generous free tier, pay for what you use
- **Fast Queries**: Indexed queries return in < 10ms

**Schema**:
```sql
feedback (
  id, source, content, author,
  sentiment, urgency, value_score, themes,
  timestamp, raw_data
)
```

**Indexes**: Optimized for common queries (source, sentiment, urgency, timestamp)

**Operations**:
- INSERT: Store new feedback with analysis results
- SELECT: Query with filters (source, sentiment, urgency)
- Aggregations: COUNT, AVG for statistics

### 4. Cloudflare Pages (Frontend)

**Purpose**: Host the dashboard UI

**Why Pages?**
- **Static Site Hosting**: Perfect for our HTML/JS/CSS dashboard
- **Global CDN**: Content delivered from edge locations worldwide
- **Free Tier**: Generous free tier for static sites
- **Easy Deployment**: Git integration or direct upload
- **Custom Domains**: Easy to add custom domain

**Implementation**:
- Vanilla JavaScript (no build step required)
- Responsive design with CSS Grid/Flexbox
- Real-time data fetching from Workers API
- Client-side filtering and rendering

## Data Flow

### Feedback Submission Flow

```
1. User submits feedback via API
   POST /api/feedback
   {
     "source": "github",
     "content": "API rate limiting is too strict"
   }

2. Worker receives request
   - Validates input
   - Calls analyzeFeedback()

3. AI Analysis
   - Cloudflare AI analyzes sentiment
   - Keyword matching for urgency
   - Theme extraction
   - Value score calculation

4. Database Storage
   - Insert into D1 database
   - Store all analysis results

5. Response
   - Return feedback ID and analysis
```

### Dashboard Data Flow

```
1. User opens dashboard
   - Enters Worker URL
   - Clicks "Load Dashboard"

2. Dashboard fetches data
   - GET /api/stats (statistics)
   - GET /api/feedback (feedback list)
   - GET /api/themes (theme analysis)

3. Worker queries D1
   - Aggregates statistics
   - Retrieves feedback with filters
   - Processes theme counts

4. Dashboard renders
   - Charts and visualizations
   - Filterable feedback list
   - Real-time updates
```

## Analysis Logic

### Sentiment Analysis
- **AI Model**: Uses Cloudflare AI's sentiment model
- **Classification**: Positive (>0.7), Negative (>0.7), Neutral (otherwise)
- **Fallback**: Keyword-based if AI fails

### Urgency Detection
- **Keyword Matching**: Predefined urgency keywords
- **Levels**: Critical, High, Medium, Low
- **Scoring**: Counts keyword matches, selects highest level

### Value Score
- **Calculation**: Based on sentiment + urgency
- **Range**: 1-10 (higher = more valuable to address)
- **Logic**:
  - Negative + Critical = 10
  - Negative + High = 8
  - Positive = 2
  - etc.

### Theme Extraction
- **Method**: Keyword matching against predefined categories
- **Categories**: API, UI/UX, Performance, Bugs, Security, etc.
- **Output**: Top 3 matching themes

## Scalability Considerations

### Current Architecture
- **Workers**: Auto-scales to handle traffic spikes
- **D1**: Handles thousands of queries per second
- **AI**: Processes requests in parallel
- **Pages**: CDN handles unlimited traffic

### Future Enhancements
- **KV Caching**: Cache frequently accessed stats
- **R2 Storage**: Store large attachments/files
- **Queues**: Batch process feedback for high-volume scenarios
- **Durable Objects**: Real-time collaboration features

## Security

- **CORS**: Configured for dashboard domain
- **Input Validation**: All inputs validated before processing
- **SQL Injection**: Parameterized queries prevent SQL injection
- **Error Handling**: Errors don't expose sensitive information
- **HTTPS**: All traffic encrypted (Cloudflare default)

## Cost Optimization

- **Workers**: Pay per request, free tier: 100,000 requests/day
- **AI**: Included in Workers, no additional cost
- **D1**: Free tier: 5GB storage, 5M reads/month
- **Pages**: Free tier: Unlimited requests, 500 builds/month

**Estimated Monthly Cost** (for typical usage):
- Small team (1000 feedback/month): $0 (within free tiers)
- Medium team (10,000 feedback/month): ~$5-10
- Large team (100,000 feedback/month): ~$50-100

## Deployment

### Workers Deployment
```bash
wrangler deploy
```

### D1 Database Setup
```bash
wrangler d1 create feedback-db
wrangler d1 execute feedback-db --file=./schema.sql
wrangler d1 execute feedback-db --file=./seed.sql
```

### Pages Deployment
- Via Cloudflare Dashboard
- Or via Wrangler: `wrangler pages deploy public`

## Monitoring

- **Workers Analytics**: Built-in analytics in Cloudflare Dashboard
- **D1 Metrics**: Query performance and usage metrics
- **Error Tracking**: Workers logs errors automatically
- **Custom Metrics**: Can add custom analytics endpoints

## Future Integrations

The architecture supports easy integration with:
- **GitHub**: Webhook → Worker → Analysis
- **Discord**: Bot → Worker → Analysis
- **Slack**: Webhook → Worker → Daily Reports
- **Email**: IMAP/POP3 → Worker → Analysis
- **Twitter**: API → Worker → Analysis

Each integration would follow the same pattern:
1. Receive data from source
2. Transform to feedback format
3. Submit to `/api/feedback`
4. Store and analyze automatically
