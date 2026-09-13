#!/bin/sh
set -eu

if [ -z "${RUNTIME_DB_PASSWORD:-}" ]; then
  echo "RUNTIME_DB_PASSWORD is required" >&2
  exit 1
fi

psql --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=runtime_password="$RUNTIME_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE atendeai_runtime LOGIN PASSWORD %L', :'runtime_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atendeai_runtime') \gexec

GRANT CONNECT ON DATABASE atendeai TO atendeai_runtime;
GRANT USAGE ON SCHEMA public TO atendeai_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO atendeai_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO atendeai_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE atendeai_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO atendeai_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE atendeai_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO atendeai_runtime;
SQL
