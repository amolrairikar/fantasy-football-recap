#!/bin/bash
# =============================================================================
# create_lambda_layer.sh
# Creates an AWS Lambda layer zip for a given Python package.
#
# Usage:
#   ./create_lambda_layer.sh <package_name> [python_version]
#
# Examples:
#   ./create_lambda_layer.sh pandas
#   ./create_lambda_layer.sh pandas 3.11
#   ./create_lambda_layer.sh "scikit-learn" 3.12
# =============================================================================
 
set -euo pipefail
 
# ── Args ─────────────────────────────────────────────────────────────────────
PACKAGE_NAME="${1:-}"
PYTHON_VERSION="${2:-3.13}"
 
if [[ -z "$PACKAGE_NAME" ]]; then
  echo "❌  Usage: $0 <package_name> [python_version]"
  echo "   Example: $0 pandas 3.13"
  exit 1
fi
 
# Derive a filesystem-safe name (e.g. "scikit-learn" → "scikit_learn")
SAFE_NAME="${PACKAGE_NAME//-/_}"
PYTHON_MINOR="python${PYTHON_VERSION}"
LAYER_DIR="lambda_layer_${SAFE_NAME}"
SITE_PACKAGES_PATH="${LAYER_DIR}/python/lib/${PYTHON_MINOR}/site-packages"
OUTPUT_ZIP="${SAFE_NAME}_lambda_layer.zip"
 
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
echo "  📦  Package       : ${PACKAGE_NAME}"
echo "  🐍  Python version: ${PYTHON_VERSION}"
echo "  📂  Layer dir     : ${LAYER_DIR}/"
echo "  🗜   Output zip    : ${OUTPUT_ZIP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
 
# Clean any previous build artifacts
rm -rf "${LAYER_DIR}" "${OUTPUT_ZIP}"
 
echo ""
echo "⬇️   Installing '${PACKAGE_NAME}' into layer directory…"
mkdir -p "${SITE_PACKAGES_PATH}"
 
"${PIP_CMD}" install \
  "${PACKAGE_NAME}" \
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
 
# Compiled Python bytecode — Python regenerates these on first import
find "${SITE_PACKAGES_PATH}" -type f -name "*.pyc" -delete
find "${SITE_PACKAGES_PATH}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
 
# Package metadata — not needed at runtime
find "${SITE_PACKAGES_PATH}" -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "*.egg-info"  -exec rm -rf {} + 2>/dev/null || true
 
# Tests bundled inside packages — never needed in Lambda
find "${SITE_PACKAGES_PATH}" -type d -name "tests"   -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "test"    -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "testing" -exec rm -rf {} + 2>/dev/null || true
 
# Documentation and examples bundled inside packages
find "${SITE_PACKAGES_PATH}" -type d -name "doc"      -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "docs"     -exec rm -rf {} + 2>/dev/null || true
find "${SITE_PACKAGES_PATH}" -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
 
# C/Fortran source files shipped alongside compiled extensions (pandas, numpy, etc.)
find "${SITE_PACKAGES_PATH}" -type f -name "*.pyx"  -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.pxd"  -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.c"    -delete
find "${SITE_PACKAGES_PATH}" -type f -name "*.h"    -delete
 
# Static libraries — only needed at compile time, not runtime
find "${SITE_PACKAGES_PATH}" -type f -name "*.a" -delete
 
# Strip debug symbols from shared libraries — largest single win for numpy/pandas
# (requires binutils; no-op if strip is unavailable)
if command -v strip &>/dev/null; then
  find "${SITE_PACKAGES_PATH}" -type f -name "*.so" \
    | xargs -r strip --strip-debug 2>/dev/null || true
fi
 
AFTER=$(du -sh "${LAYER_DIR}" | cut -f1)
echo "✅  Size before stripping: ${BEFORE}  →  after: ${AFTER}"
 
# ── Zip ───────────────────────────────────────────────────────────────────────
echo ""
echo "🗜   Creating zip archive…"
(
  cd "${LAYER_DIR}"
  zip -r "../${OUTPUT_ZIP}" . -q
)
 
ZIP_SIZE=$(du -sh "${OUTPUT_ZIP}" | cut -f1)
echo "✅  Created ${OUTPUT_ZIP} (${ZIP_SIZE})"
 
# ── Optional cleanup ──────────────────────────────────────────────────────────
rm -rf "${LAYER_DIR}"
