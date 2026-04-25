# Wire

Full-stack app:

- Frontend: React + Vite (root)
- Backend: Go API (`server/`)

## Local development

Frontend:

```sh
npm ci
npm run dev
```

Backend:

```sh
cd server
cp .env.example .env
# create/provide server/service-account.json (see server/README.md)
go run ./cmd/api
```

## GitHub Pages (frontend)

This repo includes a GitHub Actions workflow that builds the frontend and deploys `dist/` to GitHub Pages on pushes to `main`.

In your GitHub repo settings:

- Settings → Pages → Build and deployment → Source: **GitHub Actions**

# wireweb

"# wireweb" 
