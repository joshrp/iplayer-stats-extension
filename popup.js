
document.getElementById('btn').addEventListener('click', function () {
	console.log('clicked btn')
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {});
	});
});
