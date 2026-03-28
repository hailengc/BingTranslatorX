const __BTX_SHADOW_CSS__ = `
.ext-bt-container {
  z-index: 999999999;
  border: 1px solid grey;
  position: fixed;
  font-family: Arial, Helvetica, sans-serif;
  color: black;
  background-color: skyblue;
}
.ext-bt-container .content .header {
  padding: 5px;
}
.ext-bt-container .content .header .detailLink {
  font-size: 12px;
  float: right;
  line-height: 20px;
  margin-left: 6px;
}
.ext-bt-container .content .header .detailLink a {
  text-decoration: underline;
  font-weight: bold;
  color: #666666;
}
.ext-bt-container .content .header .tip {
  font-size: 14px;
  background-color: #f9f5dd;
}
.ext-bt-container .content .header .word {
  font-size: 28px;
  font-weight: 500;
}
.ext-bt-container .content .header .pron {
  color: #777777;
  margin-top: 5px;
}
.ext-bt-container .content .header .pron .pr {
  display: inline-block;
}
.ext-bt-container .content .header .pron .pr .volume {
  margin-left: 4px;
  cursor: pointer;
}
.ext-bt-container .content .header .pron .pr .volume :hover {
  fill: #ffa31a;
}
.ext-bt-container .content .header .pron .pr .pr-en {
  margin-left: 10px;
}
.ext-bt-container .content ul.translation-list {
  max-width: 300px;
  list-style-type: none;
  display: table;
  border-collapse: separate;
  border-spacing: 5px 10px;
  margin: 0;
  padding: 0;
}
.ext-bt-container .content ul.translation-list li {
  display: table-row;
  line-height: 15px !important;
}
.ext-bt-container .content ul.translation-list li > span {
  display: table-cell;
}
.ext-bt-container .content ul.translation-list li .property {
  font-weight: bold;
  font-size: 13px;
  text-align: center;
  vertical-align: middle;
  background-color: #aaa;
  color: #fff;
}
.ext-bt-container .content ul.translation-list li .web {
  background-color: #000;
}
.ext-bt-container .content ul.translation-list li .translation {
  font-size: 14px;
  font-weight: bold;
}
.ext-bt-container .content ul.translation-list li .translation a {
  color: blue;
  text-decoration-line: underline;
}
.ext-bt-container .no-content {
  padding: 3px;
  font-size: 14px;
  font-style: italic;
  background-color: yellow;
}
.ext-bt-container .multi-word-translation {
  font-size: 14px;
  padding: 3px;
}
.loading {
  position: fixed;
  z-index: 999999999;
}
.loading img {
  height: 30px !important;
}
`;

if (document.body) {
  const host = document.createElement("div");
  host.id = "__EXT_BT_ROOT__";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>${__BTX_SHADOW_CSS__}</style>
    <div class="ext-bt-container" style="display: none;"></div>
    <div class="loading" style="display: none;">
      <img src="${chrome.runtime.getURL("images/loading.svg")}" />
    </div>
  `;
  window.__BTX_SHADOW__ = shadow;
} else {
  console.log(
    "BingTranslatorX won't work on this page since no <body> element is detected in this document."
  );
}
