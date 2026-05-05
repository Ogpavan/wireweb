package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebaseauth "firebase.google.com/go/v4/auth"
	"github.com/go-chi/chi/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log/slog"
	"wire-server/internal/auth"
	"wire-server/internal/session"
)

type Handlers struct {
	logger          *slog.Logger
	authClient      *firebaseauth.Client
	firestoreClient *firestore.Client
	sessionManager  *session.Manager
}

type signupRequest struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type saveAPIKeyRequest struct {
	APIKey string `json:"apiKey"`
}

type createAPIKeyRequest struct {
	Name string `json:"name"`
}

type deleteAPIKeyRequest struct {
	Name string `json:"name"`
}

type webhookConfigRequest struct {
	URL string `json:"url"`
}

type createWhatsAppSessionRequest struct {
	Name     string `json:"name"`
	APIKeyID string `json:"apiKeyId"`
}

type sendMessageRequest struct {
	SessionID string `json:"sessionId"`
	To        string `json:"to"`
	Text      string `json:"text"`
}

type sendMediaRequest struct {
	SessionID string
	To        string
	FileData  []byte
	MediaType string
	MimeType  string
	Caption   string
	FileName  string
}

type deleteWhatsAppSessionRequest struct {
	Name string `json:"name"`
}

type apiKeyResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	APIKey    string    `json:"apiKey,omitempty"`
	MaskedKey string    `json:"maskedKey"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type logResponse struct {
	ID        string         `json:"id"`
	Event     string         `json:"event"`
	Metadata  map[string]any `json:"metadata"`
	CreatedAt time.Time      `json:"createdAt"`
}

type rateLimitConfigResponse struct {
	RateLimits session.RateLimitConfig `json:"rateLimits"`
	UpdatedAt  time.Time               `json:"updatedAt,omitempty"`
}

type updateRateLimitRequest struct {
	RateLimits session.RateLimitConfig `json:"rateLimits"`
}

type dashboardTrendPoint struct {
	Date          string `json:"date"`
	MessagesSent  int    `json:"messagesSent"`
	Incoming      int    `json:"incoming"`
	WebhookFailed int    `json:"webhookFailed"`
}

type dashboardCountItem struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

type dashboardSessionItem struct {
	SessionID string `json:"sessionId"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	Count     int    `json:"count"`
}

func (h *Handlers) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "wire-server",
	})
}

func (h *Handlers) SignUp(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	fullName := strings.TrimSpace(req.FullName)
	email := strings.TrimSpace(strings.ToLower(req.Email))
	password := strings.TrimSpace(req.Password)

	if fullName == "" {
		writeError(w, http.StatusBadRequest, "fullName is required")
		return
	}
	if email == "" || !strings.Contains(email, "@") {
		writeError(w, http.StatusBadRequest, "valid email is required")
		return
	}
	if len(password) < 6 {
		writeError(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}

	params := (&firebaseauth.UserToCreate{}).
		Email(email).
		Password(password).
		DisplayName(fullName).
		EmailVerified(false)

	userRecord, err := h.authClient.CreateUser(r.Context(), params)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "email-already-exists") {
			writeError(w, http.StatusConflict, "an account with this email already exists")
			return
		}
		h.logger.Error("failed to create firebase user", "email", email, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	now := time.Now().UTC()
	if _, err := h.firestoreClient.Collection("users").Doc(userRecord.UID).Set(r.Context(), map[string]any{
		"email":     email,
		"fullName":  fullName,
		"createdAt": now,
		"updatedAt": now,
	}, firestore.MergeAll); err != nil {
		h.logger.Error("failed to create user profile", "uid", userRecord.UID, "error", err)
		_ = h.authClient.DeleteUser(context.Background(), userRecord.UID)
		writeError(w, http.StatusInternalServerError, "failed to create account profile")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"uid":       userRecord.UID,
		"email":     email,
		"fullName":  fullName,
		"createdAt": now,
	})
}

func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"uid":   user.UID,
		"email": user.Email,
	})
}

