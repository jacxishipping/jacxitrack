# JacxiTrack Universal Container Tracking API

Production-oriented Express/Mongoose API for tracking ISO 6346 shipping containers. It validates check digits, stores a flexible data payload plus an embedded status history, and can seed unknown containers from a deterministic mock carrier lookup.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Set `MONGODB_URI` in `.env` to a reachable MongoDB instance. For development, use `npm run dev`; run unit checks with `npm test`.

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

## Design notes

The mock lookup is deliberately isolated in `utils/trackingLookup.js`; its inline integration note identifies where a carrier webhook or real-time provider client should update the local state atomically.
