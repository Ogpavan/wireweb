package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port              string
	AllowedOrigins    []string
	FirebaseProjectID string
	StoreDir          string
}

func Load() Config {
	appEnv := strings.ToLower(env("APP_ENV", "local"))
	if appEnv == "production" {
		loadDotEnv(".env.production")
	} else {
		loadDotEnv(".env.local")
	}

	return Config{
		Port:              env("PORT", "8080"),
		AllowedOrigins:    splitCSV(env("ALLOWED_ORIGINS", "http://localhost:5173")),
		FirebaseProjectID: env("FIREBASE_PROJECT_ID", ""),
		StoreDir:          env("WHATSAPP_STORE_DIR", "store"),
	}
}

func env(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}

	return out
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		_ = os.Setenv(key, trimEnvValue(value))
	}
}

func trimEnvValue(value string) string {
	value = strings.TrimSpace(value)
	if len(value) < 2 {
		return value
	}

	quote := value[0]
	if (quote == '"' || quote == '\'') && value[len(value)-1] == quote {
		return value[1 : len(value)-1]
	}

	return value
}
