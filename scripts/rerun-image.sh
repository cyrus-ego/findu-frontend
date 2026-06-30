#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-findu-frontend}"
IMAGE_REF="${IMAGE_REF:-ghcr.io/cyrus-ego/findu-frontend:latest}"
LOCAL_PORT="${LOCAL_PORT:-3002}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
SKIP_PROMPTS=0

usage() {
  cat <<EOF
Stop, remove, rebuild, and run the frontend Docker image locally.
When run interactively, the script asks for the local and container ports.

Usage:
  scripts/rerun-image.sh [options]

Options:
  --name NAME              Container name. Default: ${CONTAINER_NAME}
  --image IMAGE            Image ref. Default: ${IMAGE_REF}
  --local-port PORT        Host/local port. Default: ${LOCAL_PORT}
  --container-port PORT    Container app port. Default: ${CONTAINER_PORT}
  -y, --yes                Use defaults/non-interactive values without port prompts
  -h, --help               Show this help

Environment overrides:
  CONTAINER_NAME, IMAGE_REF, LOCAL_PORT, CONTAINER_PORT
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --image)
      IMAGE_REF="$2"
      shift 2
      ;;
    --local-port)
      LOCAL_PORT="$2"
      shift 2
      ;;
    --container-port)
      CONTAINER_PORT="$2"
      shift 2
      ;;
    -y | --yes)
      SKIP_PROMPTS=1
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

prompt_port() {
  local label="$1"
  local current="$2"
  local value

  if [[ "${SKIP_PROMPTS}" -eq 1 || ! -r /dev/tty ]]; then
    printf '%s' "${current}"
    return
  fi

  read -r -p "${label} [${current}]: " value </dev/tty
  printf '%s' "${value:-$current}"
}

LOCAL_PORT="$(prompt_port "Local/host port" "${LOCAL_PORT}")"
CONTAINER_PORT="$(prompt_port "Container port" "${CONTAINER_PORT}")"

echo "Container: ${CONTAINER_NAME}"
echo "Image: ${IMAGE_REF}"
echo "Port mapping: ${LOCAL_PORT}:${CONTAINER_PORT}"

if docker ps -a --format '{{.Names}}' | grep -Fxq "${CONTAINER_NAME}"; then
  echo "Stopping ${CONTAINER_NAME}..."
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true

  echo "Removing ${CONTAINER_NAME}..."
  docker rm "${CONTAINER_NAME}" >/dev/null
else
  echo "No existing ${CONTAINER_NAME} container found."
fi

echo "Building local Docker image..."
npm run docker:build

echo "Starting ${CONTAINER_NAME}..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -e "PORT=${CONTAINER_PORT}" \
  -p "${LOCAL_PORT}:${CONTAINER_PORT}" \
  "${IMAGE_REF}"

echo "Started ${CONTAINER_NAME}: http://localhost:${LOCAL_PORT}"
