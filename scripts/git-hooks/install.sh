#!/bin/sh
# Instala los git hooks versionados como symlinks en .git/hooks/.
# Ejecutar tras clonar el repo (una sola vez) o si un hook se pierde.
#   Uso: ./scripts/git-hooks/install.sh
set -eu

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/git-hooks"
HOOKS_DST="$REPO_ROOT/.git/hooks"

for src in "$HOOKS_SRC"/*; do
    name="$(basename "$src")"
    [ "$name" = "install.sh" ] && continue
    dst="$HOOKS_DST/$name"
    ln -sfn "../../scripts/git-hooks/$name" "$dst"
    chmod +x "$src"
    echo "✓ hook '$name' instalado ($dst → ../../scripts/git-hooks/$name)"
done
