package session

import "time"

type RateLimitConfig struct {
	MessagePerMinute  int `json:"messagePerMinute"`
	MediaPerMinute    int `json:"mediaPerMinute"`
	APIKeyPerMinute   int `json:"apiKeyPerMinute"`
	SessionPerMinute  int `json:"sessionPerMinute"`
	WebhookPerMinute  int `json:"webhookPerMinute"`
	ContactsPerMinute int `json:"contactsPerMinute"`
	ChatsPerMinute    int `json:"chatsPerMinute"`
	LogsPerMinute     int `json:"logsPerMinute"`
	SendDelayMs       int `json:"sendDelayMs"`
}

func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		MessagePerMinute:  60,
		MediaPerMinute:    30,
		APIKeyPerMinute:   15,
		SessionPerMinute:  10,
		WebhookPerMinute:  120,
		ContactsPerMinute: 40,
		ChatsPerMinute:    40,
		LogsPerMinute:     120,
		SendDelayMs:       0,
	}
}

func NormalizeRateLimitConfig(cfg RateLimitConfig) RateLimitConfig {
	if cfg.MessagePerMinute < 0 {
		cfg.MessagePerMinute = 0
	}
	if cfg.MediaPerMinute < 0 {
		cfg.MediaPerMinute = 0
	}
	if cfg.APIKeyPerMinute < 0 {
		cfg.APIKeyPerMinute = 0
	}
	if cfg.SessionPerMinute < 0 {
		cfg.SessionPerMinute = 0
	}
	if cfg.WebhookPerMinute < 0 {
		cfg.WebhookPerMinute = 0
	}
	if cfg.ContactsPerMinute < 0 {
		cfg.ContactsPerMinute = 0
	}
	if cfg.ChatsPerMinute < 0 {
		cfg.ChatsPerMinute = 0
	}
	if cfg.LogsPerMinute < 0 {
		cfg.LogsPerMinute = 0
	}
	if cfg.SendDelayMs < 0 {
		cfg.SendDelayMs = 0
	}
	return cfg
}

func RateLimitConfigFromMap(data map[string]any) RateLimitConfig {
	cfg := DefaultRateLimitConfig()
	raw, ok := data["rateLimits"].(map[string]any)
	if !ok || raw == nil {
		return cfg
	}

	if value, ok := intFromAny(raw["messagePerMinute"]); ok {
		cfg.MessagePerMinute = value
	}
	if value, ok := intFromAny(raw["mediaPerMinute"]); ok {
		cfg.MediaPerMinute = value
	}
	if value, ok := intFromAny(raw["apiKeyPerMinute"]); ok {
		cfg.APIKeyPerMinute = value
	}
	if value, ok := intFromAny(raw["sessionPerMinute"]); ok {
		cfg.SessionPerMinute = value
	}
	if value, ok := intFromAny(raw["webhookPerMinute"]); ok {
		cfg.WebhookPerMinute = value
	}
	if value, ok := intFromAny(raw["contactsPerMinute"]); ok {
		cfg.ContactsPerMinute = value
	}
	if value, ok := intFromAny(raw["chatsPerMinute"]); ok {
		cfg.ChatsPerMinute = value
	}
	if value, ok := intFromAny(raw["logsPerMinute"]); ok {
		cfg.LogsPerMinute = value
	}
	if value, ok := intFromAny(raw["sendDelayMs"]); ok {
		cfg.SendDelayMs = value
	}

	return NormalizeRateLimitConfig(cfg)
}

func (cfg RateLimitConfig) ToMap() map[string]any {
	return map[string]any{
		"messagePerMinute":  cfg.MessagePerMinute,
		"mediaPerMinute":    cfg.MediaPerMinute,
		"apiKeyPerMinute":   cfg.APIKeyPerMinute,
		"sessionPerMinute":  cfg.SessionPerMinute,
		"webhookPerMinute":  cfg.WebhookPerMinute,
		"contactsPerMinute": cfg.ContactsPerMinute,
		"chatsPerMinute":    cfg.ChatsPerMinute,
		"logsPerMinute":     cfg.LogsPerMinute,
		"sendDelayMs":       cfg.SendDelayMs,
	}
}

func intFromAny(value any) (int, bool) {
	switch typed := value.(type) {
	case int:
		return typed, true
	case int32:
		return int(typed), true
	case int64:
		return int(typed), true
	case float64:
		return int(typed), true
	case float32:
		return int(typed), true
	default:
		return 0, false
	}
}

func delayDuration(cfg RateLimitConfig) time.Duration {
	return time.Duration(cfg.SendDelayMs) * time.Millisecond
}
