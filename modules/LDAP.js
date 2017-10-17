/**
* @fileoverview  Handles interactions with the ttm-ldap node module and therefore the LDAP server
*                -
* @author Casey Mason
*/
'use strict';
const humanname = require('humanname');
const Common = require('../modules/Common');
const LDAPnode = require('ttm-ldap-dashboard');

class LDAP {
  constructor() {
    return this;
  }

  /**
  * Takes a search string from the frontend and appends an asterisk to it before calling the
  *  ttm-ldap module to complete the search
  * @param  {string} associateName The search string from the frontend
  * @param  {object} cfg The config object that contains the reference to the Server
  * @return {promise} The results from the LDAP server
  */
  static get_associates(associateName, cfg) {
    return new Promise(function(fulfill,reject) {
      let ldap = new LDAPnode(cfg);
      ldap.associateSrch(associateName + "*", function (err, results) {
          if(typeof results !== 'undefined' && results.length > 0) {
            return fulfill(results);
          } else if(typeof err !== 'undefined' && err !== null) {
            return reject("LDAP - get_associates() - error: " + err);
          } else {
            return reject("LDAP - get_associates() - No Results");
          }
      });
    });
  }

  static get_associate_exact(associateID, cfg) {
    return new Promise(function(fulfill,reject) {
      let ldap = new LDAPnode(cfg);
      ldap.associateSrch(associateID, function (err, results) {
          if(typeof results !== 'undefined' && results.length > 0) {
            return fulfill(results);
          } else if(typeof err !== 'undefined' && err !== null) {
            return reject("LDAP - get_associates() - error: " + err);
          } else {
            return reject("LDAP - get_associates() - No Results");
          }
      });
    });
  }

  static getAssociateByCompany(companyName, cfg) {
    return new Promise(function(fulfill,reject) {
      let ldap = new LDAPnode(cfg);
      ldap.search("company", companyName, function (err, results) {
          if(typeof results !== 'undefined' && results.length > 0) {
            return fulfill(results);
          } else if(typeof err !== 'undefined' && err !== null) {
            return reject("LDAP - get_associates() - error: " + err);
          } else {
            return reject("LDAP - get_associates() - No Results");
          }
      });
    });
  }

}
module.exports = LDAP;
