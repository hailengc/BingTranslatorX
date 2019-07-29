// let extensionOnOff = document.getElementById("extensionOnOff");

// extensionOnOff.onclick = function(element) {
//   chrome.storage.sync.set({
//     enable: false
//   });

//   chrome.browserAction.setIcon({ path: "images/logo32-inactive.png" });
// };

const defaultSetting = {
  enable: false,
  hover: {
    enable: true,
    key: ""
  },
  container: {
    backgroundColor: "skyblue"
  }
};

const i18n = chrome.i18n.getMessage;

// hide until setting is ready
hideElement(".main");

document.querySelectorAll("[data-i18n]").forEach(node => {
  node.textContent = i18n(node.dataset.i18n);
});

const main = document.querySelector(".main");
const cbEnableExt = document.getElementById("cbEnableExt");

const cbEnableHovering = document.getElementById("cbEnableHovering");
const selAuxKey = document.getElementById("selAuxKey");
cbEnableHovering.optionChildren = [selAuxKey];

const selBackgroundColor = document.getElementById("selBackgroundColor");
cbEnableExt.optionChildren = [cbEnableHovering, selBackgroundColor];

const closeButton = document.getElementById("closeButton");

// add event handler
cbEnableExt.onclick = event => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableExt, checked);
  extensionSetting.enable = checked;
  saveSetting(extensionSetting);
};

cbEnableHovering.onclick = event => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableHovering, checked);

  extensionSetting.hover.enable = checked;
  saveSetting(extensionSetting);
};

selAuxKey.onchange = event => {
  extensionSetting.hover.key = event.target.value;
  saveSetting(extensionSetting);
};

selBackgroundColor.onchange = event => {
  const color = event.target.value;
  extensionSetting.container.backgroundColor = color;
  main.style.backgroundColor = color;
  saveSetting(extensionSetting);
};

closeButton.onclick = event => {
  window.close();
};

function saveSetting(setting) {
  chrome.storage.sync.set(setting);
}

function changeIcon(isActive) {
  const path = isActive ? "images/logo32.png" : "images/logo32-inactive.png";
  chrome.browserAction.setIcon({ path });
}

function toggleCheckBox(cb, checked) {
  cb.checked = checked;
  const optionChildren = cb.optionChildren;
  if (optionChildren) {
    optionChildren.forEach(child => {
      child.disabled = !checked;
    });
  }

  if (cb === cbEnableExt) {
    changeIcon(checked);
  }
}

function updateFormWithSetting(setting) {
  toggleCheckBox(cbEnableExt, setting.enable);
  toggleCheckBox(cbEnableHovering, setting.hover.enable);
  selAuxKey.value = setting.hover.key;
  selBackgroundColor.value = setting.container.backgroundColor;
  main.style.backgroundColor = setting.container.backgroundColor;
}

let extensionSetting = null;
fetchExtSetting().then(setting => {
  // extensionSetting = defaultSetting;
  logTime("loaded setting success!");
  extensionSetting = setting;
  showElement(".main");
  updateFormWithSetting(setting);
});
