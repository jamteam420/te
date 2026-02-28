#!/bin/bash
set -e

# ============================================================
# deploy.sh - Commit, push y publicar en GitHub Pages
# Uso: ./deploy.sh "mensaje del commit"
# ============================================================

REPO_USER="jamteam420"
REPO_EMAIL="ccjamteam@gmail.com"
REPO_URL="github.com/jamteam420/te.git"
BASE_HREF="/te/"
DIST_DIR="dist/te-app/browser"

# --- Mensaje de commit ---
COMMIT_MSG="${1:-deploy: actualización}"

# --- Pedir PAT ---
echo ""
read -rsp "🔑 Ingresá tu Personal Access Token (PAT): " PAT
echo ""

if [[ -z "$PAT" ]]; then
  echo "❌ No se ingresó ningún token. Abortando."
  exit 1
fi

# --- Configurar usuario y remote con PAT ---
git config user.name "$REPO_USER"
git config user.email "$REPO_EMAIL"
git remote set-url origin "https://${REPO_USER}:${PAT}@${REPO_URL}"

# --- Commit y push ---
echo ""
echo "📦 Commiteando cambios..."
git add .

if git diff --cached --quiet; then
  echo "ℹ️  No hay cambios para commitear."
else
  git commit -m "$COMMIT_MSG"
  echo "⬆️  Pusheando a main..."
  git push origin main
fi

# --- Build de producción ---
echo ""
echo "🔨 Buildeando para GitHub Pages..."
npx ng build --configuration production --base-href "$BASE_HREF"

# --- Publicar en gh-pages ---
echo ""
echo "🚀 Publicando en GitHub Pages..."
npx angular-cli-ghpages --dir="$DIST_DIR"

echo ""
echo "✅ Listo! La app está en: https://${REPO_USER}.github.io/te/"
