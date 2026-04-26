#!/bin/sh
set -e

DB_CONTAINER=hq-postgres

if [ "$1" = "stop" ]; then
  docker stop "$DB_CONTAINER"
  exit 0
fi

if ! docker ps -q --filter "name=^${DB_CONTAINER}$" | grep -q .; then
  if docker ps -aq --filter "name=^${DB_CONTAINER}$" | grep -q .; then
    docker start "$DB_CONTAINER"
  else
    docker run -d --name "$DB_CONTAINER" \
      -e POSTGRES_USER=hq -e POSTGRES_PASSWORD=hq -e POSTGRES_DB=hq \
      -p 5432:5432 -v hq-postgres-data:/var/lib/postgresql/data \
      postgres:17-alpine
  fi
  until docker exec "$DB_CONTAINER" pg_isready -U hq -q 2>/dev/null; do sleep 0.5; done
fi

DATABASE_URL=postgres://hq:hq@localhost/hq deno run --allow-net --allow-read --allow-write --allow-env --allow-run hq.js "$@"
