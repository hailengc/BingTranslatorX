const injectedTemplate = `
<div id="__EXT_BT_ROOT__" style="display: block">
  <div class="container" style="display: none;"></div>
  <div class="loading" style="display: none;">
    <img src="${chrome.runtime.getURL("images/loading.svg")}"    />
  </div>
</div>
`;

if (document.body) {
  document.body.insertAdjacentHTML("beforeend", injectedTemplate);
} else {
  console.log(
    "BingTranslator won't work on this page since no body tag is detected."
  );
}
