#!/bin/bash
# Please run ../setup/setup_web.bash before running this script

# Ensure root privilege
if [ `id -u` -ne 0 ]; then
	echo Need sudo
	exit 1
fi

set -e

# Go to project base directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $(dirname $DIR)

# Install npm dependencies
npm install --loglevel warn

# Build frontend and move to nginx html folder
npm run build
rm -rf /var/www/html
cp -r ./build /var/www/html

# Start backend
NODE_LOG_DIR="/var/log/nodejs"
pm2 delete all || true
pm2 start ./src/api/index.js -i max -e $NODE_LOG_DIR/err.log -o $NODE_LOG_DIR/out.log

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
