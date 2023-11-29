
const url = new URL(location.href)
const fileName = url.pathname.substring(1).split('.')[0]
console.log("[hook]: hook.js", fileName)
const ext = chrome.extension
const URLS = {
  md5: chrome.runtime.getURL(`utils/md5.js`),
  login: chrome.runtime.getURL(`hook/login.js`),
  search: chrome.runtime.getURL(`hook/search.js`),
  player: chrome.runtime.getURL(`hook/player.js`),
  biliapp: chrome.runtime.getURL(`hook/biliapp.js`),
  commonJS: chrome.runtime.getURL(`hook/common.js`),
  commonCSS: chrome.runtime.getURL(`hook/common.css`),
  RoamingPage: chrome.runtime.getURL(`hook/RoamingPage.html`),
  PlayerEnhance: chrome.runtime.getURL(`hook/PlayerEnhance.html`),
}

var commonJS = document.createElement('script');
commonJS.src = URLS.commonJS;
(document.head || document.documentElement).appendChild(commonJS);
// commonJS.onload = function () {
//   commonJS.remove();
// };
var md5JS = document.createElement('script');
md5JS.src = URLS.md5;
(document.head || document.documentElement).appendChild(md5JS);
// md5JS.onload = function () {
//   md5JS.remove();
// };

// Event listener
document.addEventListener('ROAMING_getURL', function (e) {
  // e.detail contains the transferred data (can be anything, ranging
  // from JavaScript objects to strings).
  // Do something, for example:
  console.log('hook ROAMING_getURL:', e.detail);
  let data = null
  switch (e.detail) {
    case 'URLS':
      data = URLS
      break;
    default:
      data = URLS[e.detail];
      break
  }
  document.dispatchEvent(new CustomEvent('ROAMING_sendURL', {
    detail: data
  }));
});

