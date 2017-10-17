'use strict';

/**************************************************
Node Modules
***************************************************/
const moment = require('moment');
const schedule = require('node-schedule');
/**************************************************
Modules
***************************************************/
const Common  = require('../modules/Common');

class View {
  constructor(q) {
    this.id = 0;
    this.mnemonic = "";
    this.display = "";
    this.active = 1;
    this.timezone = "";
    this.client = "";
    this.allview_ind = 0;
    this.teamview_ind = 0;
    this.service = "";
    this.team_group_flag = 0; /*0 = group of teams, 1 = single team*/
    this.owners = [];
    this.columns = [];
    this.groups = [];
    this.team = "";
    this.graph_ready = 0;
    this.graph_min = 0;
    this.graph_lookback = 12;
    this.dirty_flot = 0;
    this.debug = false;
    this.tat_notification = 0;
    this.team_view = 0;
    this.net_chg_flag = 0;
    this.target_msg = "";
    this.target_cls = "";
    this.target_open = "";
    this.target_fcr = "";
    this.target_24h = "";
    this.target_7d = "";
    this.target_30d = "";
    this.target_opp = "";
    this.creator = "";
    this.updated = "";
    this.update_by = "";

    if(typeof q.id !== 'undefined') {this.id = q.id;}
    if(typeof q.mnemonic !== 'undefined') {this.mnemonic = q.mnemonic;}
    if(typeof q.display !== 'undefined') {this.display = q.display;}
    if(typeof q.active !== 'undefined') {this.active = q.active;}
    if(typeof q.public !== 'undefined') {this.public = q.public;}
    if(typeof q.allview_ind !== 'undefined') {this.allview_ind = q.allview_ind;}
    if(typeof q.teamview_ind !== 'undefined') {this.teamview_ind = q.teamview_ind;}
    if(typeof q.service !== 'undefined') {this.service = q.service;}
    if(typeof q.timezone !== 'undefined') {this.timezone = q.timezone;}
    if(typeof q.graph_min !== 'undefined') {this.graph_min = q.graph_min;}
    if(typeof q.graph_ready !== 'undefined') {this.graph_ready = q.graph_ready;}
    if(typeof q.team_group_flag !== 'undefined') {this.team_group_flag = q.team_group_flag;}
    if(typeof q.team !== 'undefined') {this.team = q.team;}
    if(typeof q.client !== 'undefined') {this.client = q.client.replace(/\s/g,'');} // remove whitespace
    if(typeof q.team_view_template !== 'undefined') {this.team_view_template = q.team_view_template;}
    if(typeof q.owners !== 'undefined') {this.owners = q.owners;}
    if(typeof q.columns !== 'undefined') {this.columns = q.columns;}
    if(typeof q.groups !== 'undefined') {this.groups = q.groups;}
    if(typeof q.graph_lookback !== 'undefined') {this.graph_lookback = q.graph_lookback;}
    if(typeof q.net_chg_flag !== 'undefined') {this.net_chg_flag = q.net_chg_flag;}
    if(typeof q.dirty_flot !== 'undefined') {this.dirty_flot = q.dirty_flot;}
    if(typeof q.debug !== 'undefined') {this.debug = q.debug;}
    if(typeof q.tat_notification !== 'undefined') {this.tat_notification = q.tat_notification;}
    if(typeof q.target_msg !== 'undefined') {this.target_msg = q.target_msg;}
    if(typeof q.target_cls !== 'undefined') {this.target_cls = q.target_cls;}
    if(typeof q.target_fcr !== 'undefined') {this.target_fcr = q.target_fcr;}
    if(typeof q.target_24h !== 'undefined') {this.target_24h = q.target_24h;}
    if(typeof q.target_7d !== 'undefined') {this.target_7d = q.target_7d;}
    if(typeof q.target_30d !== 'undefined') {this.target_30d = q.target_30d;}
    if(typeof q.target_open !== 'undefined') {this.target_open = q.target_open;}
    if(typeof q.target_opp !== 'undefined') {this.target_opp = q.target_opp;}
    if(typeof q.target_asa !== 'undefined') {this.target_asa = q.target_asa;}
    if(typeof q.creator !== 'undefined') {this.creator = q.creator;}
    if(typeof q.updated !== 'undefined') {this.updated = q.updated;}
    if(typeof q.update_by !== 'undefined') {this.update_by = q.update_by;}


    //DO NOT SORT groups here, it takes too long, sort groups in 'update' only
    return;
  }
  update(q) {

    if(typeof q.id !== 'undefined') {this.id = q.id;}
    if(typeof q.mnemonic !== 'undefined') {this.mnemonic = q.mnemonic;}
    if(typeof q.display !== 'undefined') {this.display = q.display;}
    if(typeof q.active !== 'undefined') {this.active = q.active;}
    if(typeof q.public !== 'undefined') {this.public = q.public;}
    if(typeof q.team !== 'undefined') {this.team = q.team;}
    if(typeof q.allview_ind !== 'undefined') {this.allview_ind = q.allview_ind;}
    if(typeof q.teamview_ind !== 'undefined') {this.teamview_ind = q.teamview_ind;}
    if(typeof q.service !== 'undefined') {this.service = q.service;}
    if(typeof q.timezone !== 'undefined') {this.timezone = q.timezone;}
    if(typeof q.graph_min !== 'undefined') {this.graph_min = q.graph_min;}
    if(typeof q.graph_ready !== 'undefined') {this.graph_ready = q.graph_ready;}
    if(typeof q.team_group_flag !== 'undefined') {this.team_group_flag = q.team_group_flag;}
    if(typeof q.client !== 'undefined') {this.client = q.client.replace(/\s/g,'');} // remove whitespace
    if(typeof q.team_view_template !== 'undefined') {this.team_view_template = q.team_view_template;}
    if(typeof q.owners !== 'undefined') {this.owners = q.owners;}
    if(typeof q.columns !== 'undefined') {this.columns = q.columns;}
    if(typeof q.groups !== 'undefined') {this.groups = q.groups;}
    if(typeof q.graph_lookback !== 'undefined') {this.graph_lookback = q.graph_lookback;}
    if(typeof q.net_chg_flag !== 'undefined') {this.net_chg_flag = q.net_chg_flag;}
    if(typeof q.dirty_flot !== 'undefined') {this.dirty_flot = q.dirty_flot;}
    if(typeof q.debug !== 'undefined') {this.debug = q.debug;}
    if(typeof q.tat_notification !== 'undefined') {this.tat_notification = q.tat_notification;}
    if(typeof q.target_msg !== 'undefined') {this.target_msg = q.target_msg;}
    if(typeof q.target_cls !== 'undefined') {this.target_cls = q.target_cls;}
    if(typeof q.target_fcr !== 'undefined') {this.target_fcr = q.target_fcr;}
    if(typeof q.target_24h !== 'undefined') {this.target_24h = q.target_24h;}
    if(typeof q.target_7d !== 'undefined') {this.target_7d = q.target_7d;}
    if(typeof q.target_30d !== 'undefined') {this.target_30d = q.target_30d;}
    if(typeof q.target_open !== 'undefined') {this.target_open = q.target_open;}
    if(typeof q.target_opp !== 'undefined') {this.target_opp = q.target_opp;}
    if(typeof q.target_asa !== 'undefined') {this.target_asa = q.target_asa;}
    if(typeof q.creator !== 'undefined') {this.creator = q.creator;}
    if(typeof q.updated !== 'undefined') {this.updated = q.updated;}
    if(typeof q.update_by !== 'undefined') {this.update_by = q.update_by;}


    if(this.groups.length > 0) {
      this.groups.sort();
    }

    return;
  }
  create_in_db(cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {

      let dashdb = cfg.DB.pool;
      let sqlquery = " INSERT INTO `views`(mnemonic,active,creator) VALUES("+dashdb.escape(_this.mnemonic)+","+dashdb.escape(_this.active)+","+dashdb.escape(_this.creator)+"); ";

      return fulfill(sqlquery);
    });
  }
  update_to_db(cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {

      let dashdb = cfg.DB.pool;
      let sqlquery = " UPDATE `views` SET `display`="+dashdb.escape(_this.display);
      sqlquery += ",`active`="+dashdb.escape(_this.active);
      sqlquery += ",`public`="+dashdb.escape(_this.public);
      sqlquery += ",`client`="+dashdb.escape(_this.client.replace(/\s/g,'')); // remove whitespace
      sqlquery += ",`timezone`="+dashdb.escape(_this.timezone);
      sqlquery += ",`team_view_template`="+dashdb.escape(_this.team_view_template);
      sqlquery += ",`team_group_flag`="+dashdb.escape(_this.team_group_flag);
      sqlquery += ",`graph_min`="+dashdb.escape(_this.type);
      sqlquery += ",`service`="+dashdb.escape(_this.service);
      sqlquery += ",`team`="+dashdb.escape(_this.team);
      sqlquery += ",`graph_lookback`="+dashdb.escape(_this.graph_lookback);
      sqlquery += ",`dirty_flot`="+dashdb.escape(_this.dirty_flot);
      sqlquery += ",`debug`="+dashdb.escape(_this.debug);
      sqlquery += ",`tat_notification`="+dashdb.escape(_this.tat_notification);
      sqlquery += ",`teamview_ind`="+dashdb.escape(_this.teamview_ind);
      sqlquery += ",`allview_ind`="+dashdb.escape(_this.allview_ind);
      sqlquery += ",`net_chg_flag`="+dashdb.escape(_this.net_chg_flag);
      sqlquery += ",`target_msg`="+dashdb.escape(_this.target_msg);
      sqlquery += ",`target_cls`="+dashdb.escape(_this.target_cls);
      sqlquery += ",`target_open`="+dashdb.escape(_this.target_open);
      sqlquery += ",`target_fcr`="+dashdb.escape(_this.target_fcr);
      sqlquery += ",`target_24h`="+dashdb.escape(_this.target_24h);
      sqlquery += ",`target_7d`="+dashdb.escape(_this.target_7d);
      sqlquery += ",`target_30d`="+dashdb.escape(_this.target_30d);
      sqlquery += ",`target_opp`="+dashdb.escape(_this.target_opp);
      sqlquery += ",`update_by`="+dashdb.escape(_this.update_by);
      sqlquery += " WHERE `mnemonic`="+dashdb.escape(_this.mnemonic)+"; ";

      sqlquery += " DELETE FROM `view_owner_r` ";
      sqlquery += " WHERE `view_id` in( SELECT id FROM `views` WHERE mnemonic="+dashdb.escape(_this.mnemonic)+"); ";

      for(let o=0;o<_this.owners.length;o++) {
        sqlquery += "INSERT INTO `view_owner_r`(`view_id`,`user_id`) VALUES((SELECT id FROM `views` WHERE mnemonic="+dashdb.escape(_this.mnemonic)+"),(SELECT id FROM users WHERE mnemonic="+dashdb.escape(_this.owners[o])+"));";
      }

      sqlquery += " DELETE FROM `view_group_r` ";
      sqlquery += " WHERE `view_id` in( SELECT id FROM `views` WHERE mnemonic="+dashdb.escape(_this.mnemonic)+"); ";

      for(let o=0;o<_this.groups.length;o++) {
        sqlquery += "INSERT INTO `view_group_r`(`view_id`,`group_id`) VALUES((SELECT id FROM `views` WHERE mnemonic="+dashdb.escape(_this.mnemonic)+"),(SELECT id FROM groups WHERE mnemonic="+dashdb.escape(_this.groups[o])+"));";
      }

      return fulfill(sqlquery);
    });
  }
  /**
  * Adds a child cache object into the array for this object
  * This checks for duplicates
  * @param {string} child type of child (owner, queue, etc)
  * @param {string} value mnemonic of the child object
  */
  add_child(child,value) {
    let _this = this;
    if(_this[child].indexOf(value.child) === -1) {
      _this[child].push(value.child);
    }
    return;
  }
}
module.exports = View;
