package session

import (
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
)

type Status string

const (
	StatusDisconnected Status = "disconnected"
	StatusPairing      Status = "pairing"
	StatusConnected    Status = "connected"
)

type Record struct {
	ID              string    `json:"id"`
	UID             string    `json:"uid"`
	Name            string    `json:"name"`
	APIKeyID        string    `json:"apiKeyId"`
	Status          Status    `json:"status"`
	JID             string    `json:"jid,omitempty"`
	PhoneNumber     string    `json:"phoneNumber,omitempty"`
	StorePath       string    `json:"storePath"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	LastConnectedAt time.Time `json:"lastConnectedAt,omitempty"`
}

type Session struct {
	record Record
	client *whatsmeow.Client
	qr     string
	mu     sync.RWMutex
}

func (s *Session) Snapshot() Record {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.record
}

func (s *Session) SetQR(qr string) {
	s.mu.Lock()
	s.qr = qr
	s.record.Status = StatusPairing
	s.record.UpdatedAt = time.Now().UTC()
	s.mu.Unlock()
}

func (s *Session) QR() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.qr
}

func (s *Session) SetConnected(jid string, phoneNumber string) {
	s.mu.Lock()
	s.qr = ""
	s.record.JID = jid
	s.record.PhoneNumber = phoneNumber
	s.record.Status = StatusConnected
	s.record.LastConnectedAt = time.Now().UTC()
	s.record.UpdatedAt = s.record.LastConnectedAt
	s.mu.Unlock()
}

func (s *Session) SetDisconnected() {
	s.mu.Lock()
	s.record.Status = StatusDisconnected
	s.record.UpdatedAt = time.Now().UTC()
	s.mu.Unlock()
}
