#!/bin/bash

if [ `id -u` -ne 0 ]; then
  echo Need sudo
  exit 1
fi

set -e

# Add MongoDB key
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
. /etc/os-release
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $VERSION_CODENAME/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Install MongoDB
apt update
apt install -y mongodb-org unzip

# Start MongoDB
echo "Launching MongoDB..."
sudo systemctl restart mongod
while [ 1 ]; do echo "Waitting for MongoDB to start..."; echo "exit" | mongo --quiet > /dev/null && break; sleep 1; done

# Create administrator
export MONGO_HOST=$(curl -s http://checkip.amazonaws.com)
export MONGO_ADMIN_USR="MongoAdmin"
export MONGO_ADMIN_PWD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16}; echo;)
export MONGO_ADMIN_URL="mongodb://$MONGO_ADMIN_USR:$MONGO_ADMIN_PWD@$MONGO_HOST:27017"
echo $MONGO_ADMIN_URL >> mongodb_urls

RUNMONGO () {
  echo "$*" | mongo --quiet
}

RUNMONGO "
  use admin
  db.createUser(
    {
      user: \"$MONGO_ADMIN_USR\",
      pwd: \"$MONGO_ADMIN_PWD\",
      roles: [ { role: \"userAdminAnyDatabase\", db: \"admin\" }, \"readWriteAnyDatabase\" ]
    }
  )
"

# Create database and user
export MONGO_DB="DBProject"
export MONGO_USR="$(echo $MONGO_DB)User"
export MONGO_PWD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16}; echo;)
export MONGO_URL="mongodb://$MONGO_USR:$MONGO_PWD@$MONGO_HOST:27017/$MONGO_DB?authSource=$MONGO_DB"
echo $MONGO_URL >> mongodb_urls

RUNMONGO "
  use $MONGO_DB
  db.createUser(
    {
      user: \"$MONGO_USR\",
      pwd: \"$MONGO_PWD\",
      roles:  [
        { role: \"readWrite\", db: \"$MONGO_DB\" }
      ]
    }
  )
"

# Config access control and bind address
sed 's/^\( *bindIp *: *\).*/\10.0.0.0/' -i /etc/mongod.conf
sed "s/#security:/security:\n  authorization: enabled/g" -i /etc/mongod.conf

# Restart MongoDB
systemctl restart mongod
systemctl status mongod

# Import data
wget -q -c https://istd50043-assets.s3-ap-southeast-1.amazonaws.com/kindle_metadata_cleaned.zip
unzip kindle_metadata_cleaned.zip
for filename in ./combined_output/part-*; do
  echo "Importing $filename"
  mongoimport --quiet --collection books $MONGO_URL $filename
done
rm -rf kindle_metadata_cleaned.zip
rm -rf combined_output

wget -q -c https://istd50043-assets.s3-ap-southeast-1.amazonaws.com/kindle_categories.json
mongoimport --quiet --collection categories $MONGO_URL kindle_categories.json
rm -rf kindle_categories.json

# Finsih setup
echo "Done!"
echo "You can now access: $MONGO_URL"
