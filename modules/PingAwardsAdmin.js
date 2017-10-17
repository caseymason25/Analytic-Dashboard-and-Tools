/**
* @fileoverview  Handles the backend functionality of the ping awards admin tab
*        - The tab will allow the user to select a group and a date range and pull back pings submitted during that timeframe
*        - The user will be able to export the list of pings submitted to a CSV file
* @author Casey Mason
*/
'use strict';

const Common = require('../modules/Common');
const fs = require('fs');
var XLSX = require('xlsx-style');

class PingAwardsAdmin {
  constructor() {
    return this;
  }

  /**
  * Creates an excel file that is formatted with a new sheet for each group. Each Team should be bolded and
  *  an associates name should only show up once - even if they are a part of multiple teams.
  * @param  {object[]} pingList An array of objects representing each ping award
  * @return {string} The file location that the frontend will use to link to the correct Excel file
  */
  static createWorkbook(pingList) {
    var ATTRIBUTE_VALUE_STYLE={
      font: {
        name:   "Arial",
        sz:     10
      },
      border: {
        right: { style: "thick", color: { rgb: "FFFFFFFF" }}
      }
    };

    var ATTRIBUTE_VALUE_STYLE_HEADER={
      font: {
        name: "Arial",
        sz: 12,
        bold: true,
        underline: true
      },
      border: {
        right: { style: "thick", color: { rgb: "FFFFFFFF" }}
      }
    };

    var ATTRIBUTE_VALUE_STYLE_HIGHLIGHT={
      font: {
        name:   "Arial",
        sz:     10,
      },
      fill: {
        fgColor: {
          rgb: "FFFFFF00"
        }
      },
      border: {
        right: { style: "thick", color: { rgb: "FFFFFFFF" }}
      }
    };

    var Workbook = function(){
      this.SheetNames = [];
      this.Sheets = {};
    };

    var range = {s: {c:10000000, r:10000000}, e:{c:0, r:0}};

    function updateRange(row, col) {
      if (range.s.r > row) { range.s.r = row;}
      if (range.s.c > col) { range.s.c = col; }
      if (range.e.r < row) { range.e.r = row; }
      if (range.e.c < col) { range.e.c = col; }
    }

    function addCell(wb, ws, value, type, row, col, styles) {

      updateRange(row, col);

      var cell = {t: type, v: value, s:styles};

      // i use d to recognize that the format is a date, and if it is, i use z attribute to format it
      if (cell.t === 'd') {
        cell.t = 'n';
        cell.z = XLSX.SSF._table[14];
      }

      var cell_ref = XLSX.utils.encode_cell({c: col, r:row});

      ws[cell_ref] = cell;
    }

    var wb = new Workbook();
    var ws = {"!cols": []}; // worksheet with array of column properties objects.
    var sheetName = pingList[0].GROUP;
    var row = 0; // counter to know which row in the excel document we are on
    var col = 0; // Counter to know what column to use. 3 columns per page
    var maxLength = pingList[0].TEAM.length; // maxLength is used to set the column width in ws[!cols]
    var uniqueAssociateList = []; // List of unique associate IDs. No duplicates.

    addCell(wb, ws, pingList[0].TEAM, 's', row++, col, ATTRIBUTE_VALUE_STYLE_HEADER);

    for(var i = 0; i < pingList.length; i++) {

      if(i > 0 && pingList[i].GROUP !== pingList[i-1].GROUP) {
        // New group - add the current worksheet to the workbook and reset for the next group/sheet
        ws["!ref"] = XLSX.utils.encode_range(range);
        ws["!cols"].push({wch: maxLength});
        ws["!pageSetup"] = {scale: '100'};
        ws["!colBreaks"] = [3,6,9,12,15,18,21,24,27,30]; // 3 columns per page
        wb.SheetNames.push(sheetName);
        wb.Sheets[sheetName] = ws;
        sheetName = pingList[i].GROUP;
        ws = {"!cols": []};
        row = 0;
        col = 0;
        maxLength = 0;
      }
      if(uniqueAssociateList.indexOf(pingList[i].RECIPIENT_ASSOCIATE_ID) < 0) {
        // Assoicate has not been added to the excel sheet yet. We check this so that an associate tied to multiple teams will only show up 1 time
        if(i > 0 && pingList[i].TEAM !== pingList[i-1].TEAM) {
          // New Team, Add the Team header
          if(maxLength < pingList[i].TEAM.length) { maxLength = pingList[i].TEAM.length; }
          addCell(wb, ws, pingList[i].TEAM, 's', row++, col, ATTRIBUTE_VALUE_STYLE_HEADER);
        }

        if(pingList[i].FIRST_PING === 1) {
          // First Ping, Hihlight Cell
          addCell(wb, ws, pingList[i].RECIPIENT, 's', row++, col, ATTRIBUTE_VALUE_STYLE_HIGHLIGHT);
        } else {
          addCell(wb, ws, pingList[i].RECIPIENT, 's', row++, col, ATTRIBUTE_VALUE_STYLE);
        }
        // Add the newly added associate to the array of already used associates
        uniqueAssociateList.push(pingList[i].RECIPIENT_ASSOCIATE_ID);

        // If the row is 40 and it's a team header then this will not hit. In that case we will write the header on row 40 and 1 extra row with a single
        // associate name on row 41, then continue as normal.
        if(row >= 40) {
          // Move on to the next column
          col++;
          row = 0;
          ws["!cols"].push({wch: maxLength});
        }
      }

      if(maxLength < pingList[i].RECIPIENT.length) { maxLength = pingList[i].RECIPIENT.length; }

    }
    ws["!ref"] = XLSX.utils.encode_range(range);
    ws["!cols"].push({wch: maxLength});
    ws["!pageSetup"] = {scale: '100'};
    ws["!colBreaks"] = [3,6,9,12,15,18,21,24,27,30];
    wb.SheetNames.push(sheetName);
    wb.Sheets[sheetName] = ws;

    /* bookType can be 'xszlsx' or 'xlsm' or 'xlsb' */
    var wopts = { bookType:'xlsx' };
    // Create a unique filename using the date in milliseconds and a random integer
    var timestamp = Date.now();
    var rand = Math.floor(Math.random() * (10000 - 0)) + 0;
    var OUTFILE = 'tmp/ping_awards_' + timestamp + '_' + rand + '.xlsx';
    XLSX.writeFile(wb, "public/"+OUTFILE, wopts);
    return OUTFILE;
  }

