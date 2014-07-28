var statsCache = {
	fetched: 0,
	data: {}
};
document.getElementsByClassName('show-btn')[0].addEventListener('click', function () {
	var hour = $('.hour-select').val();

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		getStats(tabs[0].url).done(function (stats) {
			chrome.tabs.sendMessage(tabs[0].id, {
				event: 'show-stats',
				data: {
					stats: stats,
					hourRange: hour
				}
			});
		});
	});
});

document.getElementsByClassName('clear-btn')[0].addEventListener('click', function () {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {
			event: 'clear-stats'
		})
	});
});

var slider = $('.hour-select').noUiSlider({
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

var getStatsUrlForPage = function(currentUrl) {
	currentPath = currentUrl.replace(/https?:\/\/[^\/]+/, '');
	categoryMatches = currentPath.match(/\/iplayer\/categories\/([\w\-]+)\/highlights/)
	channelMatches = currentPath.match(/\/((iplayer|tv)\/)?(cbbc|bbc\w+|cbeebies)$/)
	if (categoryMatches) {
		return 'category-stream-' + categoryMatches[1];
	} else if (channelMatches) {
		return 'channels-stream-' + (channelMatches.length == 4 ? channelMatches[3] : channelMatches[2]);
	} else {
		return 'homepage-stream';
	}
}

var getStats = function (url) {
	var url = 'http://192.168.192.10:9615/stats/' + getStatsUrlForPage(url),
		defer = $.Deferred()

	initLoading();

	$.getJSON(url).fail(function (e) {
		console.log('Failed to fetch stats from', url)
		defer.reject(e);
	}).done(function (results, status, jqXHR) {
		var stats = {}
		var maxVal = 0;

		if (jqXHR.status === 204) {
			$('.notReady').show();
		}

		$.each(results, function (i, stat) {
			 Math.max(stat.c[2], maxVal);

		});
		$.each(results, function (i, stat) {
			var stat = stat.c,
				parts = stat[0].split(/[_\-]/),
				columnNum,
				rowNum

			if (stat[0] == 'Total') {
				return;
			}
			if (parts.length == 2) {
				columnNum = parts[0];
				rowNum = parts[1];
			} else if (parts.length == 3) {
				columnNum = parts[0]
				rowNum = parts[1] + '-' + parts[2];
			}

			column = stats[columnNum] || {};
			column[rowNum] = column[rowNum] || {};
			column[rowNum][stat[1]] = stat[2];
			stats[columnNum] = column;

		});

		defer.resolve(stats);
	}).always(function () {
		endLoading();
	})

	return defer;

}

var initLoading = function () {
	$('.notReady').hide();
}

var endLoading = function () {

}
