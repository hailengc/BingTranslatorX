const injectTemplate = `
<div class="__EXT_BT_ROOT__" style="display: block">
  <div class="container" style="display: none;"></div>
  <div class="loading" style="display: none;">
    <img src="${chrome.runtime.getURL(
      "images/loading.svg"
    )}"  style="height: 30px;" />
  </div>
</div>
`;

if (document.body) {
  //   const domParser = new DOMParser();
  //   const templateDom = domParser.parseFromString(template, "text/html");
  //   document.body.append(...templateDom.body.children);
  document.body.insertAdjacentHTML("beforeend", injectTemplate);

  // test for mustache
  Mustache.parse(standardTemplate); // optional, speeds up future uses
  const rendered = Mustache.render(standardTemplate, {
    showTip: true,
    tip: "this is the tip",
    headerWord: "think",
    translationList: [
      { property: "adv", translation: "腹黑凤凰飞机付款金额" },
      {
        property: "a",
        translation: `<a href="http://www.baidu.com">baidu.com</a> 的科技和`
      },
      { property: "adv", translation: "腹黑凤凰飞机付款金额" },
      { property: "adv", translation: "腹黑凤凰飞机付款金额" }
    ]
  });

  document.body.insertAdjacentHTML("beforeend", rendered);
} else {
  console.log(
    "BingTranslator won't work on this page since no body tag is detected."
  );
}
