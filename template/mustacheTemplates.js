const standardTemplate = `
<div class="content">
  <div class="header">
    {{#tip}}
    <div class="tip">{{ tip }}</div>
    {{/tip}}
    <div class="word">
        <span> {{ headerWord }} </span>
    </div>
  </div>
  <ul class="translation-list" >
    {{#translationList}}
    <li>
      <span class="property {{#isWeb}}web{{/isWeb}}">{{ property }}</span>
      <span class="translation" >{{ &translation }}</span>
    </li>
    {{/translationList}}
  </ul>
</div>
`;

const multiWordTemplate = `
<div class="multi-word-translation">
  <span>{{translation}}</span>
</div>
`;

const noContentTemplate = `
<div class="no-content">
  <span>{{message}}</span>
</div>
`;

const injectTemplate = `
<div id="__EXT_BT_ROOT__" style="display: block">
  <div class="container" style="display: none;">{{>content}}</div>
  <div class="loading" style="display: none;">
    <img src="${chrome.runtime.getURL(
      "images/loading.svg"
    )}"  style="height: 30px;" />
  </div>
</div>
`;
