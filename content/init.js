const injectedTemplate = `
<div id="__EXT_BT_ROOT__" style="display: block">
  <div class="ext-bt-container" style="display: none;"></div>
  <div class="loading" style="display: none;">
    <img src="${chrome.runtime.getURL("images/loading.svg")}"    />
  </div>
</div>
`;

if (document.body) {
  document.body.insertAdjacentHTML("beforeend", injectedTemplate);
} else {
  console.log(
    "BingTranslatorX won't work on this page since no <body> element is detected in this document."
  );
}
