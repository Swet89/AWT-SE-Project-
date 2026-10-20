# Odyssey Travel — frontend

Angular 21 app. See the [project root README](../README.md) for full setup
instructions (backend, MongoDB, Docker, API keys).

Quick start (backend must already be running on port 4000):
```bash
npm install
npm start
```
Then open http://localhost:4200. Requests to `/api/*` are proxied to
`http://localhost:4000` via `proxy.conf.json` during `ng serve`.

Production build:
```bash
npx ng build
```
Output goes to `dist/frontend/browser/`.
