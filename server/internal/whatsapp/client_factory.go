package whatsapp

import (
	"context"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func NewClient(ctx context.Context, sessionDir string, handler func(any)) (*whatsmeow.Client, error) {
	if err := os.MkdirAll(sessionDir, 0o755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(sessionDir, "whatsapp.db")
	container, err := sqlstore.New(ctx, "sqlite3", "file:"+dbPath+"?_foreign_keys=on", waLog.Stdout("wire/whatsapp", "INFO", true))
	if err != nil {
		return nil, err
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, err
	}
	if deviceStore == nil {
		deviceStore = container.NewDevice()
	}

	client := whatsmeow.NewClient(deviceStore, nil)
	if handler != nil {
		client.AddEventHandler(handler)
	}

	return client, nil
}
