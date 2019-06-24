"use strict";

let extensionOnOff = document.getElementById("extensionOnOff");

extensionOnOff.onclick = function(element) {
  chrome.storage.sync.set({
    enable: false,
    hoverKey: "none",
    containerColor: "#87ceeb"
  });

  chrome.browserAction.setIcon({ path: "images/test.png" });
};
