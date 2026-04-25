package session

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
	"wire-server/internal/whatsapp"
)

type Manager struct {
	storeDir          string
	logger            *slog.Logger
	mu                sync.RWMutex
	sessions          map[string]map[string]*Session
	sendMu            sync.Mutex
	nextSendAllowed   map[string]time.Time
	webhookResolver   func(context.Context, string) (string, error)
	rateLimitResolver func(context.Context, string) (RateLimitConfig, error)
	logSink           func(context.Context, string, string, map[string]any)
}

func NewManager(storeDir string, logger *slog.Logger) *Manager {
	return &Manager{
		storeDir:        storeDir,
		logger:          logger,
		sessions:        make(map[string]map[string]*Session),
		nextSendAllowed: make(map[string]time.Time),
	}
}

func (m *Manager) SetWebhookResolver(resolver func(context.Context, string) (string, error)) {
	m.webhookResolver = resolver
}

func (m *Manager) SetRateLimitResolver(resolver func(context.Context, string) (RateLimitConfig, error)) {
	m.rateLimitResolver = resolver
}

func (m *Manager) SetLogSink(sink func(context.Context, string, string, map[string]any)) {
	m.logSink = sink
}

func (m *Manager) Create(ctx context.Context, uid string, name string, apiKeyID string) (Record, error) {
	sessionID, err := randomSessionID()
	if err != nil {
		return Record{}, err
	}

	return m.ensure(ctx, uid, sessionID, name, apiKeyID)
}

func (m *Manager) Ensure(ctx context.Context, uid string, sessionID string, name string, apiKeyID string) (Record, error) {
	if record, ok := m.Get(uid, sessionID); ok {
		return record, nil
	}

	return m.ensure(ctx, uid, sessionID, name, apiKeyID)
}

