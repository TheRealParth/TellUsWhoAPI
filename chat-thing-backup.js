var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
function puts(error, stdout, stderr) {  }

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/registerUser',function(req,res,next){
	var username = req.body.username
  	var password=req.body.password
  	var ejbcommand = "ejabberdctl register "+username+" localhost "+password
	exec(ejbcommand, puts)
  	res.json("user created in ejabberd");
})

router.get('/changePassword',function(req,res,next){
		var username = req.body.username
  		var newPassword=req.body.newPassword
  		var ejbcommand = "ejabberdctl change_password "+username+" localhost "+newPassword
  		exec(ejbcommand, puts)
  		res.json("password for "+username+" succesfully changed in ejabberd");
})

router.get('/createRoom',function(req,res,next){
	var roomName = req.body.roomName
	var mucService = req.body.mucService
	var ejbcommand = "ejabberdctl create_room "+roomName+" "+mucService+" localhost "
	exec(ejbcommand, puts)
	res.json("teeup: "+roomName+" succesfully created in ejabberd");
})

module.exports = router;
