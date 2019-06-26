"use strict";

let extensionOnOff = document.getElementById("extensionOnOff");

extensionOnOff.onclick = function(element) {
  chrome.storage.sync.set({
    enable: false
  });

  chrome.browserAction.setIcon({ path: "images/test.png" });
};
