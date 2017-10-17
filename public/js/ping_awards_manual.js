/**
* @fileoverview  Handles the frontend functionality of the ping awards manual tab
*        - The user will be able to manually submit Ping Awards
* @author Casey Mason and Seth Bird
*
*/

/**
* Saves the manually entered ping to the database
* @param  {Object} pingAward A single object containing the ping award information
* @return {null}
*/
function save_ping_awards_manual() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    // This if check should never fail as the autocomplete should safegaurd the field from being a non dropdown value.
    if(validateDropdownSelection("ping-form-manual-name")) {
      var nameField = $('#ping-form-manual-name').val();
      var assocName = nameField.substring(0,nameField.indexOf(" - ("));
      var assocID = nameField.substring(nameField.indexOf("(")+1,nameField.indexOf(")"));
      var pingAward = {
        SR: $('#ping-form-manual-ticket').val(),
        NAME: assocName,
        ASSOCIATE_ID: assocID.toUpperCase(),
        CLIENT_MNEMONIC: $('#ping-form-manual-client').val().toUpperCase(),
        COMMENT: $('#ping-form-manual-textarea').val(),
        TEAM: $('#ping-team-dropdown').val(),
        EMAIL: $('#ping-form-manual-name').attr("associateEmail")
      };
      if(pingAward.NAME.length > 0 && pingAward.COMMENT.length > 0 && pingAward.TEAM.length > 0 && pingAward.ASSOCIATE_ID.length > 0) {
        retrieve_mode(true);
        var data = pingAward;
        var send_data = JSON.stringify(data);
        var url = "/save_ping_awards_manual";
        $.ajax({
          type: 'post',
          url: url,
          data: send_data,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function(data) {
            retrieve_mode(false);
            if(data.success === 1) {
              handle_server_msg(0,"Ping Submission Successful");
              $('#ping-form-manual-ticket').val("");
              $('#ping-form-manual-name').val("");
              $('#ping-form-manual-name').attr("associateEmail", "");
              //$('#ping-form-manual-manager').val("");
              $('#ping-form-manual-client').val("");
              $('#ping-form-manual-textarea').val("");
              $('#ping-team-dropdown').val("");
              $('.ping-awards-manual-container').hide();
              $('.ping-awards-manual-complete').show();
              // Stop the frontend timer and send the audit object to be inserted
              stopTimer = createAuditTimerFE();
              sendAuditTimer(data.auditObj,startTimer,stopTimer);
            } else {
              if(data.hasOwnProperty('reason')) {
                handle_server_msg(1,data.reason);
              }
            }
          },
          failure: function(data) {
            retrieve_mode(false);
            if(data.hasOwnProperty('reason')) {
              handle_server_msg(1,data.reason);
            }
          },
          error: function(xhr, ajaxOptions, thrownError) {
            retrieve_mode(false);
            handle_server_msg(1,"Issue saving data");
            console.log("error with ajax call"+xhr);
            if(xhr.hasOwnProperty('responseText')) {
              console.log("error with ajax call"+xhr.responseText);
            }
          }
        });
        retrieve_mode(false);
        pingInitializePostLoadTable();
      } else {
        handle_server_msg(1,"Ping Submission Failed");
      }
    } else {
      handle_server_msg(1,"Recipient's Name field not valid");
      console.log("Recipient's Name field not valid!");
    }
  } catch(err) {
    console.log(err);
  }
}

