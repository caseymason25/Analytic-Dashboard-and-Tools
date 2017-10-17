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
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const validator = require("email-validator");
const humanname = require('humanname');
const Common = require('../modules/Common');
const moment = require('moment');
const async = require('async');

class PingAwards {
  constructor() {
    return this;
  }

  /**
  * Get all teams for this person to send ping responses
  * @param  {object} filters Object of the different filters that will be used in the SQL query
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {promise}
  */
  static get_teams(req, cfg) {
    return new Promise(function(fulfill,reject) {
      var sql = "SELECT t.ID,t.DISPLAY as NAME FROM teams t,team_owner_r tor WHERE t.id=tor.team_id AND tor.user_id="+req.session.USER_ID+" ORDER BY t.display;";
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwards - get_teams -conn|"+err);
          return;
        }
        if (cfg.SETTINGS.loglvl >= 5) {
          fs.writeFileSync("logs/PINGAWARDS_GETTEAMS_"+req.session.USER_ID+".txt",sql);
        }
        var mylist = [];
        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("PingAwards - get_teams -qry|"+err);
          return;
        })
        .on('result', function (row) {
          mylist.push([row.ID,row.NAME]);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("PingAwards - get_teams done", 2, cfg);
          }
          dashdb.release();
          fulfill(mylist);
        });
      });
    });
  }

  /**
  * Get positive pings (associate rating >= 4) from the local DB
  * @param  {object} filters Object of the different filters that will be used in the SQL query
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {promise}
  */
  static getPings(filters, cfg) {
    return new Promise(function(fulfill,reject) {
      var _teams = '';
      for(var i = 0; i < filters.TEAM.length; i++) {
        _teams += "'"+filters.TEAM[i] + "',";
      }
      _teams = _teams.substring(0,_teams.length-1); //remove last comma

      var sql = " SELECT ";
      sql += " DATE_FORMAT(ss.survey_submitted_dttm,'%Y-%m-%d') as SUBMITTED_DTTM ";
      sql += " ,DATE_FORMAT(ss.sent_dttm,'%Y-%m-%d %H:%i') as SENT_DTTM ";
      sql += " ,DATE_FORMAT(ss.updt_dttm,'%Y-%m-%d %H:%i') as UPDT_DTTM ";
      sql += " ,t.id as t_id ";
      sql += " ,u.email as owner_email ";
      sql += " ,u2.email as tag_email ";
      sql += " ,ss.* ";
      sql += " FROM survey_send_assoc ss ";
      sql += " JOIN queues q ON ss.team=q.mnemonic ";
      sql += " JOIN team_queue_r r ON r.queue_id=q.id ";
      sql += " JOIN teams t ON t.id = r.team_id AND t.id IN ("+_teams+") ";
      sql += " LEFT OUTER JOIN users u ON u.mnemonic = ss.sr_associate_id ";
      sql += " LEFT OUTER JOIN users u2 ON u2.mnemonic = ss.tag_associate_id ";
      sql += " WHERE ss.survey_submitted_dttm between '" + filters.START + "' AND '" + filters.END + "' ";
      sql += " AND ss.associate_resp >= '4' ";
      sql += " AND ss.comment != '' ";
      sql += " GROUP BY ss.response_id ";
      sql += " ORDER BY TEAM, SUBMITTED_DTTM desc; ";
      if(cfg.SETTINGS.loglvl >= 5) {
        fs.writeFileSync("logs/PING_AWARDS_"+filters.TEAM+"_QUERY.txt",sql);
      }

      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwards - getPings -conn|"+err);
          return;
        }
        var mylist = [];
        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("PingAwards - getPings -qry|"+err);
          return;
        })
        .on('result', function (row) {
          var item ={};
          var otherTag;
          item.ID        = row.survey_send_assoc_id;
          item.EXCLUDED = row.excluded;
          //item.SUBMITTED_DTTM = moment.utc(row.SUBMITTED_DTTM).tz('America/Chicago').format('YYYY-MM-DD HH:mm');
          item.SUBMITTED_DTTM = moment.utc(row.SUBMITTED_DTTM).format('MM-DD-YYYY');
          item.SR         = row.sr;
          item.CLIENT     = row.client;
          item.TEAM       = row.team;
          item.SR_OWNER = row.sr_owner;
          item.SR_OWNER_EMAIL = row.owner_email;
          if(row.tag_owner.length > 0) {
            var parseName = humanname.parse(row.tag_owner);
            var formatted = parseName.lastName + ',' + parseName.firstName;
            item.TAG_OWNER = formatted;
          } else {
            item.TAG_OWNER = row.tag_owner;
          }
          item.TAG_OWNER_EMAIL = row.tag_email;
          item.CONTACT_NAME  = row.contact_name;
          item.SATISFACTION_LEVEL = row.associate_resp;
          item.SATISFACTION_OVERALL = row.overall_resp;
          item.COMMENT   = row.comment;
          item.TO_EMAIL  = row.team_email_dl;
          item.TAG_OWNER_OTHER  = row.tag_owner_other;
          // Remove the last occurence of the '###' seperator and replace the rest with the word 'and'
          item.TAG_OWNER_OTHER = item.TAG_OWNER_OTHER.substring(0,item.TAG_OWNER_OTHER.lastIndexOf("###"));
          item.TAG_OWNER_OTHER.replace(/###/g, " and ");
          item.PING_IND = row.ping_ind;
          item.PING_TAG_IND = row.ping_tag_ind;
          item.TEAM_ID  = row.t_id;
          item.SR_ASSOCIATE_ID = row.sr_associate_id;
          item.TAG_ASSOCIATE_ID  = row.tag_associate_id;
          mylist.push(item);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("PingAwards - getPings done", 2, cfg);
          }
          dashdb.release();
          fulfill(mylist);
        });
      });
    });
  }

  /**
  * Uses nodemailer to create and send an email based on the text and email address provided
  * @param  {string} emailTextHTML The HTML that will be used in the body of the email
  * @param  {string} to_email The email address that the message should be sent to
  * @return {promise}
  */
  static sendTeampings(emailTextHTML,to_email) {
    return new Promise(function(fulfill,reject) {
      try{
        if(validator.validate(to_email)) {
          // Email address is valid
          var email = to_email;

          // Create the transport object
          var transport = nodemailer.createTransport(smtpTransport({
            host: "smtprr._redacted_.com",  // hostname
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
            subject: "Team ping Results!",
            html:    emailTextHTML
          };

          // Send the email
          transport.sendMail(mailOptions, function(err, response) {
            if(err) {
              return reject("sendTeampings-err:"+email+"|"+emailTextHTML+"|"+err);
            } else {
              return fulfill();
            }
          });
        } else {
          return reject("PingAwards - sendTeampings-err: Email is not valid");
        }
      } catch(error) {
        return reject("PingAwards - sendTeampings-err:"+to_email+"|"+emailTextHTML+"|"+error);
      }
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
            return reject("sendIndividualPingEmail-err:"+email+"|"+emailTextHTML+"|"+err);
          } else {
            return fulfill();
          }
        });
      } else {
        return reject("PingAwards - sendIndividualPingEmail-err: Email is not valid");
      }
    });
  }

  /**
  *
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static processIndividualPingEmails(individualEmails,cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {
      async.each(individualEmails,function(item,callback) {
        _this.sendIndividualPingEmail(item.HTML, item.EMAIL);
        callback(); // Must callback after completing
      },function(err) {
        if(typeof err !=='undefined' && err !== null) {
          reject("PingAwards - processIndividualPingEmails -async.eachLimit|"+err);
          return;
        }

        fulfill();
      });
    });
  }


  /**
  * Saves the Ping awards to the database when the user marks the checkboxes and submits
  *  the batch of Pings on the Ping Awards dashboard
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static savePingAwards(req,cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {
      // Set up the connection before entering into the loop
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwards - savePingAwards -conn|"+err);
          return;
        }
        // Iterate over each item coming in from req.body
        async.each(req.body.pingAwards,function(item,callback) {
          var sql = '';
          if(item.TAG === 0) {
            //This is not a TAG ping
            sql = "UPDATE survey_send_assoc ssa SET ssa.ping_ind = '1', ssa.ping_submitted_dttm = NOW(), ssa.ping_submitted_by = '" + req.session.associateID + "' WHERE ssa.survey_send_assoc_id IN('" + item.ID + "');  ";
          } else {
            // This is a TAG ping
            sql = "UPDATE survey_send_assoc ssa SET ssa.ping_tag_ind = '1', ssa.ping_tag_submitted_dttm = NOW(), ssa.ping_tag_submitted_by = '" + req.session.associateID + "' WHERE ssa.survey_send_assoc_id IN('" + item.ID +"');  ";
          }

          var sqlInsert = '';
          sqlInsert += "INSERT INTO ping_awards(survey_send_assoc_id, submitted_dttm,submitted_by,ticket,client_mnemonic,comment,recipient,team,recipient_associate_id) SELECT * FROM(SELECT "+dashdb.escape(item.ID)+", NOW(),'"+req.session.associateID+"',"+dashdb.escape(item.SR)+","+dashdb.escape(item.CLIENT_MNEMONIC)+","+dashdb.escape(item.COMMENT)+","+dashdb.escape(item.NAME)+","+dashdb.escape(item.TEAM)+","+dashdb.escape(item.ASSOCIATE_ID)+") AS tmp WHERE NOT EXISTS (SELECT ticket FROM ping_awards WHERE survey_send_assoc_id="+dashdb.escape(item.ID)+" AND recipient="+dashdb.escape(item.NAME)+") LIMIT 1;";
          if(cfg.SETTINGS.loglvl >= 5) {
            fs.writeFileSync("logs/PING_AWARDS_INS_QUERY.txt",sqlInsert);
          }

          dashdb.query(sql)
          .on('error',function(err) {
            Common.log("PingAwards - savePingAwards query error|" + err,4,cfg);
          })
          .on('end', function () {
            if (cfg.SETTINGS.loglvl >= 4) {
              Common.log("PingAwards - savePingAwards query done",2,cfg);
            }
            dashdb.query(sqlInsert)
            .on('error',function(err) {
              Common.log("PingAwards - savePingAwards submission error|" + err,4,cfg);
            })
            .on('end', function () {
              if (cfg.SETTINGS.loglvl >= 4) {
                Common.log("PingAwards - savePingAwards submission done",2,cfg);
              }
            });
            callback(); // Must callback after completing
          });
        },function(err) {
          dashdb.release(); // Release the connection at this point, doesn't matter if it is successful or not
          if(typeof err !=='undefined' && err !== null) {
            reject("PingAwards - savePingAwards -async.eachLimit|"+err);
            return;
          }
          _this.processIndividualPingEmails(req.body.individualEmails,cfg);
          fulfill();
        });
      });
    });
  }

  /**
  * Updates the survey_send_assoc table to mark the survey as excluded for Ping awards. This makes the frontend show
  *   the row as greyed out, and will prevent the ping from being seen on the admin panel.
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static excludePingRow(req,cfg) {
    return new Promise(function(fulfill,reject) {
      // Set up the connection before entering into the loop
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("PingAwards - excludePingRow -conn|"+err);
          return;
        }
        var sql = '';
        sql = "UPDATE survey_send_assoc ssa SET ssa.excluded = " + dashdb.escape(req.body.FLAG) +" WHERE ssa.survey_send_assoc_id = " + dashdb.escape(req.body.ID) +";  ";
        dashdb.query(sql)
        .on('error',function(err) {
          Common.log("PingAwards - excludePingRow query error|" + err,4,cfg);
          reject("PingAwards - excludePingRow query error|" + err);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("PingAwards - excludePingRow query done",2,cfg);
          }
          dashdb.release();
          fulfill();
        });
      });
    });
  }
}
module.exports = PingAwards;
