function removeNodeBySelectors(parentNode, selectorList) {
  selectorList.forEach((selector) => {
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

function getTextContent(node) {
  try {
    return node.textContent;
  } catch (error) {
    return null;
  }
}

function getInnerHTML(node) {
  try {
    return node.innerHTML;
  } catch (error) {
    return null;
  }
}

function fetchExtSetting() {
  return new Promise((res, rej) => {
    chrome.storage.local.get(null, (result) => {
      res(result);
    });
  });
}

function logTime(prefix) {
  const d = new Date();
  console.log(
    `${prefix}, at: ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} ${d.getMilliseconds()}`
  );
}

// const audioBanList = [
//   "https://rmpdhdsnappytv-vh.akamaihd.net",
//   "https://prod-video-eu-central-1.pscp.tv",
//   "https://prod-video-ap-south-1.pscp.tv",
//   "https://v.cdn.vine.co",
//   "https://dwo3ckksxlb0v.cloudfront.net",
//   "https://twitter.com",
//   "https://prod-video-us-east-2.pscp.tv",
//   "https://prod-video-cn-north-1.pscp.tv",
//   "https://amp.twimg.com",
//   "https://smmdhdsnappytv-vh.akamaihd.net",
//   "https://*.twimg.com",
//   "https://prod-video-eu-west-1.pscp.tv",
//   "https://*.video.pscp.tv",
//   "https://rmmdhdsnappytv-vh.akamaihd.net",
//   "https://clips-media-assets.twitch.tv",
//   "https://prod-video-ap-northeast-2.pscp.tv",
//   "https://prod-video-us-west-2.pscp.tv",
//   "https://prod-video-us-west-1.pscp.tv",
//   "https://prod-video-ap-northeast-1.pscp.tv",
//   "https://smdhdsnappytv-vh.akamaihd.net",
//   "https://ton.twitter.com",
//   "https://prod-video-eu-west-3.pscp.tv",
//   "https://rmdhdsnappytv-vh.akamaihd.net",
//   "https://mmdhdsnappytv-vh.akamaihd.net",
//   "https://prod-video-ca-central-1.pscp.tv",
//   "https://smpdhdsnappytv-vh.akamaihd.net",
//   "https://prod-video-sa-east-1.pscp.tv",
//   "https://mdhdsnappytv-vh.akamaihd.net",
//   "https://prod-video-ap-southeast-2.pscp.tv",
//   "https://mtc.cdn.vine.co",
//   "https://prod-video-cn-northwest-1.pscp.tv",
//   "https://prod-video-eu-west-2.pscp.tv",
//   "https://canary-video-us-east-1.pscp.tv",
//   "https://dev-video-us-west-2.pscp.tv",
//   "https://prod-video-us-east-1.pscp.tv",
//   "https://prod-video-ap-northeast-3.pscp.tv",
//   "https://prod-video-ap-southeast-1.pscp.tv",
//   "https://mpdhdsnappytv-vh.akamaihd.net",
//   "https://dev-video-eu-west-1.pscp.tv",
// ];

const audioBanList = [];
