/**
* @fileoverview  Handles the backend functionality of the ping awards tab
*        - The tab will allow the user to select a team and a date range and pull back positive surveys with comments that
*          have been submitted for the associates on the team.
*        - The user will be able to mark each comment to submit a ping for the associate, the TAG engineer, or both.
*        - The user will be able to designate which email address to send it too.
*        - The user will be able to write in a costumized message that will be included at the top of the email.
*        - The user will be able to manually submit Ping Awards
* @author Casey Mason
*/
'use strict';
const fs = require('fs');
const humanname = require('humanname');
const Common = require('../modules/Common');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const validator = require("email-validator");

class PingAwardsManual {
  constructor() {
    return this;
  }

  /**
  * Get all teams for this person to send ping responses
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static get_teams(req, cfg) {
    return new Promise(function(fulfill,reject) {
      var validGroups = ["CIS Global", "CIS", "CIS CS"]; // Only doing this for the CIS teams right now
      var _groups = '';
      for(var i = 0; i < validGroups.length; i++) {
        _groups += "'"+validGroups[i] + "',";
      }
      _groups = _groups.substring(0,_groups.length-1); //remove last comma

      var sql = "SELECT t.ID as TEAM_ID,t.DISPLAY as NAME FROM teams t, groups r, group_team_r gtr ";
      sql += " WHERE r.mnemonic IN ("+_groups+") AND r.id = gtr.group_id AND t.id = gtr.team_id ";
      sql += " ORDER BY t.DISPLAY ASC; ";
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwardsManual - get_teams -conn|"+err);
          return;
        }
        var mylist = [];
        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("PingAwardsManual - get_teams -qry|"+err);
          return;
        })
        .on('result', function (row) {
          mylist.push([row.TEAM_ID,row.NAME]);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("PingAwardsManual - get_teams done", 2, cfg);
          }
          dashdb.release();
          fulfill(mylist);
        });
      });
    });
  }

  /**
  * Saves the Ping award to the database when the user fills out and
  *  submits the manual Ping submission form on the Ping Awards dashboard
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static savePingAwardsManual(req,cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {
      // Set up the connection before entering into the loop
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwardsManual - savePingAwardsManual -conn|"+err);
          return;
        }
        var sqlInsert = '';
        sqlInsert += "INSERT INTO ping_awards(submitted_dttm,submitted_by,ticket,client_mnemonic,comment,recipient,team,recipient_associate_id) VALUES (NOW(), '"+req.session.associateID+"',"+dashdb.escape(req.body.SR)+","+dashdb.escape(req.body.CLIENT_MNEMONIC)+","+dashdb.escape(req.body.COMMENT)+","+dashdb.escape(req.body.NAME)+","+dashdb.escape(req.body.TEAM)+","+dashdb.escape(req.body.ASSOCIATE_ID)+");";
        if(cfg.SETTINGS.loglvl >= 5) {
          fs.writeFileSync("logs/PING_AWARDS_MANUAL_INS_QUERY.txt",sqlInsert);
        }

        dashdb.query(sqlInsert)
        .on('error',function(err) {
          Common.log("PingAwardsManual - savePingAwardsManual submission error| " + err, 4, cfg);
        })
        .on('end', function () {
          //usage.update_usage('PINGWARDS-MANUAL',1);
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("PingAwardsManual - savePingAwardsManual submission done", 2, cfg);
          }
        });
        dashdb.release();
      });
      //req.body.SR
      _this.buildEmailText(req)
      .then(function(emailText) {
        return _this.sendIndividualPingEmail(emailText, req.body.EMAIL);
      })
      .then(function() {
        fulfill();
      })
      .catch(function(error) {
        reject("PingAwardsManual - savePingAwardsManual-err: ", error);
      });
      fulfill();
    });
  }

  /**
  * Build the HTML string that will be used for the Ping Award email
  * @param  {object} req The request containing the values from the frontend
  * @return {string} The completed HTML string
  */
  static buildEmailText(req) {
    return new Promise(function(fulfill,reject) {
      let emailTextHTML = '';
      emailTextHTML += '<p>Hello,</p>';
      emailTextHTML += '<p>Congratulations! You have been recognized with the Client Service Ping Award.</p>';
      emailTextHTML += '<hr/>';
      emailTextHTML += '<p>';
      emailTextHTML += '<span style="font-weight:bold">Presented To: </span>' + req.body.NAME + '<br/>';
      if(req.body.CLIENT_MNEMONIC.length > 0) {
        emailTextHTML += '<span style="font-weight:bold">Client Mnemonic: </span>' + req.body.CLIENT_MNEMONIC + '<br/>';
      }
      if(req.body.SR.length > 0) {
        emailTextHTML += '<span style="font-weight:bold">Ticket Number: </span>' + req.body.SR + '<br/>';
      }
      emailTextHTML += '<span style="font-weight:bold">Description of Recognition: </span>' + req.body.COMMENT + '<br/>';
      emailTextHTML += '<br/></p><hr/>';
      fulfill(emailTextHTML);
    });
  }

  /**
  * Uses nodemailer to create and send an email based on the text and email address provided
  * @param  {string} emailTextHTML The HTML that will be used in the body of the email
  * @param  {string} to_email The email address that the message should be sent to
  * @return {promise}
  */
  static sendIndividualPingEmail(emailTextHTML,to_email) {
    return new Promise(function(fulfill,reject) {
      if(validator.validate(to_email)) {
        // Email address is valid
        var email = to_email;

        // Create the transport object
        var transport = nodemailer.createTransport(smtpTransport({
          host: "_redacted_",  // hostname
          secure: false,              // no need to use SSL
          secureConnection: false,
          port: 25,                   // port for secure SMTP
          tls: {
            rejectUnauthorized: false
          }
        }));

        // Build the email
        var mailOptions = {
          to:      email,
          from:    '_redacted_',
          subject: "Nominee for Client Service Ping Award",
          html:    emailTextHTML
        };

        // Send the email
        transport.sendMail(mailOptions, function(err, response) {
          if(err) {
            return reject("PingAwardsManual - sendIndividualPingEmail-err:"+email+"|"+emailTextHTML+"|"+err);
          } else {
            return fulfill();
          }
        });
      } else {
        return reject("PingAwardsManual - sendIndividualPingEmail-err: Email is not valid");
      }
    });
  }
}
module.exports = PingAwardsManual;
