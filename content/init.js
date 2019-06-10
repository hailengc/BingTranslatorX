const template = `
<div class="__EXT_BT_ROOT__" style="display: none">
  <div class="__EXT_BT_CONTAINER__" style="display: none;"></div>
  <div class="__EXT_BT_LOADING__" style="display: none">
    <img src="${chrome.runtime.getURL("images/loading.svg")}" />
  </div>
</div>`;

const domParser = new DOMParser();
const templateDom = domParser.parseFromString(template, "text/html");

document.body.appendChild(templateDom.body.firstChild);
