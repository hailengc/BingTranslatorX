const rootSelector = "#__EXT_BT_ROOT__";
const containerSelector = `${rootSelector} .container`;
const loadingSelector = `${rootSelector} .loading`;

let isSelecting = false,
  lastQueryTarget = QueryTarget.createNullTarget(),
  extSetting = null;

const ERROR_INVALID_CONTENT = "INVALID_CONTENT";
const ERROR_NETWORK_ERROR = "NETWORK_ERROR";

const TRANSLATION_CONTENT_NORMAL = "TRANSLATION_CONTENT_NORMAL";
const TRANSLATION_CONTENT_MULTIWORD = "TRANSLATION_CONTENT_MULTIWORD";
const TRANSLATION_CONTENT_INVALID = "TRANSLATION_CONTENT_INVALID";

function getSeletionCR(selection) {
  return selection.getRangeAt(0).getBoundingClientRect();
}

function hasValidSelection() {
  return isStringValid(window.getSelection().toString());
}

function isDisplay(selector) {
  const node = document.querySelector(selector);
  if (node && node.style.display !== "none") {
    return true;
  }
  return false;
}

function isHoveringEnable(event) {
  if (extSetting.enable && extSetting.hover.enable) {
    if (extSetting.hover.key) {
      return event[extSetting.hover.key];
    } else {
      return true;
    }
  }

  return false;
}

function isContainerShowing() {
  return isDisplay(containerSelector);
}

function isLoadingShowing() {
  return isDisplay(loadingSelector);
}

function isUIShowing() {
  return isContainerShowing() || isLoadingShowing();
}

function showRoot() {
  showElement(rootSelector);
}

function hideRoot() {
  const rootNode = document.querySelector(rootSelector);
  rootNode.style.top = -999;
  rootNode.style.left = -999;
}

function delay(timeout, func) {
  setTimeout(func, timeout);
}

function hideAll() {
  hideRoot();
  hideElement(containerSelector);
  hideElement(loadingSelector);
}

function showLoading(targetClientRect = null) {
  if (!isLoadingShowing()) {
    hideElement(containerSelector);
    showElement(loadingSelector);
  }
  if (targetClientRect) {
    adjustPosition(loadingSelector, targetClientRect);
  }
}

function showContainer(targetClientRect = null) {
  if (!isContainerShowing()) {
    hideElement(loadingSelector);
    showElement(containerSelector);
  }
  if (targetClientRect) {
    adjustPosition(containerSelector, targetClientRect);
  }

  getContainerNode().style.backgroundColor =
    extSetting.container.backgroundColor;
}

function adjustPosition(selector, targetClientRect) {
  const element = document.querySelector(selector);
  const docWidth = document.body.clientWidth;
  const windowHeight = window.innerHeight;
  const extWidth = element.clientWidth;
  const extHeight = element.clientHeight;

  if (targetClientRect.width > 500) {
    element.style.maxWidth = targetClientRect.width + "px";
  }

  const horizontalOffset = targetClientRect.left + extWidth - docWidth;
  if (horizontalOffset > 0) {
    let left = targetClientRect.left - horizontalOffset - 3;
    left = Math.max(left, 3);
    element.style.left = left + "px";
  } else {
    element.style.left = targetClientRect.left + "px";
  }

  const verticalOffset = targetClientRect.bottom + extHeight - windowHeight;
  if (verticalOffset > 0) {
    element.style.top = targetClientRect.top - extHeight + "px";
  } else {
    element.style.top = targetClientRect.bottom + "px";
  }
}

function updateContainerContent(contentString) {
  let result = false;
  const container = getContainerNode();
  if (container) {
    // note the white space in dom,
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
    if (container.firstElementChild) {
      container.removeChild(container.firstElementChild);
    }
    container.insertAdjacentHTML("beforeend", contentString);
    result = true;
  }

  return result;
}

function getTranslationContentType(contentNode) {
  if (contentNode.querySelector(".qdef > ul")) {
    return TRANSLATION_CONTENT_NORMAL;
  } else if (contentNode.querySelector(".lf_area .p1-11")) {
    return TRANSLATION_CONTENT_MULTIWORD;
  } else {
    return TRANSLATION_CONTENT_INVALID;
  }
}

const audioUrlRegexp = /https.*\.mp3/;
function getAudioUrl(contentNode, type) {
  try {
    const ss = type === "US" ? ".hd_prUS" : ".hd_pr";
    const hdNode = contentNode.querySelector(`${ss} + .hd_tf`);
    const linkNode = hdNode.querySelector("a");
    const clickString = linkNode.getAttribute("onclick");
    return clickString.match(audioUrlRegexp)[0];
  } catch (error) {
    return null;
  }
}

const queryUrlTestExp = /^\/dict\/search\?.*$/;
const queryHost = "https://cn.bing.com";
const queryBaseUrl = `${queryHost}/dict/search?mkt=zh-cn&q=`;

