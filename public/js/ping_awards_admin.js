/**
* @fileoverview  Handles the fontend functionality of the ping awards admin tab
*        - The tab will allow the user to select a group and a date range and pull back pings submitted during that timeframe
*        - The user will be able to export the list of pings submitted to a CSV file
* @author Casey Mason and Seth Bird
*
*/

/**
* Loads the ping awards admin tab. Populates the group dropdown and the start and stop days
* @return {null}
*/
function load_ping_awards_admin() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/loadpingawardsadmin";
    $.ajax({
      type: 'get',
      url: url,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        if(data.success === 1) {
          handle_server_msg(0,"Ping Admin Page Refreshed");
          $("#WRAPPER_PING_AWARDS_ADMIN").html(data.html);
          initialize_post_load_events();
          pingAdminInitializePostLoad();
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
        handle_server_msg(1,"Issue getting Ping Admin Page");
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
* Calls the database to get the ping awards for the specified group and date range
* @return {null}
*/
function get_ping_awards_admin() {
  'use strict';
  try{
    // Create the frontend timers
    var startTimer, stopTimer;
    startTimer = createAuditTimerFE();
    retrieve_mode(true);
    var url = "/getpingawardsadmin";
    var startDate = new Date($('#ping-admin-start-date').val()).toISOString();
    var startDateFormatted = new Date(startDate).toDateInputValue();
    var endDate= new Date($('#ping-admin-end-date').val()); // get the end date from the input field
    endDate.setUTCDate(endDate.getUTCDate() + 1); // add one UTC date - this allows the end date to encompass the current day
    endDate.toISOString(); // set to ISO
    var endDateFormatted = new Date(endDate).toDateInputValue(); // finally format the date for use in the query
    var data = {
      "GROUP" : $('#ping_awards_admin_TEAM_ID').val(),
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
          handle_server_msg(0,"Ping Admin Page Refreshed");
          $("#ping-awards-admin-body").html(data.html);
          initialize_post_load_events();
          pingAdminInitializePostLoadTable();
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
        handle_server_msg(1,"Issue getting Ping Admin Page");
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
* Loads the UI improvements. Use after the tab is loaded.
* @return {null}
*/
function pingAdminInitializePostLoad() {
  'use strict';
  try {
    var startDate = new Date();
    startDate.setDate(1); // set the start date to the first of the month
    $('#ping-admin-start-date').datepicker().datepicker("setDate",startDate);
    $('#ping-admin-end-date').datepicker().datepicker("setDate", new Date());
  } catch(err) {
    console.log(err);
  }
}

/**
* Loads the UI improvements for the table. Use after table is displayed.
* * @return {bool} True if successful
*/
function pingAdminInitializePostLoadTable() {
  'use strict';
  try {
    pingAdminInitializeTableSort();
    $.each($('.ping-checkbox'), function() {
      if(this.checked === true) {
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
* Turns on the table sorter functionality for the ping-awards-admin-table after it is rendered
* @return {bool} True if successful
*/
function pingAdminInitializeTableSort() {
  'use strict';
  try {
    /* Enables the table sorter on the assoicate ping table, sets default sort to first column */
    if($('.ping-awards-admin-row').length > 0) {
      // If there are rows to sort, enable the sorter, disable sorting on checkbox columns
      $(".ping-awards-admin-table").tablesorter({ sortList: [[0, 0],[1, 0],[2,0]] });
    }
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

/**
* Generate up to 8 random winners for the NOTT gift card and highlight the rows
* @return {null}
*/
function randomWinners() {
  var winners = []; // Keep track of the row on the table.
  var associateList = []; // List of associate IDs from the frontend, duplicates OK. This will be equal to the number of rows on the table.
  var winnersList = []; // Keep track of who has been picked already.
  var maxWinners = 8; // The maximum number of winners for the NOTT gift card.
  var count = 0; // Tracks the row on the frontend when applying the highlighting.
  var uniqueAssociateList = []; // List of unique associate IDs. No duplicates.

  // Reset the rows in case the generate button is clicked multiple times, build the associateList array, and count the rows
  $('#ping-awards-admin-table .ping-awards-admin-row').each(function(){
    $(this).find('td').each(function(){
      $(this).removeClass("ping-awards-admin-winner");
      if($(this).hasClass("ping-awards-admin-recipient")) {
        var associate = $(this).attr("pingassociateid").toUpperCase();
        if(uniqueAssociateList.indexOf(associate) < 0) {
          // Associate ID is not is the array. Add it.
          uniqueAssociateList.push(associate);
        }
        associateList.push(associate);
      }
    });
  });

  // Don't generate more numbers than associates
  if(uniqueAssociateList.length < maxWinners) {
    maxWinners = uniqueAssociateList.length;
  }

  // Generate the random, but unique, winners
  for(var i = 0; i < maxWinners; i++) {
    var cur = Math.floor(Math.random() * (associateList.length - 0)) + 0;
    while(winnersList.indexOf(associateList[cur]) >= 0) {
      // Associate is not been chosen yet, so add them to the winner list
      cur = Math.floor(Math.random() * (associateList.length - 0)) + 0;
    }
    winners.push(cur);
    winnersList.push(associateList[cur]);
  }

  // Highlight the rows that match the numbers that were generated
  $('#ping-awards-admin-table .ping-awards-admin-row').each(function(){
    if(winners.indexOf(count) >= 0) {
      $(this).find('td').each(function(){
        $(this).addClass("ping-awards-admin-winner");
      });
    }
    count++;
  });
}