func (m *Manager) ensure(ctx context.Context, uid string, sessionID string, name string, apiKeyID string) (Record, error) {
	storePath := filepath.Join(m.storeDir, uid, sessionID)
	client, err := whatsapp.NewClient(ctx, storePath, nil)
	if err != nil {
		return Record{}, err
	}

	now := time.Now().UTC()
	sess := &Session{
		client: client,
		record: Record{
			ID:        sessionID,
			UID:       uid,
			Name:      name,
			APIKeyID:  apiKeyID,
			Status:    StatusDisconnected,
			StorePath: storePath,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
	client.AddEventHandler(m.eventHandler(sess))

	m.mu.Lock()
	if _, ok := m.sessions[uid]; !ok {
		m.sessions[uid] = make(map[string]*Session)
	}
	m.sessions[uid][sessionID] = sess
	m.mu.Unlock()

	if err := m.connect(ctx, sess); err != nil {
		m.logger.Error("failed to connect whatsapp session", "uid", uid, "sessionID", sessionID, "error", err)
	}

	return sess.Snapshot(), nil
}

func (m *Manager) List(uid string) []Record {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userSessions := m.sessions[uid]
	out := make([]Record, 0, len(userSessions))
	for _, sess := range userSessions {
		out = append(out, sess.Snapshot())
	}
	return out
}

func (m *Manager) Get(uid string, sessionID string) (Record, bool) {
	sess, ok := m.getSession(uid, sessionID)
	if !ok {
		return Record{}, false
	}
	return sess.Snapshot(), true
}

func (m *Manager) QR(uid string, sessionID string) (string, error) {
	sess, ok := m.getSession(uid, sessionID)
	if !ok {
		return "", errors.New("session not found")
	}

	qr := sess.QR()
	if qr == "" {
		return "", errors.New("qr not available")
	}

	return whatsapp.QRToBase64PNG(qr)
}

func (m *Manager) SendText(ctx context.Context, uid string, sessionID string, to string, text string) (string, error) {
	sess, err := m.readySession(ctx, uid, sessionID)
	if err != nil {
		return "", err
	}

	if err := m.waitForSendDelay(ctx, uid); err != nil {
		return "", err
	}

	jid := types.NewJID(normalizePhone(to), "s.whatsapp.net")
	response, err := sess.client.SendMessage(ctx, jid, &waProto.Message{
		Conversation: proto.String(text),
	})
	if err != nil {
		return "", err
	}

	return response.ID, nil
}

type MediaMessage struct {
	To        string
	Data      []byte
	MediaType string
	MimeType  string
	Caption   string
	FileName  string
}

type Contact struct {
	JID           string `json:"jid"`
	Phone         string `json:"phone,omitempty"`
	FirstName     string `json:"firstName,omitempty"`
	FullName      string `json:"fullName,omitempty"`
	PushName      string `json:"pushName,omitempty"`
	BusinessName  string `json:"businessName,omitempty"`
	RedactedPhone string `json:"redactedPhone,omitempty"`
}

type Chat struct {
	JID         string    `json:"jid"`
	Phone       string    `json:"phone,omitempty"`
	Name        string    `json:"name,omitempty"`
	Pinned      bool      `json:"pinned"`
	Archived    bool      `json:"archived"`
	MutedUntil  time.Time `json:"mutedUntil,omitempty"`
	IsGroup     bool      `json:"isGroup"`
	HasSettings bool      `json:"hasSettings"`
}

type IncomingWebhookPayload struct {
	Event     string    `json:"event"`
	SessionID string    `json:"sessionId"`
	MessageID string    `json:"messageId"`
	Chat      string    `json:"chat"`
	Sender    string    `json:"sender"`
	From      string    `json:"from"`
	Text      string    `json:"text,omitempty"`
	Type      string    `json:"type"`
	PushName  string    `json:"pushName,omitempty"`
	IsGroup   bool      `json:"isGroup"`
	Timestamp time.Time `json:"timestamp"`
}

func (m *Manager) SendMedia(ctx context.Context, uid string, sessionID string, media MediaMessage) (string, error) {
	sess, err := m.readySession(ctx, uid, sessionID)
	if err != nil {
		return "", err
	}

	if err := m.waitForSendDelay(ctx, uid); err != nil {
		return "", err
	}

	mimeType := media.MimeType
	if mimeType == "" {
		return "", errors.New("mimeType is required")
	}
	fileName := media.FileName

	appInfo, err := mediaAppInfo(media.MediaType, mimeType)
	if err != nil {
		return "", err
	}
	uploaded, err := sess.client.Upload(ctx, media.Data, appInfo)
	if err != nil {
		return "", err
	}

	msg, err := buildMediaMessage(uploaded, media.MediaType, mimeType, media.Caption, fileName)
	if err != nil {
		return "", err
	}

	jid := types.NewJID(normalizePhone(media.To), "s.whatsapp.net")
	response, err := sess.client.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", err
	}

	return response.ID, nil
}

func (m *Manager) waitForSendDelay(ctx context.Context, uid string) error {
	delay := time.Duration(0)
	if m.rateLimitResolver != nil {
		cfg, err := m.rateLimitResolver(ctx, uid)
		if err != nil {
			m.logger.Warn("failed to load rate limits", "uid", uid, "error", err)
		} else {
			delay = delayDuration(cfg)
		}
	}

	wait := m.reserveSendSlot(uid, delay)
	if wait <= 0 {
		return nil
	}

	timer := time.NewTimer(wait)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func (m *Manager) reserveSendSlot(uid string, delay time.Duration) time.Duration {
	if delay <= 0 {
		return 0
	}

	now := time.Now().UTC()
	m.sendMu.Lock()
	defer m.sendMu.Unlock()

	nextAllowed := m.nextSendAllowed[uid]
	if now.Before(nextAllowed) {
		wait := nextAllowed.Sub(now)
		m.nextSendAllowed[uid] = nextAllowed.Add(delay)
		return wait
	}

	m.nextSendAllowed[uid] = now.Add(delay)
	return 0
}

func (m *Manager) Contacts(ctx context.Context, uid string, sessionID string, limit int) ([]Contact, error) {
	sess, err := m.readySession(ctx, uid, sessionID)
	if err != nil {
		return nil, err
	}
	if sess.client.Store.Contacts == nil {
		return []Contact{}, nil
	}

	contacts, err := sess.client.Store.Contacts.GetAllContacts(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]Contact, 0, len(contacts))
	for jid, info := range contacts {
		out = append(out, Contact{
			JID:           jid.String(),
			Phone:         jid.User,
			FirstName:     info.FirstName,
			FullName:      info.FullName,
			PushName:      info.PushName,
			BusinessName:  info.BusinessName,
			RedactedPhone: info.RedactedPhone,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return contactSortName(out[i]) < contactSortName(out[j])
	})
	if limit > 0 && limit < len(out) {
		out = out[:limit]
	}

	return out, nil
}

func (m *Manager) Chats(ctx context.Context, uid string, sessionID string, limit int) ([]Chat, error) {
	sess, err := m.readySession(ctx, uid, sessionID)
	if err != nil {
		return nil, err
	}
	if sess.client.Store.Contacts == nil {
		return []Chat{}, nil
	}

	contacts, err := sess.client.Store.Contacts.GetAllContacts(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]Chat, 0, len(contacts))
	for jid, info := range contacts {
		chat := Chat{
			JID:     jid.String(),
			Phone:   jid.User,
			Name:    firstNonEmpty(info.FullName, info.PushName, info.BusinessName, info.FirstName, jid.User),
			IsGroup: jid.Server == "g.us",
		}

		if sess.client.Store.ChatSettings != nil {
			settings, err := sess.client.Store.ChatSettings.GetChatSettings(ctx, jid)
			if err == nil && settings.Found {
				chat.Pinned = settings.Pinned
				chat.Archived = settings.Archived
				chat.MutedUntil = settings.MutedUntil
				chat.HasSettings = true
			}
		}
		out = append(out, chat)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Pinned != out[j].Pinned {
			return out[i].Pinned
		}
		return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name)
	})
	if limit > 0 && limit < len(out) {
		out = out[:limit]
	}

	return out, nil
}

