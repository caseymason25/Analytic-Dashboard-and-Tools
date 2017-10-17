/**
* @fileoverview  Controls the frontend functionality of the sidebar navigation on the manage page
* @author Casey Mason and Seth Bird
*/

/**
* Document on ready function. Called when page loads.
* @return {null}
*/
$(document).ready(function(){
  setLastTab();
  navScrollCheck();
  pageScrollCheck();
});

/**
 * Window resize function. Executes everytime the window is resized.
 *  Checks if a scrollbar is needed on the sidebar navigation or on the right pane
 * @return {null}
 */
$(window).resize(function(){navScrollCheck();pageScrollCheck();});

/**********************************************
/* Start - Sidebar navigation click handlers
**********************************************/

/**
 * Handles expanding and collapsing the sidebar-nav
 * @param  {object} e The event handler
 * @return {null}
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
  $(".sub-tab > i").toggleClass("toggled");
  navScrollCheck();
});

/**
 * Handles hiding and displaying the subtabs of a sidebar-header
 * @param  {object} e The event handler
 * @return {null}
 */
$(".sidebar-header").click(function(e) {
  e.preventDefault();
  $(this).find('span').toggleClass("toggled");
  var _this = $(this);
  _this.next("ul").slideToggle("fast", function() {
    navScrollCheck();
  });
});

$("#tab-link-home").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_HOME","tab-link-home");
});

$("#tab-link-views").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_VIEWS","tab-link-views");
});
$("#home-link-views").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_VIEWS","tab-link-views");
});

$("#tab-link-groups").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_GROUPS","tab-link-groups");
});
$("#home-link-groups").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_GROUPS","tab-link-groups");
});

$("#tab-link-teams").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_TEAMS","tab-link-teams");
});
$("#home-link-teams").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_TEAMS","tab-link-teams");
});

$("#tab-link-queues").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_QUEUES","tab-link-queues");
});
$("#home-link-queues").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_QUEUES","tab-link-queues");
});

$("#tab-link-users").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_USERS","tab-link-users");
});
$("#home-link-users").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_USERS","tab-link-users");
});

$("#tab-link-stats").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_STATS","tab-link-stats");
});
$("#home-link-stats").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_STATS","tab-link-stats");
});

$("#tab-link-sspr").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SSPR","tab-link-sspr");
});
$("#home-link-sspr").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SSPR","tab-link-sspr");
});

$("#tab-link-server-options").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SERVER","tab-link-server-options");
});
$("#home-link-server-options").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SERVER","tab-link-server-options");
});

$("#tab-link-auto-surveys").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY","tab-link-auto-surveys");
});
$("#home-link-auto-surveys").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY","tab-link-auto-surveys");
});

$("#tab-link-client-feedback").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY_RESP","tab-link-client-feedback");
});
$("#home-link-client-feedback").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY_RESP","tab-link-client-feedback");
});

$("#tab-link-client-feedback-admin").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY_RESP_ADMIN","tab-link-client-feedback-admin");
});
$("#home-link-client-feedback-admin").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY_RESP_ADMIN","tab-link-client-feedback-admin");
});

$("#tab-link-associate-surveys").click(function(e){
  handleClick("WRAPPER_SURVEY_ASSOC","tab-link-associate-surveys");
});
$("#home-link-associate-surveys").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_SURVEY_ASSOC","tab-link-associate-surveys");
});

$("#tab-link-manual-ping-awards").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_MANUAL_PING_AWARDS","tab-link-manual-ping-awards");
});
$("#home-link-manual-ping-awards").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_MANUAL_PING_AWARDS","tab-link-manual-ping-awards");
});

$("#tab-link-ping-awards").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_PING_AWARDS","tab-link-ping-awards");
  pingInitializePostLoadTable();
});
$("#home-link-ping-awards").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_PING_AWARDS","tab-link-ping-awards");
  pingInitializePostLoadTable();
});

$("#tab-link-ping-awards-admin").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_PING_AWARDS_ADMIN","tab-link-ping-awards-admin");
});
$("#home-link-ping-awards-admin").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_PING_AWARDS_ADMIN","tab-link-ping-awards-admin");
});

$("#tab-link-change-log").click(function(e){
  e.preventDefault();
  handleClick("WRAPPER_CHANGE_LOG","tab-link-change-log");
});
/**********************************************
/* End - Sidebar navigation click handlers
**********************************************/

