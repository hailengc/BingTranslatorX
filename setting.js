"use strict";

let extensionOnOff = document.getElementById("extensionOnOff");

extensionOnOff.onclick = function(element) {
  chrome.browserAction.setIcon({ path: "images/test.png" });
};
