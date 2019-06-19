chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({ color: "#3aa757" }, function() {
    console.log("The color is green.");
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "developer.chrome.com" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

const queryBaseUrl = "https://cn.bing.com/dict/search?mkt=zh-cn&q=";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "query") {
    fetch(queryBaseUrl + encodeURIComponent(request.queryString), {
      mode: "cors"
    })
      .then(response => {
        if (response.ok) {
          return response.text();
        } else {
          throw Promise.reject(response.statusText);
        }
      })
      .then(data => {
        sendResponse({
          status: 0,
          data: data,
          ...request
        });
      })
      .catch(error =>
        sendResponse({
          ...request,
          status: -1
        })
      );

    // send response async
    return true;
  }
});
