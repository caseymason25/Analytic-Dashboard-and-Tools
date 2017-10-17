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
const PingAwardsAdmin = require('../modules/PingAwardsAdmin');
const Audit = require('../modules/Audit');

module.exports = function (Server) {
  'use strict';
  let exported = {};
  let app = Server.app;
  let cfg = Server.config;

  /**
  * Load the Ping Awards Admin tab after the user clicks load
  * @param  {object} req The request coming in. This should be an object array and req.body will contain the ping info
  * @param  {object} res The response we send back to the frontend. Usually 'success'
  * @return {object} {success:1,html:html,auditObj:audit}
  */
  app.get('/loadpingawardsadmin', function(req, res) {
    // Create the audit object for usage and timers
    let audit = new Audit(cfg, "USG-PINGAWARDSADMIN-LOAD", req.session.associateID);
    audit.startSV();
    var page_data = {
      perm    : cfg.PERM,
      role    : req.session.ROLE,
      teams   : []
    };

    PingAwardsAdmin.getTeamGroups(req, cfg)
    .then(function(data){
      page_data.groups = data;
      res.render('includes/ping_awards_admin',page_data,function(err,html){
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
  });

  /**
  * Call getPingsAdmin() to query the database for the pings submitted for the specified group and time frame
  * @param  {object} req The request coming in. This should be an object array.
  * @param  {object} res The response we send back to the frontend.
  * @return {object[]}    An object array of the returned SQL query
  */
  app.post('/getpingawardsadmin',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-PINGAWARDSADMIN-GETPINGS", req.session.associateID);
      audit.startSV();
      audit.setValues(cfg,req.body.GROUP, "Comma Seperated Team ID",req.body.START, "Start Date from the frontend", req.body.END, "End Date from the frontend");
      if(req.session.ROLE & cfg.PERM.PINGADMIN) {
        if(!cfg.SETTINGS.client_pause) {
          var filters = {
            "GROUP"   : 0,
            "START"  : new Date(),
            "END"    : new Date()
          };
          var page_data = {};

          filters.GROUP = req.body.GROUP;
          filters.START = req.body.START;
          filters.END = req.body.END;
          return PingAwardsAdmin.getPingsAdmin(filters, cfg)
          .then(function(data) {
            return PingAwardsAdmin.checkFirstPingsAdmin(data, filters.START, cfg);
          })
          .then(function(data){
            page_data.pings = data.pings;
            page_data.excel_file = data.excel_file;
            res.render('includes/ping_awards_admin_body',page_data,function(err,html) {
              if(err){
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
          });
        } else {
          res.send({'success':0,'reason':"Refresh paused"});
        }
      } else {
        res.send({success:0,reason:"Permission Denied"});
      }
    } catch(error) {
      Common.log("getpingawardsadmin exception caught|"+error,4,cfg);
    }
  });
  return exported;
};
