# Roadmap

## Current State (September 2025)
- Unified discovery DTOs power trending, search, recommendations, and stack insights on both client and server.
- Discovery API integrations support npm, PyPI, GitHub, and Docker with status reporting and fallback logic.
- Stack Intelligence, budgeting, and optimisation routes consume the normalised helpers for popularity, pricing, and timestamps.
- Client views (Discovery Hub, Discover Tools, My Stack, Stack Intelligence) render shared metrics and badges via helper utilities.
- Mapper unit tests verify DTO conversions; development workflow uses 
pm run dev (Express + Vite) and Drizzle migrations via 
pm run db:push.

## Near-Term (Next 2 Sprints)
1. **Discovery Data Plumbing**
   - Implement storage.getDiscoveredToolsByIds to remove synthetic fallbacks in /api/discovery/cost-impact.
   - Persist lookup traces for discovery source statuses and surface them in Discover Tools.
2. **Client/Server Contracts**
   - Finish migrating remaining legacy surfaces (client/src/pages/discover-tools.tsx add-to-stack response typing, Chart widgets) to DiscoveryToolSummary-backed schemas.
   - Add Zod response validation for cost-impact and budgeting routes.
3. **Resilience & Observability**
   - Centralise logging/metrics for discovery source adapters; expose failure counters via /api/discovery/statistics.

## Mid-Term Enhancements
- **Personalised Discovery Pipelines** – Persist user stack heuristics and tune recommendation weights (popularity vs. quality, cost sensitivity).
- **Search Experience** – Introduce filters for pricing, difficulty, and languages backed by server facets; add pagination tokens for large result sets.
- **Testing & QA** – Add integration tests for discovery routes (mocking upstream APIs) and Cypress smoke tests for the discovery hub flows.

## Long-Term Vision
- **Unified Storage Layer** – Replace ad-hoc CSV seeding utilities with scripted migrations & fixtures; expose REST + GraphQL endpoints.
- **Automation & Retraining** – Schedule periodic discovery scans and anomaly detection for “tools degrading quickly”.
- **Ecosystem Integrations** – Ship plug-ins for Jira/GitHub issues linking stack intelligence recommendations to tracked work items.
