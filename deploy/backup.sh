#!/bin/sh
set -eu
cd /srv/my-web
docker compose exec -T -e BACKUP_DIR=/backups web node scripts/database-backup.mjs
# Intentionally retain all snapshots; review storage before adding a retention policy.