func (m *Manager) readySession(ctx context.Context, uid string, sessionID string) (*Session, error) {
	sess, ok := m.getSession(uid, sessionID)
	if !ok {
		return nil, errors.New("session not found")
	}
	if sess.client == nil {
		return nil, errors.New("session client not initialized")
	}
	if sess.client.Store.ID == nil {
		return nil, errors.New("session not logged in")
	}
	if !sess.client.IsConnected() {
		if err := m.connect(ctx, sess); err != nil {
			return nil, err
		}
	}
	if !sess.client.IsConnected() {
		return nil, errors.New("session not connected")
	}

	return sess, nil
}

func contactSortName(contact Contact) string {
	return strings.ToLower(firstNonEmpty(contact.FullName, contact.PushName, contact.BusinessName, contact.FirstName, contact.Phone, contact.JID))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func (m *Manager) Delete(uid string, sessionID string) error {
	m.mu.Lock()
	userSessions := m.sessions[uid]
	sess := userSessions[sessionID]
	if sess != nil {
		delete(userSessions, sessionID)
	}
	m.mu.Unlock()

	storePath := filepath.Join(m.storeDir, uid, sessionID)
	if sess != nil && sess.client != nil {
		sess.client.Disconnect()
	}

	return os.RemoveAll(storePath)
}

func (m *Manager) getSession(uid string, sessionID string) (*Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userSessions := m.sessions[uid]
	if userSessions == nil {
		return nil, false
	}

	sess, ok := userSessions[sessionID]
	return sess, ok
}

func randomSessionID() (string, error) {
	buf := make([]byte, 5)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	enc := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(buf)
	return "ws_" + strings.ToLower(enc), nil
}

func normalizePhone(value string) string {
	value = strings.TrimSpace(value)
	value = strings.TrimPrefix(value, "+")
	if strings.Contains(value, "@") {
		return strings.Split(value, "@")[0]
	}
	return value
}

func mediaAppInfo(mediaType string, mimeType string) (whatsmeow.MediaType, error) {
	switch strings.ToLower(strings.TrimSpace(mediaType)) {
	case "image":
		return whatsmeow.MediaImage, nil
	case "video":
		return whatsmeow.MediaVideo, nil
	case "audio":
		return whatsmeow.MediaAudio, nil
	case "document", "":
		if strings.HasPrefix(mimeType, "image/") {
			return whatsmeow.MediaImage, nil
		}
		if strings.HasPrefix(mimeType, "video/") {
			return whatsmeow.MediaVideo, nil
		}
		if strings.HasPrefix(mimeType, "audio/") {
			return whatsmeow.MediaAudio, nil
		}
		return whatsmeow.MediaDocument, nil
	default:
		return "", errors.New("mediaType must be image, video, audio, or document")
	}
}

func buildMediaMessage(uploaded whatsmeow.UploadResponse, mediaType string, mimeType string, caption string, fileName string) (*waProto.Message, error) {
	baseType, err := mediaAppInfo(mediaType, mimeType)
	if err != nil {
		return nil, err
	}

	switch baseType {
	case whatsmeow.MediaImage:
		return &waProto.Message{ImageMessage: &waProto.ImageMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uploaded.FileLength),
			Mimetype:      proto.String(mimeType),
			Caption:       proto.String(caption),
		}}, nil
	case whatsmeow.MediaVideo:
		return &waProto.Message{VideoMessage: &waProto.VideoMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uploaded.FileLength),
			Mimetype:      proto.String(mimeType),
			Caption:       proto.String(caption),
		}}, nil
	case whatsmeow.MediaAudio:
		return &waProto.Message{AudioMessage: &waProto.AudioMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uploaded.FileLength),
			Mimetype:      proto.String(mimeType),
		}}, nil
	default:
		return &waProto.Message{DocumentMessage: &waProto.DocumentMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uploaded.FileLength),
			Mimetype:      proto.String(mimeType),
			Caption:       proto.String(caption),
			FileName:      proto.String(fileName),
			Title:         proto.String(fileName),
		}}, nil
	}
}