function convertFromHTMLContent(htmlContent, queryString) {
  let convertedContent = null;
  try {
    if (htmlContent === ERROR_NETWORK_ERROR) {
      throw new Error(ERROR_NETWORK_ERROR);
    }
    const domParser = new DOMParser();
    const contentNode = domParser
      .parseFromString(htmlContent, "text/html")
      .querySelector(".content");
    const contentType = getTranslationContentType(contentNode);
    if (contentType === TRANSLATION_CONTENT_INVALID) {
      throw new Error(ERROR_INVALID_CONTENT);
    } else if (contentType === TRANSLATION_CONTENT_NORMAL) {
      // detail url
      const detailUrl = queryBaseUrl + encodeURIComponent(queryString);

      // get tip
      const tipNode = contentNode.querySelector(".in_tip");
      const tip = tipNode && tipNode.textContent;

      // get head
      const headerWord = getTextContent(contentNode.querySelector("#headword"));

      // get pronunciation
      const pronNode = contentNode.querySelector(".hd_p1_1");
      const pron = pronNode
        ? {
            prUS: getTextContent(pronNode.querySelector(".hd_prUS")),
            audioUS: getAudioUrl(pronNode, "US"),
            prEN: getTextContent(pronNode.querySelector(".hd_pr")),
            audioEN: getAudioUrl(pronNode, "EN")
          }
        : null;

      // get translation
      const translationList = [];
      const ulNode = contentNode.querySelector("ul");
      for (const li of ulNode.children) {
        const property = getTextContent(li.querySelector(".pos"));
        const translation = getInnerHTML(li.querySelector(".def"));
        translationList.push({
          property,
          translation,
          isWeb: property.toLowerCase().indexOf("web") > -1
        });
      }

      Mustache.parse(standardTemplate); // optional cache, speeds up future uses
      convertedContent = Mustache.render(
        standardTemplate,
        {
          detailUrl,
          tip,
          headerWord,
          translationList,
          hasPhonetic: true,
          pron
        },
        {
          volume: volumeTemplate
        }
      );
    } else if (contentType === TRANSLATION_CONTENT_MULTIWORD) {
      const translation = contentNode.querySelector(".p1-11").textContent;
      convertedContent = Mustache.render(multiWordTemplate, {
        translation
      });
    }
  } catch (error) {
    if (error.message === ERROR_NETWORK_ERROR) {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 似乎有网络错误"
      });
    } else if (error.message === ERROR_INVALID_CONTENT) {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 没有找到该词的翻译"
      });
    } else {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 似乎有未知错误"
      });
    }
  }

  return convertedContent;
}

function queryAndShow(queryTarget) {
  if (!extSetting.enable) {
    return;
  }

  if (queryTarget.isActive || !queryTarget.targetString) {
    return;
  }
  queryTarget.isActive = true;

  const targetClientRect = queryTarget.targetClientRect;
  showLoading(targetClientRect);

  const queryString = queryTarget.targetString;
  chrome.runtime.sendMessage(
    { action: "query", queryString, queryTarget },
    response => {
      const htmlContent =
        response.status === 0 ? response.data : ERROR_NETWORK_ERROR;
      const convertedContent = convertFromHTMLContent(htmlContent, queryString);
      if (convertedContent && updateContainerContent(convertedContent)) {
        // check if still the same queryTarget
        if (queryTarget.equalTo(lastQueryTarget)) {
          showContainer(queryTarget.targetClientRect);
        }
      }
    }
  );
}

function getCurrentSelectionRange() {
  if (window.getSelection().rangeCount > 0) {
    return window.getSelection().getRangeAt(0);
  } else {
    return null;
  }
}

function getQueryTargetByHovering(event) {
  if (
    event.target.nodeName === "INPUT" ||
    event.target.nodeName === "TEXTAREA"
  ) {
    // skip hovering targets: Input and Textarea
    return QueryTarget.createNullTarget();
  }

  let queryTarget = QueryTarget.createNullTarget(),
    range = null,
    textNode = null;

  const currentSelectionRange = getCurrentSelectionRange();
  const activeElement = document.activeElement;
  // Note: assume selectionStart equals selectionEnd
  const activeElementEditable = !isNil(activeElement.selectionStart);
  const activeElementSelectionStart = activeElement.selectionStart || 0;

  if (document.caretPositionFromPoint) {
    range = document.caretPositionFromPoint(event.clientX, event.clientY);
    textNode = range.offsetNode;
    offset = range.offset;
  } else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (range) {
      textNode = range.startContainer;
      offset = range.startOffset;
    }
  }

  if (isValidTextNode(textNode)) {
    const selection = window.getSelection();
    selection.empty();
    selection.addRange(range);
    selection.modify("move", "forward", "word");
    selection.modify("extend", "backward", "word");
    const slectionRange = selection.getRangeAt(0);
    const rect = slectionRange.getBoundingClientRect();

    const qstr = selection.toString().trim();
    if (qstr && inRect(rect, event.clientX, event.clientY)) {
      queryTarget = new QueryTarget(qstr, rect);
    }

    selection.empty();
    if (currentSelectionRange) {
      if (activeElement && activeElementEditable) {
        activeElement.focus();
        activeElement.selectionStart = activeElementSelectionStart;
      } else {
        selection.addRange(currentSelectionRange);
      }
    }
  }

  return queryTarget;
}

