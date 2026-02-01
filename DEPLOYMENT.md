# Deployment Guide

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`

### 2. Authentication

Login to Cloudflare:
```bash
wrangler login
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create D1 Database

```bash
npm run db:create
```

This will output something like:
```
✅ Successfully created DB 'feedback-db'!

Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copy the `database_id` and update it in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "your-actual-database-id-here"
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Seed Database (Optional)

To populate with mock data:
```bash
npm run db:seed
```

### 7. Deploy Worker

```bash
npm run deploy
```

After deployment, you'll get a URL like:
```
https://feedback-aggregator.your-subdomain.workers.dev
```

**Save this URL** - you'll need it for the dashboard!

### 8. Deploy Dashboard to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project"
3. Choose "Upload assets"
4. Upload the `public` folder
5. Click "Deploy site"

#### Option B: Via Wrangler CLI

```bash
wrangler pages deploy public --project-name=feedback-aggregator-dashboard
```

#### Option C: Via Git (Recommended for updates)

1. Push your code to GitHub/GitLab
2. In Cloudflare Dashboard → Pages → Create project
3. Connect your Git repository
4. Set:
   - Build command: (leave empty)
   - Build output directory: `public`
5. Deploy

### 9. Configure Dashboard

1. Open your deployed Pages URL
2. Enter your Worker URL in the configuration field
3. Click "Load Dashboard"

## Testing the API

### Test Health Check

```bash
curl https://your-worker.workers.dev/
```

### Submit Feedback

```bash
curl -X POST https://your-worker.workers.dev/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github",
    "content": "The API rate limiting is too strict. We keep hitting 429 errors in production.",
    "author": "dev_user_123"
  }'
```

### Get Statistics

```bash
curl https://your-worker.workers.dev/api/stats
```

### Get Feedback List

```bash
curl https://your-worker.workers.dev/api/feedback?limit=10
```

### Filter by Source

```bash
curl https://your-worker.workers.dev/api/feedback?source=github
```

### Filter by Sentiment

```bash
curl https://your-worker.workers.dev/api/feedback?sentiment=negative
```

## Local Development

### Run Worker Locally

```bash
npm run dev
```

The Worker will be available at `http://localhost:8787`

### Test with Local Database

For local development, you can use Wrangler's local D1:

```bash
wrangler d1 execute feedback-db --local --file=./schema.sql
wrangler d1 execute feedback-db --local --file=./seed.sql
```

Then run:
```bash
wrangler dev --local
```

## Troubleshooting

### Database Not Found

- Make sure you've created the database: `npm run db:create`
- Verify the `database_id` in `wrangler.toml` matches your database

### AI Binding Error

- Ensure your Cloudflare account has AI Workers enabled
- Check that `[ai]` binding is in `wrangler.toml`

### CORS Errors

- Make sure CORS is enabled in the Worker (already included)
- Verify the dashboard URL matches your Pages deployment

### Dashboard Not Loading Data

- Check that the Worker URL is correct
- Verify the Worker is deployed and accessible
- Check browser console for errors
- Ensure database has data (run `npm run db:seed`)

## Environment Variables

No environment variables are required for basic operation. All configuration is done via:
- `wrangler.toml` for Workers configuration
- Database bindings are configured in `wrangler.toml`

## Production Considerations

1. **Custom Domain**: Add a custom domain to your Worker and Pages
2. **Rate Limiting**: Consider adding rate limiting for production
3. **Authentication**: Add authentication for production use
4. **Monitoring**: Set up Cloudflare Analytics and alerts
5. **Backups**: D1 automatically backs up, but consider additional backups for critical data

## Cost Estimation

### Free Tier Limits
- **Workers**: 100,000 requests/day
- **D1**: 5GB storage, 5M reads/month
- **Pages**: Unlimited requests
- **AI**: Included in Workers

### Typical Usage
- Small team (1,000 feedback/month): **$0/month** (within free tier)
- Medium team (10,000 feedback/month): **~$5-10/month**
- Large team (100,000 feedback/month): **~$50-100/month**

## Next Steps

- Integrate with real platforms (GitHub, Discord, etc.)
- Set up scheduled reports
- Add user authentication
- Implement advanced analytics
- Add export functionality
