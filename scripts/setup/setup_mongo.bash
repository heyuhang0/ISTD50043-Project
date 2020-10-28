#!/bin/bash

if [ `id -u` -ne 0 ]; then
	echo Need sudo
	exit 1
fi

set -e

wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
. /etc/os-release
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $VERSION_CODENAME/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

apt update -y && apt install -y python3 mongodb-org
