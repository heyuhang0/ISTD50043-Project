#!/bin/bash

if [ `id -u` -ne 0 ]; then
	echo Need sudo
	exit 1
fi

set -v

apt update -y
apt install -y python3 mongodb-org
