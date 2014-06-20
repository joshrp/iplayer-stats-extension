
document.getElementById('btn').addEventListener('click', function () {
	var hour = $('.hour-select').val();

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		getStats().done(function (stats) {
			chrome.tabs.sendMessage(tabs[0].id, {
				stats: stats,
				hourRange: hour
			});
		});
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

var buildDaxUrl = function () {
	var url = config.daxUrl;
	params = $.extend({}, config.daxParams);

	params['customParams'] = config.customParams.map(function (param) {
		return param.name + ':' + encodeURIComponent(param.value);
	}).join('|');

	$.each(params, function (id, value) {
		url = url.replace('{' + id + '}', value);
	});

	return url;
}

var getStats = function () {
	var url = '',
		defer = $.Deferred()

	$.getJSON(url).fail(function (e) {
		console.log('Failed to fetch stats from', url)
		defer.reject(e);
	}).done(function (results) {
		var stats = {}
		$.each(results, function (i, stat) {
			stat = stat.c
			var parts = stat[0].split('_'),
				columnNum,
				rowNum

			if (parts.length == 2) {
				columnNum = parts[0];
				rowNum = parts[1];
			} else if (parts.length == 3) {
				columnNum = parts[0]
				rowNum = parts[1] + '_' + parts[2]
			}
			column = stats[columnNum] || {};
			column[rowNum] = column[rowNum] || {};
			column[rowNum][stat[1]] = stat[2];
			stats[columnNum] = column;
		});

		defer.resolve(stats);
	});

	return defer;

}