  /**
  * Query the database for the pings submitted for the specified group and time frame
  * @param  {object} filters Object of the different filters that will be used in the SQL query
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {promise}
  */
  static getPingsAdmin(filters, cfg) {
    var _this = this;
    return new Promise(function(fulfill,reject) {
      var _groups = '';
      for(var i = 0; i < filters.GROUP.length; i++) {
        _groups += "'"+filters.GROUP[i] + "',";
      }
      _groups = _groups.substring(0,_groups.length-1); //remove last comma
      var sql = "";
      sql += " SELECT g2.mnemonic, t.display, pa.recipient, pa.comment, pa.recipient_associate_id, pa.ping_awards_id ";
      sql += " FROM ping_awards pa ";
      sql += " JOIN teams t ON t.id = pa.team ";
      sql += " JOIN group_team_r g ON g.team_id = t.id ";
      sql += " JOIN groups g2 ON g2.id = g.group_id AND g.group_id IN (" + _groups + ") ";
      sql += " LEFT OUTER JOIN survey_send_assoc ssa ON ssa.survey_send_assoc_id = pa.survey_send_assoc_id AND ssa.excluded = 0 ";
      sql += " WHERE pa.submitted_dttm BETWEEN '" + filters.START + "' AND '" + filters.END + "' ";
      sql += " ORDER BY g2.mnemonic, t.display, pa.recipient ";

      if(cfg.SETTINGS.loglvl >= 5) {
        fs.writeFileSync("logs/ping_awards_admin_"+filters.GROUP+"_QUERY.txt",sql);
      }

      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("getPingsAdmin -conn|"+err);
          return;
        }

        var mylist = {
          pings: [],
          pingsExcel:[]
        };

        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("getPingsAdmin -qry|"+err);
          return;
        })
        .on('result', function (row) {
          var item ={};
          item.ID = row.ping_awards_id;
          item.RECIPIENT = row.recipient;
          item.TEAM = row.display;
          item.GROUP = row.mnemonic;
          item.COMMENT = row.comment;
          item.RECIPIENT_ASSOCIATE_ID = row.recipient_associate_id.toUpperCase();
          mylist.pings.push(item);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("getPingsAdmin done",2,cfg);
          }
          var sql2 = "";
          sql2 += " SELECT g2.mnemonic, t.display, pa.recipient, pa.comment, pa.recipient_associate_id, pa.ping_awards_id ";
          sql2 += " FROM ping_awards pa ";
          sql2 += " JOIN teams t ON t.id = pa.team ";
          sql2 += " JOIN group_team_r g ON g.team_id = t.id ";
          sql2 += " JOIN groups g2 ON g2.id = g.group_id AND g.group_id IN (" + _groups + ") ";
          sql2 += " LEFT OUTER JOIN survey_send_assoc ssa ON ssa.survey_send_assoc_id = pa.survey_send_assoc_id AND ssa.excluded = 0 ";
          sql2 += " WHERE pa.submitted_dttm BETWEEN '" + filters.START + "' AND '" + filters.END + "' ";
          sql2 += " GROUP BY g2.mnemonic, t.display, pa.recipient ";
          sql2 += " ORDER BY g2.mnemonic, t.display, pa.recipient ";
          dashdb.query(sql2)
          .on('error',function(err) {
            dashdb.release();
            reject("get_pings_excel_admin -qry|"+err);
            return;
          })
          .on('result', function (row) {
            var item ={};
            item.ID = row.ping_awards_id;
            item.RECIPIENT = row.recipient;
            item.TEAM = row.display;
            item.GROUP = row.mnemonic;
            item.RECIPIENT_ASSOCIATE_ID = row.recipient_associate_id.toUpperCase();
            item.FIRST_PING = 0;
            mylist.pingsExcel.push(item);
          })
          .on('end', function () {
            if (cfg.SETTINGS.loglvl >= 4) {
              Common.log("get_pings_excel_admin done",2,cfg);
            }
            dashdb.release();

            fulfill(mylist);
          });
        });
      });
    });
  }

  /**
  * Looks back to January 1st of the current year up until the start date chosen on the frontend.
  *  If any of the current Ping Award winners do not come back in the query then it is their first
  *  Ping Award of the year. This will flag them with an asterisk and mark their FIRST_PING indicator
  *  to 1 so that the excel file will highlight their name.
  * @param  {object[]} pingList  The list of Pings for the current date range. This array should have an assoicate exist only 1 time in the array
  * @param  {string} startDate The start date from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {object[]} The completed list of pings with the excel file location stored in it (for the frontend)
  */
  static checkFirstPingsAdmin(pingList, startDate, cfg) {
    var _this = this;
    return new Promise(function(fulfill,reject) {
      var _associates = '';
      for(var i = 0; i < pingList.pingsExcel.length; i++) {
        _associates += "'"+pingList.pingsExcel[i].RECIPIENT_ASSOCIATE_ID + "',";
      }
      _associates = _associates.substring(0,_associates.length-1); //remove last comma

      var sql = "";
      sql += " SELECT DISTINCT(pa.recipient_associate_id) ";
      sql += " FROM ping_awards pa ";
      sql += " WHERE pa.submitted_dttm BETWEEN '2017-01-01' AND '" + startDate + "' ";
      sql += " ORDER BY pa.ticket, pa.recipient_associate_id ";

      if(cfg.SETTINGS.loglvl >= 5) {
        fs.writeFileSync("logs/ping_awards_admin_check_first_QUERY.txt",sql);
      }

      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("checkFirstPingsAdmin -conn|"+err);
          return;
        }
        var mylist = {
          pings: []
        };

        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("checkFirstPingsAdmin -qry|"+err);
          return;
        })
        .on('result', function (row) {
          var item ={};
          item.RECIPIENT_ASSOCIATE_ID = row.recipient_associate_id.toUpperCase();
          mylist.pings.push(item);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("checkFirstPingsAdmin done",2,cfg);
          }
          dashdb.release();

          /**
          * Loop the pingList array containing the Ping Awards and compare the associates with the past ping awards
          *  to determine if this is the associate's first ping award for the year.
          */
          for(var i = 0; i < pingList.pingsExcel.length; i++) {
            var found = false;
            for(var j = 0; j < mylist.pings.length; j++) {
              if(pingList.pingsExcel[i].RECIPIENT_ASSOCIATE_ID === mylist.pings[j].RECIPIENT_ASSOCIATE_ID) {
                // found, the associate has had a ping in the past year
                found = true;
              }
            }
            if(!found) {
              // The associate has not recieved a Ping before
              pingList.pingsExcel[i].FIRST_PING = 1;
              pingList.pingsExcel[i].RECIPIENT = "*" + pingList.pingsExcel[i].RECIPIENT;
            }
          }

          // Create the Excel workbook only if there are Ping Awards to process
          if(pingList.pingsExcel.length > 0) {
            var filename = _this.createWorkbook(pingList.pingsExcel);
            pingList.excel_file = filename;
          } else {
            pingList.excel_file = "";
          }

          fulfill(pingList);
        });
      });
    });
  }

  /**
  * Get all groups form the GROUPS table
  * @param  {object} req The request containing the values from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {Promise}
  */
  static getTeamGroups(req, cfg) {
    return new Promise(function(fulfill,reject) {
      var sql = "SELECT DISTINCT(display) as name, id as group_id FROM groups where id > 0 ORDER BY display;";
      cfg.DB.pool.getConnection(function(err,dashdb) {
        if(err) {
          reject("get_ping_awards get_team_groups -conn|"+err);
          return;
        }
        if (cfg.SETTINGS.loglvl >= 5) {
          fs.writeFileSync("logs/PINGAWARDSAMIN_GETTEAMGROUPS.txt",sql);
        }
        var mylist = [];
        dashdb.query(sql)
        .on('error',function(err) {
          dashdb.release();
          reject("get_ping_awards_admin get_team_groups -qry|"+err);
          return;
        })
        .on('result', function (row) {
          mylist.push([row.name,row.group_id]);
        })
        .on('end', function () {
          if (cfg.SETTINGS.loglvl >= 4) {
            Common.log("get_ping_awards_admin get_team_groups done",2,cfg);
          }
          dashdb.release();
          fulfill(mylist);
        });
      });
    });
  }
}
module.exports = PingAwardsAdmin;
