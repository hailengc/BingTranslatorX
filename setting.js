const i18n = chrome.i18n.getMessage;

// hide until setting is ready
hideElement(".main");

document.querySelectorAll("[data-i18n]").forEach((node) => {
  node.textContent = i18n(node.dataset.i18n);
});

const main = document.querySelector(".main");
const cbEnableExt = document.getElementById("cbEnableExt");
const cbSkipBrowserLanguage = document.getElementById("cbSkipBrowserLanguage");

const cbEnableHovering = document.getElementById("cbEnableHovering");
const selAuxKey = document.getElementById("selAuxKey");
cbEnableHovering.optionChildren = [selAuxKey];

const selBackgroundColor = document.getElementById("selBackgroundColor");
cbEnableExt.optionChildren = [
  cbSkipBrowserLanguage,
  cbEnableHovering,
  selBackgroundColor,
];

const closeButton = document.getElementById("closeButton");
const cbSelectionTranslation = document.getElementById("cbSelectionTranslation");
const selectionTranslationStatus = document.getElementById("selectionTranslationStatus");
let translationPreparation;

// add event handler
cbEnableExt.onclick = (event) => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableExt, checked);
  saveSetting({ enable: checked });
};

cbSkipBrowserLanguage.onchange = (event) => {
  saveSetting({ skipBrowserLanguage: event.target.checked });
};

cbEnableHovering.onclick = (event) => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableHovering, checked);

  extensionSetting.hover.enable = checked;
  saveSetting({ hover: extensionSetting.hover });
};

selAuxKey.onchange = (event) => {
  extensionSetting.hover.key = event.target.value;
  saveSetting({ hover: extensionSetting.hover });
};

selBackgroundColor.onchange = (event) => {
  const color = event.target.value;
  extensionSetting.container.backgroundColor = color;
  main.style.backgroundColor = color;
  saveSetting({ container: extensionSetting.container });
};

cbSelectionTranslation.addEventListener("change", async () => {
  const enabled = cbSelectionTranslation.checked;
  if (!enabled) {
    translationPreparation?.abort();
    selectionTranslationStatus.textContent = "";
    await chrome.storage.local.set({ selectionTranslationEnabled: false });
    return;
  }

  const controller = new AbortController();
  translationPreparation = controller;
  selectionTranslationStatus.textContent = i18n("translationSetupPreparing");
  try {
    await Promise.all([
      chrome.storage.local.set({ selectionTranslationEnabled: true }),
      prepareSelectionTranslation({ signal: controller.signal }),
    ]);
    if (!controller.signal.aborted) {
      selectionTranslationStatus.textContent = i18n("translationSettingsReady");
    }
  } catch {
    if (!controller.signal.aborted) {
      selectionTranslationStatus.textContent = i18n("translationSettingsFailed");
    }
  } finally {
    if (translationPreparation === controller) {
      translationPreparation = undefined;
    }
  }
});

chrome.storage.local.onChanged.addListener(({ selectionTranslationEnabled }) => {
  if (!selectionTranslationEnabled) {
    return;
  }
  cbSelectionTranslation.checked = selectionTranslationEnabled.newValue === true;
  if (!cbSelectionTranslation.checked) {
    translationPreparation?.abort();
    selectionTranslationStatus.textContent = "";
  }
});

closeButton.onclick = () => {
  window.close();
};

function saveSetting(setting) {
  chrome.storage.local.set(setting);
}

function changeIcon(isActive) {
  const path = isActive ? "images/logo32.png" : "images/logo32-inactive.png";
  chrome.action.setIcon({ path });
}

function toggleCheckBox(cb, checked) {
  cb.checked = checked;
  const optionChildren = cb.optionChildren;
  if (optionChildren) {
    optionChildren.forEach((child) => {
      child.disabled = !checked;
    });
  }

  if (cb === cbEnableExt) {
    changeIcon(checked);
  }
}

function updateFormWithSetting(setting) {
  toggleCheckBox(cbEnableExt, setting.enable);
  cbSkipBrowserLanguage.checked = setting.skipBrowserLanguage !== false;
  toggleCheckBox(cbEnableHovering, setting.hover.enable);
  selAuxKey.value = setting.hover.key;
  selBackgroundColor.value = setting.container.backgroundColor;
  cbSelectionTranslation.checked = setting.selectionTranslationEnabled === true;
  main.style.backgroundColor = setting.container.backgroundColor;
}

let extensionSetting = null;
fetchExtSetting().then((setting) => {
  logTime("loaded setting success!");
  extensionSetting = setting;
  showElement(".main");
  updateFormWithSetting(setting);
});
