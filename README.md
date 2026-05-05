# Wire

Full-stack app:

- Frontend: React + Vite (root)
- Backend: Go API (`server/`)

## Local development

Frontend:

```sh
# edit values in .env.local
npm ci
npm run dev
```

Backend:

```sh
cd server
# edit values in server/.env.local
# create/provide server/service-account.json (see server/README.md)
APP_ENV=local go run ./cmd/api
```

## Production env files

Frontend (Vite reads this automatically on build):

```sh
# edit values in .env.production
npm run build
```

Backend:

```sh
cd server
# edit values in server/.env.production
APP_ENV=production go run ./cmd/api
```

## GitHub Pages (frontend)

This repo includes a GitHub Actions workflow that builds the frontend and deploys `dist/` to GitHub Pages on pushes to `main`.

In your GitHub repo settings:

- Settings → Pages → Build and deployment → Source: **GitHub Actions**

# wireweb

"# wireweb" 
