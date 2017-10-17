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
const PingAwardsManual = require('../modules/PingAwardsManual');
const Audit = require('../modules/Audit');

module.exports = function (Server) {
  'use strict';
  let exported = {};
  let app = Server.app;
  let cfg = Server.config;

  /**
  * Load the Ping Awards Manual tab after the user clicks load
  * @param  {object} req The request coming in.
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {object} {success:1,html:html,auditObj:audit}
  */
  app.get('/loadpingawardsmanual', function(req, res) {
    try {
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDSMANUAL-LOAD", req.session.associateID);
      audit.startSV();

      var page_data = {
        perm    : cfg.PERM,
        role    : req.session.ROLE,
        teams   : []
      };

      PingAwardsManual.get_teams(req, cfg)
      .then(function(data){
        page_data.teams = data;
        res.render('includes/ping_awards_manual',page_data,function(err,html){
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
      Common.log("loadpingawardsmanual exception caught|"+error,4,cfg);
    }
  });

  /**
  * Saves the manually entered ping awards
  * @param  {object} req The request coming in.
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {null}
  */
  app.post('/save_ping_awards_manual',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDS-SAVEPINGSMANUAL",req.session.associateID);
      audit.startSV();
      audit.setValues(cfg,req.body.TEAM,"Team ID the Ping is submitted for",req.body.SR,"SR number the Ping was issued for",req.body.NAME, "The name of the reciepient");

        if(!cfg.SETTINGS.client_pause) {
          PingAwardsManual.savePingAwardsManual(req,cfg)
          .then(function() {
            // Stop and send the audit object
            audit.stopSV(cfg);
            res.send({'success':1,'reason':"Ping Award Submitted",auditObj:audit});
          })
          .catch(function(error) {
            Common.log(error,4,cfg);
            res.send({success:0,reason:error});
          });
        } else {
          res.send({'success':0,'reason':"Refresh paused"});
        }
    } catch(error) {
      Common.log("save_ping_awards_manual exception caught|"+error,4,cfg);
    }
  });
  return exported;
};
