const defaultSetting = {
  enable: true,
  hover: {
    enable: true,
    key: ""
  },
  container: {
    backgroundColor: "skyblue"
  }
};

const queryHost = "https://cn.bing.com";
const queryBaseUrl = `${queryHost}/dict/search?mkt=zh-cn&q=`;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(defaultSetting);
});

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
