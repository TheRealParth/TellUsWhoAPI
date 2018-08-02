*There is  Vagrantfile for building a virtual machine to run this application**
=================================================================================


REQUIREMENTS:
-------------
* at least 4GB of ram (preferably >=6)
* at least a quad-core machine (2 cores allocated to the VM that will be spawned)
1) Download virtualBox in order for vagrant to work:

[Virtual Box Downloads page](https://www.virtualbox.org/wiki/Downloads)

2) Then you can install vagrant:

[Vagrant download page](https://www.vagrantup.com/downloads.html)

Install both for your respective platform (windows, osx, etc)

3) To set the hosts accordingly in order to get oAuth working install the hosts plugin for vagrant:

[Vagrant-Hostsupdater](https://github.com/cogitatio/vagrant-hostsupdater)

To Install:

 `vagrant plugin install vagrant-hostsupdater`


4) Then you will be able to run `sudo vagrant up --provider=virtualbox`

It will take some time for vagrant machine to build and allow you to ssh into it:

5) `sudo vagrant ssh`


*Note*

`/CooeAPI/` is a mounted folder. This means that if you edit any files on your local box, virtual box
will reload them automatically. You do not have to `scp` into the VM in order to upload updated files.

Your folder `CooeAPI/` on local will always have the same contents as `/vagrant/` on the virtual machine
that has been created.

After you ssh into the vagrantbox, you can run the nvm install script

6) `./installNVM.sh`

If this fails to run, it may be because you have to `chmod +x installNVM.sh` in order to make it executable.

Run the next 5 lines that are shown in this file, in order to source your `.bashrc`, install the 6.11.2 version of node,
install pm2 globally and locally install all npm dependencies for cooe api.

The final line in the script `npm run dev` starts pm2 in dev mode, with hot reloading.

You should be able to view in your browser at `192.168.99.106` or at `http://dev.coo-e.com:8080`

The rethinkdb data explorer is visibile on port 8081.

*If you have issues with networking or other errors when running vagrant commands please contact me on slack*