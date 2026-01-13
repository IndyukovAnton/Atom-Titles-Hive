# Environment Variables Setup Guide

This document describes the environment variables required to run the backend application.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your local or production settings.

## Configuration Variables

### Core settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | The port on which the server listens | No | `1221` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | No | `development` |

### Security

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens. **Must be at least 32 characters in production.** | **Yes** | - |
| `JWT_EXPIRES_IN` | JWT token expiration time (e.g., `7d`, `1h`) | **Yes** | - |

### Database

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_PATH` | Path to the SQLite database file | **Yes** | - |
| `TYPEORM_SYNCHRONIZE` | Auto-sync schema schema (unsafe in prod) | No | `false` |
| `TYPEORM_LOGGING` | Enable SQL query logging | No | `false` |

### Logging

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `LOG_RETENTION_DAYS` | Number of days to keep logs | No | `30` |

## Validation

The application performs strict validation of environment variables on startup.
If any required variable is missing or invalid, the application will fail to start with a descriptive error message.

See `src/config/env.validation.ts` for validation logic.

## Troubleshooting

### "JWT_SECRET must be at least 32 characters long"
Ensure your `JWT_SECRET` in `.env` is sufficiently long and complex.

### "Config validation error: ..."
Check the error message for the specific variable that is missing or incorrect in your `.env` file.
