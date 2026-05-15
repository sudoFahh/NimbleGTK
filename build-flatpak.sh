#!/bin/bash
set -e

APP_ID="io.vncl.sudofahh.nimble"
MANIFEST="flatpak/$APP_ID.json"

echo "🧹 Cleaning..."
rm -rf build .flatpak-builder

echo "📦 Building Flatpak..."
flatpak-builder build "$MANIFEST" --force-clean

echo "🚀 Installing locally..."
flatpak-builder --user --install --force-clean --disable-rofiles-fuse build flatpak/io.vncl.sudofahh.nimble.json

echo "▶ Running app..."
flatpak run "$APP_ID"
