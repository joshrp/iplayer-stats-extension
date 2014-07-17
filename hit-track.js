function getNewCounter() {
	return $("<div/>", {
		"class": "hit-count",
		html: $('<span class="count"/><div class="overlay"/>')
	});
}

formatHour = function (hour) {
	n = parseInt(hour).toString();
	width = 2;
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

getMaxValue = function (hours, stats) {
	var start = parseInt(hours[0], 10),
		end = parseInt(hours[1], 10),
		max = 0;

	for (columnKey in stats) {
		var column = stats[columnKey];
		for (rowKey in column) {
			var row = column[rowKey]
			if (columnKey && rowKey) {
				total = getCount(columnKey, rowKey, hours, stats);
				max = Math.max(total, max)
			}
		}
	}
	return max;
}

getCount = function (column, row, hours, stats) {
	var item = stats[column][row],
		start = parseInt(hours[0], 10),
		end = parseInt(hours[1], 10),
		totalCount = 0;

	if (item == undefined)
		return false;

	for (var i=0; i < end - start; i++) {
		index = i + start;
		totalCount += parseInt(item[formatHour(index)], 10) || 0;
	}
	return totalCount;
}

run = function ($, stats, hours) {
	var column = 1, row = 'A'
	$('.hit-count').css({opacity:1});

	var maxValue = getMaxValue(hours, stats);

	$('.stream-item').each(function (i, item) {
		$item = $(item)
		var counter = $item.find('.hit-count')
		if (counter.length == 0)
			counter = getNewCounter()

		if ($item.is('.group-item')) {
			var itemNum = 1;
			var numChildren = $item.find('.collection-list-item a').length;

			// Make sure every group has 5 items
			if (numChildren < 5) {
				children = $item.find('.collection-list-item');
				itemsNeeded = 5 - numChildren;
				newItems = children.slice(0,itemsNeeded).clone()
				newItems.find('.title, .subtitle').html('');
				newItems.find('a').attr('title','')
				$item.find('.collection-list').append(newItems);
			}

			$item.find('.collection-list-item a').each(function (j, link) {
				var counter = $(link).find('.hit-count')
				if (counter.length == 0)
					counter = getNewCounter()

				count = getCount(column, 'AB-' + itemNum, hours, stats);
				if (count === false)
					count = 'No Data'

				counter.find('.count').text(count)
				height = ((count / maxValue) * 100) + '%';
				counter.find('.overlay').css('max-height', height);

				$(link)
					.css({position:'relative'})
					.addClass(column + '-AB-' + itemNum)
					.append(counter)

				itemNum++;
			});

			$item.find('.collection-list-more a').each(function (j, link) {
				var counter = $(link).find('.hit-count')
				if (counter.length == 0)
					counter = getNewCounter()

				count = getCount(column, 'AB-ALL', hours, stats);

				counter.find('.count').text(count)
				height = ((count / maxValue) * 100) + '%';
				counter.find('.overlay').css('max-height', height);

				$(link)
					.css({position:'relative'})
					.addClass(column + '-AB-All')
					.append(counter)
			});

			row = 'A'
			column++;

		} else if ($item.is(':not(.stream-panel)')) {
			if (stats[column] === undefined || stats[column][row] === undefined) {
				return;
			}
			count = getCount(column, row, hours, stats);
			counter.find('.count').text(count)

			height = ((count / maxValue) * 100) + '%';
			counter.find('.overlay').css('max-height', height);

			$(item).css({position:'relative'});
			$item.find('a').eq(0)
				.append(counter)
				.addClass(column + '-' + row)

			if (row == 'A') {
				row = 'B'
			} else {
				row = 'A';
				column++;
			}
		}

	})

	setTimeout(function () {
		$('.hit-count').css({opacity: 1})
	}, 1)

	groups = $('.stream-item.group-item');

	groups.find('.collection-header-inner').css({top: 0})
	groups.find('.collection-gradient').css({top: 0})
		.find('.gradient-background').css({opacity:1})
	groups.find('.header-item-count').css({display: 'none'})
	groups.find('.collection-list-item a').css({opacity: 1})
	groups.find('.collection-list-container').css({top: 75})
	groups.find('.collection-list-more a').css({opacity: 1})
}

chrome.runtime.onMessage.addListener(
 	function(request, sender, sendResponse) {
		run(jQuery, request.stats, request.hourRange)
  	}
);
