/**
* @fileoverview  Handles the routing functions for the LDAP connection
* @author Casey Mason and Seth Bird
*/

const Common = require('../modules/Common');
const Audit = require('../modules/Audit');
const LDAP = require('../modules/LDAP.js');
const async = require('async');
const fs = require('fs');

module.exports = function (Server) {
  'use strict';
  let exported = {};
  let app = Server.app;
  let cfg = Server.config;
  let ldap = new LDAP(cfg);

  /**
  * Takes in a search string and calls LDAP.get_associates to search the LDAP server for this user's name or associate ID.
  *   This is used for the autocomplete functionality.
  * @param  {object} req The request coming in. This should be an object array and req.query.term will contain the search term typed into the text box
  * @param  {object} res The response we send back to the frontend.
  * @return {null}
  */
  app.get('/get_users_by_name',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-LDAP-GETUSERSBYNAME",req.session.associateID);
      audit.startSV();
      if(!cfg.SETTINGS.client_pause) {
        LDAP.get_associates(req.query.term,cfg)
        .then(function(data) {
          audit.setValues(cfg,req.query.term,"Search string passed in from the frontend",data.length, "Total rows returned from the LDAP server", data[0].displayName, "Top result returned to the frontend");
          // Stop and send the audit object
          audit.stopSV(cfg);
          res.send({'success':1,'reason':"LDAP Users Retrieved",auditObj:audit, 'users': data});
        })
        .catch(function(error) {
          Common.log(error,4,cfg);
          res.send({success:0,reason:error});
        });
      } else {
        res.send({'success':0,'reason':"Refresh paused"});
      }
    } catch(error) {
      Common.log("ldap - get_users_by_name - exception caught|"+error,4,cfg);
    }
  });



  app.get('/get_users_by_company',function(req,res) {
    try{
      // Create the audit object for usage and timers
      let audit = new Audit(cfg, "USG-LDAP-GETUSERSBYCOMPANY",req.session.associateID);
      audit.startSV();
      if(!cfg.SETTINGS.client_pause) {
        LDAP.getAssociateByCompany("Application Services - Cerner Connect",cfg)
        .then(function(data) {
          cfg.DB.pool.getConnection(function(err,dashdb) {
            if(err) {
              return;
            }
            // Iterate over each item coming in from req.body
            async.each(data,function(item,callback) {
              var sqlUpdate = "";
              sqlUpdate += " UPDATE users ";
              sqlUpdate += " SET first_name = "+dashdb.escape(item.givenName)+" ";
              sqlUpdate += " , last_name = "+dashdb.escape(item.sn)+" ";
              sqlUpdate += " , distinguished_name = "+dashdb.escape(item.distinguishedName)+" ";
              sqlUpdate += " , manager_distinguished_name = "+dashdb.escape(item.manager)+" ";
              sqlUpdate += " , email = "+dashdb.escape(item.mail)+" ";
              sqlUpdate += " , update_by = '" + req.session.associateID + "' ";
              sqlUpdate += " WHERE mnemonic =  "+dashdb.escape(item.sAMAccountName)+"; ";

              var sqlInsert = "INSERT INTO users(mnemonic) SELECT * FROM(SELECT "+dashdb.escape(item.sAMAccountName)+") AS tmp WHERE NOT EXISTS (SELECT mnemonic FROM users WHERE mnemonic="+dashdb.escape(item.sAMAccountName)+") LIMIT 1;";
              if(cfg.SETTINGS.loglvl >= 5) {
                fs.writeFileSync("logs/ldap_company_build.txt",sqlInsert);
              }
              dashdb.query(sqlInsert)
              .on('error',function(err) {
                Common.log("get_users_by_company insert error|" + err,4,cfg);
              })
              .on('end', function () {
                if (cfg.SETTINGS.loglvl >= 4) {
                  Common.log("get_users_by_company insert done",2,cfg);
                }
                dashdb.query(sqlUpdate)
                .on('error',function(err) {
                  Common.log("get_users_by_company update error|" + err,4,cfg);
                })
                .on('end', function () {
                  if (cfg.SETTINGS.loglvl >= 4) {
                    Common.log("get_users_by_company update done",2,cfg);
                  }
                });
                callback(); // Must callback after completing
              });
            },function(err) {
              dashdb.release(); // Release the connection at this point, doesn't matter if it is successful or not
              if(typeof err !=='undefined' && err !== null) {
                return;
              }

            });
          });

          audit.stopSV(cfg);
          res.send({'success':1,'reason':"LDAP Users Retrieved",auditObj:audit, 'users': data});
        })
        .catch(function(error) {
          Common.log(error,4,cfg);
          res.send({success:0,reason:error});
        });
      } else {
        res.send({'success':0,'reason':"Refresh paused"});
      }
    } catch(error) {
      Common.log("ldap - get_users_by_company - exception caught|"+error,4,cfg);
    }
  });

  return exported;
};
