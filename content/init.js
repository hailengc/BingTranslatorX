const template = `
<div class="__EXT_BT_ROOT__" style="display: block">
  <div class="container" style="display: none;"></div>
  <div class="loading" style="display: none;">
    <img src="${chrome.runtime.getURL(
      "images/loading.svg"
    )}"  style="height: 30px;" />
  </div>
</div>`;

if (document.body) {
  const domParser = new DOMParser();
  const templateDom = domParser.parseFromString(template, "text/html");
  document.body.appendChild(templateDom.body.firstChild);
} else {
  console.log(
    "BingTranslator won't work on this page since no body tag is detected."
  );
}
