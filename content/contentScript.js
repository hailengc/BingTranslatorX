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

    const extensionContent = document.querySelector(".__EXT_BT__");
    if (extensionContent) {
      if (extensionContent.firstChild) {
        extensionContent.removeChild(extensionContent.firstChild);
      }
      extensionContent.appendChild(queryContentNode);
      // extensionContent.style.left = targetClientRect.left + "px";
      extensionContent.style.top = targetClientRect.bottom + "px";

      const docWidth = document.body.clientWidth;
      const extWidth = extensionContent.clientWidth;
      const offset = targetClientRect.left + extWidth - docWidth;
      if (offset > 0) {
        extensionContent.style.left = targetClientRect.left - offset + "px";
      } else {
        extensionContent.style.left = targetClientRect.left + "px";
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
      }
    }

    selection.empty();
  }
});
