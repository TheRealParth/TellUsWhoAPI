var kue = require('kue');
var Teeup = require('../models/teeup');
var message = require('./messageSender.js')
var redisConfig = require('../config/config.js')['redis'];
var Queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: redisConfig.host,
    db: 3, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclient
    }
  }});



exports.deleteJob = function(jobId){
  kue.Job.get(jobId, function(err, job){
    if (err) return;
    job.remove(function(err){
      if (err) throw err;
      ;
    });
  })
  return
}


exports.setHappeningAutoChange = function(teeupId, date, prevId){
  //DELETE OLD JOB
  if(prevId > -1){
    deleteJob(prevId)
  }
  //CREATE NEW JOB
  var job = Queue.create('happening', {teeupId: teeupId})
  job.delay(date).priority('high').save()
  //SET THE PROCESS TO DO THE JOB AT THE SET TIME
  //2 = its happening, 3 = its ended
  Queue.process('happening' , function(job, done){
    Teeup.get(teeupId).run().then(teeup=>{
      if(teeup.autoChangeSettings.requireWhenBeDecided && teeup.autoChangeSettings.requireItsOnBeSet) {
        if(teeup.whenDecided && (teeup.status == 1)){
          teeup.status = 2;
          teeup.save().then(teeup=>{
              
              message.autoTeeupStatusChange(teeupId, teeup.status)
          })
        }
      } else if (teeup.autoChangeSettings.requireWhenBeDecided && !teeup.autoChangeSettings.requireItsOnBeSet) {
        if(teeup.whenDecided){
          teeup.status = 2;
          teeup.save().then(teeup=>{
              
              message.autoTeeupStatusChange(teeupId, teeup.status)
          })
        }
      } else if (!teeup.autoChangeSettings.requireWhenBeDecided && teeup.autoChangeSettings.requireItsOnBeSet) {
        if(teeup.status == 1){
          teeup.status = 2;
          teeup.save().then(teeup=>{
              
              message.autoTeeupStatusChange(teeupId, teeup.status)
          })
        }
      } else if (!teeup.autoChangeSettings.requireWhenBeDecided && !teeup.autoChangeSettings.requireItsOnBeSet) {
        teeup.status = 2;
        teeup.save().then(teeup=>{
            
            message.autoTeeupStatusChange(teeupId, teeup.status)
        })
      }

    })
    return job.id
    done()
  })


  return
}
exports.setEndedAutoChange = function(teeupId, date, prevId){
  //DELETE OLD JOB
  if(prevId > -1){
    deleteJob(prevId)
  }
  //CREATE NEW JOB
  var job = Queue.create('itsEnded', {teeupId: teeupId})
  job.delay(date).priority('high').save()
  //SET THE PROCESS TO DO THE JOB AT THE SET TIME
  Queue.process('itsEnded' , function(job, done){
    ;
    Teeup.get(teeupId).run().then(teeup=>{

      teeup.status = 3;
      teeup.save().then(teeup=>{
          
          message.autoTeeupStatusChange(teeupId, teeup.status)
          deleteJob(job.id)
      })
    })
    return job.id
    done()
  })


}
