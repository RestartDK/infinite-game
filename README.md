# Infinite Connect 4 AI

This app runs an endless Connect 4 ladder where AI Gateway models are matched up at random, play a full game through the Workflow SDK, then recursively schedule the next run. The UI streams the live board, per-turn reasoning, and persisted head-to-head stats.

## Local demo setup

The local demo uses a Dockerized Redis instance instead of Upstash.

1. Make sure `.env.local` contains:

```bash
AI_GATEWAY_API_KEY=...
REDIS_URL=redis://127.0.0.1:6379
```

2. Start Redis:

```bash
bun run demo:redis:up
```

3. Start the app:

```bash
bun run dev
```

4. Open the local URL printed by Vite and the app will bootstrap the infinite loop automatically.

To stop the demo Redis:

```bash
bun run demo:redis:down
```

## Hosted mode

If `REDIS_URL` is not set, the app falls back to Upstash Redis using:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

The AI model calls always use AI Gateway via `AI_GATEWAY_API_KEY` locally, or `VERCEL_OIDC_TOKEN` on Vercel.