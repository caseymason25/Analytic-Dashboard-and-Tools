'use strict';
/**************************************************
Node Modules
***************************************************/
const fs     = require('fs');
const moment = require('moment');
const async  = require('async');
const schedule = require('node-schedule');
/**************************************************
Modules
***************************************************/
const Common  = require('../modules/Common');
const Timer   = require('./Timer');

class Query_Manager {
  constructor(cfg,filename) {
    this.queries = [];
    this.process_queries = []; //copy to this when we're running the process to prevent collisions
    this.error_key = 0; //used to tell where the array left off during an error
    this.in_progress = false;
    this.save_queries_cache_in_progress = false;
    this.filename = filename;
    this.build_scheduled_jobs(cfg);
    this.rebuild_queries_from_file(cfg);

    return;
  }
  create(cfg,query) {
    let _this = this;
    try{
      if(query === null || typeof query === 'undefined' || query === "") {
        Common.log("|Query_Manager -create was passed an empty query:"+query,4,cfg);
        return;
      }
      _this.queries.push(query);
      return;
    } catch(error) {
      Common.log("QM create|"+error,4,cfg);
      return;
    }
  }
  update(cfg) {
    let _this = this;
    return new Promise(function(fulfill,reject) {
      try{
        if(_this.in_progress === false) {
          _this.in_progress = true;
          //see if we need to add any new queries
          if(_this.queries.length > 0) {
            //if process_queries still has some items left, process those first
            let query_len = _this.queries.length; //this will be where we draw the line with queries
            let extract_len = query_len;
            if(query_len >= 100000) {
              extract_len = 100000;
            }
            if(_this.process_queries.length === 0) {
              _this.process_queries = _this.queries.splice(0,extract_len);
            }
          }
          if(_this.process_queries.length > 0) {
            let timer = new Timer();
            if(cfg.SETTINGS.loglvl >= 3) {
              Common.log("|Query Manager -Queries to process:"+_this.process_queries.length,2,cfg);
              timer.newSubTimer("RUN_QUERIES");
            }
            _this.run_update(cfg)
            .then(function(){
              _this.in_progress = false;
              if(cfg.SETTINGS.loglvl >= 3) {
                timer.log(cfg,'Queries have finished - count: ' + _this.process_queries.length,"RUN_QUERIES",0);
              }
              _this.process_queries = [];
              //all process queries finished successfully
              return fulfill();
            })
            .catch(function(error) {
              //error occurred
              _this.in_progress = false;
              _this.process_queries = _this.process_queries.slice(_this.key);
              if(cfg.SETTINGS.loglvl >= 3) {
                timer.log(cfg,'Queries have finished with errors',"RUN_QUERIES",0);
              }
              Common.log("|Query_Manager-update:"+error,4,cfg);
            });
          } else {
            _this.in_progress = false;
            return fulfill();
          }
        } else {
          return reject("ALREADY_RUNNING");
        }
      } catch(error) {
        Common.log("QM update|"+error,4,cfg);
        return reject("QM update| -try catch|"+error);
      }
    });
  }
  run_update(cfg){
    let _this = this;
    return new Promise(function(fulfill,reject) {
      try{
        cfg.DB.pool.getConnection(function (err,dashdb) {
          if(err) {
            return reject("run_update -conn|"+err);
          }
          async.eachOfLimit(_this.process_queries,10,function(qry,key,callback) {
            if(qry !== null && qry !== "") {
              dashdb.beginTransaction(function(err) {
                if(err) {
                  _this.error_key = key;
                  return callback("run_update-beg|"+err);
                }
                dashdb.query(qry,function(err,result) {
                  if(err) {
                    _this.error_key = key;
                    let timestamp = moment.utc().format('x');
                    fs.writeFileSync("logs/RUN_UPDATE_SAVE_QUERY_ER_"+timestamp+".txt",qry+"|run_update-err|"+err);
                    dashdb.rollback();
                    return callback("run_update-qry|"+err);
                  }
                  dashdb.commit(function(err) {
                    if(err) {
                      _this.error_key = key;
                      dashdb.rollback();
                      return callback("run_update-commit|"+err);
                    }
                    return callback();
                  }); // END COMMIT
                }); // END DELETE
              }); // END TRANSACTION
            } else {
              return callback();
            } //ENDIF ensure it's not null/empty
          },function(err) {
            dashdb.release();
            if(typeof err !=='undefined' && err !== null) {
              return reject("process_module-cb|"+err);
            }
            return fulfill();
          });
        });
      } catch(error) {
        Common.log("QM run_update|"+error,4,cfg);
        return reject("run_update -try catch|"+error);
      }
    });
  }
  build_scheduled_jobs(cfg) {
    let _this = this;
    schedule.scheduleJob(cfg.SETTINGS.qm_schedule, function () {
      if(cfg.SERVER.running === true && cfg.SETTINGS.qm_pause === false) {
        _this.update(cfg)
        .then(function(){
          _this.save_cache(cfg);
          return;
        })
        .catch(function(error) {
          if(error !== 'ALREADY_RUNNING') {
            Common.log("|Query_Manager -build_scheduled_jobs -error|"+error,4,cfg);
          }
        });
      }
    });
  }
  rebuild_queries_from_file(cfg) {
    let _this = this;
    try{
      if(fs.existsSync('./cache/'+_this.filename+'.json')) {
        let file = JSON.parse(fs.readFileSync('./cache/'+_this.filename+'.json'));
        for(let k=0;k<file.process_queries.length;k++) {
          _this.create(cfg,file.process_queries[k]);
        }
        for(let k=0;k<file.queries.length;k++) {
          _this.create(cfg,file.queries[k]);
        }
        Common.log("Query Manager cache restored for: "+_this.filename,1,cfg);
      }
    } catch(error) {
      Common.log("|rebuild_queries_from_file -catch|"+error,4,cfg);
      return;
    }
  }
  save_cache(cfg) {
    let _this = this;
    try{
      if(_this.save_queries_cache_in_progress === false) {
        _this.save_queries_cache_in_progress = true;
        fs.writeFileSync("cache/"+_this.filename+"_TEMP.json",JSON.stringify(_this,null,2));
        if(fs.existsSync('./cache/'+_this.filename+'_TEMP.json')) {
          fs.renameSync("cache/"+_this.filename+"_TEMP.json","cache/"+_this.filename+".json");
        }
        _this.save_queries_cache_in_progress = false;
      }
    } catch(error) {
      Common.log("QM save_cache|"+error,4,cfg);
      return;
    }
  }
}
module.exports = Query_Manager;
