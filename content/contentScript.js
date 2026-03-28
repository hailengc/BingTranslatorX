const containerSelector = ".ext-bt-container";
const loadingSelector = ".loading";

function getShadowRoot() {
  return window.__BTX_SHADOW__;
}

// flag tells if a selection is in progress
let isSelecting = false;

// the latest query target
let lastQueryTarget = QueryTarget.createNullTarget();

// the extension setting
let extSetting = null;

// if a security policy violation is detected
// for now, use this to skip the audio play, this means we don't render the audio element in the template
let isSecurityPolicyViolationDetected = false;

const ERROR_INVALID_CONTENT = "INVALID_CONTENT";
const ERROR_NETWORK_ERROR = "NETWORK_ERROR";

const TRANSLATION_CONTENT_NORMAL = "TRANSLATION_CONTENT_NORMAL";
const TRANSLATION_CONTENT_MULTIWORD = "TRANSLATION_CONTENT_MULTIWORD";
const TRANSLATION_CONTENT_INVALID = "TRANSLATION_CONTENT_INVALID";

const keyNameMapping = {
  Shift: "shiftKey",
  Control: "ctrlKey",
  Alt: "altKey",
};

function getSeletionClientRect(selection) {
  if (selection.rangeCount === 0) {
    return new DOMRect(0, 0, 0, 0);
  }
  return selection.getRangeAt(0).getBoundingClientRect();
}

function hasValidSelection() {
  return isStringValid(window.getSelection().toString());
}

function isDisplay(selector) {
  const node = getShadowRoot().querySelector(selector);
  if (node && node.style.display !== "none") {
    return true;
  }
  return false;
}

