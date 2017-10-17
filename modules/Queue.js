'use strict';
/**************************************************
Modules
***************************************************/
const Common  = require('../modules/Common');
const Metric  = require('../modules/Metric');
const fs = require('fs');

class Queue {
  constructor(q) {
    this.mnemonic = "";
    this.id = 0;
    this.flag = 0;
    this.timezone = "America/Chicago";
    this.active = 1;
    this.creator = "";
    this.update_by = "";
    this.team_lead_user_mnemonic = "";
    this.client_team_name = "";

    if(typeof q.id !== 'undefined') {this.id = q.id;}
    if(typeof q.mnemonic !== 'undefined') {this.mnemonic = q.mnemonic;}
    if(typeof q.flag !== 'undefined') {this.flag = q.flag;}
    if(typeof q.active !== 'undefined') {this.active = q.active;}
    if(typeof q.timezone !== 'undefined') {this.timezone = q.timezone;}
    if(typeof q.creator !== 'undefined') {this.creator = q.creator;}
    if(typeof q.updated !== 'undefined') {this.updated = q.updated;}
    if(typeof q.update_by !== 'undefined') {this.update_by = q.update_by;}
    if(typeof q.team_lead_user_mnemonic !== 'undefined') {this.team_lead_user_mnemonic = q.team_lead_user_mnemonic;}
    if(typeof q.client_team_name !== 'undefined') {this.client_team_name = q.client_team_name;}

    return;
  }
  update(q) {
    if(typeof q.id !== 'undefined') {this.id = q.id;}
    if(typeof q.mnemonic !== 'undefined') {this.mnemonic = q.mnemonic;}
    if(typeof q.flag !== 'undefined') {this.flag = q.flag;}
    if(typeof q.timezone !== 'undefined') {this.timezone = q.timezone;}
    if(typeof q.creator !== 'undefined') {this.creator = q.creator;}
    if(typeof q.updated !== 'undefined') {this.updated = q.updated;}
    if(typeof q.update_by !== 'undefined') {this.update_by = q.update_by;}
    if(typeof q.team_lead_user_mnemonic !== 'undefined') {this.team_lead_user_mnemonic = q.team_lead_user_mnemonic;}
    if(typeof q.client_team_name !== 'undefined') {this.client_team_name = q.client_team_name;}

    if(typeof q.active !== 'undefined') {
      if(q.active !== 2) {
        this.active = q.active;
      }
    }
    return;
  }
  create_in_db(cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {

      let dashdb = cfg.DB.pool;
      let sqlquery = " INSERT INTO `queues`(mnemonic,active,creator) VALUES("+dashdb.escape(_this.mnemonic)+",'"+_this.active+"',"+dashdb.escape(_this.creator)+"); ";

      if(cfg.SETTINGS.loglvl >= 5) {
        fs.writeFileSync("logs/QUEUES_INSERT_"+_this.mnemonic+"_QUERY.txt",sqlquery);
      }
      return fulfill(sqlquery);
    });
  }
  update_to_db(cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {

      let dashdb = cfg.DB.pool;
      let sqlquery = " UPDATE `queues` SET `active`="+dashdb.escape(_this.active);
      sqlquery += " ,`team_lead_user_mnemonic`="+dashdb.escape(_this.team_lead_user_mnemonic);
      sqlquery += " ,`client_team_name`="+dashdb.escape(_this.client_team_name);
      sqlquery += " ,`flag`="+dashdb.escape(_this.flag);
      sqlquery += " ,`update_by`="+dashdb.escape(_this.update_by);
      sqlquery += " WHERE `mnemonic`='"+_this.mnemonic+"'; ";

      return fulfill(sqlquery);
    });
  }
}
module.exports = Queue;
