# Wire Server

Go backend for the Wire console.

## Responsibilities

- Verify Firebase Auth ID tokens from the React app.
- Store app metadata in Firebase/Firestore.
- Manage WhatsApp device sessions with whatsmeow.
- Keep whatsmeow SQLite device stores on server storage under `WHATSAPP_STORE_DIR`.

## Local Setup

1. Create a Firebase service account JSON file.
2. Put it at `server/service-account.json` or point `GOOGLE_APPLICATION_CREDENTIALS` to its absolute path.
3. Copy `.env.example` to `.env` and update values if needed.
4. Run:

```sh
go mod tidy
go run ./cmd/api
```

The server listens on `http://localhost:8080` by default.

## Auth Contract

Frontend requests must include:

```http
Authorization: Bearer <firebase-id-token>
```

The backend verifies that token with Firebase Admin SDK and scopes WhatsApp sessions by Firebase UID.
