package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"wire-server/internal/config"
	firebaseclient "wire-server/internal/firebase"
	"wire-server/internal/httpapi"
	"wire-server/internal/session"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg := config.Load()
	if storeDir, err := filepath.Abs(cfg.StoreDir); err == nil {
		logger.Info("whatsapp store directory", "path", storeDir)
	}
	ctx := context.Background()

	firebaseClients, err := firebaseclient.New(ctx, cfg.FirebaseProjectID)
	if err != nil {
		logger.Error("failed to initialize firebase", "error", err)
		os.Exit(1)
	}
	defer firebaseClients.Close()

	sessionManager := session.NewManager(cfg.StoreDir, logger)
	sessionManager.SetWebhookResolver(func(ctx context.Context, uid string) (string, error) {
		snapshot, err := firebaseClients.Firestore.Collection("users").Doc(uid).Get(ctx)
		if err != nil {
			return "", err
		}
		value, _ := snapshot.Data()["webhookUrl"].(string)
		return value, nil
	})
	sessionManager.SetRateLimitResolver(func(ctx context.Context, uid string) (session.RateLimitConfig, error) {
		snapshot, err := firebaseClients.Firestore.Collection("users").Doc(uid).Get(ctx)
		if err != nil {
			if status.Code(err) == codes.NotFound {
				return session.DefaultRateLimitConfig(), nil
			}
			return session.DefaultRateLimitConfig(), err
		}
		return session.RateLimitConfigFromMap(snapshot.Data()), nil
	})
	sessionManager.SetLogSink(func(ctx context.Context, uid string, event string, metadata map[string]any) {
		_, _, err := firebaseClients.Firestore.Collection("users").Doc(uid).Collection("logs").Add(ctx, map[string]any{
			"event":     event,
			"metadata":  metadata,
			"createdAt": time.Now().UTC(),
		})
		if err != nil {
			logger.Error("failed to write user log", "uid", uid, "event", event, "error", err)
		}
	})
	router := httpapi.NewRouter(httpapi.RouterConfig{
		Config:          cfg,
		Logger:          logger,
		AuthClient:      firebaseClients.Auth,
		FirestoreClient: firebaseClients.Firestore,
		SessionManager:  sessionManager,
	})

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("server listening", "addr", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown failed", "error", err)
		os.Exit(1)
	}

	logger.Info("server stopped")
}
