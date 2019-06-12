const standardTemplate = `
<div class="content">
  {{#tip}}
  <div class="tip">{{ tip }}</div>
  {{/tip}}
  <div class="header">
    <div class="word">
      <h1>
        <strong>{{ headerWord }}</strong>
      </h1>
    </div>
  </div>
  <ul class="translation-list" style="list-style-type:none;">
    {{#translationList}}
    <li>
      <span class="property">{{ property }}</span>
      <span class="translation">{{ &translation }}</span>
    </li>
    {{/translationList}}
  </ul>
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
