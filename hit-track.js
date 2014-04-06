function getCounter() {
	return $("<div/>", {
		"class": "hit-count",
		html: $('<span class="count"/>')
	});
}


run = function ($) {
	console.log($('.stream-item'))
	$('.stream-item').each(function (i, item) {
		$item = $(item)

		if ($item.is('.group-item')) {
			$item.find('.collection-list-item a').each(function (j, link) {
				counter = getCounter()
				counter.find('.count').text(i + '-' + j)

				$(link)
					.css({position:'relative'})
					.append(counter)

			});
		} else {
			counter = getCounter()
			counter.find('.count').text(i)
			$(item).css({position:'relative'});
			$item.find('a').eq(0).append(counter)
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
run(jQuery)