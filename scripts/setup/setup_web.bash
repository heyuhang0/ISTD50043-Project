#!/bin/bash

# Check Root
if [ `id -u` -ne 0 ]; then
	echo Need sudo
	exit 1
fi

set -e

# Installl nodejs and nginx
apt update -qq -y && apt install -qq -y nodejs npm nginx

# Install pm2
npm install -g pm2 --loglevel warn

# Setup Nginx forward
echo "server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    server_name _;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:8080;
    }
}" > /etc/nginx/sites-available/default
nginx -s stop || true
nginx
nginx -s reload