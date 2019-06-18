function removeNodeBySelectors(parentNode, selectorList) {
  selectorList.forEach(selector => {
    const node = parentNode.querySelector(selector);
    node && node.remove();
  });
}

function isStringValid(str) {
  return str !== null && str.length > 0;
}

function shouldDoQuery(queryString) {
  return queryString !== currentQueryString;
}

function inRect(rect, x, y) {
  return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
}

function showElement(selector) {
  const element = document.querySelector(selector);
  element.style.display = "block";
}

function hideElement(selector) {
  const element = document.querySelector(selector);
  element.style.display = "none";
}

function isValidTextNode(textNode) {
  if (!textNode || textNode.nodeType != Node.TEXT_NODE) {
    return false;
  }

  const content = textNode.textContent;
  if (!content) {
    return false;
  } else if (content == "\u200B") {
    return false;
  }
  return true;
}

function isNil(value) {
  return value === undefined || value === null;
}
