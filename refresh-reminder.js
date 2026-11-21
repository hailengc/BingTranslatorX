document.documentElement.lang = chrome.i18n.getUILanguage();
document.querySelectorAll("[data-i18n]").forEach((node) => {
  node.textContent = chrome.i18n.getMessage(node.dataset.i18n);
});

document.querySelector("button").addEventListener("click", () => window.close());
