package firebase

import (
	"context"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type Clients struct {
	Auth      *auth.Client
	Firestore *firestore.Client
}

func New(ctx context.Context, projectID string) (*Clients, error) {
	options := []option.ClientOption{}
	config := &firebase.Config{}

	if projectID != "" {
		config.ProjectID = projectID
	}

	app, err := firebase.NewApp(ctx, config, options...)
	if err != nil {
		return nil, err
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, err
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		return nil, err
	}

	return &Clients{
		Auth:      authClient,
		Firestore: firestoreClient,
	}, nil
}

func (c *Clients) Close() {
	if c == nil || c.Firestore == nil {
		return
	}
	_ = c.Firestore.Close()
}
