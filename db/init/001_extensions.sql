-- Runs once, on first initialization of an empty data directory
-- (via /docker-entrypoint-initdb.d). Keep this limited to extensions only.
-- Table/schema creation is owned by EF Core migrations, not this file.

-- Provides uuid_generate_v4(), used as the server-side default for UUID PKs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
