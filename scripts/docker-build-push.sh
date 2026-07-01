#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-ghcr.io/cyrus-ego/findu-frontend}"
PLATFORM="${PLATFORM:-linux/arm64}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.chatvn.online/api}"
NEXT_PUBLIC_SOCKET_URL="${NEXT_PUBLIC_SOCKET_URL:-https://api.chatvn.online}"
NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-https://api.chatvn.online}"
TAG_SHA="${TAG_SHA:-$(git rev-parse HEAD)}"
OUTPUT_MODE="--push"

usage() {
  cat <<EOF
Build and publish the frontend Docker image.

Usage:
  scripts/docker-build-push.sh [options]

Options:
  --image IMAGE             Image name. Default: ${IMAGE_NAME}
  --platform PLATFORM       Docker target platform. Default: ${PLATFORM}
  --api-url URL             NEXT_PUBLIC_API_URL. Default: ${NEXT_PUBLIC_API_URL}
  --socket-url URL          NEXT_PUBLIC_SOCKET_URL. Default: ${NEXT_PUBLIC_SOCKET_URL}
  --backend-url URL         NEXT_PUBLIC_BACKEND_URL. Default: ${NEXT_PUBLIC_BACKEND_URL}
  --tag TAG                 Commit tag. Default: current git HEAD
  --load                    Load image into local Docker instead of pushing
  -h, --help                Show this help

Environment overrides:
  IMAGE_NAME, PLATFORM, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_BACKEND_URL, TAG_SHA
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --api-url)
      NEXT_PUBLIC_API_URL="$2"
      shift 2
      ;;
    --socket-url)
      NEXT_PUBLIC_SOCKET_URL="$2"
      shift 2
      ;;
    --backend-url)
      NEXT_PUBLIC_BACKEND_URL="$2"
      shift 2
      ;;
    --tag)
      TAG_SHA="$2"
      shift 2
      ;;
    --load | --no-push)
      OUTPUT_MODE="--load"
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

echo "Building ${IMAGE_NAME}:latest"
echo "Building ${IMAGE_NAME}:${TAG_SHA}"
echo "Platform: ${PLATFORM}"
echo "Output: ${OUTPUT_MODE}"

docker build \
  --platform "${PLATFORM}" \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}" \
  --build-arg "NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}" \
  -t "${IMAGE_NAME}:latest" \
  -t "${IMAGE_NAME}:${TAG_SHA}" \
  "${OUTPUT_MODE}" \
  .
