# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
require 'etc'
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.network :private_network, ip: "192.168.99.106"
  config.vm.hostname = "dev.coo-e.com"
  config.vm.network "forwarded_port", guest:8000, host:8000
  config.vm.network "forwarded_port", guest:3000, host:3000
  config.vm.network "forwarded_port", guest:80, host:81
  config.vm.network "forwarded_port", guest:8080, host:8080
  config.vm.network "forwarded_port", guest:8081, host:8081
  config.vm.network "forwarded_port", guest:6379, host:6379
  config.vm.network "forwarded_port", guest:28015, host:28015



  config.vm.provider "virtualbox" do |v,override|
    # max 66% CPU cap
    v.customize ["modifyvm", :id, "--cpuexecutioncap", "66"]
    # 4gb ram
    v.memory = 4000
    v.cpus = 2
  end

  # Only run the provisioning on the first 'vagrant up'
  if Dir.glob("#{File.dirname(__FILE__)}/.vagrant/machines/default/*/id").empty?
    # Install Docker
    pkg_cmd = "wget -q -O - https://get.docker.io/gpg | apt-key add -;" \
      "echo deb http://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list;" \
      "apt-get update -qq; apt-get install -q -y --force-yes lxc-docker; "\
    # Add vagrant user to the docker group
    pkg_cmd << "usermod -a -G docker ubuntu; "
    config.vm.provision :shell, :inline => pkg_cmd
    config.vm.provision :shell, path: "bootstrap.sh"
  end
end