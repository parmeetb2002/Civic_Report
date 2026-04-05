#!/usr/bin/env bash
# exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Build the frontend (Vite)
cd civic_ui
npm install
npm run build
cd ..

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput
