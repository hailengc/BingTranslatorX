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
