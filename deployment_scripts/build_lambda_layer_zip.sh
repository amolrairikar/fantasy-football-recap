#!/bin/bash
# =============================================================================
# create_lambda_layer.sh
# Creates an AWS Lambda layer zip for one or more Python packages.
# When multiple packages are provided, they are installed together so that
# shared dependencies (e.g. numpy) are deduplicated.
#
# Usage:
#   ./create_lambda_layer.sh <layer_name> <python_version> <package> [package2 ...]
#
# Examples:
#   ./create_lambda_layer.sh pandas_duckdb 3.13 pandas duckdb
#   ./create_lambda_layer.sh pandas 3.13 pandas
# =============================================================================
 
set -euo pipefail
 
# ── Args ─────────────────────────────────────────────────────────────────────
LAYER_NAME="${1:-}"
PYTHON_VERSION="${2:-3.13}"
 
if [[ -z "$LAYER_NAME" || $# -lt 3 ]]; then
  echo "❌  Usage: $0 <layer_name> <python_version> <package> [package2 ...]"
  echo "   Example: $0 pandas_duckdb 3.13 pandas duckdb"
  exit 1
fi
 
# All remaining args are packages
shift 2
PACKAGES=("$@")
 
PYTHON_MINOR="python${PYTHON_VERSION}"
LAYER_DIR="lambda_layer_${LAYER_NAME}"
SITE_PACKAGES_PATH="${LAYER_DIR}/python/lib/${PYTHON_MINOR}/site-packages"
OUTPUT_ZIP="${LAYER_NAME}_lambda_layer.zip"
 
# ── Checks ────────────────────────────────────────────────────────────────────
if ! command -v pip3 &>/dev/null && ! command -v pip &>/dev/null; then
  echo "❌  pip is not installed or not on PATH."
  exit 1
fi
 
if ! command -v zip &>/dev/null; then
  echo "❌  zip is not installed. Install it and re-run."
  exit 1
fi
 
PIP_CMD="$(command -v pip3 || command -v pip)"
 
# ── Build ─────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦  Packages      : ${PACKAGES[*]}"
echo "  🐍  Python version: ${PYTHON_VERSION}"
echo "  📂  Layer dir     : ${LAYER_DIR}/"
echo "  🗜   Output zip    : ${OUTPUT_ZIP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
 
rm -rf "${LAYER_DIR}" "${OUTPUT_ZIP}"
mkdir -p "${SITE_PACKAGES_PATH}"
 
echo ""
echo "⬇️   Installing packages into layer directory…"
 
# Install all packages in a single pip call so pip resolves shared
# dependencies once and deduplicates them (e.g. numpy for pandas+duckdb)
"${PIP_CMD}" install \
  "${PACKAGES[@]}" \
  --target "${SITE_PACKAGES_PATH}" \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version "${PYTHON_VERSION}" \
  --only-binary=:all: \
  --upgrade \
  --quiet
 
echo "✅  Installation complete."
 
# ── Strip ─────────────────────────────────────────────────────────────────────
echo ""
echo "✂️   Stripping unnecessary files…"
 
BEFORE=$(du -sh "${LAYER_DIR}" | cut -f1)
 
# Compiled Python bytecode
find "${SITE_PACKAGES_PATH}" -type f -name "*.pyc" -delete
find "${SITE_PACKAGES_PATH}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
 
# Package metadata
find "${SITE_PACKAGES_PATH}" -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "*.egg-info"  -exec rm -rf {} + 2>/dev/null || true
 
# Tests
find "${SITE_PACKAGES_PATH}" -type d -name "tests"   -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "test"    -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "testing" -exec rm -rf {} + 2>/dev/null || true
 
# Documentation and examples
find "${SITE_PACKAGES_PATH}" -type d -name "doc"      -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "docs"     -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
 
# C/Fortran source files
find "${SITE_PACKAGES_PATH}" -type f -name "*.pyx" -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.pxd" -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.c"   -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.h"   -delete
 
# Static libraries
find "${SITE_PACKAGES_PATH}" -type f -name "*.a" -delete
 
# Strip debug symbols from shared libraries
if command -v strip &>/dev/null; then
  find "${SITE_PACKAGES_PATH}" -type f -name "*.so" \
    | xargs -r strip --strip-debug 2>/dev/null || true
fi
 
AFTER=$(du -sh "${LAYER_DIR}" | cut -f1)
echo "✅  Size before: ${BEFORE}  →  after: ${AFTER}"
 
# ── Zip ───────────────────────────────────────────────────────────────────────
echo ""
echo "🗜   Creating zip archive…"
(
  cd "${LAYER_DIR}"
  zip -r "../${OUTPUT_ZIP}" . -q
)
 
ZIP_SIZE=$(du -sh "${OUTPUT_ZIP}" | cut -f1)
echo "✅  Created ${OUTPUT_ZIP} (${ZIP_SIZE})"
 
rm -rf "${LAYER_DIR}"
