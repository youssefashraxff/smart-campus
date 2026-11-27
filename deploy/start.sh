#!/bin/sh
# Container entry point for the Render deployment (see render.yaml). Not used for local development.
set -e

# Render gives the database as separate parts; Spring wants one JDBC URL.
if [ -n "$DB_HOST" ]; then
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
fi

# Only the gateway container sets SEED_DATABASE=true: once every service has run its Flyway
# migrations, load db/seed.sql if the users table is still empty (i.e. first deploy only).
if [ "$SEED_DATABASE" = "true" ]; then
  (
    export PGPASSWORD="$SPRING_DATASOURCE_PASSWORD"
    q() { psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$SPRING_DATASOURCE_USERNAME" -d "$DB_NAME" -tAc "$1" 2>/dev/null; }
    for i in $(seq 1 120); do
      n=$(q "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN
             ('users','facilities','events','speakers','bookings','registrations','notifications')")
      if [ "$n" = "7" ]; then
        if [ "$(q 'SELECT COUNT(*) FROM users')" = "0" ]; then
          echo "[seed] loading db/seed.sql"
          psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$SPRING_DATASOURCE_USERNAME" -d "$DB_NAME" \
               -v ON_ERROR_STOP=1 -q -f /app/seed.sql && echo "[seed] done"
        else
          echo "[seed] users already present, skipping"
        fi
        exit 0
      fi
      sleep 15
    done
    echo "[seed] gave up waiting for the services' tables"
  ) &
fi

exec java -Dserver.port="${PORT:-8080}" -jar /app/app.jar
