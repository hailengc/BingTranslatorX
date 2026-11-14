const message = chrome.i18n.getMessage;
document.documentElement.lang = chrome.i18n.getUILanguage();
document.querySelectorAll("[data-i18n]").forEach((node) => {
  node.textContent = message(node.dataset.i18n);
});

const download = document.getElementById("download");
const skip = document.getElementById("skip");
const status = document.getElementById("status");
const progress = document.getElementById("progress");
progress.setAttribute("aria-label", message("selectionTranslationDownloading"));

async function showSetup() {
  try {
    const availability = await globalThis.Translator?.availability(setupTranslationLanguages);
    if (!skip.disabled && availability && availability !== "unavailable") {
      download.hidden = false;
    } else if (!skip.disabled) {
      status.textContent = message("translationSetupUnavailable");
    }
  } catch {
    if (!skip.disabled) {
      status.textContent = message("translationSetupUnavailable");
    }
  }
}

skip.addEventListener("click", async () => {
  skip.disabled = true;
  download.disabled = true;
  try {
    await chrome.storage.local.set({ selectionTranslationEnabled: false });
    const tab = await chrome.tabs.getCurrent();
    if (tab) {
      await chrome.tabs.remove(tab.id);
    } else {
      window.close();
    }
  } catch {
    skip.disabled = false;
    download.disabled = false;
  }
});

download.addEventListener("click", async () => {
  download.disabled = true;
  skip.disabled = true;
  status.textContent = message("translationSetupPreparing");
  progress.removeAttribute("value");
  progress.hidden = false;
  try {
    await Promise.all([
      chrome.storage.local.set({ selectionTranslationEnabled: true }),
      prepareSelectionTranslation({
        onProgress({ loaded, total }) {
          if (total > 0) {
            progress.max = total;
            progress.value = loaded;
            if (loaded > 0 && loaded < total) {
              status.textContent = message("selectionTranslationDownloading");
            }
          }
        },
      }),
    ]);
    status.textContent = message("translationSetupReady");
    download.hidden = true;
    skip.hidden = true;
  } catch {
    status.textContent = message("translationSetupFailed");
    skip.disabled = false;
  } finally {
    progress.hidden = true;
    download.disabled = false;
  }
});

showSetup();
