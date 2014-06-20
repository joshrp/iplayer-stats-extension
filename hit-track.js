function getNewCounter() {
	return $("<div/>", {
		"class": "hit-count",
		html: $('<span class="count"/>')
	});
}

formatHour = function (hour) {
	n = parseInt(hour).toString();
	width = 2;
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
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

				count = getCount(column, 'AB_' + itemNum, hours, stats);
				if (count === false)
					count = 'No Data'
				counter.find('.count').text(count)

				$(link)
					.css({position:'relative'})
					.addClass(column + '_AB_' + itemNum)
					.append(counter)

				itemNum++;
			});

			row = 'A'
			column++;

		} else if ($item.is(':not(.stream-endpanel)')) {
			if (stats[column] === undefined || stats[column][row] === undefined) {
				return;
			}

			counter.find('.count').text(getCount(column, row, hours, stats))
			$(item).css({position:'relative'});
			$item.find('a').eq(0)
				.append(counter)
				.addClass(column + '_' + row)

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
}

chrome.runtime.onMessage.addListener(
 	function(request, sender, sendResponse) {
		run(jQuery, request.stats, request.hourRange)
  	}
);
