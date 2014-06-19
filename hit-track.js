function getCounter() {
	return $("<div/>", {
		"class": "hit-count",
		html: $('<span class="count"/>')
	});
}

run = function ($) {
	var column = 1, row = 'A'
	$('.stream-item').each(function (i, item) {
		$item = $(item)

		if ($item.is('.group-item')) {
			var itemNum = 1;
			$item.find('.collection-list-item a').each(function (j, link) {
				counter = getCounter()
				counter.find('.count').text(column + '_AB_' + itemNum)

				$(link)
					.css({position:'relative'})
					.addClass(column + '_AB_' + itemNum)
					.append(counter)

				itemNum++;
			});

			row = 'A'
			column++;

		} else {
			counter = getCounter();
			counter.find('.count').text(column + '_' + row)
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
		console.log(sender.tab ?
				"from a content script:" + sender.tab.url :
				"from the extension");
		run(jQuery)
  	}
);