func (m *Manager) connect(ctx context.Context, sess *Session) error {
	if sess.client.IsConnected() {
		snapshot := sess.Snapshot()
		if snapshot.JID != "" {
			sess.SetConnected(snapshot.JID, snapshot.PhoneNumber)
		}
		return nil
	}

	if sess.client.Store.ID != nil || sess.client.IsLoggedIn() {
		return sess.client.ConnectContext(ctx)
	}

	qrChan, err := sess.client.GetQRChannel(ctx)
	if err != nil {
		if sess.client.Store.ID != nil || sess.client.IsLoggedIn() {
			return sess.client.ConnectContext(ctx)
		}
		return err
	}

	go m.consumeQRChannel(sess, qrChan)
	return sess.client.ConnectContext(ctx)
}

func (m *Manager) consumeQRChannel(sess *Session, qrChan <-chan whatsmeow.QRChannelItem) {
	for item := range qrChan {
		switch item.Event {
		case whatsmeow.QRChannelEventCode:
			sess.SetQR(item.Code)
		case "success":
			snapshot := sess.Snapshot()
			m.logger.Info("whatsapp session paired", "uid", snapshot.UID, "sessionID", snapshot.ID)
		case whatsmeow.QRChannelEventError:
			sess.SetDisconnected()
			snapshot := sess.Snapshot()
			m.logger.Error("whatsapp qr pairing failed", "uid", snapshot.UID, "sessionID", snapshot.ID, "error", item.Error)
		default:
			if item.Event != "" {
				sess.SetDisconnected()
			}
		}
	}
}

func (m *Manager) eventHandler(sess *Session) func(any) {
	return func(raw any) {
		switch evt := raw.(type) {
		case *events.Message:
			m.handleIncomingMessage(sess, evt)
		case *events.Connected:
			jid := ""
			phoneNumber := ""
			if sess.client.Store.ID != nil {
				jid = sess.client.Store.ID.String()
				phoneNumber = sess.client.Store.ID.User
			}
			sess.SetConnected(jid, phoneNumber)
			snapshot := sess.Snapshot()
			m.logEvent(context.Background(), snapshot.UID, "session.connected", map[string]any{
				"sessionId":   snapshot.ID,
				"jid":         snapshot.JID,
				"phoneNumber": snapshot.PhoneNumber,
			})
		case *events.PairSuccess:
			sess.SetConnected(evt.ID.String(), evt.ID.User)
			snapshot := sess.Snapshot()
			m.logEvent(context.Background(), snapshot.UID, "session.paired", map[string]any{
				"sessionId":   snapshot.ID,
				"jid":         snapshot.JID,
				"phoneNumber": snapshot.PhoneNumber,
			})
		case *events.Disconnected, *events.LoggedOut:
			sess.SetDisconnected()
			snapshot := sess.Snapshot()
			m.logEvent(context.Background(), snapshot.UID, "session.disconnected", map[string]any{
				"sessionId": snapshot.ID,
			})
		}
	}
}

