chrome.runtime.onInstalled.addListener(function() {
  console.log(Date.now());

  chrome.storage.sync.set({ color: "#3aa757" }, function() {});
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

const queryHost = "https://cn.bing.com";
const queryBaseUrl = `${queryHost}/dict/search?mkt=zh-cn&q=`;

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
  } else if (request.action === "createTab") {
    chrome.tabs.query(
      {
        active: true
      },
      tab => {
        chrome.tabs.create({
          url: request.url,
          index: tab[0].index + 1
        });
      }
    );
  }
});
