# JacxiTrack Universal Container Tracking API

Production-oriented Express/Mongoose API for tracking ISO 6346 shipping containers. It validates check digits, stores a flexible data payload plus an embedded status history, and can seed unknown containers from a deterministic mock carrier lookup.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Set `MONGODB_URI` in `.env` to a reachable MongoDB instance. Set `CORS_ORIGIN` to a comma-separated allow-list for browser clients; CORS is disabled when it is omitted. For development, use `npm run dev`; run unit and HTTP checks with `npm test`.

### Docker

Start the API and a local MongoDB instance with:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`, and the database volume persists as `mongo-data`.

## API

All container numbers are normalized to uppercase and must be ISO 6346 values: four letters, six serial digits, and a valid check digit.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/containers` | Create a container. |
| `GET` | `/api/containers/:containerNumber` | Fetch a container; missing records are looked up via the mock provider and persisted. |
| `PUT` | `/api/containers/:containerNumber/status` | Set a new status and append history. |
| `GET` | `/api/containers?page=1&limit=20&status=In%20transit` | Paginated listing, optionally filtered by current status. |

### Create / update payloads

```json
{
  "containerNumber": "CSQU3054383",
  "currentStatus": "In transit",
  "containerData": { "carrier": "Example Carrier", "location": "Rotterdam" }
}
```

The status update endpoint requires `currentStatus` and optionally accepts `containerData`. List responses include `{ "data": [], "pagination": { "page", "limit", "total", "totalPages" } }`.

## Operational safeguards

The API sets a request ID on every response, applies Helmet security headers, enforces a 1 MB JSON limit, and rate-limits `/api` requests to 300 per 15-minute window. It returns structured errors containing the request ID for support correlation and shuts MongoDB down cleanly on `SIGINT`/`SIGTERM`.

## Design notes

The mock lookup is deliberately isolated in `utils/trackingLookup.js`; its inline integration note identifies where a carrier webhook or real-time provider client should update the local state atomically.
