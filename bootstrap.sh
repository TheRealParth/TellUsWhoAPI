#!/usr/bin/env bash
echo "=========================================="
echo "Provision VM START"
echo "=========================================="

sudo apt-get update

###############################################
# install prerequisites
###############################################
sudo apt-get -y -q upgrade
sudo apt-get -y -q update
sudo apt-get -y -q install software-properties-common htop
sudo apt-get -y -q install build-essential checkinstall wget
sudo apt-get install -y -q libreadline-gplv2-dev libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev
sudo apt-get -y -q install tcl8.5
###############################################
# Install Git
###############################################
sudo apt-get -y -q install git
###############################################
# Install docker
###############################################
sudo apt-get -y -q install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get -y -q update
sudo apt-get -y -q install docker-ce
###############################################
# Install docker-compose
###############################################
curl -L https://github.com/docker/compose/releases/download/1.12.0-rc1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "Install summary:"
docker --version
docker-compose version
python -v
echo "=========================================="
echo "Provision VM finished"
echo "=========================================="
cd /vagrant
docker-compose up -d
echo "=========================================="
echo "starting rethink and redis..."
echo "=========================================="