func (m *Manager) handleIncomingMessage(sess *Session, evt *events.Message) {
	if evt.Info.IsFromMe || evt.Message == nil {
		return
	}

	text := incomingText(evt.Message)
	if text == "" {
		return
	}

	snapshot := sess.Snapshot()
	payload := IncomingWebhookPayload{
		Event:     "message.received",
		SessionID: snapshot.ID,
		MessageID: string(evt.Info.ID),
		Chat:      evt.Info.Chat.String(),
		Sender:    evt.Info.Sender.String(),
		From:      evt.Info.Sender.User,
		Text:      text,
		Type:      evt.Info.Type,
		PushName:  evt.Info.PushName,
		IsGroup:   evt.Info.IsGroup,
		Timestamp: evt.Info.Timestamp,
	}

	go m.deliverIncomingWebhook(context.Background(), snapshot.UID, payload)
	m.logEvent(context.Background(), snapshot.UID, "message.received", map[string]any{
		"sessionId": snapshot.ID,
		"messageId": payload.MessageID,
		"from":      payload.From,
		"chat":      payload.Chat,
		"type":      payload.Type,
	})
}

func incomingText(message *waProto.Message) string {
	if text := strings.TrimSpace(message.GetConversation()); text != "" {
		return text
	}
	if extended := message.GetExtendedTextMessage(); extended != nil {
		return strings.TrimSpace(extended.GetText())
	}
	if image := message.GetImageMessage(); image != nil {
		return strings.TrimSpace(image.GetCaption())
	}
	if video := message.GetVideoMessage(); video != nil {
		return strings.TrimSpace(video.GetCaption())
	}
	if document := message.GetDocumentMessage(); document != nil {
		return strings.TrimSpace(document.GetCaption())
	}
	return ""
}

func (m *Manager) deliverIncomingWebhook(ctx context.Context, uid string, payload IncomingWebhookPayload) {
	if m.webhookResolver == nil {
		return
	}

	webhookURL, err := m.webhookResolver(ctx, uid)
	if err != nil || strings.TrimSpace(webhookURL) == "" {
		m.logEvent(ctx, uid, "webhook.skipped", map[string]any{
			"sessionId": payload.SessionID,
			"messageId": payload.MessageID,
			"reason":    "webhook url not configured",
		})
		return
	}

	body, err := json.Marshal(payload)
	if err != nil {
		m.logger.Error("failed to encode incoming webhook payload", "uid", uid, "error", err)
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		m.logger.Error("failed to create incoming webhook request", "uid", uid, "error", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "wire-webhook/1.0")
	req.Header.Set("X-Wire-Event", payload.Event)
	req.Header.Set("X-Wire-Session-ID", payload.SessionID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		m.logger.Error("failed to deliver incoming webhook", "uid", uid, "url", webhookURL, "error", err)
		m.logEvent(ctx, uid, "webhook.failed", map[string]any{
			"sessionId": payload.SessionID,
			"messageId": payload.MessageID,
			"url":       webhookURL,
			"error":     err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		m.logger.Error("incoming webhook returned non-2xx", "uid", uid, "url", webhookURL, "status", resp.StatusCode)
		m.logEvent(ctx, uid, "webhook.failed", map[string]any{
			"sessionId": payload.SessionID,
			"messageId": payload.MessageID,
			"url":       webhookURL,
			"status":    resp.StatusCode,
		})
		return
	}

	m.logEvent(ctx, uid, "webhook.delivered", map[string]any{
		"sessionId": payload.SessionID,
		"messageId": payload.MessageID,
		"url":       webhookURL,
		"status":    resp.StatusCode,
	})
}

func (m *Manager) logEvent(ctx context.Context, uid string, event string, metadata map[string]any) {
	if m.logSink == nil {
		return
	}
	m.logSink(ctx, uid, event, metadata)
}
