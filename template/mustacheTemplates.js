const standardTemplate = `
<div class="content">
  <div class="header">
    <span class="detailLink"><a href={{ detailUrl }} >详细释义</a></span>
    {{#tip}}
    <span class="tip">{{ tip }}</span>
    {{/tip}}
    <div class="word">
        <span> {{ headerWord }} </span>
    </div>
    {{#pron}}
    <div class="pron">
        {{#pron.prUS}}
        <div class="pr prUS">
            <span class="pr-country">{{ pron.prUS }}</span>
            {{ #pron.audioUS}}
            <span class="volume">{{ >volume }}</span>
            <audio src="{{pron.audioUS}}" class="audioUS"></audio>
            {{ /pron.audioUS}}
        </div>
        {{/pron.prUS}}

        {{#pron.prEN}}
        <div class="pr prEN">
            <span class="pr-country pr-en">{{ pron.prEN }}</span>
            {{ #pron.audioEN}}
            <span class="volume">{{ >volume }}</span>
            <audio src="{{pron.audioEN}}" class="audioEN"></audio>
            {{ /pron.audioEN}}
        </div>
        {{/pron.prEN}}
    </div>
    {{/pron}}
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

const volumeTemplate = `
<!-- Generated by IcoMoon.io -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" 
    style="width: 19px; vertical-align: middle; transform: translateY(-2px) " >
 
 
<path d="M22.485 25.985c-0.384 0-0.768-0.146-1.061-0.439-0.586-0.586-0.586-1.535 0-2.121 4.094-4.094 4.094-10.755 0-14.849-0.586-0.586-0.586-1.536 0-2.121s1.536-0.586 2.121 0c2.55 2.55 3.954 5.94 3.954 9.546s-1.404 6.996-3.954 9.546c-0.293 0.293-0.677 0.439-1.061 0.439v0zM17.157 23.157c-0.384 0-0.768-0.146-1.061-0.439-0.586-0.586-0.586-1.535 0-2.121 2.534-2.534 2.534-6.658 0-9.192-0.586-0.586-0.586-1.536 0-2.121s1.535-0.586 2.121 0c3.704 3.704 3.704 9.731 0 13.435-0.293 0.293-0.677 0.439-1.061 0.439z"></path>
<path d="M13 30c-0.26 0-0.516-0.102-0.707-0.293l-7.707-7.707h-3.586c-0.552 0-1-0.448-1-1v-10c0-0.552 0.448-1 1-1h3.586l7.707-7.707c0.286-0.286 0.716-0.372 1.090-0.217s0.617 0.519 0.617 0.924v26c0 0.404-0.244 0.769-0.617 0.924-0.124 0.051-0.254 0.076-0.383 0.076z"></path>
 
</svg>

`;
