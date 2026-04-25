package auth

import (
	"context"

	firebaseauth "firebase.google.com/go/v4/auth"
)

type contextKey struct{}

type User struct {
	UID   string
	Email string
	Token *firebaseauth.Token
}

func WithUser(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, contextKey{}, user)
}

func UserFromContext(ctx context.Context) (User, bool) {
	user, ok := ctx.Value(contextKey{}).(User)
	return user, ok
}
