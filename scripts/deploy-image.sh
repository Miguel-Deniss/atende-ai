#!/bin/sh
set -eu

APP_DIR=/opt/atendeai
APP_CONTAINER=atendeai-app
ROLLBACK_CONTAINER=atendeai-app-rollback
UPLOAD_VOLUME=atendeai_uploads

cd "$APP_DIR"
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io --username "$GHCR_USER" --password-stdin
docker pull "$APP_IMAGE"
docker pull "$MIGRATOR_IMAGE"

# Migrations are applied before the application switch and use DIRECT_URL from the protected env file.
docker run --rm --env-file "$APP_DIR/.env" "$MIGRATOR_IMAGE"

docker rm -f "$ROLLBACK_CONTAINER" >/dev/null 2>&1 || true
if docker inspect "$APP_CONTAINER" >/dev/null 2>&1; then
  docker stop "$APP_CONTAINER"
  docker rename "$APP_CONTAINER" "$ROLLBACK_CONTAINER"
fi

rollback() {
  docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
  if docker inspect "$ROLLBACK_CONTAINER" >/dev/null 2>&1; then
    docker rename "$ROLLBACK_CONTAINER" "$APP_CONTAINER"
    docker start "$APP_CONTAINER"
  fi
}
trap rollback INT TERM HUP

if ! docker run -d \
  --name "$APP_CONTAINER" \
  --restart unless-stopped \
  --env-file "$APP_DIR/.env" \
  --publish 127.0.0.1:3000:3000 \
  --volume "$UPLOAD_VOLUME:/app/data/uploads" \
  "$APP_IMAGE"; then
  rollback
  exit 1
fi

healthy=false
attempt=1
while [ "$attempt" -le 20 ]; do
  if curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 3
  attempt=$((attempt + 1))
done

if [ "$healthy" != true ]; then
  docker logs --tail 100 "$APP_CONTAINER" || true
  rollback
  exit 1
fi

trap - INT TERM HUP
docker rm -f "$ROLLBACK_CONTAINER" >/dev/null 2>&1 || true
