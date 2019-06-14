const rootSelector = "#__EXT_BT_ROOT__";
const containerSelector = `${rootSelector} .container`;
const loadingSelector = `${rootSelector} .loading`;

let isSelecting = false,
  enableHovering = false,
  lastQueryTarget = QueryTarget.createNullTarget();

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

function isContainerShowing() {
  const extContainer = document.querySelector(containerSelector);
  return extContainer.style.display !== "none";
}

function showRoot() {
  showElement(rootSelector);
}

function hideAll() {
  hideElement(containerSelector);
  hideElement(loadingSelector);
}

function showLoading(targetClientRect = null) {
  hideElement(containerSelector);
  showElement(loadingSelector);
  if (targetClientRect) {
    adjustPosition(loadingSelector, targetClientRect);
  }
}

function showContainer(targetClientRect = null) {
  hideElement(loadingSelector);
  showElement(containerSelector);
  if (targetClientRect) {
    adjustPosition(containerSelector, targetClientRect);
  }
}

function adjustPosition(selector, targetClientRect) {
  const element = document.querySelector(selector);
  const docWidth = document.body.clientWidth;
  const windowHeight = window.innerHeight;
  const extWidth = element.clientWidth;
  const extHeight = element.clientHeight;

  const horizontalOffset = targetClientRect.left + extWidth - docWidth;
  if (horizontalOffset > 0) {
    element.style.left = targetClientRect.left - horizontalOffset + "px";
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
  const container = document.querySelector(containerSelector);
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

function convertFromHTMLContent(htmlContent) {
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
      const tipNode = contentNode.querySelector(".in_tip");
      const tip = tipNode && tipNode.textContent;

      const headerWord = contentNode.querySelector("#headword").textContent;
      const translationList = [];
      const ulNode = contentNode.querySelector("ul");
      for (const li of ulNode.children) {
        const property = li.querySelector(".pos").textContent;
        const translation = li.querySelector(".def").innerHTML;
        translationList.push({
          property,
          translation,
          isWeb: property.toLowerCase().indexOf("web") > -1
        });
      }

      Mustache.parse(standardTemplate); // optional cache, speeds up future uses
      convertedContent = Mustache.render(standardTemplate, {
        tip,
        headerWord,
        translationList
      });
    } else if (contentType === TRANSLATION_CONTENT_MULTIWORD) {
      const translation = contentNode.querySelector(".p1-11").textContent;
      convertedContent = Mustache.render(multiWordTemplate, {
        translation
      });
    }
  } catch (error) {
    console.error(error);

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
      const convertedContent = convertFromHTMLContent(htmlContent);
      if (convertedContent && updateContainerContent(convertedContent)) {
        // check if still the same queryTarget
        if (queryTarget.equalTo(lastQueryTarget)) {
          showContainer(targetClientRect);
        }
      }
    }
  );
}

function getQueryTargetByHovering() {
  let range = null,
    textNode = null;

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

  let queryTarget = QueryTarget.createNullTarget();
  if (textNode && textNode.nodeType == Node.TEXT_NODE) {
    const selection = window.getSelection();
    selection.empty();
    selection.addRange(range);
    selection.modify("move", "forward", "word");
    selection.modify("extend", "backward", "word");
    const slectionRange = selection.getRangeAt(0);
    const rect = slectionRange.getBoundingClientRect();

    const qstr = selection.toString().trim();
    if (qstr && inRect(rect, event.clientX, event.clientY)) {
      queryTarget = new QueryTarget(qstr, getSeletionCR(selection));
    }
    selection.empty();
  }

  return queryTarget;
}

function startSelecting(event) {
  isSelecting = true;
  hideAll();
}
document.addEventListener("mousedown", startSelecting);
document.addEventListener("selectstart", startSelecting);

document.addEventListener("mouseup", event => {
  const sel = window.getSelection();
  const selectedString = sel.toString().trim();
  if (selectedString) {
    lastQueryTarget = new QueryTarget(selectedString, getSeletionCR(sel));
  } else {
    const queryTarget = getQueryTargetByHovering();
    if (!queryTarget.equalTo(lastQueryTarget)) {
      lastQueryTarget = queryTarget;
    }
  }

  isSelecting = false;
});

// document.addEventListener("selectionchange", event => {});

function updateQueryTarget(event) {
  if (!enableHovering || isSelecting || hasValidSelection()) {
    return;
  }
  const queryTarget = getQueryTargetByHovering();
  if (!queryTarget.equalTo(lastQueryTarget)) {
    lastQueryTarget = queryTarget;
  }
}

document.addEventListener("scroll", updateQueryTarget);
document.addEventListener("mousemove", updateQueryTarget);

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

if (document.querySelector(rootSelector)) {
  enableHovering = true;
  enableQueryTargetDetect();
}
