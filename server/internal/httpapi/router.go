package httpapi

import (
	"log/slog"
	"net/http"

	"cloud.google.com/go/firestore"
	firebaseauth "firebase.google.com/go/v4/auth"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"wire-server/internal/auth"
	"wire-server/internal/config"
	"wire-server/internal/session"
)

type RouterConfig struct {
	Config          config.Config
	Logger          *slog.Logger
	AuthClient      *firebaseauth.Client
	FirestoreClient *firestore.Client
	SessionManager  *session.Manager
}

func NewRouter(cfg RouterConfig) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(cors(cfg.Config.AllowedOrigins))

	h := &Handlers{
		logger:          cfg.Logger,
		authClient:      cfg.AuthClient,
		firestoreClient: cfg.FirestoreClient,
		sessionManager:  cfg.SessionManager,
	}

	r.Get("/health", h.Health)

	r.Route("/v1", func(r chi.Router) {
		r.Post("/auth/signup", h.SignUp)
		r.Post("/messages", h.SendMessageWithAPIKey)
		r.Post("/media", h.SendMediaWithAPIKey)
		r.Get("/contacts", h.ListContactsWithAPIKey)
		r.Get("/chats", h.ListChatsWithAPIKey)
		r.Get("/whatsapp/sessions/{sessionID}", h.GetWhatsAppSessionWithAPIKey)

		r.Group(func(r chi.Router) {
			r.Use(auth.Middleware(cfg.AuthClient, writeUnauthorized))

			r.Get("/me", h.Me)
			r.Get("/dashboard/summary", h.GetDashboardSummary)
			r.Get("/rate-limits", h.GetRateLimits)
			r.Put("/rate-limits", h.UpdateRateLimits)
			r.Get("/logs", h.ListLogs)
			r.Get("/api-keys", h.ListAPIKeys)
			r.Post("/api-keys", h.CreateAPIKey)
			r.Delete("/api-keys/{keyID}", h.DeleteAPIKey)
			r.Post("/api-key", h.SaveAPIKey)
			r.Get("/webhooks/incoming", h.GetWebhookConfig)
			r.Post("/webhooks/incoming", h.SaveWebhookConfig)
			r.Route("/whatsapp", func(r chi.Router) {
				r.Get("/sessions", h.ListWhatsAppSessions)
				r.Post("/sessions", h.CreateWhatsAppSession)
				r.Get("/sessions/{sessionID}", h.GetWhatsAppSession)
				r.Get("/sessions/{sessionID}/qr", h.GetWhatsAppSessionQR)
				r.Delete("/sessions/{sessionID}", h.DeleteWhatsAppSession)
			})
		})
	})

	return r
}
