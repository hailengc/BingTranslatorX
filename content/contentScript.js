const rootSelector = ".__EXT_BT_ROOT__";
const containerSelector = ".__EXT_BT_CONTAINER__";
const loadingSelector = ".__EXT_BT_LOADING__";

// get selection range client rect
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

function hideRoot() {
  hideElement(rootSelector);
}

function showLoading(targetClientRect = null) {
  showElement(loadingSelector);
  if (targetClientRect) {
    adjustPostion(loadingSelector, targetClientRect);
  }
  hideElement(containerSelector);
  showRoot();
}

function showContainer(targetClientRect = null) {
  showElement(containerSelector);
  if (targetClientRect) {
    adjustPostion(containerSelector, targetClientRect);
  }
  hideElement(loadingSelector);
  showRoot();
}

function adjustPostion(selector, targetClientRect) {
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

function queryAndShow(queryTarget) {
  if (queryTarget.isActive) {
    return;
  }

  queryTarget.isActive = true;
  const queryString = queryTarget.targetString;
  const targetClientRect = queryTarget.targetClientRect;
  showLoading(targetClientRect);
  chrome.runtime.sendMessage({ action: "query", queryString }, htmlString => {
    const domParser = new DOMParser();
    const queryDom = domParser.parseFromString(htmlString, "text/html");
    const queryContentNode = queryDom.querySelector(".qdef");
    if (!queryContentNode) {
      return;
    }

    removeNodeBySelectors(queryContentNode, [
      ".hd_div1",
      ".img_area",
      ".wd_div",
      ".df_div"
    ]);

    const extensionContent = document.querySelector(containerSelector);
    if (extensionContent) {
      if (extensionContent.firstChild) {
        extensionContent.removeChild(extensionContent.firstChild);
      }
      extensionContent.appendChild(queryContentNode);
      showContainer(targetClientRect);
    }
  });
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
    selection.modify("move", "backward", "word");
    selection.collapseToStart();
    selection.modify("extend", "forward", "word");
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
  lastQueryTarget = QueryTarget.createNullTarget();

document.addEventListener("selectstart", event => {
  isSelecting = true;
});

document.addEventListener("mouseup", event => {
  console.log("... mouseup...");

  if (isSelecting) {
    const sel = window.getSelection();
    const selectedString = sel.toString().trim();

    if (selectedString) {
      // queryAndShow(selectedString, getSeletionCR(sel));
      lastQueryTarget = new QueryTarget(selectedString, getSeletionCR(sel));
    } else {
      lastQueryTarget = QueryTarget.createNullTarget();
    }
  }

  isSelecting = false;
});

document.addEventListener("selectionchange", event => {});

document.addEventListener("mousemove", event => {
  if (isSelecting || hasValidSelection()) {
    console.log("... sking hovering  for existing selection...");
    return;
  }

  const queryTarget = getQueryTargetByHovering();

  if (!queryTarget.equalTo(lastQueryTarget)) {
    // update hovering target
    lastQueryTarget = queryTarget;
  }
});

const CHECK_INTERVAL = 20;
const VALID_HOVERING_TIME = 300;
let queryTargetDetectInterval = null;

function enableQueryTargetDetect() {
  queryTargetDetectInterval =
    queryTargetDetectInterval ||
    setInterval(() => {
      if (isSelecting) {
        // do nothing while selecting
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
          hideRoot();
        }
      }
    }, CHECK_INTERVAL);
}

function disableQueryTargetDetect() {
  window.clearInterval(queryTargetDetectInterval);
  queryTargetDetectInterval = null;
}

enableQueryTargetDetect();
