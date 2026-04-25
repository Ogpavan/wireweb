package auth

import (
	"context"
	"net/http"
	"strings"

	firebaseauth "firebase.google.com/go/v4/auth"
)

type Verifier interface {
	VerifyIDToken(ctx context.Context, idToken string) (*firebaseauth.Token, error)
}

func Middleware(verifier Verifier, writeUnauthorized func(http.ResponseWriter, string)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := bearerToken(r.Header.Get("Authorization"))
			if token == "" {
				writeUnauthorized(w, "missing bearer token")
				return
			}

			verifiedToken, err := verifier.VerifyIDToken(r.Context(), token)
			if err != nil {
				writeUnauthorized(w, "invalid firebase token")
				return
			}

			email, _ := verifiedToken.Claims["email"].(string)
			user := User{
				UID:   verifiedToken.UID,
				Email: email,
				Token: verifiedToken,
			}

			next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), user)))
		})
	}
}

func bearerToken(header string) string {
	parts := strings.Fields(header)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}
