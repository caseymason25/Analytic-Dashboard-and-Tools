/**
* @fileoverview  Handles the backend functionality of the ping awards tab
*        - The tab will allow the user to select a team and a date range and pull back positive surveys with comments that
*          have been submitted for the associates on the team.
*        - The user will be able to mark each comment to submit a ping for the associate, the TAG engineer, or both.
*        - The user will be able to designate which email address to send it too.
*        - The user will be able to write in a costumized message that will be included at the top of the email.
* @author Casey Mason and Seth Bird
*/

const Common = require('../modules/Common');
const PingAwards = require('../modules/PingAwards');
const Audit = require('../modules/Audit');

module.exports = function (Server) {
  'use strict';
  let exported = {};
  let app = Server.app;
  let cfg = Server.config;

  /**
  * Triggered when the user loads or refreshes the PingAwards tab
  * @param  {object} req The request coming in. This should be an object array and req.body will contain the ping info
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {null}
  */
  app.get('/loadpingawards', function(req, res) {
    try {
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-LOAD", req.session.associateID);
      audit.startSV();

      var page_data = {
        perm    : cfg.PERM,
        role    : req.session.ROLE,
        teams   : []
      };

      PingAwards.get_teams(req, cfg)
      .then(function(data){
        page_data.teams = data;
        res.render('includes/ping_awards',page_data,function(err,html){
          if(err) {
            Common.log(err,4,cfg);
          } else {
            // Stop and send the audit object
            audit.stopSV(cfg);
            res.send({success:1,html:html,auditObj:audit});
          }
        });
      })
      .catch(function(error) {
        Common.log(error,4,cfg);
        res.send({success:0,reason:error});
      });
    } catch(error) {
      Common.log("getpingawards exception caught|"+error,4,cfg);
    }
  });


  /**
  * Triggered when the user loads the table of Ping Awards. Loads the data for the table to display.
  * @param  {object} req The request coming in. This should be an object array and req.body will contain the ping info
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {null}
  */
  app.post('/getpingawards',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-GETPINGS",req.session.associateID);
      audit.startSV();
      audit.setValues(cfg,req.body.TEAM, "Comma Seperated Team ID",req.body.START, "Start Date from the frontend", req.body.END, "End Date from the frontend");
      if(req.session.ROLE & cfg.PERM.PINGAWARDS) {
        if(!cfg.SETTINGS.client_pause) {
          var filters = {
            "TEAM"   : 0,
            "START"  : new Date(),
            "END"    : new Date()
          };
          var page_data = {};

          filters.TEAM = req.body.TEAM;
          filters.START = req.body.START;
          filters.END = req.body.END;
          return PingAwards.getPings(filters,cfg)
          .then(function(data){
            page_data.pings = data;
            res.render('includes/ping_awards_body',page_data,function(err,html) {
              if(err){
                Common.log(err,4,cfg);
              } else {
                // Stop and send the audit object
                audit.stopSV(cfg);
                res.send({'success':1,'html':html,auditObj:audit});
              }
            });
          })
          .catch(function(error) {
            Common.log(error,4,cfg);
          });
        } else {
          res.send({'success':0,'reason':"Refresh paused"});
        }
      } else {
        res.send({success:0,reason:"Permission Denied"});
      }
    } catch(error) {
      Common.log("getpingawards exception caught|"+error,4,cfg);
    }
  });

  /**
  * Saves the ping awards for analysts and TAG engineers to the ping_awards table
  * Also updates the survey_send_assoc table to indicate a ping was received
  *
  * @param  {object} req The request coming in. This should be an object array and req.body will contain the ping info
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {null}
  */
  app.post('/save_ping_awards',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-SAVEPINGS",req.session.associateID);
      audit.startSV();

      if(req.session.ROLE & cfg.PERM.PINGAWARDS) {
        if(!cfg.SETTINGS.client_pause) {
          PingAwards.savePingAwards(req,cfg)
          .then(function() {
            // Stop and send the audit object
            audit.stopSV(cfg);
            res.send({'success':1,'reason':"Ping Awards Submitted",auditObj:audit});
          })
          .catch(function(error) {
            Common.log(error,4,cfg);
            res.send({success:0,reason:error});
          });
        } else {
          res.send({'success':0,'reason':"Refresh paused"});
        }
      } else {
        res.send({success:0,reason:"Permission Denied"});
      }
    } catch(error) {
      Common.log("save_ping_awards exception caught|"+error,4,cfg);
    }
  });

  /**
   * Receives POST and sends the data on the be emailed
   * @param  {object} req The request coming in. This should be an object array and req.body will contain the ping info
   * @param  {object} res The response we send back to the frontend. Usually 'success'
   * @return {null}
   */
  app.post('/send_ping_awards', function(req, res) {
    try {
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-EMAILPINGS",req.session.associateID);
      audit.startSV();
      audit.setValues(cfg,req.body.EMAIL,"Email address the Pings were sent to");

      if(req.session.ROLE & cfg.PERM.PINGAWARDS) {
        if(cfg.SETTINGS.loglvl >= 4) {
          Common.log(JSON.stringify(req.body));
          Common.log(req.session.associateID);
        }
        var emailTextHTML = req.body.MESSAGE;
        var to_email = req.body.EMAIL;
        Common.validate_user_session(cfg,req,res)
        .then(function(){
          return PingAwards.sendTeampings(emailTextHTML,to_email);
        })
        .then(function() {
          // Stop and send the audit object
          audit.stopSV(cfg);
          res.send({'success':1,auditObj:audit});
        })
        .catch(function(error) {
          Common.log(error,4,cfg);
          res.send({success:0,reason:error});
        });
      } else {
        res.send({success:0,reason:"Permission Denied"});
      }
    } catch(error) {
      Common.log("send_ping_awards exception caught|"+error,4,cfg);
    }
  });


  //exclude_row_ping_awards
  app.post('/exclude_row_ping_awards',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-EXCLUDEROW",req.session.associateID);
      audit.startSV();
      audit.setValues(cfg,req.body.ID,"survey_send_assoc_id",req.body.FLAG,"1 = exclude, 0 = unexclude");

      if(req.session.ROLE & cfg.PERM.PINGAWARDS) {
        if(!cfg.SETTINGS.client_pause) {
          PingAwards.excludePingRow(req,cfg)
          .then(function() {
            // Stop and send the audit object
            audit.stopSV(cfg);
            res.send({'success':1,'reason':"Ping Row Excluded",auditObj:audit});
          })
          .catch(function(error) {
            Common.log(error,4,cfg);
            res.send({success:0,reason:error});
          });
        } else {
          res.send({'success':0,'reason':"Refresh paused"});
        }
      } else {
        res.send({success:0,reason:"Permission Denied"});
      }
    } catch(error) {
      Common.log("exclude_row_ping_awards exception caught|"+error,4,cfg);
    }
  });

  return exported;
};
