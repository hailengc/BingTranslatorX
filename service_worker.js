const defaultSetting = {
  enable: true,
  skipBrowserLanguage: false,
  hover: {
    enable: true,
    key: "",
  },
  container: {
    backgroundColor: "skyblue",
  },
};

const queryHost = "https://cn.bing.com";
const queryBaseUrl = `${queryHost}/dict/search?mkt=zh-cn&q=`;

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install" && reason !== "update") {
    return;
  }

  if (reason === "install") {
    await chrome.storage.local.set(defaultSetting);
  }

  const { selectionTranslationPromptShown, selectionTranslationEnabled } =
    await chrome.storage.local.get([
      "selectionTranslationPromptShown",
      "selectionTranslationEnabled",
    ]);
  if (selectionTranslationPromptShown || selectionTranslationEnabled !== undefined) {
    return;
  }

  await chrome.tabs.create({ url: chrome.runtime.getURL("translation-setup.html") });
  await chrome.storage.local.set({ selectionTranslationPromptShown: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "query") {
    fetch(queryBaseUrl + encodeURIComponent(request.queryString), {
      mode: "cors",
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        // Reject with an Error so that the catch block receives a proper
        // error object instead of a pending Promise which would never
        // trigger the catch handler correctly.
        throw new Error(response.statusText);
      })
      .then((data) => {
        sendResponse({
          status: 0,
          data: data,
          ...request,
        });
      })
      .catch((error) =>
        sendResponse({
          ...request,
          status: -1,
        })
      );

    // send response async
    return true;
  } else if (request.action === "createTab") {
    chrome.tabs.query(
      {
        active: true,
      },
      (tab) => {
        chrome.tabs.create({
          url: request.url,
          index: tab[0].index + 1,
        });
      }
    );
  }
});
