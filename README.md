# FinTrack

Digital Wallet & Smart Finance Analytics Platform.

## Backend stack

**PostgreSQL + ASP.NET Core Web API (C#, .NET 8) + Entity Framework Core + Kong API Gateway + Docker Compose.**

EF Core migrations are the canonical schema system. In Development the backend
applies pending migrations automatically on startup. The frontend is not built yet.

## Project layout

```
fintrack/
  docker-compose.yml
  .env.example
  backend/
    Dockerfile
    FinTrack.Api/
      Controllers/   Health, Users, Accounts, Transactions, Budgets, Analytics
      Data/          FinTrackDbContext + design-time factory
      Models/        User, Account, Transaction, Budget
      DTOs/          request/response contracts
      Migrations/    EF Core migrations (canonical schema)
  gateway/
    kong.yml         Kong declarative config (DB-less mode)
  db/
    init/
      001_extensions.sql   PostgreSQL extensions only (no tables)
```

## Run everything

```bash
docker compose up --build
```

Services:

| Service  | URL / Port                     | Notes                                  |
|----------|--------------------------------|----------------------------------------|
| Backend  | http://localhost:8000          | Direct ASP.NET Core API                |
| Gateway  | http://localhost:8080/api      | Kong proxy → backend (strips `/api`)   |
| Kong admin | http://localhost:8001        | Kong admin API                         |
| Postgres | localhost:5432                 | Database `fintrack`                    |

## Verify

```bash
# Direct backend
curl http://localhost:8000/health

# Through the Kong gateway (the /api prefix is stripped before reaching the backend)
curl http://localhost:8080/api/health
```

Both return:

```json
{"status":"ok"}
```

## API endpoints

All paths are relative to the backend root (or to `/api` via the gateway).

| Method | Path                                              | Description                          |
|--------|---------------------------------------------------|--------------------------------------|
| GET    | `/health`                                         | Health check                         |
| POST   | `/users`                                          | Create user                          |
| GET    | `/users/{id}`                                     | Get user by id                       |
| POST   | `/accounts`                                        | Create account                       |
| GET    | `/accounts` (optional `?userId=`)                 | List accounts                        |
| GET    | `/accounts/{id}`                                  | Get account by id                    |
| POST   | `/transactions`                                    | Create transaction                   |
| GET    | `/transactions` (optional `?userId=` / `?accountId=`) | List transactions               |
| GET    | `/transactions/{id}`                              | Get transaction by id                |
| POST   | `/budgets`                                         | Create budget                        |
| GET    | `/budgets` (optional `?userId=`)                  | List budgets                         |
| GET    | `/budgets/{id}`                                   | Get budget by id                     |
| GET    | `/analytics/spending-by-category?userId=<uuid>`   | Total spending grouped by category   |

There is no authentication yet; pass `userId` explicitly in request bodies/queries.
In Development, Swagger UI is available at http://localhost:8000/swagger.

## Database

Connection details (from the host):

| Setting  | Value            |
|----------|------------------|
| Host     | localhost        |
| Port     | 5432             |
| Database | fintrack         |
| User     | fintrack_user    |
| Password | fintrack_password|

Inspect with `psql`:

```bash
docker exec -it fintrack_postgres psql -U fintrack_user -d fintrack
# then, e.g.:
#   \dt              list tables
#   \d transactions  describe a table
```

You can also connect with any standard PostgreSQL client — **pgAdmin, DBeaver, or
DataGrip** — using the connection details above.

## Migrations

Migrations are applied **automatically in Development** when the backend starts
(`Database.Migrate()` in `Program.cs`).

To work with migrations locally you need the .NET 8 SDK and the EF Core tools.
This repo pins `dotnet-ef` via a local tool manifest, so first run:

```bash
dotnet tool restore
```

Create a new migration:

```bash
dotnet ef migrations add <MigrationName> \
  --project backend/FinTrack.Api \
  --startup-project backend/FinTrack.Api
```

Apply migrations to a database manually (e.g. against a running Postgres):

```bash
dotnet ef database update \
  --project backend/FinTrack.Api \
  --startup-project backend/FinTrack.Api
```