function startSelecting(event) {
  if (isEventFromContainer(event)) {
    return;
  }
  isSelecting = true;
  hideAll();
}

// document.addEventListener("selectionchange", event => {});

const CHECK_INTERVAL = 20;
const VALID_HOVERING_TIME = 300;
let queryTargetDetectInterval = null;

function enableQueryTargetDetect() {
  queryTargetDetectInterval =
    queryTargetDetectInterval ||
    setInterval(() => {
      if (isSelecting) {
        return;
      } else if (hasValidSelection()) {
        queryAndShow(lastQueryTarget);
      } else {
        if (
          lastQueryTarget.isValid &&
          lastQueryTarget.livingTime >= VALID_HOVERING_TIME
        ) {
          queryAndShow(lastQueryTarget);
        } else {
          hideAll();
        }
      }
    }, CHECK_INTERVAL);
}

function disableQueryTargetDetect() {
  window.clearInterval(queryTargetDetectInterval);
  queryTargetDetectInterval = null;
}

function getContainerNode() {
  return document.querySelector(containerSelector);
}

function isEventFromContainer(event) {
  const container = document.querySelector(containerSelector);
  return container.contains(event.target);
}

function isTargetIgnorable(targetNode) {
  return (
    targetNode.nodeName === "INPUT" ||
    document.activeElement.nodeName == "INPUT"
  );
}

function openNewTab(url) {
  chrome.runtime.sendMessage({ action: "createTab", url });
}

function findTargetAudio(targetNode) {
  const containerNode = getContainerNode();
  const usv = containerNode.querySelector(".prUS .volume");
  if (usv && usv.contains(targetNode)) {
    return containerNode.querySelector(".audioUS");
  }
  const env = containerNode.querySelector(".prEN .volume");
  if (env && env.contains(targetNode)) {
    return containerNode.querySelector(".audioEN");
  }
  return null;
}

function playAudioIfNeed(targetNode) {
  const audioNode = findTargetAudio(targetNode);
  audioNode && audioNode.play && audioNode.play();
}

function init() {
  if (document.querySelector(rootSelector)) {
    enableQueryTargetDetect();

    document.addEventListener("selectstart", startSelecting);

    document.addEventListener("mouseup", event => {
      isSelecting = false;

      if (isEventFromContainer(event) || isTargetIgnorable(event.target)) {
        return;
      }

      const sel = window.getSelection();
      const selectedString = sel.toString().trim();
      if (selectedString) {
        let cr = getSeletionCR(sel);
        if (cr.width == 0) {
          // this happens when select in textarea and input
          // create a 10*10 rect
          cr = new DOMRect(event.clientX, event.clientY, 10, 10);
        }
        lastQueryTarget = new QueryTarget(selectedString, cr);
      } else {
        const queryTarget = getQueryTargetByHovering(event);
        if (!queryTarget.equalTo(lastQueryTarget)) {
          lastQueryTarget = queryTarget;
        }
      }
    });

    document.addEventListener("scroll", event => {
      if (hasValidSelection() && isUIShowing()) {
        // move with the scroll
        const sel = window.getSelection();
        let cr = getSeletionCR(sel);

        // update last query target's rect
        if (lastQueryTarget.isValid) {
          lastQueryTarget.updateClientRect(cr);
        }

        if (cr.width !== 0) {
          if (isContainerShowing()) {
            showContainer(cr);
          } else if (isLoadingShowing()) {
            showLoading(cr);
          }
        } else {
          // for selections in textarea/input
          hideAll();
        }
      } else {
        hideAll();
      }
    });

    document.addEventListener("mousemove", event => {
      if (
        isHoveringEnable(event) &&
        !isSelecting &&
        !hasValidSelection() &&
        !isEventFromContainer(event)
      ) {
        const queryTarget = getQueryTargetByHovering(event);
        if (!queryTarget.equalTo(lastQueryTarget)) {
          lastQueryTarget = queryTarget;
        }
      }
    });

    // document.addEventListener("select", event => {
    //   // this event fires from textarea and input
    // });

    getContainerNode().addEventListener("click", event => {
      const target = event.target;
      if (target.nodeName === "A") {
        const href = target.getAttribute("href");
        if (href) {
          if (queryUrlTestExp.test(href)) {
            openNewTab(queryHost + href);
          } else {
            openNewTab(href);
          }
        }
      }
      event.preventDefault();
      event.stopPropagation();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      for (const key in changes) {
        logTime("storage.onChange");
        const storageChange = changes[key];
        // console.log(
        //   'Storage key "%s" in namespace "%s" changed. ' +
        //     'Old value was "%s", new value is "%s".',
        //   key,
        //   namespace,
        //   storageChange.oldValue,
        //   storageChange.newValue
        // );
        extSetting[key] = storageChange.newValue;
      }
    });
  }
}

fetchExtSetting().then(setting => {
  extSetting = setting;
  console.log(extSetting);

  init();
});
