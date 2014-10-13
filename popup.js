// Clicking "Show" button
document.getElementsByClassName('show-btn')[0].addEventListener('click', function () {
	var hour = $('.hour-select').val();

	// Get active Tab
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		try {
			fillStats(tabs[0].url).done(function (stats) {
				chrome.tabs.sendMessage(tabs[0].id, {
					event: 'show-stats',
					data: {
						stats: stats,
						hourRange: hour
					}
				});
			});
		} catch(e) {
			console.log('Got error!', e)
			console.log(e.stack)
			throw e;
		}
	});
});

// Clicking "Clear" Button
document.getElementsByClassName('clear-btn')[0].addEventListener('click', function () {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {
			event: 'clear-stats'
		})
	});
});


var statsHost = 'http:/dax-stats.sandbox.co.uk',
	slider = $('.hour-select').noUiSlider({
		start: [0, 24],
		connect: false,
		range: {
			'min': 0,
			'max': 24
		},
		step: 1
	}).on('slide change', function () {
		var slider = $(this),
			lower =$('.hour-value-lower'),
			upper = $('.hour-value-upper')

		vals = slider.val();

		chrome.storage.sync.set({
			'hourRange': vals
		});

		lower.html((parseInt(vals[0], 10)) + ':00');
		upper.html((parseInt(vals[1], 10)) + ':00');
	});

chrome.storage.sync.get('hourRange', function (values) {
	slider.val(values.hourRange).trigger('slide');
})

$('.time-windows .btn').click(function () {
	var me = $(this),
		hours = [];
	switch (me.attr('data-window')) {
		case 'all':
			hours = [0, 24]
			break;
		case 'early':
			hours = [0, 6]
			break;

		case 'morning':
			hours = [6, 13]
			break;

		case 'afternoon':
			hours = [13, 17]
			break;

		case 'evening':
			hours = [17, 24]
			break;
	}

	slider.val(hours).trigger('change')
});

var statsHelper = window.statsHelpers();

var fillStats = function (url) {
	initLoading();
	var defer = $.Deferred();

	return statsHelper.getStats(url, {}).then(function (data) {
		if (data.stats === false) {
			$('.notReady').show();
		}
		endLoading();
		return data.data;
	});
}

var initLoading = function () {
	$('.notReady').hide();
}

var endLoading = function () {

}
