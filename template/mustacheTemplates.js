const standardTemplate = `
<div class="content">
  {{#tip}}
  <div class="tip">{{ tip }}</div>
  {{/tip}}
  <div class="header">
    <div class="word">
        <span> {{ headerWord }} </span>
    </div>
  </div>
  <ul class="translation-list" >
    {{#translationList}}
    <li>
      <span class="property">{{ property }}</span>
      <span class="translation" >{{ &translation }}</span>
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
