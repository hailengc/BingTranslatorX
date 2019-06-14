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
<div class="content">
  <span class="multi-word-translation">{{translation}}</span>
</div>
`;

const noContentTemplate = `
<div class="no-content">
  <span>{{message}}</span>
</div>
`;

const mTemplate = `
<b>Hello {{name}}!</b>
<ul> 
    {{#languages}}
        <li>{{.}}</li>
    {{/languages}}
    {{> partial}}
</ul>
`;

const mPartial = `
<b>this is partial: {{instrument}}</b>
`;
