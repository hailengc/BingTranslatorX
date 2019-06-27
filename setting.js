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

hideElement(".main");

const cbEnableExt = document.getElementById("cbEnableExt");

const cbEnableHovering = document.getElementById("cbEnableHovering");
const selAuxKey = document.getElementById("selAuxKey");
cbEnableHovering.optionChildren = [selAuxKey];

const selBackgroundColor = document.getElementById("selBackgroundColor");
cbEnableExt.optionChildren = [cbEnableHovering, selBackgroundColor];

cbEnableExt.onclick = event => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableExt, checked);
  chrome.storage.sync.set({ enable: checked });
};

cbEnableHovering.onclick = event => {
  const checked = event.target.checked;
  toggleCheckBox(cbEnableHovering, checked);
  chrome.storage.sync.set({
    hover: { ...extensionSetting.hover, enable: checked }
  });
};

function toggleDisabled(element, disabled) {
  if (disabled) {
    element.setAttribute("disabled", true);
  } else {
    element.removeAttribute("disabled");
  }
}

function toggleCheckBox(cb, checked) {
  cb.checked = checked;
  const optionChildren = cb.optionChildren;
  if (optionChildren) {
    optionChildren.forEach(child => {
      child.disabled = !checked;
    });
  }
}

function updateFormWithSetting(setting) {
  toggleCheckBox(cbEnableExt, setting.enable);
  toggleCheckBox(cbEnableHovering, setting.hover.enable);
  selAuxKey.value = setting.hover.key;
}

let extensionSetting = null;
fetchExtSetting().then(setting => {
  // extensionSetting = defaultSetting;
  logTime("loaded setting success!");
  extensionSetting = setting;
  showElement(".main");
  updateFormWithSetting(setting);
});
