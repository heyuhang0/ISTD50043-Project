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
apt update -qq 
apt install -qq -y mongodb-org unzip

# Start MongoDB
echo "Launching MongoDB..."
sudo systemctl restart mongod
while [ 1 ]; do echo "Waitting for MongoDB to start..."; echo "exit" | mongo --quiet > /dev/null && break; sleep 1; done

# Create administrator
MONGO_ADMIN_USR="MongoAdmin"
MONGO_ADMIN_PWD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16}; echo;)

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
MONGO_DB="DBProject"
MONGO_USR="$(echo $MONGO_DB)User"
MONGO_PWD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16}; echo;)
MONGO_LOCAL_URL="mongodb://$MONGO_USR:$MONGO_PWD@$localhost:27017/$MONGO_DB?authSource=$MONGO_DB"

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
  mongoimport --quiet --collection books $MONGO_LOCAL_URL $filename
done
rm -rf kindle_metadata_cleaned.zip
rm -rf combined_output

wget -q -c https://istd50043-assets.s3-ap-southeast-1.amazonaws.com/kindle_categories.json
mongoimport --quiet --collection categories $MONGO_LOCAL_URL kindle_categories.json
rm -rf kindle_categories.json

# Finsih setup
echo "Finished setting up MongoDB."
echo "\
export MONGO_ADMIN_USR=$MONGO_ADMIN_USR
export MONGO_ADMIN_PWD=$MONGO_ADMIN_PWD
export MONGO_DB=$MONGO_DB
export MONGO_USR=$MONGO_USR
export MONGO_PWD=$MONGO_PWD
" > ~/.credentials
echo "Credentials have been saved to ~/.credentials"
