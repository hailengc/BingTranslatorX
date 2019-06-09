const extRootElement = document.createElement("div");
extRootElement.classList.add("__EXT_BT_ROOT__");

const containerDomElement = document.createElement("div");
containerDomElement.classList.add("__EXT_BT_CONTAINER__");
containerDomElement.style.display = "none";
extRootElement.appendChild(containerDomElement);

const loadingDomElement = document.createElement("div");
loadingDomElement.classList.add("__EXT_BT_LOADING__");
loadingDomElement.style.display = "none";
extRootElement.appendChild(loadingDomElement);

document.body.appendChild(extRootElement);
