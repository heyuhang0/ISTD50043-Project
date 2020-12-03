#!/bin/bash

# Check Root
if [ `id -u` -ne 0 ]; then
  echo Need sudo
  exit 1
fi

set -e

# Config Root Password
export MYSQL_PWD=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-16}; echo;)

# Install MySQL
echo "mysql-server mysql-server/root_password password $MYSQL_PWD" | debconf-set-selections
echo "mysql-server mysql-server/root_password_again password $MYSQL_PWD" | debconf-set-selections
apt update -qq && apt install -qq -y mysql-server-8.0 mysql-client-8.0 unzip

# Config UTF-8, bind-address and allow remote access
sed -i -e "$ a [client]\n\n[mysql]\n\n[mysqld]"  /etc/mysql/my.cnf && \
sed -i -e "s/\(\[client\]\)/\1\ndefault-character-set = utf8mb4/g" /etc/mysql/my.cnf && \
sed -i -e "s/\(\[mysql\]\)/\1\ndefault-character-set = utf8mb4/g" /etc/mysql/my.cnf && \
sed -i -e "s/\(\[mysqld\]\)/\1\ninit_connect='SET NAMES utf8mb4'\ncharacter-set-server = utf8mb4\ncollation-server=utf8mb4_unicode_ci\nbind-address = 0.0.0.0/g" /etc/mysql/my.cnf
service mysql restart
mysql -uroot --database="mysql" --execute="UPDATE user SET host='%' WHERE user='root';flush privileges;"

# Install phpMyAdmin (in background)
echo "phpmyadmin phpmyadmin/dbconfig-install boolean true" | debconf-set-selections
echo "phpmyadmin phpmyadmin/app-password-confirm password $MYSQL_PWD" | debconf-set-selections
echo "phpmyadmin phpmyadmin/mysql/admin-pass password $MYSQL_PWD" | debconf-set-selections
echo "phpmyadmin phpmyadmin/mysql/app-pass password $MYSQL_PWD" | debconf-set-selections
echo "phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2" | debconf-set-selections
apt install -qq -y phpmyadmin &

# Create database
export MYSQL_DATABASE="DBProject"
mysql -uroot --execute="DROP DATABASE IF EXISTS $MYSQL_DATABASE;"
mysql -uroot --execute="CREATE DATABASE $MYSQL_DATABASE;"
RUNSQL () {
  mysql --local-infile=1 -uroot --database=$MYSQL_DATABASE --execute="$*"
}

# Download kindle_reviews.csv
echo "Downloading kindle_reviews.csv"
wget -q -c https://d2bhhe2sy3r8ii.cloudfront.net/kindle-reviews.zip -O kindle-reviews.zip
unzip kindle-reviews.zip
rm -rf kindle_reviews.json

# Import data
echo "Importing kindle_reviews.csv..."
RUNSQL "CREATE TABLE kindle_review_imported (
  reviewId INT,
  asin CHAR(10),
  helpful VARCHAR(255),
  overall INT,
  reviewText TEXT,
  reviewTime VARCHAR(255),
  reviewerId VARCHAR(255),
  reviewerName VARCHAR(255) ,
  summary TEXT,
  unixReviewTime BIGINT
);"
RUNSQL "SET GLOBAL local_infile = 1;"
RUNSQL "load data local infile 'kindle_reviews.csv'
  into table kindle_review_imported
  fields terminated by ',' enclosed by '\"' lines terminated by '\\n'
  ignore 1 rows;"
RUNSQL "SET GLOBAL local_infile = 0;"

echo "Extracting existing users..."
RUNSQL "CREATE TABLE user (
  userId INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(userId),
  UNIQUE(email)  
);"
RUNSQL "INSERT INTO user (name, email)
  SELECT max(reviewerName), reviewerId as dummyEmail
  FROM kindle_review_imported
  GROUP BY reviewerId;"

echo "Cleaning review table..."
RUNSQL "CREATE TABLE review (
  reviewId INT NOT NULL AUTO_INCREMENT,
  asin CHAR(10) NOT NULL,
  reviewerId INT NOT NULL,
  helpful INT NOT NULL DEFAULT 0,
  rating INT NOT NULL DEFAULT 0,
  summary TEXT,
  reviewText TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(reviewId),
  FOREIGN KEY(reviewerId) references user(userId) on delete cascade on update cascade,
  INDEX(asin),
  INDEX(reviewerId),
  INDEX(helpful),
  INDEX(rating),
  INDEX(createdAt),
  INDEX(updatedAt)
);"
RUNSQL "INSERT INTO review (asin, reviewerId, helpful, rating, summary, reviewText, createdAt, updatedAt)
  SELECT
    r.asin, u.userId, REGEXP_SUBSTR(r.helpful,'[0-9]+'), r.overall, r.summary, r.reviewText,
    IF(r.unixReviewTime>0, FROM_UNIXTIME(r.unixReviewTime), '1970-01-01 00:00:01'),
    IF(r.unixReviewTime>0, FROM_UNIXTIME(r.unixReviewTime), '1970-01-01 00:00:01')
  FROM kindle_review_imported r
  JOIN user u
  ON r.reviewerId = u.email"

echo "Cleaning user table..."
RUNSQL "UPDATE user SET email=null;"

echo "Delete temporary table"
RUNSQL "DROP TABLE kindle_review_imported"

# Finsih setup
wait
echo "Finished setting up MySQL server."
echo "\
export MYSQL_DB=$MYSQL_DATABASE
export MYSQL_USR=root
export MYSQL_PWD=$MYSQL_PWD
export AUTH_SECRET=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c${1:-32}; echo;)
" > ~/.credentials
echo "Credentials have been saved to ~/.credentials"