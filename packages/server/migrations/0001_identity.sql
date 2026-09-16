CREATE TABLE users (
  userId TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE (issuer, subject)
);
CREATE TABLE connections (
  connectionId TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(userId),
  provider TEXT NOT NULL CHECK (provider = 'lunchmoney'),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
  state TEXT NOT NULL CHECK (state IN ('pending', 'active', 'invalid', 'revoked', 'deletion_pending', 'deleted')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX one_live_connection ON connections(userId) WHERE state IN ('pending', 'active');
