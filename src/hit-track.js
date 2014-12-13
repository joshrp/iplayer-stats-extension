/* global jQuery, chrome, console */
/* jshint globalstrict: true */

'use strict';
(function ($) {
	function getNewCounter() {
		return $('<div/>', {
			'class': 'hit-count',
			html: $('<span class="count"/><div class="overlay"/>')
		});
	}

	var formatHour = function (hour) {
		var n = parseInt(hour).toString(),
			width = 2;

		return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
	},
	getMaxValue = function (hours, stats) {
		var max = 0;
		for (var pos in stats) {
			max = Math.max(getCount(stats[pos], hours), max);
 		}
		return max;
	},
	getCount = function (stats, hours) {
		var start = hours[0],
			end = hours[1],
			totalCount = 0;

		for (var i=0; i < end - start; i++) {
			var index = i + start;
			totalCount += parseInt(stats[formatHour(index)], 10) || 0;
		}
		return totalCount;
	},
	run = function ($, stats, hours) {
		$('.hit-count').css({opacity:1});

		var maxValue = getMaxValue(hours, stats);

		// Give every item a "No Data" overlay
		$('[data-object-position]').each(function (i, item) {
			var counter = $(item).find('.hit-count');
			if (counter.length === 0)
				counter = getNewCounter();
			counter.find('.count').text('No Data');
			$(item).append(counter);
		})

		/* Find every item with some data and set it up; */;
		$.each(stats, function (pos) {
			var item = $('[data-object-position="'+pos+'"]'),
				count = getCount(stats[pos], hours),
				counter = item.find('.hit-count'),
				height = ((count / maxValue) * 100) + '%';
			
			if (item.length === 0) {
				return;
			}
			
			counter.find('.count').text(count);
			counter.find('.overlay').css('max-height', height);
		});

		setTimeout(function () {
			$('.hit-count').css({opacity: 1});
		}, 200);

		hideItems = new UnhideItems();
	},

	hideItems,
	UnhideItems = function () {
		var items = {
				'.collection-header-inner': {
					top: 0
				},
				'.gradient-background': {
					opacity: 1
				},
				'.collection-gradient': {
					top: 0
				},
				'.collection-list-item a':{
					opacity: 1
				},
				'.collection-list-container':{
					top: 75
				},
				'.collection-list-more a':{
					opacity: 1
				},
				'.header-item-count': {
					display: 'none'
				}
			},
			groups = $('.stream-item.group-item'),
			itemDefaults = {};

		for (var css in items) {
			var properties = items[css];
			itemDefaults[css] = {};
			for (var property in properties) {
				itemDefaults[css][property] = groups.find(css).eq(0).css(property);
			}
			groups.find(css).css(properties);
		}

		return function () {
			for (css in itemDefaults) {
				groups.find(css).css(itemDefaults[css]);
			}
		};
	},
	clearStats = function ($) {
		setTimeout(function () {
			$('.hit-count').remove();
		},100);
		hideItems();
	};

	chrome.runtime.onMessage.addListener(
		function(request) {
			if (request.event == 'show-stats') {
				try {
					var hours = [
						parseInt(request.data.hourRange[0], 10),
						parseInt(request.data.hourRange[1], 10)
					];
					run($, request.data.stats, hours);
				} catch (e) {
					console.error('Something went wrong showing stats');
					console.error(e.stack);
				}
			} else if (request.event == 'clear-stats') {
				clearStats($);
			}
		}
	);

})(jQuery);