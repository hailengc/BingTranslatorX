const rootSelector = ".__EXT_BT_ROOT__";
const containerSelector = `${rootSelector} .container`;
const loadingSelector = `${rootSelector} .loading`;

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

function updateContainerContent(childContent) {
  let result = false;
  const container = document.querySelector(containerSelector);
  if (container) {
    if (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(childContent);
    result = true;
  }

  return result;
}

function convertFromHTMLContent(htmlString) {
  const domParser = new DOMParser();
  const queryDom = domParser.parseFromString(htmlString, "text/html");
  const reuslt = queryDom.querySelector(".qdef");
  if (!reuslt) {
    return null;
  } else {
    removeNodeBySelectors(reuslt, [
      ".hd_div1",
      ".img_area",
      ".wd_div",
      ".df_div"
    ]);
    return reuslt;
  }
}

function queryAndShow(queryTarget) {
  if (queryTarget.isActive) {
    return;
  }
  queryTarget.isActive = true;

  const targetClientRect = queryTarget.targetClientRect;
  showLoading(targetClientRect);

  const queryString = queryTarget.targetString;
  chrome.runtime.sendMessage(
    { action: "query", queryString, queryTarget },
    response => {
      const htmlString = response.data;
      const queryResult = convertFromHTMLContent(htmlString);
      if (queryResult && updateContainerContent(queryResult)) {
        if (queryTarget.equalTo(lastQueryTarget)) {
          // check if is still the same queryTarget
          showContainer(targetClientRect);
        } else {
          console.log("abandom due to mismatch of queryTarget..");
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
  if (textNode && textNode.nodeType == 3) {
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

let isSelecting = false,
  enableHovering = false,
  lastQueryTarget = QueryTarget.createNullTarget();

function startSelecting(event) {
  isSelecting = true;
  hideAll();
}
document.addEventListener("mousedown", startSelecting);
document.addEventListener("selectstart", startSelecting);

document.addEventListener("mouseup", event => {
  if (isSelecting) {
    const sel = window.getSelection();
    const selectedString = sel.toString().trim();
    if (selectedString) {
      lastQueryTarget = new QueryTarget(selectedString, getSeletionCR(sel));
    } else {
      lastQueryTarget = QueryTarget.createNullTarget();
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
