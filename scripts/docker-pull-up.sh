#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
SERVICE="${SERVICE:-frontend}"
IMAGE_NAME_OVERRIDE="${IMAGE_NAME:-}"
IMAGE_TAG_OVERRIDE="${IMAGE_TAG:-}"
PRUNE=0
PULL=1

usage() {
  cat <<EOF
Pull the published frontend Docker image and restart it with Docker Compose.

Usage:
  scripts/docker-pull-up.sh [options]

Options:
  --image IMAGE             Override IMAGE_NAME for compose
  --tag TAG                 Override IMAGE_TAG for compose. Default from env file/compose: latest
  --env-file FILE           Compose env file. Default: ${ENV_FILE}
  --compose-file FILE       Compose file. Default: ${COMPOSE_FILE}
  --service SERVICE         Compose service. Default: ${SERVICE}
  --no-pull                 Skip docker compose pull
  --prune                   Run docker image prune -f after up
  -h, --help                Show this help

Environment overrides:
  IMAGE_NAME, IMAGE_TAG, ENV_FILE, COMPOSE_FILE, SERVICE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE_NAME_OVERRIDE="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG_OVERRIDE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --no-pull)
      PULL=0
      shift
      ;;
    --prune)
      PRUNE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  echo "Create it from .env.example or pass --env-file FILE." >&2
  exit 1
fi

compose_env=()
if [[ -n "${IMAGE_NAME_OVERRIDE}" ]]; then
  compose_env+=("IMAGE_NAME=${IMAGE_NAME_OVERRIDE}")
fi

if [[ -n "${IMAGE_TAG_OVERRIDE}" ]]; then
  compose_env+=("IMAGE_TAG=${IMAGE_TAG_OVERRIDE}")
fi

compose_cmd=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

echo "Compose file: ${COMPOSE_FILE}"
echo "Env file: ${ENV_FILE}"
echo "Service: ${SERVICE}"
if [[ -n "${IMAGE_NAME_OVERRIDE}" ]]; then
  echo "Image override: ${IMAGE_NAME_OVERRIDE}"
fi
if [[ -n "${IMAGE_TAG_OVERRIDE}" ]]; then
  echo "Tag override: ${IMAGE_TAG_OVERRIDE}"
fi

if [[ "${PULL}" -eq 1 ]]; then
  echo "Pulling image..."
  env "${compose_env[@]}" "${compose_cmd[@]}" pull "${SERVICE}"
fi

echo "Starting ${SERVICE}..."
env "${compose_env[@]}" "${compose_cmd[@]}" up -d "${SERVICE}"

if [[ "${PRUNE}" -eq 1 ]]; then
  echo "Pruning dangling images..."
  docker image prune -f
fi

echo "Current status:"
env "${compose_env[@]}" "${compose_cmd[@]}" ps "${SERVICE}"
