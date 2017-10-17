/**
* @fileoverview  Handles the frontend functionality of the ping awards tab
*        - The tab will allow the user to select a team and a date range and pull back positive surveys with comments that
*          have been submitted for the associates on the team.
*        - The user will be able to mark each comment to submit a ping for the associate, the TAG engineer, or both.
*        - The user will be able to designate which email address to send it too.
*        - The user will be able to write in a costumized message that will be included at the top of the email.
*        - The user will be able to manually submit Ping Awards
* @author Casey Mason and Seth Bird
*
*/


/**
* This handles getting the team build drop-down and refreshing it
* @return {null}
*/
function load_ping_awards() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/loadpingawards";
    $.ajax({
      type: 'get',
      url: url,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        if(data.success === 1) {
          handle_server_msg(0,"Ping Page Refreshed");
          $("#WRAPPER_PING_AWARDS").html(data.html);
          initialize_post_load_events();
          pingInitializePostLoad();
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
        handle_server_msg(1,"Issue getting ping page");
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
* Retieves the user inputs on the frontend and pulls back pings for that team and date range
* @return {null}
*/
function get_ping_awards() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/getpingawards";
    var startDate = new Date($('#ping-start-date').val()).toISOString();
    var startDateFormatted = new Date(startDate).toDateInputValue();
    var endDate= new Date($('#ping-end-date').val()).toISOString();
    var endDateFormatted = new Date(endDate).toDateInputValue();
    var data = {
      "TEAM" : $('#PING_AWARDS_TEAM_ID').val(),
      "START"   : startDateFormatted,
      "END"     : endDateFormatted
    };
    var send_data = JSON.stringify(data);

    $.ajax({
      type: 'post',
      url: url,
      data:send_data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        retrieve_mode(false);
        if(data.success === 1) {
          handle_server_msg(0,"Ping Page Refreshed");
          $("#ping-awards-body").html(data.html);
          initialize_post_load_events();
          pingInitializePostLoadTable();
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
        handle_server_msg(1,"Issue getting ping page");
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
* Once the user has clicked OK to in the 'Complete Transaction' dialog
* process the emails that were sent and update the database to reflect this.
*
* @param {Object[]} ticketsToProcess The tickets that were processed and sent in the email
*/
function pingProcessResults(ticketsToProcess) {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);

    var send_data = JSON.stringify(ticketsToProcess);
    var url = "/save_awards_feedback_ping";
    $.ajax({
      type: 'post',
      url: url,
      data: send_data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        retrieve_mode(false);
        if(data.success === 1) {
          handle_server_msg(0,"Successful");
          pingInitializePostLoadTable();
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
  } catch(err) {
    console.log(err);
  }
}

/**
* Saves the ping awards that have been marked as pings on the frontend. Calls the node module
* @param  {Object[]} pingAwards The array of ping objects to be added to the database
* @return {null}
*/
function save_ping_awards(pingAwards, individualEmails) {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var data = {
      pingAwards: pingAwards,
      individualEmails: individualEmails
    };
    var send_data = JSON.stringify(data);
    console.log(data);
    $.each($('.ping-checkbox'), function() {
      if(this.checked === true && !$(this).hasClass("disabled")) {
        $(this).addClass("disabled");
      }
    });

    var url = "/save_ping_awards";
    $.ajax({
      type: 'post',
      url: url,
      data: send_data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        retrieve_mode(false);
        if(data.success === 1) {
          handle_server_msg(0,"Change Successful");
          pingInitializePostLoadTable();
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
  } catch(err) {
    console.log(err);
  }
}

/**
* Creates the data object to send to /send_ping_awards to send an email to the specified email address
* @param  {string} emailTextHTML The customized message that is entered into the form, and the scorecard version of the email to send.
* @param  {string} toEmail The email address that the entier email will be sent to
* @return {null}
*/
function pingSendEmail(emailTextHTML, toEmail) {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/send_ping_awards";
    var emailMessage = '';
    var emailAddress = $('#ping-form-email').val();
    var send_data;
    var data = {
      "EMAIL" : '',
      "MESSAGE" : ''
    };

    emailMessage = emailTextHTML;

    data.EMAIL = emailAddress;
    data.MESSAGE = emailMessage;

    send_data = JSON.stringify(data);

    $.ajax({
      type: 'post',
      url: url,
      data:send_data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        retrieve_mode(false);
        if(data.success === 1) {
          handle_server_msg(0,"ping Email Sent");
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
        handle_server_msg(1,"Issue sending email");
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


function ping_exclude_row(rowID,flag,obj) {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    //$(this).closest(".ping-award-excluded").toggleClass(".ping-award-excluded");
    var curRow = obj.closest("tr");
    if($(curRow).hasClass("ping-award-excluded")) {
      flag = 0;
    } else {
      flag = 1;
    }
    $(curRow).toggleClass("ping-award-excluded");
    $(curRow).find('.ping-checkbox').each(function(){
      if(this.checked === true) {
        this.disabled = true;
      }
    });

    $(curRow).find('.refresh-button').each(function(){
      if(flag) {
        this.value = "Excluded";
      } else {
        this.value = "Exclude";
      }
    });
    $(curRow).find('.ping-awards-excluded-col').each(function(){
      console.log(this);
      if(flag) {
        this.innerHTML = 1;
      } else {
        this.innerHTML = 0;
      }
    });


    var url = "/exclude_row_ping_awards";
    var data = {
      "ID" : rowID,
      "FLAG" : flag
    };

    var send_data = JSON.stringify(data);

    $.ajax({
      type: 'post',
      url: url,
      data:send_data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        retrieve_mode(false);
        if(data.success === 1) {
          handle_server_msg(0,"Row Update Complete");
          //pingInitializePostLoadTable();
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
        handle_server_msg(1,"Issue Updating Row");
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
* This will be called from the Ping Award tab's table
*  after the user has selected the tickets to process for pings and emails.
* @param  {int} flag flag to designate whether to show the dialog for email (1) or submit (0)
* @return {null}
*/
function ping_process_feedback_submission(flag) {
  'use strict';
  try{
    // Array containing objects of the tickets that will be processed
    var ticketsToProcess = [];

    $('#ping-awards-table .ping-awards-row').each(function(){
      // Loop through the table rows to gather the ticket data and if a ping or email will be created for it

      // Ticket object that will contain all necessary data to process
      var ticket = {
        ID: "", // survey_send_assoc_id
        TICKET: "", // Ticket Number
        OWNER: "", // Owner on the ticket
        TAG: "", // Tag engineer on the ticket
        TEAM: "", // The team's queue that the ticket is currently in
        CLIENT: "", // The client mnemonic
        COMMENT: "", // The comment the client left on the ping
        EMAIL: 0, // The checkbox to designate the comment should be included on the email
        PING: 0, // The checkbox to designate a ping should be created for this ticket
        TAGPING: 0, // The ping checkbox for the TAG engineer
        ASSOCIATE_ID: "",
        SR_ASSOCIATE_EMAIL: "",
        TAG_ASSOCIATE_EMAIL: ""
      };
      $(this).find('td').each(function(){
        // Loop through all of the columns in the row

        if($(this).hasClass("ping-awards-ping")) {
          var pingField = $(this).find('input');
          if(pingField[0].checked && !pingField[0].disabled) {
            //checkbox is checked, mark ticket as ready for ping
            ticket.PING = 1;
          }
        }
        if($(this).hasClass("ping-awards-tag-ping")) {
          var tagpingField = $(this).find('input');
          if(tagpingField[0].checked && !tagpingField[0].disabled) {
            //checkbox is checked, mark ticket as ready for ping
            ticket.TAGPING = 1;
          }
        }
        if($(this).hasClass("ping-awards-excluded-col")) {
          var excludedField = $(this).html();
          if(excludedField === '1') {
            // Row is excluded, do not submit a ping for this
            ticket.PING = 0;
            ticket.TAGPING = 0;
          }
        }
        if($(this).hasClass("ping-hidden-column")) {
          // Copy the reference to $(this) so that we can re-use it
          var hiddenCol = $(this);
          // Pull out the hidden field that contains the ticket info
          var ticketInfo = hiddenCol.find(".ping-awards-hidden");

          // Fill out the ticket info from the hidden field
          ticket.ID = ticketInfo[0].attributes.pingID.nodeValue;
          ticket.TICKET = ticketInfo[0].attributes.pingTicket.nodeValue;
          ticket.OWNER = ticketInfo[0].attributes.pingOwner.nodeValue;
          ticket.TAG = ticketInfo[0].attributes.pingTag.nodeValue;
          ticket.TEAM = ticketInfo[0].attributes.pingTeamID.nodeValue;
          ticket.CLIENT = ticketInfo[0].attributes.pingClient.nodeValue;
          ticket.COMMENT = ticketInfo[0].attributes.pingComment.nodeValue;
          ticket.CONTACT = ticketInfo[0].attributes.pingContact.nodeValue;
          ticket.TAG_ASSOCIATE_ID = ticketInfo[0].attributes.pingTagAssociateId.nodeValue;
          ticket.SR_ASSOCIATE_ID = ticketInfo[0].attributes.pingSRAssociateId.nodeValue;
          ticket.SR_ASSOCIATE_EMAIL = ticketInfo[0].attributes.pingAssociateEmail.nodeValue;
          ticket.TAG_ASSOCIATE_EMAIL = ticketInfo[0].attributes.pingTagAssociateEmail.nodeValue;
        }
      });
      ticketsToProcess.push(ticket);
    });
    if(flag === 1) {
      // Send Email
      ping_show_dialog(ticketsToProcess);
    } else if(flag === 0) {
      // Submit Ping
      ping_show_submit_dialog(ticketsToProcess);
    }
  } catch(err) {
    console.log(err);
  }
}

/**
* A dialog box where the user can enter text to be included in the email
*  sent to the specified address and review what the email will display
*  before sending it
* @param {Object[]} ticketsToProcess The tickets that will be processed
* @return {null}
*/
function ping_show_dialog(ticketsToProcess) {
  'use strict';
  var _pingMessages;
  var _pingHtml;
  var _pingEmail;
  var _verifyDialog;
  var _title;
  var _buttons;

  try {
    _title = 'ping Statistics to Email';
    _pingMessages = pingBuildMessage(ticketsToProcess, 1);
    _pingHtml = _pingMessages.statsHtml;
    _pingEmail = _pingMessages.statsEmail;
    _buttons = [{
      id: 'btn-cancel',
      icon: 'glyphicon glyphicon-remove',
      label: 'Cancel',
      cssClass: 'btn-primary',
      autospin: false,
      action: function(dialogRef){
        dialogRef.close(); //close out dialog div
      }
    },
    {
      id: 'btn-ok',
      icon: 'glyphicon glyphicon-check',
      label: 'Send Email',
      cssClass: 'btn-primary',
      autospin: false,
      action: function(dialogRef){
        var toEmail = $('#ping-form-email').val();
        if(pingValidateEmail(toEmail)) {
          // Email is valid
          var emailTextHTML = pingBuildEmail(_pingEmail);
          // Proccess results and send email
          pingSendEmail(emailTextHTML,toEmail);
          // Close dialog
          dialogRef.close();

        } else {
          // Email is not valid, highlight the text box and inform the user
          set_missing_field(1, '#ping-form-email', 'Email address is not valid');
          pingFormErrorMessage(1, '.ping-form-errors');
          location.href = "#ping-form-errors";
        }

      }
    }];

    _verifyDialog = pingCreateDialog(_title, _pingHtml, _buttons, 'size-wide');
    _verifyDialog.open();

  } catch(err) {
    console.log(err);
  }
}

/**
* A dialog box where the user can review the pings selected before submitting them
* @param {Object[]} ticketsToProcess The tickets that will be processed
* @return {null}
*/
function ping_show_submit_dialog(ticketsToProcess) {
  'use strict';
  var _pingMessages;
  var _pingHtml;
  var _pingEmail;
  var _verifyDialog;
  var _title;
  var _buttons;
  var _pingAwards;
  var _individualEmails;

  try {
    _title = 'Pings to Submit';
    _pingMessages = pingBuildMessage(ticketsToProcess, 0);
    _pingHtml = _pingMessages.statsHtml;
    _pingEmail = _pingMessages.statsEmail;
    _pingAwards = _pingMessages.stats;
    _individualEmails = _pingMessages.emailArray;
    _buttons = [{
      id: 'btn-cancel',
      icon: 'glyphicon glyphicon-remove',
      label: 'Cancel',
      cssClass: 'btn-primary',
      autospin: false,
      action: function(dialogRef){
        dialogRef.close(); //close out dialog div
      }
    },
    {
      id: 'btn-ok',
      icon: 'glyphicon glyphicon-check',
      label: 'Submit Pings',
      cssClass: 'btn-primary',
      autospin: false,
      action: function(dialogRef){
        save_ping_awards(_pingAwards, _individualEmails);
        // Close dialog
        dialogRef.close();

      }
    }];

    _verifyDialog = pingCreateDialog(_title, _pingHtml, _buttons, 'size-wide');
    _verifyDialog.open();

  } catch(err) {
    console.log(err);
  }
}

/**
* Shows and hides the error message on the ping form
* @param  {bool} flag If 1 or TRUE then show the error message
* @param  {string} id The CSS ID or Class of the element. Must include # sign or period (.)
* @return {bool} Returns true if no errors
*/
function pingFormErrorMessage(flag,id) {
  'use strict';
  try {
    if(flag) {
      $(id).show();
    } else {
      $(id).hide();
    }
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

/**
* Build the HTML string with the customized email message and the scorecard HTML for use in the email
* @param  {string} scorecards The HTML string containing the scorecards
* @return {string} The completed HTML string
*/
function pingBuildEmail(scorecards) {
  'use strict';
  var _message = '';
  var _emailTextHTML = '';
  _message += pingFormatForEmail($('#ping-form-textarea').val());

  if(_message.length > 0) {
    // If there is a message, put some spacing inbetween it and the scorecards
    _message += '<br/><br/>';
  }
  _emailTextHTML = _message + scorecards;
  return _emailTextHTML;
}

/**
* Creates an HTML string for the CSS to be embedded into an email
* @return {string} Te HTML for the CSS
*/
function pingCssForEmail() {
  'use strict';
  var css = "<style type='text/css'>";
  css += ".ping-awards-table{width:1700px;text-align:center;vertical-align:middle;border-collapse:collapse;table-layout:fixed;border-left:1px solid #c0c0c0;border-right:1px solid #c0c0c0;border-bottom:1px solid #c0c0c0;word-wrap:break-word;font-family:arial;background-color:#CDCDCD;margin:10px auto 15px auto;border-spacing:1px;text-align:center}.ping-awards-table thead th{margin:0px;text-align:center;background-color:#8dbdd8;border:1px solid #a0a0a0;padding:4px 15px;vertical-align:middle}.ping-awards-table tbody td{color:#3D3D3D;padding:10px;background-color:#FFF;vertical-align:middle;cursor:text;border-right:1px solid #f0f0f0;border-bottom:1px solid #c0c0c0}.ping-awards-table tbody tr{padding:5px 0px}.ping-awards-table td.ping-awards-comment{text-align:left;width:500px;}.ping-awards-table td.ping-awards-ping{padding-top:5px}.ping-awards-table td.ping-awards-email{padding-top:5px}";
  css += "</style>";
  return css;
}

/**
* Validates that an email address is in the correct format
* @return {bool} Returns true if the email address is valid
*/
function pingValidateEmail(email) {
  'use strict';
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/**
* Sorts the tickets by OWNER name in ascending order (A -> Z)
* @param {Object[]} array The object array to sort
* @returns {Object[]} The sorted object array
*/
function pingSortByAssociate(array) {
  'use strict';
  try {
    array.sort(function (a, b) {
      var nameA = a.NAME.toLowerCase(), nameB = b.NAME.toLowerCase();
      return  (nameA > nameB) ? 1 : -1;
    });
    return array;
  } catch(err) {
    console.log(err);
  }
}

/**
* Builds the form HTML for the user to enter an email and a message for the ping email
* @return {string} The HTML of the form
*/
function pingBuildStatsFormHtml() {
  'use strict';
  var formText = '';
  try {
    formText += '<div class="ping-form">';
    formText += '<form action="javascript:void(0)">';
    formText += '<div class="ping-form-errors" id="ping-form-errors">';
    formText += mainCreateMessagePanel('Email address is not valid.', 'error');
    formText += '</div>';
    formText += '<div class="ping-form-field"><label for="ping-form-email">Email*:</label><input type="email" id="ping-form-email" name="ping_form_email" placeholder="Enter email address to send to..." required /></div>';
    formText += '<div class="ping-form-field"><label for="ping-form-textarea">Customizable Message:</label><textarea id="ping-form-textarea" name="ping_form_textarea" placeholder="Enter in a customized message..."></textarea></div>';
    formText += '</form>';
    formText += '</div>';
  } catch(err) {
    console.log(err);
  }
  return formText;
}

/**
* Builds an HTML string from the pingList object
* @param {Object[]} pingList The object to convert into HTML
* @returns {String} The completed HTML string
*/
function pingBuildStatsHtml(pingList) {
  'use strict';
  try {
    var statsText = '<hr/><br/>';
    for(var i = 0; i < pingList.length; i++) {
      statsText += '<p>';
      statsText += '<span style="font-weight:bold">' + pingList[i].NAME + ':</span><br/>';
      statsText += 'Comment: ' + pingList[i].COMMENT + '<br/>';
      statsText += 'From: ' + pingList[i].CLIENT_CONTACT + ' - ' + pingList[i].CLIENT_MNEMONIC + '<br/>';
      statsText += 'Ticket Number: ' + pingList[i].SR + '<br/>';
      statsText += '<br/></p><hr/><br/>';
    }
    return statsText;
  } catch(err) {
    console.log(err);
  }
}

/**
* Build the array that contains the individual Ping Awards so that the node mailer
*   can send out the individual emails to each of the Award Recipients
* @param  {object[]} pingList Array of Pings to be processed
* @return {object[]}
*/
function pingBuildIndividualHtml(pingList) {
  'use strict';
  try {
    var associateArray = [];
    if(pingList.length > 0) {

      var pingCount = 0;
      var tempHTML = '<p>Hello,</p>';
      tempHTML += '<p>Congratulations! You have been recognized with the Client Service Ping Award.</p>';
      tempHTML += '<hr/>';
      var associateData = function(id, html, count, email) {
        this.ID = id;
        this.HTML = html;
        this.COUNT = count;
        this.EMAIL = email;
      };

      for(var i = 0; i < pingList.length; i++) {
        if(i > 0 && pingList[i].ASSOCIATE_ID !== pingList[i-1].ASSOCIATE_ID) {
          // New associate, push the existing html to the array
          associateArray.push(new associateData(pingList[i-1].ASSOCIATE_ID, tempHTML, pingCount, pingList[i-1].ASSOCIATE_EMAIL));
          pingCount = 0;
          tempHTML = '<p>Hello,</p>';
          tempHTML += '<p>Congratulations! You have been recognized with the Client Service Ping Award.</p>';
          tempHTML += '<hr/>';
        }
        pingCount++;
        tempHTML += '<p>';
        tempHTML += '<span style="font-weight:bold">Presented To:</span> ' + pingList[i].NAME + '<br/>';
        tempHTML += '<span style="font-weight:bold">Client:</span> ' + pingList[i].CLIENT_CONTACT + ' - ' + pingList[i].CLIENT_MNEMONIC + '<br/>';
        tempHTML += '<span style="font-weight:bold">Ticket Number:</span> ' + pingList[i].SR + '<br/>';
        tempHTML += '<span style="font-weight:bold">Description of Recognition:</span> ' + pingList[i].COMMENT + '<br/>';
        tempHTML += '<br/></p><hr/><br/>';
      }
      associateArray.push(new associateData(pingList[pingList.length-1].ASSOCIATE_ID, tempHTML, pingCount, pingList[pingList.length-1].ASSOCIATE_EMAIL));
    }
    return associateArray;
  } catch(err) {
    console.log(err);
  }
}


/**
* Builds a scorecard from the ticketsToProcess
* @param {Object[]} ticketsToProcess The object to convert into a scorecard
* @returns {Object[]} The completed scoredcard object array
*/
function pingBuildStatsObject(ticketsToProcess) {
  'use strict';
  console.log(ticketsToProcess);
  var ownerPingList = [];
  var tagPingList = [];
  var pingList = [];
  var curOwnerPing;
  var curTagPing;
  var ping = function(id, name,comment,team,contact,client,sr,ping,associate_id,associate_email) {
    this.ID = id;
    this.NAME = name;
    this.COMMENT = comment; //array of curStatsComment objects
    this.TEAM = team;
    this.CLIENT_CONTACT = contact;
    this.CLIENT_MNEMONIC = client;
    this.SR = sr;
    this.TAG = ping;
    this.ASSOCIATE_ID = associate_id;
    this.ASSOCIATE_EMAIL = associate_email;
  };
  try {
    for(var j = 0; j < ticketsToProcess.length; j++) {
      if(ticketsToProcess[j].PING === 1 && ticketsToProcess[j].OWNER.length > 0) {
        curOwnerPing = new ping(ticketsToProcess[j].ID,ticketsToProcess[j].OWNER,ticketsToProcess[j].COMMENT,ticketsToProcess[j].TEAM,ticketsToProcess[j].CONTACT,ticketsToProcess[j].CLIENT,ticketsToProcess[j].TICKET, 0, ticketsToProcess[j].SR_ASSOCIATE_ID, ticketsToProcess[j].SR_ASSOCIATE_EMAIL);
        ownerPingList.push(curOwnerPing);
      }
      if(ticketsToProcess[j].TAGPING === 1 && ticketsToProcess[j].TAG.length > 0) {
        curTagPing = new ping(ticketsToProcess[j].ID,ticketsToProcess[j].TAG,ticketsToProcess[j].COMMENT,ticketsToProcess[j].TEAM,ticketsToProcess[j].CONTACT,ticketsToProcess[j].CLIENT,ticketsToProcess[j].TICKET, 1, ticketsToProcess[j].TAG_ASSOCIATE_ID, ticketsToProcess[j].TAG_ASSOCIATE_EMAIL);
        tagPingList.push(curTagPing);
      }
    }
    pingList = ownerPingList.concat(tagPingList);
    pingSortByAssociate(pingList);
    return pingList;
  } catch(err) {
    console.log(err);
  }
}

/**
* Replaces the linebreaks from the textarea into HTML linebreaks
* @param {string} rawHtml The string to be formatted
* @returns {string} The string with the linebreaks to be converted
*/
function pingFormatForEmail(rawHtml) {
  'use strict';
  var _formattedHtml;
  try {
    _formattedHtml = rawHtml;
    _formattedHtml = nl2br(_formattedHtml);
    return _formattedHtml;
  } catch(err) {
    console.log(err);
  }
}

/**
* Replaces \n to <br/> for use in emails
* @param  {string}  str The string to convert
* @param  {Boolean} is_xhtml Flag to designate if this is xhtml
* @return {string} The formatted string
*/
function nl2br (str, is_xhtml) {
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}


/**
* Builds the ping results messages to be displayed in HTML
* and in a format suitable for the mailto email function
* @param {Object[]} ticketsToProcess The list of tickets that need to be processed
* @param {int} flag 0 if submitting pings, 1 if sending email
* @returns {Object} Object containing the formatted string for HTML and Email
*/
function pingBuildMessage(ticketsToProcess, flag) {
  'use strict';
  try {
    var _statsHtml = '';
    var _statsEmail = '';
    var _statsOwnerList;
    var _formHtml = '';
    var _individualEmailArray;
    // Build the sorted object that will contain the scores
    _statsOwnerList = pingBuildStatsObject(ticketsToProcess);
    console.log("_statsOwnerList: ", _statsOwnerList);
    // Convert the statsOwnerList to be displayed in HTML
    _statsEmail = pingBuildStatsHtml(_statsOwnerList);
    _individualEmailArray = pingBuildIndividualHtml(_statsOwnerList);
    console.log("_individualEmailArray: ", _individualEmailArray);
    _statsHtml += '<div class="ping-email-dialog">';
    _statsHtml += '<div class="ping-email-text">';
    if(flag) {
      _statsHtml += pingCreateInfoPanel('Please enter in the email address to send the ping results to. <br/>You may enter in a customized message that will be displayed at the top of the email.', 'question');
      // Build the form
      _formHtml = pingBuildStatsFormHtml();
      _statsHtml += _formHtml;
    } else {
      _statsHtml += pingCreateInfoPanel('Please verify the pings below are correct before submitting', 'question');
    }
    _statsHtml += _statsEmail;  //hiding the list in the dialog for now
    _statsHtml += '</div>'; // end ping-email-text
    _statsHtml += '</div>'; // end ping-email-dialog
    return {statsHtml: _statsHtml, statsEmail: _statsEmail, stats: _statsOwnerList, emailArray: _individualEmailArray};
  } catch(err) {
    console.log(err);
  }
}

/**
* Loads the UI improvements after the first load button is clicked which displays the input controls
* @return {null}
*/
function pingInitializePostLoad() {
  'use strict';
  try {
    var startDate = new Date();
    startDate.setDate(1); // set the start date to the first of the month
    $('#ping-start-date').datepicker().datepicker("setDate",startDate);
    $('#ping-end-date').datepicker().datepicker("setDate", new Date());
  } catch(err) {
    console.log(err);
  }
}

/**
* Loads the UI improvements after the Load team button is clicked and the table is displayed
* @return {bool} True if successful
*/
function pingInitializePostLoadTable() {
  'use strict';
  try {
    pingInitializeTableSort();
    pingInitializeTagOther();
    $.each($('.ping-checkbox'), function() {
      if(this.checked === true && $(this).hasClass("disabled")) {
        this.disabled = true;
      }
    });
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

/**
* Turns on the table sorter functionality for the ping-awards-table after it is rendered
* @return {bool} True if successful
*/
function pingInitializeTableSort() {
  'use strict';
  try {
    /* Enables the table sorter on the assoicate ping table, sets default sort to first column */
    if($('.ping-awards-row').length > 0) {
      // If there are rows to sort, enable the sorter, disable sorting on checkbox columns
      $(".ping-awards-table").tablesorter({ sortList: [[11, 0],[0, 0]],
        headers: {8:{sorter:false},11:{sorter:false},13:{sorter:false}}
      });
    }
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

/**
* Hides the ping-awards-tag-other column if there are no rows with the value filled out
*  Most teams will not have values for this column as there should only be 1 TAG engineer per ticket
* @return {bool} True if successful
*/
function pingInitializeTagOther() {
  'use strict';
  try {
    var _tagOtherEmpty = true;
    $("td.ping-awards-tag-other").each(function() {
      if($(this).html().length > 0) {
        _tagOtherEmpty = false;
      }
    });

    if(_tagOtherEmpty) {
      $(".ping-awards-tag-other").hide();
    } else {
      $(".ping-awards-tag-other").show();
    }
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

/**
* Helper function to create a bootstrap modal dialog for the allview dashboards
* @param {string} title The title to be displayed for the modal dialog
* @param {string} message The HTML that will be passed in as the message for the modal dialog
* @param {object[]} buttons The buttons that will be on the dialog
* @param {string} size The size of the modal dialog - can be 'size-normal', 'size-small', 'size-wide', or 'size-large' - default to 'size-normal'
* @param {function} iniFunction The function to be called after the dialog is displayed. Needed to apply jQuery operations to the message HTML
* @returns The dialog object. Use the .open() function to open it
*/
function pingCreateDialog(title, message, buttons, size, iniFunction) {
  'use strict';
  var _title = title;
  var _message = message;
  var _size = size;
  var _iniFunction = iniFunction;
  var _pingCreateDialog;
  var _buttons = buttons;
  try {
    // If the size was not passed in correctly, set it to 'size-normal'
    if(_size !== 'size-normal' && _size !== 'size-small' && _size !== 'size-wide' && _size !== 'size-large') {
      _size = 'size-normal';
    }

    _pingCreateDialog = new BootstrapDialog({
      title: _title,
      message: _message,
      onshown: _iniFunction,
      buttons: _buttons
    });
    _pingCreateDialog.setSize(_size);
  } catch(err) {
    console.log(err);
  }
  return _pingCreateDialog;
}

/**
* DEPRECATED
* Helper function to build the HTML needed for the info panels - currently a wrapper for the main.js version
* @param {string} message The message that should be displayed in the info panel
* @param {string} type The type of info panel to create
*
* @returns The completed HTML with the message in it
*/
function pingCreateInfoPanel(message, type) {
  'use strict';
  var _html;
  try {
    _html = mainCreateMessagePanel(message, type);
  } catch(err) {
    console.log(err);
  }
  return _html;
}