/**
* This handles loading the manual ping submission tab.
* @return {null}
*/
function load_manual_ping_awards() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/loadpingawardsmanual";
    $.ajax({
      type: 'get',
      url: url,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        if(data.success === 1) {
          handle_server_msg(0,"Manual Ping Submission Page Refreshed");
          $("#WRAPPER_MANUAL_PING_AWARDS").html(data.html);
          initialize_post_load_events();
          initialize_post_load_events_ping_manaul();
          // Stop the frontend timer and send the audit object to be inserted
          stopTimer = createAuditTimerFE();
          sendAuditTimer(data.auditObj,startTimer,stopTimer);
        } else {
          if(data.hasOwnProperty('reason')) {
            handle_server_msg(1,data.reason);
          }
        }
        retrieve_mode(false);
      },
      failure: function(data) {
        if(data.hasOwnProperty('reason')) {
          handle_server_msg(1,data.reason);
          retrieve_mode(false);
        }
      },
      error: function(xhr, ajaxOptions, thrownError) {
        handle_server_msg(1,"Issue getting Manual Ping Submission page");
        retrieve_mode(false);
        console.log("error with ajax call"+xhr);
        if(xhr.hasOwnProperty('responseText')) {
          console.log("error with ajax call"+xhr.responseText);
        }
      }
    });
  } catch(err) {
    console.log(err);
  }
}

/**
* Calls the initialize functions needed to make the frontend JS work as expected
* @return {null}
*/
function initialize_post_load_events_ping_manaul() {
  try {
    initializeAssocNameAutoComplete();
  } catch(err) {
    console.log(err);
  }
}

/**
* Applies the autocomplete functionality to the Recipient's Name field
* @return {null}
*/
function initializeAssocNameAutoComplete() {
  try {
    var cache = {};
    var bestMatch = "";
    $("#ping-form-manual-name").autocomplete({
      minLength: 4,
      delay: 1000,
      autoFocus: true,
      position: { my : "right top", at: "right bottom" },
      change: function(event, ui) {
        // If the user doesn't pick something from the dropdown, use the best match.
        if(ui.item === null && $("#ping-form-manual-name").val().length > 0) {
          $("#ping-form-manual-name").val(bestMatch.label);
          $("#ping-form-manual-name").attr("associateEmail", bestMatch.email);
        }
      },
      close: function(event, ui) {
        // If the user doesn't pick something from the dropdown, use the best match.
        if(ui.item === null && $("#ping-form-manual-name").val().length > 0) {
          $("#ping-form-manual-name").val(bestMatch.label);
          $("#ping-form-manual-name").attr("associateEmail", bestMatch.email);
        }
      },
      source: function( request, response ) {
        // Create the frontend timers
        var startTimer, stopTimer;
        startTimer = createAuditTimerFE();
        var term = request.term;

        $.getJSON( "/get_users_by_name", request, function( data, status, xhr ) {
          var formattedData = [];
          if(data.success === 1) {
            // Format the data and only show top 10 results
            var maxResults = 10;
            if(data.users.length < maxResults) {
              maxResults = data.users.length;
            }
            for(var i = 0; i < maxResults; i++) {
              formattedData[i] = {label:data.users[i].displayName + " - (" + data.users[i].sAMAccountName + ")",email:data.users[i].mail};
            }
            bestMatch = formattedData[0];
          }
          // Stop the frontend timer and send the audit object to be inserted
          stopTimer = createAuditTimerFE();
          sendAuditTimer(data.auditObj,startTimer,stopTimer);
          response( formattedData );
        });

      },
      select: function(event, ui) {
        $("#ping-form-manual-name").attr("associateEmail", ui.item.email);
      }
    });
  } catch(err) {
    console.log(err);
  }
}

/**
* Verifies the field has been chosen from the list of LDAP formatted options. This should never fail since there is checking
*  for this in the autocomplete function, but this is still necessary to catch any edge cases.
* @param  {string} fieldID The HTML ID of the field to validate
* @return {bool}
*/
function validateDropdownSelection(fieldID) {
  try {
    var fieldData = $("#" + fieldID + "").val();
    if(fieldData.indexOf(" - (") > 0 && fieldData.indexOf(")") > fieldData.indexOf(" - (") && fieldData.indexOf(",") < fieldData.indexOf(" - (")) {
      return true;
    } else {
      return false;
    }
  } catch(err) {
    console.log(err);
  }
}
