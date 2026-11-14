const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function element(nodeName, properties = {}) {
  return { nodeName, nodeType: 1, closest: () => null, ...properties };
}

async function createPage(browserLanguage = "zh-CN", initialSettings = {}) {
  const listeners = new Map();
  const intervals = [];
  const requests = [];
  const translations = [];
  const rect = { left: 0, right: 100, top: 0, bottom: 20, width: 100 };
  const text = element("P");
  const caret = {
    startContainer: { nodeType: 3, parentElement: text },
    getBoundingClientRect: () => rect,
  };
  let selectionChanges = 0;
  let selectedText = "";
  let hoveredText = "";
  let usingHoverRange = false;
  let now = Date.now();
  let onSettingsChanged;
  const selection = {
    rangeCount: 0,
    toString: () => selection.rangeCount ? (usingHoverRange ? hoveredText : selectedText) : "",
    getRangeAt: () => caret,
    empty() { selectionChanges++; this.rangeCount = 0; usingHoverRange = false; },
    addRange() { selectionChanges++; this.rangeCount = 1; },
    modify() { selectionChanges++; usingHoverRange = true; },
  };
  const container = { style: { display: "none" }, addEventListener() {} };
  const loading = { style: { display: "none" } };
  const shadow = {
    host: { style: {} },
    querySelector: selector => selector === ".loading" ? loading : container,
  };
  const body = element("BODY");
  const document = {
    body,
    activeElement: body,
    designMode: "off",
    caretRangeFromPoint: () => caret,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
  };
  const closedRoots = new Map();
  const context = vm.createContext({
    document,
    window: { __BTX_SHADOW__: shadow, getSelection: () => selection },
    Date: class extends Date { static now() { return now; } },
    AbortController,
    Node: { ELEMENT_NODE: 1 },
    Range: Object,
    DOMRect: class {
      constructor(left, top, width, height) {
        Object.assign(this, { left, top, width, height, right: left + width, bottom: top + height });
      }
    },
    chrome: {
      dom: { openOrClosedShadowRoot: host => closedRoots.get(host) || null },
      i18n: { getUILanguage: () => browserLanguage },
      runtime: { id: "test-extension", sendMessage: (request, callback) => requests.push({ request, callback }) },
      storage: { local: {
        get: (_, callback) => callback({
          enable: true, hover: { enable: true, key: "" },
          container: { backgroundColor: "skyblue" },
          ...initialSettings,
        }),
        onChanged: { addListener(listener) { onSettingsChanged = listener; } },
      } },
    },
    Translator: {
      availability: async () => "available",
      create: async () => ({
        async translate(text) {
          translations.push(text);
          return "translated text";
        },
        destroy() {},
      }),
    },
    Mustache: { render: (_, { translation }) => translation },
    setInterval: callback => { intervals.push(callback); return intervals.length; },
  });
  for (const file of ["lib/util.js", "lib/QueryTarget.js", "template/mustacheTemplates.js", "content/contentScript.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  }
  // init() runs after the stored settings have loaded.
  await vm.runInContext("Promise.resolve()", context);

  const dispatch = (type, target = text, eventPath = [target]) => {
    const event = { target, clientX: 5, clientY: 5, composedPath: () => eventPath };
    for (const listener of listeners.get(type) || []) listener(event);
  };
  return {
    context, document, body, text, caret, closedRoots, requests, translations, container, loading,
    dispatch,
    tick: (ms = 0) => { now += ms; intervals.forEach(callback => callback()); },
    changes: () => selectionChanges,
    select: text => { selectedText = text; selection.rangeCount = text ? 1 : 0; },
    hover: text => { hoveredText = text; dispatch("mousemove"); },
    setLanguageFilter: value => onSettingsChanged({ skipBrowserLanguage: { newValue: value } }),
    seedQuery: () => vm.runInContext(`
      lastQueryTarget = new QueryTarget("hello", ${JSON.stringify(rect)});
      lastQueryTarget.createdTime -= 500;
    `, context),
  };
}

async function testInputFocus() {
  for (const control of [
    element("INPUT"),
    element("TEXTAREA"),
    element("DIV", { isContentEditable: true }),
    element("SPAN", { isContentEditable: true }),
    element("DIV", { closest: () => element("DIV") }),
  ]) {
    const page = await createPage();
    page.document.activeElement = control;
    page.dispatch("mousemove");
    assert.strictEqual(page.changes(), 0, `selection must stay untouched with ${control.nodeName} focused`);
  }

  for (const mode of ["open", "closed"]) {
    const page = await createPage();
    const innerHost = element("DIV", { shadowRoot: { activeElement: element("INPUT") } });
    const host = element("DIV");
    const root = { activeElement: innerHost };
    if (mode === "open") host.shadowRoot = root;
    else page.closedRoots.set(host, root);
    page.document.activeElement = host;
    page.dispatch("mousemove");
    assert.strictEqual(page.changes(), 0, `selection must stay untouched with nested ${mode} shadow input focused`);
  }

  for (const viaCaret of [false, true]) {
    const page = await createPage();
    const editable = element("SPAN", { isContentEditable: true });
    if (viaCaret) page.caret.startContainer.parentElement = editable;
    page.dispatch("mousemove", viaCaret ? page.text : editable);
    assert.strictEqual(page.changes(), 0, "hovering an unfocused editor must not move its selection");
  }

  {
    const page = await createPage();
    page.document.designMode = "on";
    page.dispatch("mousemove");
    assert.strictEqual(page.changes(), 0, "designMode documents must keep their selection");
  }

  for (const trigger of ["focusin", "compositionstart"]) {
    const page = await createPage();
    page.seedQuery();
    page.loading.style.display = "block";
    if (trigger === "focusin") page.document.activeElement = element("INPUT");
    page.dispatch(trigger);
    page.tick();
    assert.strictEqual(page.requests.length, 0, `${trigger} must cancel pending hover queries`);
    assert.strictEqual(page.loading.style.display, "none");
    assert.strictEqual(page.container.style.display, "none");
  }

  {
    const page = await createPage();
    page.seedQuery();
    page.tick();
    assert.strictEqual(page.requests.length, 1);
    page.document.activeElement = element("DIV", { isContentEditable: true });
    page.dispatch("focusin");
    // A stale response must be discarded before parsing or rendering it.
    page.context.convertFromBingResponseContent = () => { throw new Error("stale response rendered"); };
    page.requests[0].callback({ status: 0, data: "late dictionary response" });
    assert.strictEqual(page.container.style.display, "none");
    assert.strictEqual(page.loading.style.display, "none");
  }

  {
    const page = await createPage();
    page.dispatch("compositionstart");
    page.dispatch("mousemove");
    assert.strictEqual(page.changes(), 0, "composition must block selection changes even without editable focus");
    page.dispatch("compositionend");
    page.dispatch("mousemove");
    assert.ok(page.changes() > 0, "ordinary hover detection must resume after composition ends");
  }

  {
    const page = await createPage();
    page.document.activeElement = element("BUTTON");
    page.dispatch("mousemove");
    assert.ok(page.changes() > 0, "non-editable focus must allow ordinary hover detection");
    page.seedQuery();
    page.tick();
    assert.strictEqual(page.requests[0].request.queryString, "hello");
  }

  {
    const page = await createPage("zh-CN", { selectionTranslationEnabled: true });
    page.document.activeElement = element("INPUT");
    page.select("selected text");
    page.dispatch("mouseup", page.document.activeElement);
    page.tick();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepStrictEqual(page.translations, ["selected text"], "opted-in selection translation must remain available in inputs");
    assert.strictEqual(page.container.innerHTML, "translated text");
    assert.strictEqual(page.requests.length, 0);
  }

  {
    const page = await createPage("zh-CN", { selectionTranslationEnabled: false });
    page.select("selected text");
    page.dispatch("mouseup");
    page.tick();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepStrictEqual(page.translations, [], "selecting a sentence must respect opt-out");
    assert.strictEqual(page.requests.length, 0);
    assert.strictEqual(page.loading.style.display, "none");
  }

  console.log("Input focus regression tests passed");
}

async function testLanguageFilter() {
  const cases = [
    ["zh-CN", {}, "hello", true],
    ["zh-TW", {}, "你好", false],
    ["en-US", {}, "你好", true],
    ["en-GB", {}, "hello", false],
    ["fr-CA", {}, "hello", true],
    ["fr-CA", {}, "你好", true],
    ["en-US", { skipBrowserLanguage: false }, "hello", true],
    ["zh-CN", { skipBrowserLanguage: false }, "你好", true],
  ];

  for (const [locale, settings, text, expected] of cases) {
    for (const trigger of ["hover", "selection"]) {
      const page = await createPage(locale, settings);
      if (trigger === "hover") {
        page.hover(text);
        page.tick(350);
      } else {
        page.select(text);
        page.dispatch("mouseup");
        page.tick();
      }

      assert.deepStrictEqual(
        page.requests.map(({ request }) => request.queryString),
        expected ? [text] : [],
        `${locale} ${trigger} for ${text} with ${JSON.stringify(settings)}`,
      );
    }
  }

  const page = await createPage("en-US");
  page.hover("hello");
  page.tick(350);
  assert.strictEqual(page.requests.length, 0);

  page.setLanguageFilter(false);
  page.hover("hello");
  page.tick(350);
  assert.strictEqual(page.requests[0].request.queryString, "hello");

  page.setLanguageFilter(true);
  assert.strictEqual(page.loading.style.display, "none");

  page.setLanguageFilter(false);
  page.hover("hello");
  page.tick(350);
  assert.strictEqual(page.requests.length, 2);
  page.context.convertFromBingResponseContent = () => { throw new Error("filtered response rendered"); };
  page.requests[0].callback({ status: 0, data: "late dictionary response" });
  assert.strictEqual(page.container.style.display, "none");

  console.log("Browser language filter regression tests passed");
}

async function main() {
  await testInputFocus();
  await testLanguageFilter();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
