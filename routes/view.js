'use strict';
/**************************************************
Node Modules
***************************************************/
const fs = require('fs');
const Common = require('../modules/Common');

module.exports = function (Server) {

  let exported = {};
  let app = Server.app;
  let cfg = Server.config;

  app.get('/getviews', function(req, res) {

    let page_data = {
      perm : cfg.PERM,
      role : req.session.ROLE
    };
    Common.validate_user_session(cfg,req,res)
    .then(function(){
      return Server.cache.get_all("View");
    })
    .then(function(items){
      page_data.build_views = items;
      return Server.cache.get_cache_time("view");
    })
    .then(function(item){
      page_data.allview_cache_refresh = item;
      res.render('includes/view_build',page_data,function(error,html){
        if(error) {
          Common.log("|/getviews -render:"+error,4,cfg);
          res.send({success:0});
        } else {
          res.send({success:1,html:html});
        }
      });
    })
    .catch(function(error) {
      Common.log("|/getviews -catch:"+error,4,cfg);
      res.send({success:0,reason:error});
    });
  });

  app.post('/getview', function(req, res) {

    let page_data = {
      id : 0,
      close_types : cfg.LISTS.CLOSE_TYPES,
      stat_types  : cfg.LISTS.STAT_TYPES,
      cols        : JSON.parse(JSON.stringify(cfg.LISTS.COLS)),
      perm        : cfg.PERM,
      role        : req.session.ROLE,
      team_view_templates : cfg.LISTS.TEAM_VIEW_TEMPLATES,
      timezones   : cfg.LISTS.TIMEZONES
    };
    Common.validate_user_session(cfg,req,res)
    .then(function(){
      return Server.cache.valid_object("View",req.body.mnemonic);
    })
    .then(function(){
      return Server.cache.valid_owner(cfg,"View",req.body.mnemonic,req.session.associateID);
    })
    .then(function(admin_view){
      page_data.admin_view = admin_view;
      return Server.cache.get(cfg,"View",req.body.mnemonic);
    })
    .then(function(item){
      page_data.item = item;
      return Server.cache.get_children("View",req.body.mnemonic,"columns");
    })
    .then(function(items){
      page_data.item.column_objs = items;
      return Server.cache.get_all_as_array("User");
    })
    .then(function(item_users){
      page_data.users = item_users;
      return Server.cache.get_all_as_array("Group");
    })
    .then(function(groups){
      page_data.groups = groups;
      return Server.cache.get_all_as_array("Team");
    })
    .then(function(teams){
      page_data.teams = teams;
      return Server.cache.get_cache_time("view");
    })
    .then(function(time){
      res.render('includes/view_form',page_data,function(error,html){
        if(error) {
          Common.log("|/getview -render:"+error,4,cfg);
          res.send({success:0});
        } else {
          res.send({success:1,html:html,last_refresh:time});
        }
      });
    })
    .catch(function(error) {
      Common.log("|/getview -catch:"+error,4,cfg);
      res.send({success:0,reason:error});
    });
  });
  app.post('/createview', function(req, res) {

    if(req.body.mnemonic.trim().length === 0) {
      res.send({success:0,reason:"View mnemonic must be provided"});
      return false;
    }
    let obj = {
      'mnemonic' : req.body.mnemonic,
      'display' : req.body.mnemonic,
      'id'       : 0,
      'active'   : 0,
      'type'     : 0,
      'creator'  : req.session.associateID,
      'owner'    : [req.session.associateID]
    };
    let page_data = {
      perm : cfg.PERM,
      role : req.session.ROLE
    };

    Common.validate_user_session(cfg,req,res)
    .then(function(){
      return Server.cache.create(cfg,"View",obj,1);
    })
    .then(function() {
      return Server.cache.get_all("View");
    })
    .then(function(items){
      page_data.build_views = items;
      return Server.cache.valid_owner(cfg,"View",req.body.mnemonic,req.session.associateID);
    })
    .then(function(admin_view){
      page_data.admin_view = admin_view;
      return Server.cache.get_cache_time("view");
    })
    .then(function(time){
      page_data.allview_cache_refresh = time;
      res.render('includes/view_build',page_data,function(error,html){
        if(error) {
          Common.log("|/createview -render:"+error,4,cfg);
          res.send({success:0});
        } else {
          res.send({success:1,html:html,last_refresh:time});
        }
      });
    })
    .catch(function(error) {
      Common.log("|/createview -catch:"+error,4,cfg);
      res.send({success:0,reason:error});
    });
  });
  app.post('/createviewfromteam', function(req, res) {

    if(req.body.mnemonic.trim().length === 0) {
      res.send({success:0,reason:"Team mnemonic must be provided"});
      return false;
    }
    let obj = {
      'mnemonic' : req.body.mnemonic,
      'display' : req.body.mnemonic,
      'team' : req.body.mnemonic,
      'team_group_flag' : 1,
      'teamview_ind':1,
      'creator'  : req.session.associateID,
      'owners'    : [req.session.associateID]
    };
    let page_data = {
      perm : cfg.PERM,
      role : req.session.ROLE
    };

    Common.validate_user_session(cfg,req,res)
    .then(function(){
      return Server.cache.create(cfg,"View",obj,1);
    })
    .then(function() {
      res.send({success:1});
    })
    .catch(function(error) {
      Common.log("|/createviewfromteam -catch:"+error,4,cfg);
      res.send({success:0,reason:error});
    });
  });
  app.post('/saveview', function(req, res) {

    if(req.body.mnemonic.trim().length === 0) {
      res.send({success:0,reason:"Mnemonic must be provided"});
      return false;
    }

    Common.validate_user_session(cfg,req,res)
    .then(function(){
      return Server.cache.valid_object("View",req.body.mnemonic);
    })
    .then(function(){
      return Server.cache.valid_owner(cfg,"View",req.body.mnemonic,req.session.associateID);
    })
    .then(function(admin_view){
      if(admin_view === false) {
        throw "Permission denied";
      }
      return Server.cache.update(cfg,"View",req.body,1);
    })
    .then(function() {
      res.send({success:1});
    })
    .catch(function(error) {
      Common.log("/saveview -catch"+error,4,cfg);
      res.send({success:0,reason:error});
    });
  });
  return exported;
};
