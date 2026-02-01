# Cloudflare Products Documentation Links

This project uses the following Cloudflare products. Below are direct links to their official documentation.

## 1. Cloudflare Workers

**Purpose**: Serverless edge computing platform hosting the REST API backend

**Documentation**:
- **Main Docs**: https://developers.cloudflare.com/workers/
- **Getting Started**: https://developers.cloudflare.com/workers/get-started/
- **Runtime APIs**: https://developers.cloudflare.com/workers/runtime-apis/
- **Configuration (wrangler.toml)**: https://developers.cloudflare.com/workers/configuration/
- **Local Development**: https://developers.cloudflare.com/workers/configuration/local-development/
- **Deployment**: https://developers.cloudflare.com/workers/configuration/deployments/

**Key Features Used**:
- Edge computing at 300+ locations worldwide
- Serverless execution with < 1ms cold starts
- Native integration with D1, AI, and other Cloudflare products

---

## 2. Cloudflare AI

**Purpose**: On-edge AI inference for sentiment analysis

**Documentation**:
- **Main Docs**: https://developers.cloudflare.com/workers-ai/
- **Getting Started**: https://developers.cloudflare.com/workers-ai/get-started/
- **Models**: https://developers.cloudflare.com/workers-ai/models/
- **Sentiment Analysis Model**: https://developers.cloudflare.com/workers-ai/models/text-classification/
- **API Reference**: https://developers.cloudflare.com/workers-ai/api/

**Model Used**:
- `@cf/huggingface/distilbert-sst-2-int8` - Sentiment analysis model
- Documentation: https://developers.cloudflare.com/workers-ai/models/text-classification/

**Key Features Used**:
- On-edge AI inference (no external API calls)
- Low latency (< 100ms)
- No API keys required
- Integrated directly with Workers

---

## 3. Cloudflare D1

**Purpose**: SQLite database at the edge for persistent storage

**Documentation**:
- **Main Docs**: https://developers.cloudflare.com/d1/
- **Getting Started**: https://developers.cloudflare.com/d1/get-started/
- **Local Development**: https://developers.cloudflare.com/d1/local-development/
- **SQL Reference**: https://developers.cloudflare.com/d1/reference/
- **Wrangler Commands**: https://developers.cloudflare.com/d1/commands/
- **Best Practices**: https://developers.cloudflare.com/d1/best-practices/

**Key Features Used**:
- SQLite database with SQL interface
- Edge-optimized queries
- Integrated with Workers via bindings
- Local and remote database support

**Commands Used**:
- `wrangler d1 create` - Create database
- `wrangler d1 execute` - Run SQL migrations
- `wrangler d1 list` - List databases

---

## 4. Cloudflare Pages

**Purpose**: Static site hosting for the dashboard UI

**Documentation**:
- **Main Docs**: https://developers.cloudflare.com/pages/
- **Getting Started**: https://developers.cloudflare.com/pages/get-started/
- **Deployment**: https://developers.cloudflare.com/pages/platform/deploy/
- **Custom Domains**: https://developers.cloudflare.com/pages/platform/custom-domains/
- **Build Configuration**: https://developers.cloudflare.com/pages/platform/build-configuration/
- **Wrangler CLI**: https://developers.cloudflare.com/pages/platform/wrangler/

**Key Features Used**:
- Global CDN delivery
- Free tier for static sites
- Easy deployment via CLI or dashboard
- Automatic HTTPS

**Deployment Methods**:
- Via Cloudflare Dashboard
- Via Wrangler CLI: `wrangler pages deploy public`
- Via Git integration

---

## Additional Resources

### Wrangler CLI
- **Main Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Installation**: https://developers.cloudflare.com/workers/wrangler/install-and-update/
- **Commands Reference**: https://developers.cloudflare.com/workers/wrangler/commands/

### Cloudflare Developer Platform
- **Platform Overview**: https://developers.cloudflare.com/
- **Pricing**: https://developers.cloudflare.com/workers/platform/pricing/
- **Limits**: https://developers.cloudflare.com/workers/platform/limits/

### Community & Support
- **Discord**: https://discord.cloudflare.com
- **Community Forum**: https://community.cloudflare.com/
- **GitHub**: https://github.com/cloudflare/workers-examples

---

## Product Integration

### How They Work Together

1. **Workers** serves as the primary platform, hosting the API
2. **D1** provides persistent storage via database bindings
3. **AI** enables real-time sentiment analysis via AI bindings
4. **Pages** hosts the static dashboard that calls the Worker API

All products are integrated through Cloudflare's binding system, allowing seamless communication between services.

### Binding Configuration

Bindings are configured in `wrangler.toml`:
```toml
[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "your-database-id"
```

See: https://developers.cloudflare.com/workers/configuration/bindings/

---

## Quick Reference

| Product | Purpose | Documentation |
|---------|---------|---------------|
| **Workers** | API Backend | https://developers.cloudflare.com/workers/ |
| **AI** | Sentiment Analysis | https://developers.cloudflare.com/workers-ai/ |
| **D1** | Database | https://developers.cloudflare.com/d1/ |
| **Pages** | Dashboard Hosting | https://developers.cloudflare.com/pages/ |
| **Wrangler** | CLI Tool | https://developers.cloudflare.com/workers/wrangler/ |
