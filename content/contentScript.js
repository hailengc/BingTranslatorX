const EXT_BT_SELECTOR = ".__EXT_BT__";

function removeNodeBySelectors(parentNode, selectorList) {
  selectorList.forEach(selector => {
    const node = parentNode.querySelector(selector);
    node && node.remove();
  });
}

function shouldDoQuery(queryString) {
  return queryString !== currentQueryString;
}

function isStringValid(str) {
  return str !== null && str.length > 0;
}

// get selection's range client rect
function getSeletionCR(selection) {
  return selection.getRangeAt(0).getBoundingClientRect();
}

function hasValidSelection() {
  return isStringValid(window.getSelection().toString());
}

function inRect(rect, x, y) {
  return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
}

function showExtensionContainer() {
  const extContainer = document.querySelector(EXT_BT_SELECTOR);
  extContainer.style.display = "block";
}

function hideExtensionContainer() {
  const extContainer = document.querySelector(EXT_BT_SELECTOR);
  extContainer.style.display = "none";
  currentQueryString = "";
}

function queryAndShow(queryString, targetClientRect) {
  if (!shouldDoQuery(queryString)) {
    return;
  }

  currentQueryString = queryString;
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

    const extensionContent = document.querySelector(EXT_BT_SELECTOR);
    if (extensionContent) {
      if (extensionContent.firstChild) {
        extensionContent.removeChild(extensionContent.firstChild);
      }
      showExtensionContainer();
      extensionContent.appendChild(queryContentNode);
      // extensionContent.style.left = targetClientRect.left + "px";
      // extensionContent.style.top = targetClientRect.bottom + "px";

      const docWidth = document.body.clientWidth;
      const windowHeight = window.innerHeight;
      const extWidth = extensionContent.clientWidth;
      const extHeight = extensionContent.clientHeight;

      const horizontalOffset = targetClientRect.left + extWidth - docWidth;
      if (horizontalOffset > 0) {
        console.log(".... horizontalOffset " + horizontalOffset);
        extensionContent.style.left =
          targetClientRect.left - horizontalOffset + "px";
      } else {
        extensionContent.style.left = targetClientRect.left + "px";
      }

      const verticalOffset = targetClientRect.bottom + extHeight - windowHeight;
      if (verticalOffset > 0) {
        extensionContent.style.top = targetClientRect.top - extHeight + "px";
        console.log(" ... vertial offset ..." + verticalOffset);
      } else {
        extensionContent.style.top = targetClientRect.bottom + "px";
      }
    }
  });
}

let currentQueryString = null,
  isSelecting = false;

document.addEventListener("mouseup", event => {
  console.log("... mouseup...");

  if (isSelecting) {
    const sel = window.getSelection();
    const selectedString = sel.toString().trim();

    if (selectedString) {
      queryAndShow(selectedString, getSeletionCR(sel));
    } else {
      hideExtensionContainer();
    }
  }

  isSelecting = false;
});

document.addEventListener("selectstart", event => {
  console.log(".... selection start ...");
  isSelecting = true;
});

document.addEventListener("selectionchange", event => {});

document.addEventListener("mousemove", event => {
  if (isSelecting || hasValidSelection()) {
    console.log("... sking hovering query...");
    return;
  }

  console.log("... mouse moving ...");

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

  if (textNode && textNode.nodeType == 3) {
    const selection = window.getSelection();
    selection.empty();
    selection.addRange(range);
    selection.modify("move", "backward", "word");
    selection.modify("extend", "forward", "word");
    const slectionRange = selection.getRangeAt(0);
    const rect = slectionRange.getBoundingClientRect();

    if (inRect(rect, event.clientX, event.clientY)) {
      const qstr = selection.toString().trim();
      if (qstr) {
        queryAndShow(qstr, getSeletionCR(selection));
      } else {
        hideExtensionContainer();
      }
    } else {
      hideExtensionContainer();
    }

    selection.empty();
  }
});