/**
* Brings the user to the last tab that they were on when they left / refreshed the page
* @return {null}
*/
function setLastTab() {
  'use strict';
  try {
    var _tab = localStorage.getItem("manage_tab");
    var _wrapper = localStorage.getItem("manage_wrapper");
    if(_tab !== null && typeof _tab !== "undefined" && _wrapper !== null && typeof _wrapper !== "undefined") {
      //Verify the length of the variables and verify the wrapper loaded (permissions)
      if(_tab.length > 0 && _wrapper.length > 0 && $("#" + _wrapper + "").length) {
        // Treat this just like a regular click
        handleClick(_wrapper,_tab);
      }
      // else do nothing and the homepage tab will load
    }
  } catch(err) {
    console.log(err);
  }
}

/**
* Checks to see if a scroll bar will be needed on the left pane and adjusts the width accordingly
* @return {null}
*/
function navScrollCheck() {
  'use strict';
  try {
    var windowHeight = $(window).height();
    var navHeight = $(".sidebar-nav").height();
    if(navHeight > windowHeight) {
      if($("#wrapper").hasClass("toggled")) {
        $("#sidebar-wrapper").css("width", "267px");
        $("#wrapper").css("padding-left", "267px");
      } else {
        $("#sidebar-wrapper").css("width", "57px");
        $("#wrapper").css("padding-left", "57px");
      }
    } else {
      $("#sidebar-wrapper").removeAttr("style");
      $("#wrapper").removeAttr("style");
    }
  } catch(err) {
    console.log(err);
  }
}

/**
* Checks to see if a scroll bar will be needed on the right pane and adjusts the height accordingly
* @return {null}
*/
function pageScrollCheck() {
  'use strict';
  try {
    var windowHeight = $(window).height()-1;
    $("#page-content-wrapper").css("min-height", windowHeight + "px");
    $("#page-content-wrapper").css("max-height", windowHeight + "px");
  } catch(err) {
    console.log(err);
  }
}

/**
* Handles a click action on a link from the homepage or sidebar nav
* This will bring up the requested page, mark the sidebar nav link as active,
* and expand the group the sidebar nav is in if it is currently collapsed
* @param  {string} wrapper The ID of the wrapper div for the requested page
* @param  {string} tab     The ID of the sidebar nav tab to activate and show
* @return {null}
*/
function handleClick(wrapper, tab) {
  'use strict';
  try {
    var _showTab = $("#" + tab + "").closest(".sidebar-group").children(".sidebar-header"); // The group the tab is in
    // Hide all wrappers
    $.each($(".wrappers"), function() {
      $(this).hide();
    });
    // Remove the active class from all sidebar nav tabs
    $.each($(".tab-link"), function() {
      $(this).removeClass("active");
    });
    // Expand the group the tab is in
    _showTab.next("ul").slideDown("fast", function() {
      // Flip the arrow icon so that it displays correctly when expanded
      var _tabGroup = $("#" + tab + "").closest(".sidebar-group").children(".sidebar-header");
      _tabGroup.children(".glyphicon-menu-down").addClass("toggled");
      navScrollCheck();
    });
    // Mark the current tab as active
    $("#" + tab + "").addClass("active");
    // Show the wrapper for the requested page
    $("#" + wrapper + "").show();
    // Set the cookie info for the last tab and wrapper for the setLastTab() function
    localStorage.setItem("manage_tab",tab);
    localStorage.setItem("manage_wrapper",wrapper);
    // Only reload the tab if needed
    if(!$("#" + tab + "").hasClass("tab-loaded")) {
      $("#" + tab + "").addClass("tab-loaded");
      loadTab(tab);
    }
  } catch(err) {
    console.log(err);
  }
}

/**
* Takes in a name of a tab and fires the correct load functionality to populate
*   tab with data.
* @param  {string} tab The ID of the tab clicked on
* @return {null}
*/
function loadTab(tab) {
  'use strict';
  try {
    if(typeof tab !== 'undefined' && tab !== null) {
      switch(tab) {
        case 'tab-link-views':
        load_views();
        break;
        case 'tab-link-groups':
        load_groups();
        break;
        case 'tab-link-teams':
        load_teams();
        break;
        case 'tab-link-queues':
        load_queues();
        break;
        case 'tab-link-users':
        load_users();
        break;
        case 'tab-link-stats':
        // Nothing to load
        break;
        case 'tab-link-server-options':
        // Nothing to laod
        break;
        case 'tab-link-auto-surveys':
        load_survey();
        break;
        case 'tab-link-client-feedback':
        load_survey_resp();
        break;
        case 'tab-link-client-feedback-admin':
        load_survey_resp_admin();
        break;
        case 'tab-link-associate-surveys':
        load_survey_assoc();
        break;
        case 'tab-link-ping-awards':
        load_ping_awards();
        break;
        case 'tab-link-manual-ping-awards':
        load_manual_ping_awards();
        break;
        case 'tab-link-ping-awards-admin':
        load_ping_awards_admin();
        break;
      }
    }
  } catch(err) {
    console.log(err);
  }
}