func (h *Handlers) ListLogs(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	page := 1
	if rawPage := strings.TrimSpace(r.URL.Query().Get("page")); rawPage != "" {
		parsedPage, err := strconv.Atoi(rawPage)
		if err != nil || parsedPage <= 0 {
			writeError(w, http.StatusBadRequest, "page must be a positive number")
			return
		}
		page = parsedPage
	}

	pageSize := 25
	if rawPageSize := strings.TrimSpace(r.URL.Query().Get("pageSize")); rawPageSize != "" {
		parsedPageSize, err := strconv.Atoi(rawPageSize)
		if err != nil || parsedPageSize <= 0 || parsedPageSize > 100 {
			writeError(w, http.StatusBadRequest, "pageSize must be between 1 and 100")
			return
		}
		pageSize = parsedPageSize
	}

	query := h.firestoreClient.Collection("users").Doc(user.UID).Collection("logs").OrderBy("createdAt", firestore.Desc)
	var startAt time.Time
	var endBefore time.Time

	if rawStartDate := strings.TrimSpace(r.URL.Query().Get("startDate")); rawStartDate != "" {
		parsedStartAt, _, err := parseDateRange(rawStartDate, true)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		startAt = parsedStartAt
		query = query.Where("createdAt", ">=", startAt)
	}

	if rawEndDate := strings.TrimSpace(r.URL.Query().Get("endDate")); rawEndDate != "" {
		_, parsedEndBefore, err := parseDateRange(rawEndDate, false)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		endBefore = parsedEndBefore
		query = query.Where("createdAt", "<", endBefore)
	}

	if !startAt.IsZero() && !endBefore.IsZero() && !startAt.Before(endBefore) {
		writeError(w, http.StatusBadRequest, "startDate must be before endDate")
		return
	}

	offset := (page - 1) * pageSize
	snapshots, err := query.Offset(offset).Limit(pageSize + 1).Documents(r.Context()).GetAll()
	if err != nil {
		h.logger.Error("failed to list logs", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list logs")
		return
	}

	hasMore := len(snapshots) > pageSize
	if hasMore {
		snapshots = snapshots[:pageSize]
	}

	logs := make([]logResponse, 0, len(snapshots))
	for _, snapshot := range snapshots {
		data := snapshot.Data()
		metadata, _ := data["metadata"].(map[string]any)
		if metadata == nil {
			metadata = map[string]any{}
		}
		logs = append(logs, logResponse{
			ID:        snapshot.Ref.ID,
			Event:     stringField(data, "event"),
			Metadata:  metadata,
			CreatedAt: timeField(data, "createdAt"),
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"logs":     logs,
		"page":     page,
		"pageSize": pageSize,
		"hasMore":  hasMore,
	})
}

func (h *Handlers) GetDashboardSummary(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	ctx := r.Context()
	logSnapshots, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("logs").OrderBy("createdAt", firestore.Desc).Documents(ctx).GetAll()
	if err != nil {
		h.logger.Error("failed to load dashboard logs", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load dashboard analytics")
		return
	}

	sessionSnapshots, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Documents(ctx).GetAll()
	if err != nil {
		h.logger.Error("failed to load dashboard sessions", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load dashboard analytics")
		return
	}

	apiKeySnapshots, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("apiKeys").Documents(ctx).GetAll()
	if err != nil {
		h.logger.Error("failed to load dashboard api keys", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load dashboard analytics")
		return
	}

	now := time.Now().UTC()
	dayKeys := make([]string, 0, 7)
	trendByDay := map[string]*dashboardTrendPoint{}
	for i := 6; i >= 0; i-- {
		day := now.AddDate(0, 0, -i).Format("2006-01-02")
		dayKeys = append(dayKeys, day)
		trendByDay[day] = &dashboardTrendPoint{Date: day}
	}

	var totalEvents int
	var messagesSent int
	var incomingMessages int
	var webhookFailed int
	var webhookDelivered int
	endpointCounts := map[string]int{}
	sessionCounts := map[string]int{}
	sessionNames := map[string]string{}
	sessionStatuses := map[string]string{}
	recentActivity := make([]logResponse, 0, 10)

	for _, snapshot := range logSnapshots {
		data := snapshot.Data()
		event := stringField(data, "event")
		metadata, _ := data["metadata"].(map[string]any)
		if metadata == nil {
			metadata = map[string]any{}
		}
		createdAt := timeField(data, "createdAt")

		totalEvents++
		if len(recentActivity) < 10 {
			recentActivity = append(recentActivity, logResponse{
				ID:        snapshot.Ref.ID,
				Event:     event,
				Metadata:  metadata,
				CreatedAt: createdAt,
			})
		}

		dayKey := createdAt.UTC().Format("2006-01-02")
		if bucket, ok := trendByDay[dayKey]; ok {
			switch event {
			case "api.message.sent":
				bucket.MessagesSent++
			case "webhook.delivered":
				bucket.Incoming++
			case "webhook.failed":
				bucket.WebhookFailed++
			}
		}

		switch event {
		case "api.message.sent":
			messagesSent++
			endpointCounts["Send message"]++
		case "api.media.sent":
			endpointCounts["Send media"]++
		case "api.contacts.listed":
			endpointCounts["Get contacts"]++
		case "api.chats.listed":
			endpointCounts["List chats"]++
		case "webhook.delivered":
			incomingMessages++
			webhookDelivered++
			endpointCounts["Webhook delivery"]++
		case "webhook.failed":
			webhookFailed++
			endpointCounts["Webhook failure"]++
		case "api.message.failed":
			endpointCounts["Send message failure"]++
		case "api.media.failed":
			endpointCounts["Send media failure"]++
		case "api.contacts.failed":
			endpointCounts["Get contacts failure"]++
		case "api.chats.failed":
			endpointCounts["List chats failure"]++
		}

		if sessionID, ok := metadata["sessionId"].(string); ok && sessionID != "" {
			sessionCounts[sessionID]++
			if name, ok := metadata["sessionName"].(string); ok && name != "" {
				sessionNames[sessionID] = name
			}
			if status, ok := metadata["sessionStatus"].(string); ok && status != "" {
				sessionStatuses[sessionID] = status
			}
		}
	}

	trend := make([]dashboardTrendPoint, 0, len(dayKeys))
	for _, dayKey := range dayKeys {
		trend = append(trend, *trendByDay[dayKey])
	}

	activityItems := make([]dashboardCountItem, 0, len(endpointCounts))
	for label, count := range endpointCounts {
		activityItems = append(activityItems, dashboardCountItem{Label: label, Count: count})
	}
	sort.Slice(activityItems, func(i, j int) bool {
		if activityItems[i].Count == activityItems[j].Count {
			return activityItems[i].Label < activityItems[j].Label
		}
		return activityItems[i].Count > activityItems[j].Count
	})

	sessionItems := make([]dashboardSessionItem, 0, len(sessionCounts))
	for sessionID, count := range sessionCounts {
		sessionItems = append(sessionItems, dashboardSessionItem{
			SessionID: sessionID,
			Name:      sessionNames[sessionID],
			Status:    sessionStatuses[sessionID],
			Count:     count,
		})
	}
	sort.Slice(sessionItems, func(i, j int) bool {
		if sessionItems[i].Count == sessionItems[j].Count {
			return sessionItems[i].SessionID < sessionItems[j].SessionID
		}
		return sessionItems[i].Count > sessionItems[j].Count
	})

	if len(recentActivity) > 10 {
		recentActivity = recentActivity[:10]
	}

	connectedSessions := 0
	pairingSessions := 0
	disconnectedSessions := 0
	for _, snapshot := range sessionSnapshots {
		data := snapshot.Data()
		sessionNames[snapshot.Ref.ID] = stringField(data, "name")
		sessionStatuses[snapshot.Ref.ID] = stringField(data, "status")
		status := stringField(data, "status")
		switch status {
		case "connected":
			connectedSessions++
		case "pairing":
			pairingSessions++
		default:
			disconnectedSessions++
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"totalEvents":          totalEvents,
		"messagesSent":         messagesSent,
		"incomingMessages":     incomingMessages,
		"webhookDelivered":     webhookDelivered,
		"webhookFailed":        webhookFailed,
		"connectedSessions":    connectedSessions,
		"pairingSessions":      pairingSessions,
		"disconnectedSessions": disconnectedSessions,
		"apiKeys":              len(apiKeySnapshots),
		"dailyActivity":        trend,
		"endpointUsage":        activityItems,
		"sessionActivity":      sessionItems,
		"recentActivity":       recentActivity,
	})
}

func (h *Handlers) GetRateLimits(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	snapshot, err := h.firestoreClient.Collection("users").Doc(user.UID).Get(r.Context())
	if err != nil {
		if status.Code(err) == codes.NotFound {
			writeJSON(w, http.StatusOK, rateLimitConfigResponse{RateLimits: session.DefaultRateLimitConfig()})
			return
		}
		h.logger.Error("failed to load rate limits", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load rate limits")
		return
	}

	data := snapshot.Data()
	writeJSON(w, http.StatusOK, rateLimitConfigResponse{
		RateLimits: session.RateLimitConfigFromMap(data),
		UpdatedAt:  timeField(data, "rateLimitsUpdatedAt"),
	})
}

func (h *Handlers) UpdateRateLimits(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req updateRateLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	cfg := session.NormalizeRateLimitConfig(req.RateLimits)
	now := time.Now().UTC()
	_, err := h.firestoreClient.Collection("users").Doc(user.UID).Set(r.Context(), map[string]any{
		"rateLimits":          cfg.ToMap(),
		"rateLimitsUpdatedAt": now,
		"updatedAt":           now,
	}, firestore.MergeAll)
	if err != nil {
		h.logger.Error("failed to save rate limits", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save rate limits")
		return
	}

	h.addUserLog(r.Context(), user.UID, "rate_limits.updated", map[string]any{
		"sendDelayMs":       cfg.SendDelayMs,
		"messagePerMinute":  cfg.MessagePerMinute,
		"mediaPerMinute":    cfg.MediaPerMinute,
		"apiKeyPerMinute":   cfg.APIKeyPerMinute,
		"sessionPerMinute":  cfg.SessionPerMinute,
		"webhookPerMinute":  cfg.WebhookPerMinute,
		"contactsPerMinute": cfg.ContactsPerMinute,
		"chatsPerMinute":    cfg.ChatsPerMinute,
		"logsPerMinute":     cfg.LogsPerMinute,
	})

	writeJSON(w, http.StatusOK, rateLimitConfigResponse{
		RateLimits: cfg,
		UpdatedAt:  now,
	})
}

func (h *Handlers) SaveAPIKey(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req saveAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" {
		writeError(w, http.StatusBadRequest, "apiKey is required")
		return
	}

	now := time.Now().UTC()
	_, err := h.firestoreClient.Collection("users").Doc(user.UID).Set(r.Context(), map[string]any{
		"apiKey":        apiKey,
		"apiKeySetAt":   now,
		"apiKeyUpdated": now,
		"email":         user.Email,
		"updatedAt":     now,
	}, firestore.MergeAll)
	if err != nil {
		h.logger.Error("failed to save api key", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save api key")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "saved",
		"uid":       user.UID,
		"updatedAt": now,
	})
}

func (h *Handlers) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	snapshots, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("apiKeys").Documents(r.Context()).GetAll()
	if err != nil {
		h.logger.Error("failed to list api keys", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list api keys")
		return
	}

	keys := make([]apiKeyResponse, 0, len(snapshots))
	for _, snapshot := range snapshots {
		data := snapshot.Data()
		keys = append(keys, apiKeyResponse{
			ID:        snapshot.Ref.ID,
			Name:      stringField(data, "name"),
			MaskedKey: maskAPIKey(stringField(data, "apiKey")),
			CreatedAt: timeField(data, "createdAt"),
			UpdatedAt: timeField(data, "updatedAt"),
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{"keys": keys})
}

func (h *Handlers) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req createAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	apiKey, err := generateAPIKey()
	if err != nil {
		h.logger.Error("failed to generate api key", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to generate api key")
		return
	}

	now := time.Now().UTC()
	doc, _, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("apiKeys").Add(r.Context(), map[string]any{
		"name":      name,
		"apiKey":    apiKey,
		"email":     user.Email,
		"createdAt": now,
		"updatedAt": now,
	})
	if err != nil {
		h.logger.Error("failed to create api key", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create api key")
		return
	}

	if _, err := h.firestoreClient.Collection("apiKeyLookups").Doc(apiKey).Set(r.Context(), map[string]any{
		"uid":       user.UID,
		"apiKeyId":  doc.ID,
		"createdAt": now,
	}); err != nil {
		h.logger.Error("failed to create api key lookup", "uid", user.UID, "keyID", doc.ID, "error", err)
		_, _ = doc.Delete(r.Context())
		writeError(w, http.StatusInternalServerError, "failed to create api key")
		return
	}
	h.addUserLog(r.Context(), user.UID, "api_key.created", map[string]any{"keyId": doc.ID, "name": name})

	writeJSON(w, http.StatusCreated, apiKeyResponse{
		ID:        doc.ID,
		Name:      name,
		APIKey:    apiKey,
		MaskedKey: maskAPIKey(apiKey),
		CreatedAt: now,
		UpdatedAt: now,
	})
}

func (h *Handlers) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req deleteAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	typedName := strings.TrimSpace(req.Name)
	if typedName == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	doc := h.firestoreClient.Collection("users").Doc(user.UID).Collection("apiKeys").Doc(chi.URLParam(r, "keyID"))
	snapshot, err := doc.Get(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "api key not found")
		return
	}

	name := stringField(snapshot.Data(), "name")
	if typedName != name {
		writeError(w, http.StatusBadRequest, "typed name does not match api key name")
		return
	}

	apiKey := stringField(snapshot.Data(), "apiKey")
	if _, err := doc.Delete(r.Context()); err != nil {
		h.logger.Error("failed to delete api key", "uid", user.UID, "keyID", doc.ID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete api key")
		return
	}
	if apiKey != "" {
		_, _ = h.firestoreClient.Collection("apiKeyLookups").Doc(apiKey).Delete(r.Context())
	}
	h.addUserLog(r.Context(), user.UID, "api_key.deleted", map[string]any{"keyId": doc.ID, "name": name})

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) GetWebhookConfig(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	snapshot, err := h.firestoreClient.Collection("users").Doc(user.UID).Get(r.Context())
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]string{"url": ""})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"url": stringField(snapshot.Data(), "webhookUrl"),
	})
}

func (h *Handlers) SaveWebhookConfig(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req webhookConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	webhookURL := strings.TrimSpace(req.URL)
	if webhookURL != "" && !strings.HasPrefix(webhookURL, "http://") && !strings.HasPrefix(webhookURL, "https://") {
		writeError(w, http.StatusBadRequest, "url must start with http:// or https://")
		return
	}

	_, err := h.firestoreClient.Collection("users").Doc(user.UID).Set(r.Context(), map[string]any{
		"webhookUrl": webhookURL,
		"updatedAt":  time.Now().UTC(),
	}, firestore.MergeAll)
	if err != nil {
		h.logger.Error("failed to save webhook config", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save webhook config")
		return
	}
	h.addUserLog(r.Context(), user.UID, "webhook.configured", map[string]any{"url": webhookURL})

	writeJSON(w, http.StatusOK, map[string]string{"url": webhookURL})
}

func (h *Handlers) ListWhatsAppSessions(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	snapshots, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Documents(r.Context()).GetAll()
	if err != nil {
		h.logger.Error("failed to list whatsapp sessions", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list whatsapp sessions")
		return
	}

	active := map[string]session.Record{}
	for _, record := range h.sessionManager.List(user.UID) {
		active[record.ID] = record
	}

	records := make([]session.Record, 0, len(snapshots))
	for _, snapshot := range snapshots {
		data := snapshot.Data()
		record, ok := active[snapshot.Ref.ID]
		if !ok {
			record = session.Record{
				ID:        snapshot.Ref.ID,
				UID:       user.UID,
				Name:      stringField(data, "name"),
				APIKeyID:  stringField(data, "apiKeyId"),
				Status:    session.StatusDisconnected,
				StorePath: stringField(data, "storePath"),
				CreatedAt: timeField(data, "createdAt"),
				UpdatedAt: timeField(data, "updatedAt"),
			}
		}
		records = append(records, record)
	}

	writeJSON(w, http.StatusOK, records)
}

func (h *Handlers) addUserLog(ctx context.Context, uid string, event string, metadata map[string]any) {
	if uid == "" {
		return
	}

	_, _, err := h.firestoreClient.Collection("users").Doc(uid).Collection("logs").Add(ctx, map[string]any{
		"event":     event,
		"metadata":  metadata,
		"createdAt": time.Now().UTC(),
	})
	if err != nil {
		h.logger.Error("failed to write user log", "uid", uid, "event", event, "error", err)
	}
}

func (h *Handlers) CreateWhatsAppSession(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req createWhatsAppSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	name := strings.TrimSpace(req.Name)
	apiKeyID := strings.TrimSpace(req.APIKeyID)
	if name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	record, err := h.sessionManager.Create(context.Background(), user.UID, name, apiKeyID)
	if err != nil {
		h.logger.Error("failed to create whatsapp session", "uid", user.UID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create whatsapp session")
		return
	}

	_, err = h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Doc(record.ID).Set(r.Context(), map[string]any{
		"name":      record.Name,
		"apiKeyId":  record.APIKeyID,
		"storePath": record.StorePath,
		"createdAt": record.CreatedAt,
		"updatedAt": record.UpdatedAt,
	})
	if err != nil {
		h.logger.Error("failed to save whatsapp session metadata", "uid", user.UID, "sessionID", record.ID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save whatsapp session metadata")
		return
	}
	h.addUserLog(r.Context(), user.UID, "session.created", map[string]any{"sessionId": record.ID, "name": record.Name})

	writeJSON(w, http.StatusCreated, record)
}

func (h *Handlers) GetWhatsAppSession(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	sessionID := chi.URLParam(r, "sessionID")
	record, ok := h.sessionManager.Get(user.UID, sessionID)
	if !ok {
		snapshot, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Doc(sessionID).Get(r.Context())
		if err != nil {
			writeError(w, http.StatusNotFound, "session not found")
			return
		}
		record, err = h.sessionManager.Ensure(context.Background(), user.UID, sessionID, stringField(snapshot.Data(), "name"), stringField(snapshot.Data(), "apiKeyId"))
		if err != nil {
			h.logger.Error("failed to reuse whatsapp session", "uid", user.UID, "sessionID", sessionID, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to reuse whatsapp session")
			return
		}
	}

	writeJSON(w, http.StatusOK, record)
}

func (h *Handlers) GetWhatsAppSessionWithAPIKey(w http.ResponseWriter, r *http.Request) {
	uid, ok := h.uidFromAPIKey(w, r)
	if !ok {
		return
	}

	sessionID := chi.URLParam(r, "sessionID")
	record, ok := h.sessionManager.Get(uid, sessionID)
	if !ok {
		snapshot, err := h.firestoreClient.Collection("users").Doc(uid).Collection("whatsappSessions").Doc(sessionID).Get(r.Context())
		if err != nil {
			writeError(w, http.StatusNotFound, "session not found")
			return
		}
		record, err = h.sessionManager.Ensure(context.Background(), uid, sessionID, stringField(snapshot.Data(), "name"), stringField(snapshot.Data(), "apiKeyId"))
		if err != nil {
			h.logger.Error("failed to reuse whatsapp session", "uid", uid, "sessionID", sessionID, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to reuse whatsapp session")
			return
		}
	}

	writeJSON(w, http.StatusOK, record)
}

func (h *Handlers) GetWhatsAppSessionQR(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	sessionID := chi.URLParam(r, "sessionID")
	if _, ok := h.sessionManager.Get(user.UID, sessionID); !ok {
		snapshot, err := h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Doc(sessionID).Get(r.Context())
		if err != nil {
			writeError(w, http.StatusNotFound, "session not found")
			return
		}
		if _, err := h.sessionManager.Ensure(context.Background(), user.UID, sessionID, stringField(snapshot.Data(), "name"), stringField(snapshot.Data(), "apiKeyId")); err != nil {
			h.logger.Error("failed to reuse whatsapp session for qr", "uid", user.UID, "sessionID", sessionID, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to reuse whatsapp session")
			return
		}
	}

	qr, err := h.waitForWhatsAppQR(r.Context(), user.UID, sessionID)
	if err != nil {
		writeError(w, http.StatusConflict, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"qr": qr})
}

func (h *Handlers) SendMessageWithAPIKey(w http.ResponseWriter, r *http.Request) {
	req, ok := h.readSendMessageRequest(w, r)
	if !ok {
		return
	}

	apiKey := bearerToken(r.Header.Get("Authorization"))
	if apiKey == "" {
		writeUnauthorized(w, "missing api token")
		return
	}

	snapshot, err := h.firestoreClient.Collection("apiKeyLookups").Doc(apiKey).Get(r.Context())
	if err != nil {
		writeUnauthorized(w, "invalid api token")
		return
	}
	data := snapshot.Data()
	uid := stringField(data, "uid")
	if uid == "" {
		writeUnauthorized(w, "invalid api token")
		return
	}

	if !h.ensureMessageSession(w, r, uid, req.SessionID) {
		return
	}

	messageID, err := h.sessionManager.SendText(r.Context(), uid, req.SessionID, req.To, req.Text)
	if err != nil {
		h.addUserLog(r.Context(), uid, "api.message.failed", map[string]any{"sessionId": req.SessionID, "to": req.To, "error": err.Error()})
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	h.addUserLog(r.Context(), uid, "api.message.sent", map[string]any{"sessionId": req.SessionID, "to": req.To, "messageId": messageID})

	writeJSON(w, http.StatusAccepted, map[string]string{
		"messageId": messageID,
		"status":    "sent",
	})
}

func (h *Handlers) SendMediaWithAPIKey(w http.ResponseWriter, r *http.Request) {
	req, ok := h.readSendMediaRequest(w, r)
	if !ok {
		return
	}

	uid, ok := h.uidFromAPIKey(w, r)
	if !ok {
		return
	}
	if !h.ensureMessageSession(w, r, uid, req.SessionID) {
		return
	}

	messageID, err := h.sessionManager.SendMedia(r.Context(), uid, req.SessionID, session.MediaMessage{
		To:        req.To,
		Data:      req.FileData,
		MediaType: req.MediaType,
		MimeType:  req.MimeType,
		Caption:   req.Caption,
		FileName:  req.FileName,
	})
	if err != nil {
		h.addUserLog(r.Context(), uid, "api.media.failed", map[string]any{"sessionId": req.SessionID, "to": req.To, "fileName": req.FileName, "error": err.Error()})
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	h.addUserLog(r.Context(), uid, "api.media.sent", map[string]any{"sessionId": req.SessionID, "to": req.To, "fileName": req.FileName, "messageId": messageID})

	writeJSON(w, http.StatusAccepted, map[string]string{
		"messageId": messageID,
		"status":    "sent",
	})
}

func (h *Handlers) ListContactsWithAPIKey(w http.ResponseWriter, r *http.Request) {
	uid, ok := h.uidFromAPIKey(w, r)
	if !ok {
		return
	}

	sessionID := strings.TrimSpace(r.URL.Query().Get("sessionId"))
	if sessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return
	}
	if !h.ensureMessageSession(w, r, uid, sessionID) {
		return
	}

	limit, ok := parseLimit(w, r)
	if !ok {
		return
	}

	contacts, err := h.sessionManager.Contacts(r.Context(), uid, sessionID, limit)
	if err != nil {
		h.addUserLog(r.Context(), uid, "api.contacts.failed", map[string]any{"sessionId": sessionID, "error": err.Error()})
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	h.addUserLog(r.Context(), uid, "api.contacts.listed", map[string]any{"sessionId": sessionID, "count": len(contacts)})

	writeJSON(w, http.StatusOK, map[string]any{"contacts": contacts})
}

func (h *Handlers) ListChatsWithAPIKey(w http.ResponseWriter, r *http.Request) {
	uid, ok := h.uidFromAPIKey(w, r)
	if !ok {
		return
	}

	sessionID := strings.TrimSpace(r.URL.Query().Get("sessionId"))
	if sessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return
	}
	if !h.ensureMessageSession(w, r, uid, sessionID) {
		return
	}

	limit, ok := parseLimit(w, r)
	if !ok {
		return
	}

	chats, err := h.sessionManager.Chats(r.Context(), uid, sessionID, limit)
	if err != nil {
		h.addUserLog(r.Context(), uid, "api.chats.failed", map[string]any{"sessionId": sessionID, "error": err.Error()})
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	h.addUserLog(r.Context(), uid, "api.chats.listed", map[string]any{"sessionId": sessionID, "count": len(chats)})

	writeJSON(w, http.StatusOK, map[string]any{"chats": chats})
}

func parseLimit(w http.ResponseWriter, r *http.Request) (int, bool) {
	rawLimit := strings.TrimSpace(r.URL.Query().Get("limit"))
	if rawLimit == "" {
		return 0, true
	}

	limit, err := strconv.Atoi(rawLimit)
	if err != nil || limit < 0 {
		writeError(w, http.StatusBadRequest, "limit must be a positive number")
		return 0, false
	}

	return limit, true
}

func (h *Handlers) readSendMessageRequest(w http.ResponseWriter, r *http.Request) (sendMessageRequest, bool) {
	var req sendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return req, false
	}

	req.SessionID = strings.TrimSpace(req.SessionID)
	req.To = strings.TrimSpace(req.To)
	req.Text = strings.TrimSpace(req.Text)
	if req.SessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return req, false
	}
	if req.To == "" {
		writeError(w, http.StatusBadRequest, "to is required")
		return req, false
	}
	if req.Text == "" {
		writeError(w, http.StatusBadRequest, "text is required")
		return req, false
	}

	return req, true
}

func (h *Handlers) readSendMediaRequest(w http.ResponseWriter, r *http.Request) (sendMediaRequest, bool) {
	var req sendMediaRequest
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return req, false
	}

	req.SessionID = strings.TrimSpace(r.FormValue("sessionId"))
	req.To = strings.TrimSpace(r.FormValue("to"))
	req.MediaType = strings.TrimSpace(r.FormValue("mediaType"))
	req.MimeType = strings.TrimSpace(r.FormValue("mimeType"))
	req.Caption = strings.TrimSpace(r.FormValue("caption"))
	req.FileName = strings.TrimSpace(r.FormValue("fileName"))
	if req.SessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return req, false
	}
	if req.To == "" {
		writeError(w, http.StatusBadRequest, "to is required")
		return req, false
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return req, false
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, 25<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read file")
		return req, false
	}
	if len(data) == 25<<20 {
		writeError(w, http.StatusBadRequest, "media file is too large")
		return req, false
	}
	req.FileData = data
	if req.FileName == "" {
		req.FileName = header.Filename
	}
	if req.FileName == "" {
		req.FileName = "media"
	}
	if req.MimeType == "" {
		req.MimeType = header.Header.Get("Content-Type")
		if parsed, _, err := mime.ParseMediaType(req.MimeType); err == nil {
			req.MimeType = parsed
		}
	}
	if req.MimeType == "" {
		req.MimeType = http.DetectContentType(data)
	}

	return req, true
}

func (h *Handlers) uidFromAPIKey(w http.ResponseWriter, r *http.Request) (string, bool) {
	apiKey := bearerToken(r.Header.Get("Authorization"))
	if apiKey == "" {
		writeUnauthorized(w, "missing api token")
		return "", false
	}

	snapshot, err := h.firestoreClient.Collection("apiKeyLookups").Doc(apiKey).Get(r.Context())
	if err != nil {
		writeUnauthorized(w, "invalid api token")
		return "", false
	}
	uid := stringField(snapshot.Data(), "uid")
	if uid == "" {
		writeUnauthorized(w, "invalid api token")
		return "", false
	}

	return uid, true
}

func (h *Handlers) ensureMessageSession(w http.ResponseWriter, r *http.Request, uid string, sessionID string) bool {
	if _, ok := h.sessionManager.Get(uid, sessionID); ok {
		return true
	}

	snapshot, err := h.firestoreClient.Collection("users").Doc(uid).Collection("whatsappSessions").Doc(sessionID).Get(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "session not found")
		return false
	}

	data := snapshot.Data()
	if _, err := h.sessionManager.Ensure(context.Background(), uid, sessionID, stringField(data, "name"), stringField(data, "apiKeyId")); err != nil {
		h.logger.Error("failed to reuse whatsapp session for message", "uid", uid, "sessionID", sessionID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to reuse whatsapp session")
		return false
	}

	return true
}

func (h *Handlers) DeleteWhatsAppSession(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeUnauthorized(w, "missing user context")
		return
	}

	var req deleteWhatsAppSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	typedName := strings.TrimSpace(req.Name)
	if typedName == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	sessionID := chi.URLParam(r, "sessionID")
	doc := h.firestoreClient.Collection("users").Doc(user.UID).Collection("whatsappSessions").Doc(sessionID)
	snapshot, err := doc.Get(r.Context())
	if err != nil {
		writeError(w, http.StatusNotFound, "session not found")
		return
	}

	name := stringField(snapshot.Data(), "name")
	if typedName != name {
		writeError(w, http.StatusBadRequest, "typed name does not match session name")
		return
	}

	if _, err := doc.Delete(r.Context()); err != nil {
		h.logger.Error("failed to delete whatsapp session metadata", "uid", user.UID, "sessionID", sessionID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete whatsapp session")
		return
	}

	if err := h.sessionManager.Delete(user.UID, sessionID); err != nil {
		h.logger.Error("failed to delete whatsapp session store", "uid", user.UID, "sessionID", sessionID, "error", err)
		h.addUserLog(r.Context(), user.UID, "session.store_delete_failed", map[string]any{"sessionId": sessionID, "name": name, "error": err.Error()})
	}
	h.addUserLog(r.Context(), user.UID, "session.deleted", map[string]any{"sessionId": sessionID, "name": name})

	w.WriteHeader(http.StatusNoContent)
}

func stringField(data map[string]any, key string) string {
	value, _ := data[key].(string)
	return value
}

func timeField(data map[string]any, key string) time.Time {
	value, _ := data[key].(time.Time)
	return value
}

func parseDateRange(raw string, start bool) (time.Time, time.Time, error) {
	parsed, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("date values must use YYYY-MM-DD format")
	}

	if start {
		return parsed.UTC(), time.Time{}, nil
	}

	return time.Time{}, parsed.AddDate(0, 0, 1).UTC(), nil
}

func (h *Handlers) waitForWhatsAppQR(ctx context.Context, uid string, sessionID string) (string, error) {
	deadline := time.NewTimer(8 * time.Second)
	defer deadline.Stop()

	ticker := time.NewTicker(400 * time.Millisecond)
	defer ticker.Stop()

	for {
		qr, err := h.sessionManager.QR(uid, sessionID)
		if err == nil {
			return qr, nil
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-deadline.C:
			return "", err
		case <-ticker.C:
		}
	}
}

func maskAPIKey(value string) string {
	if value == "" {
		return ""
	}

	if len(value) <= 4 {
		return "****"
	}

	return "********" + value[len(value)-4:]
}

func generateAPIKey() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return "wire_" + base64.RawURLEncoding.EncodeToString(bytes), nil
}

func bearerToken(header string) string {
	parts := strings.Fields(header)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}
