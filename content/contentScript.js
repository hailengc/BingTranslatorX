function removeNodeBySelectors(parentNode, selectorList) {
  selectorList.forEach(selector => {
    const node = parentNode.querySelector(selector);
    node && node.remove();
  });
}

function shouldDoQuery(queryString) {
  return queryString !== currentQueryString;
}

function doQuery(queryString) {
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
      isShowing = true;
    }
  });
}

let selectedString = null,
  currentQueryString = null;
let isShowing = false;

document.addEventListener("mouseup", event => {
  if (selectedString) {
    doQuery(selectedString);
  }
});

document.addEventListener("selectionchange", event => {
  const selection = document.getSelection();
  selectedString = selection.toString().trim();
});

document.addEventListener("mousemove", event => {
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
    console.log(selection.toString().trim());
    const qstr = selection.toString().trim();
    if (qstr) {
      doQuery(qstr);
    }
    range.detach();
    selection.empty();
  }
});
