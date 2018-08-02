var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    // if(error) ;
    // 
}

function logger(msg) {
    // ;
}

exports.registerUser = function(username, password){
    // var ejbcommand = "ejabberdctl register "+username+" localhost "+password;
    // exec(ejbcommand, puts);
    // logger("user created.");
}

exports.changePassword = function(username, newPassword){
    // var ejbcommand = "ejabberdctl change_password "+username+" localhost "+newPassword;
    // exec(ejbcommand, puts);
    // logger("password for "+username+" succesfully changed in ejabberd");
}

exports.createRoom = function(roomName, mucService){
    // var ejbcommand = "ejabberdctl create_room "+roomName+" "+mucService+" localhost ";
    // exec(ejbcommand, puts);
    // logger("teeup: "+roomName+" succesfully created in ejabberd");
}
