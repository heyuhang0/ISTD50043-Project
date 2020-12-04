#!/bin/bash
# this script is only designed for Ubuntu 16.04 (ami-04613ff1fdcd2eab1/ami-0f82752aa17ff8f5d)

echo "Setting up AWS CLI"
read -p 'AWS Access Key ID: ' access_key_id
read -p 'AWS Secret Access Key: ' secret_access_key
read -p 'AWS Session Token [Optional]: ' session_token
read -p 'Default region name: ' aws_region

mkdir -p ~/.aws
echo "[default]" > ~/.aws/config
echo "region = $aws_region" >> ~/.aws/config
echo "[default]" > ~/.aws/credentials
echo "aws_access_key_id=$access_key_id" >> ~/.aws/credentials
echo "aws_secret_access_key=$secret_access_key" >> ~/.aws/credentials
if [ ! -z "$session_token" ]
then
    echo "aws_session_token=$session_token" >> ~/.aws/credentials
fi

echo "Installing python3.7"
yes | sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.7 python3-pip

echo "Installing libraries: boto3 and paramiko"
python3.7 -m pip install --upgrade pip
python3.7 -m pip install boto3 paramiko
