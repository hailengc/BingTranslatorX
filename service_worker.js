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

let openingRefreshReminder = false;

async function rememberRefreshReminderTabs(reason) {
  if (!chrome.action.openPopup) {
    return;
  }

  if (reason === "update") {
    // Reloading an unpacked extension reports an update. Only rearm local builds.
    const { installType } = await chrome.management.getSelf();
    if (installType !== "development") {
      return;
    }
  }

  const [tabs, [installTab]] = await Promise.all([
    chrome.tabs.query({ windowType: "normal", discarded: false, status: "complete" }),
    chrome.tabs.query({ active: true, lastFocusedWindow: true }),
  ]);
  // Closing the setup page often returns to the store or extensions manager.
  const tabIds = tabs
    .map((tab) => tab.id)
    .filter((id) => Number.isInteger(id) && id >= 0 && id !== installTab?.id);
  if (tabIds.length > 0) {
    await chrome.storage.session.set({ refreshReminderTabIds: tabIds });
  }
}

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  if (openingRefreshReminder || !chrome.action.openPopup) {
    return;
  }

  openingRefreshReminder = true;
  try {
    const { refreshReminderTabIds } = await chrome.storage.session.get("refreshReminderTabIds");
    if (!refreshReminderTabIds?.includes(tabId)) {
      return;
    }

    const { enable } = await chrome.storage.local.get("enable");
    if (!enable) {
      return;
    }

    const hasContentScript = await chrome.tabs.sendMessage(
      tabId,
      { action: "checkContentScript" },
      { frameId: 0 },
    ).catch(() => false);
    if (hasContentScript) {
      return;
    }

    const defaultPopup = chrome.runtime.getManifest().action.default_popup;
    await chrome.action.setPopup({ tabId, popup: "refresh-reminder.html" });
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.active || tab.windowId !== windowId || tab.status !== "complete") {
        return;
      }

      await chrome.action.openPopup({ windowId });
      await chrome.storage.session.remove("refreshReminderTabIds");
    } finally {
      // Restore the regular popup for the next toolbar click.
      await chrome.action.setPopup({ tabId, popup: defaultPopup }).catch(() => {});
    }
  } catch (error) {
    // The tab can close or the window can lose focus while the popup opens.
    console.debug("Unable to open the refresh reminder", error);
  } finally {
    openingRefreshReminder = false;
  }
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install" && reason !== "update") {
    return;
  }

  if (reason === "install") {
    await chrome.storage.local.set(defaultSetting);
  }

  // Capture the existing tabs before the setup page opens.
  await rememberRefreshReminderTabs(reason).catch((error) => {
    console.debug("Unable to prepare the refresh reminder", error);
  });

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
