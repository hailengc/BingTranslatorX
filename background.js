chrome.runtime.onInstalled.addListener(function() {
  console.log(".... oninstalled called " + new Date().toISOString());

  chrome.storage.sync.set({
    enable: true,
    hover: {
      enable: true,
      key: ""
    },
    container: {
      // default skyblue
      backgroundColor: "lightgrey"
      // backgroundColor: "white"
      // backgroundColor: "#84e184"
    }
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
