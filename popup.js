
document.getElementById('btn').addEventListener('click', function () {
  chrome.tabs.insertCSS(null, {file: "main.css"});
  chrome.tabs.executeScript(null, {file: "hit-track.js"});
});