function isHoveringEnable(event) {
  if (extSetting.enable && extSetting.hover.enable) {
    if (extSetting.hover.key) {
      return !!event[extSetting.hover.key];
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

function hideRoot() {
  const host = getShadowRoot().host;
  host.style.top = "-999px";
  host.style.left = "-999px";
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
  const element = getShadowRoot().querySelector(selector);
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
    container.innerHTML = contentString;
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

function isOriginInAudioBanList() {
  const origin = window.location.origin;
  // TODO: not good enough
  return audioBanList.find((host) => origin.startsWith(host));
}

const audioUrlRegexp = /https.*\.mp3/;
function getAudioUrl(contentNode, type) {
  try {
    if (isOriginInAudioBanList()) {
      return null;
    }

    const ss = type === "US" ? ".hd_prUS" : ".hd_pr";
    const hdNode = contentNode.querySelector(`${ss} + .hd_tf`);
    const linkNode = hdNode.querySelector("a");
    const clickString = linkNode.getAttribute("data-mp3link");
     
    // Update 2025-01-29:
    // returned `data-mp3link` now is: `/dict/mediamp3?blob=audio%2Ftom%2F12%2Fe1%2F12E11E186018D1050FF711C3471AA639.mp3`
    return `https://bing.com/${clickString}`;
  } catch (error) {
    // for any reason we failed, that's fine and be silent
    return null;
  }
}

const queryUrlTestExp = /^\/dict\/search\?.*$/;
const queryHost = "https://www.bing.com";
const queryBaseUrl = `${queryHost}/dict/search?mkt=zh-cn&q=`;

function convertFromBingResponseContent(htmlContent, queryString) {
  let convertedContent = null;
  try {
    if (htmlContent === ERROR_NETWORK_ERROR) {
      throw new Error(ERROR_NETWORK_ERROR);
    }
    const domParser = new DOMParser();
    const contentNode = domParser
      .parseFromString(htmlContent, "text/html")
      .querySelector(".content");
    if (!contentNode) {
      throw new Error(ERROR_INVALID_CONTENT);
    }
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
       // make sure we don't render audio element if security policy violation is detected
      const pron =
        !isSecurityPolicyViolationDetected && pronNode
          ? {
              prUS: getTextContent(pronNode.querySelector(".hd_prUS")),
              audioUS: getAudioUrl(pronNode, "US"),
              prEN: getTextContent(pronNode.querySelector(".hd_pr")),
              audioEN: getAudioUrl(pronNode, "EN"),
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
          isWeb: property.toLowerCase().indexOf("web") > -1,
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
          pron,
        },
        // volume is a partial template
        {
          volume: volumeTemplate,
        }
      );
    } else if (contentType === TRANSLATION_CONTENT_MULTIWORD) {
      const translation = contentNode.querySelector(".p1-11").textContent;
      convertedContent = Mustache.render(multiWordTemplate, {
        translation,
      });
    }
  } catch (error) {
    if (error.message === ERROR_NETWORK_ERROR) {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 似乎有网络错误",
      });
    } else if (error.message === ERROR_INVALID_CONTENT) {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 没有找到该词的翻译",
      });
    } else {
      convertedContent = Mustache.render(noContentTemplate, {
        message: "Sorry, 似乎有未知错误",
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
    (response) => {
      const htmlContent =
        response.status === 0 ? response.data : ERROR_NETWORK_ERROR;
      const convertedContent = convertFromBingResponseContent(
        htmlContent,
        queryString
      );
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
  let range = null,
    rect = null,
    selection = null,
    qstr = null;

  if (
    event.target.nodeName === "INPUT" ||
    event.target.nodeName === "TEXTAREA"
  ) {
    // TODO: how to fix?
    // The challenge is couldn't find a way to get caret postion without mouse click.
    return QueryTarget.createNullTarget();
  } else {
    // convert hover caret position to client X and Y
    if (document.caretRangeFromPoint) {
      // Use WebKit-proprietary fallback method
      // Update: 2024-09-14:  this now seems to work in chrome, the previous working
      // `document.caretPositionFromPoint` is not anymore.
      range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (range == null || !(range instanceof Range)) {
        return QueryTarget.createNullTarget();
      }
    } else if (document.caretPositionFromPoint) {
      range = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (range == null || !(range instanceof Range)) {
        return QueryTarget.createNullTarget();
      }
    } else {
      return QueryTarget.createNullTarget();
    }
    // use a selection object to hold the range we just got and expand it to a word
    // NOTE:
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection
    // It is worth noting that currently getSelection() doesn't work on the content of <textarea> and <input> elements in Firefox and Edge (Legacy).
    // HTMLInputElement.setSelectionRange() or the selectionStart and selectionEnd properties could be used to work around this.
    selection = window.getSelection();

    // store all existing ranges
    let oldRanges = [];
    for (let index = 0; index < selection.rangeCount; index++) {
      oldRanges.push(selection.getRangeAt(index));
    }

    // empty existing selection
    selection.empty();
    selection.addRange(range);
    selection.modify("move", "forward", "word");
    selection.modify("extend", "backward", "word");
    qstr = selection.toString().trim();
    rect = selection.getRangeAt(0).getBoundingClientRect();

    // done using, empty selection again
    selection.empty();

    // restore all old ranges
    oldRanges.forEach((range) => selection.addRange(range));

    // get string content of the selection and build the `query target`
    if (qstr && inRect(rect, event.clientX, event.clientY)) {
      return new QueryTarget(qstr, rect);
    } else {
      return QueryTarget.createNullTarget();
    }
  }
}

function startSelecting(event) {
  if (isEventFromBTXContainer(event)) {
    return;
  }
  isSelecting = true;
  hideAll();
}

const CHECK_INTERVAL = 30;
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
  return getShadowRoot().querySelector(containerSelector);
}

function isEventFromBTXContainer(event) {
  const host = getShadowRoot().host;
  return event.composedPath().includes(host);
}

function isMouseUpEventTargetIgnorable(targetNode) {
  return (
    targetNode.nodeName === "INPUT" ||
    document.activeElement.nodeName == "INPUT" ||
    targetNode.nodeName === "TEXTAREA" ||
    document.activeElement.nodeName == "TEXTAREA"
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

function playAudioIfCan(targetNode) {
  try {
    const audioNode = findTargetAudio(targetNode);
    audioNode && audioNode.play && audioNode.play();
  } catch (error) {
    // if anything wrong, keep silence...
    console.log("... wait, Can I ask user to click?");
  }
}

function isChildOfVolume(targetNode) {
  const volumeNodes = getContainerNode().getElementsByClassName("volume");

  for (let index = 0; index < volumeNodes.length; index++) {
    const volumeNode = volumeNodes[index];
    if (volumeNode.contains(targetNode)) {
      return true;
    }
  }

  return false;
}

function init() {
  // see:  https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent
  if (getShadowRoot()) {
    document.addEventListener("securitypolicyviolation", (_e) => {
      isSecurityPolicyViolationDetected = true;

      // hide volume element if security policy violation is detected
      let containerNode = getContainerNode();
      if (containerNode && containerNode.style.display !== "none") {
        const volumeNodes = containerNode.getElementsByClassName("volume");
        for (let index = 0; index < volumeNodes.length; index++) {
          const volumeNode = volumeNodes[index];
          volumeNode.style.display = "none";
        }
      }
    });

    enableQueryTargetDetect();

    document.addEventListener("selectstart", startSelecting);

    // TODO: try handle select event from input elements include Input and Textarea but failed, see comments below.
    // document.addEventListener(
    //   "select",
    //   (event) => {
    //     isSelecting = false;
    //     if (isEventFromBTXContainer(event)) {
    //       return;
    //     }
    //     let range = document.createRange();
    //     range.setStart(event.target.firstChild, event.target.selectionStart);
    //     range.setEnd(event.target.firstChild, event.target.selectionEnd);
    //     const selectedString = range.toString().trim();
    //     if (selectedString) {
    //       // NOTE: this returns all-zero value rect,
    //       // this is because there is no text node around this exact range
    //       //  see https://stackoverflow.com/questions/29759713/how-to-get-the-bounding-rect-of-selected-text-inside-an-input
    //       let cr = range.getBoundingClientRect();
    //       lastQueryTarget = new QueryTarget(selectedString, cr);
    //     } else {
    //       // const queryTarget = getQueryTargetByHovering(event);
    //       // if (!queryTarget.equalTo(lastQueryTarget)) {
    //       //   lastQueryTarget = queryTarget;
    //       // }
    //       lastQueryTarget = QueryTarget.createNullTarget();
    //     }
    //   },
    //   {
    //     passive: true,
    //   }
    // );

    document.addEventListener(
      "mouseup",
      (event) => {
        isSelecting = false;

        if (
          // skip event from extension container area
          isEventFromBTXContainer(event)
        ) {
          return;
        }

        const selection = window.getSelection();
        const selectedString = selection.toString().trim();
        if (selectedString) {
          let clientRect = getSeletionClientRect(selection);
          if (
            isMouseUpEventTargetIgnorable(event.target) ||
            clientRect.width == 0
          ) {
            // for these cases  we can't get real client rect,
            // just create a small "anchor rect" so that we can show our container accordingly
            clientRect = new DOMRect(event.clientX, event.clientY, 10, 10);
          }
          lastQueryTarget = new QueryTarget(selectedString, clientRect);
        } else {
          lastQueryTarget = QueryTarget.createNullTarget();
        }
      },
      { passive: true }
    );

    document.addEventListener("keyup", (event) => {
      const key = event.key;
      if (extSetting.hover.enable && extSetting.hover.key) {
        if (extSetting.hover.key === keyNameMapping[key]) {
          hideAll();
        }
      }
    });

    document.addEventListener(
      "scroll",
      (event) => {
        hideAll();
      },
      { passive: true, capture: true }
    );

    document.addEventListener(
      "mousemove",
      (event) => {
        if (
          isHoveringEnable(event) &&
          !isSelecting &&
          !hasValidSelection() &&
          !isEventFromBTXContainer(event) &&
          document.activeElement.nodeName !== "INPUT" &&
          document.activeElement.nodeName !== "TEXTAREA"
        ) {
          const queryTarget = getQueryTargetByHovering(event);
          if (!queryTarget.equalTo(lastQueryTarget)) {
            lastQueryTarget = queryTarget;
          }
        }
      },
      { passive: true }
    );

    getContainerNode().addEventListener("click", (event) => {
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
      } else if (isChildOfVolume(target)) {
        playAudioIfCan(target);
      }

      event.preventDefault();
      event.stopPropagation();
    });

    // NOTE: Let's disable hovering to play, mainly because:
    // "Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
    /**
    getContainerNode().addEventListener(
      "mouseover",
      (event) => {
        if (isChildOfVolume(event.target)) {
          playAudioIfCan(event.target);
          event.stopPropagation();
        }
      },
      { passive: true }
    );
     */

    chrome.storage.local.onChanged.addListener((changes, namespace) => {
      for (const key in changes) {
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

fetchExtSetting().then((setting) => {
  extSetting = setting;
  init();
});
