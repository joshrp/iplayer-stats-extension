var statsHelper = window.statsHelpers();

(function($, statsHelper) {

	statsHelper.getStatus().done(function (status) {
		console.log('got status');
		console.log(status.date, moment(status.date * 1000))
		var currentDate = moment(status.date * 1000);
		$('.currentDate').html(currentDate.format('ddd Do MMM'))
	});

	function Popup () {
		var that = this;
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			that.currentTab = tabs[0];
			info = statsHelper.getPageInfo(that.currentTab.url);
			info.name = info.id
						.replace(/^bbc/, 'BBC ')
						.replace(/\-/g,' ')
						.replace(/(\s+\w|^\w)/g, function (txt) {
							return txt.charAt(0).toUpperCase();
						});
			$('.currentPage').html(info.name)

			that.init();
		});
	}

	Popup.prototype.bindEvents = function () {
		var that = this;
		// Clicking "Show" button
		document.getElementsByClassName('show-btn')[0].addEventListener('click', function () {
			var hour = $('.hour-select').val();

			// Get active Tab
			try {
				fillStats(that.currentTab.url).done(function (data) {
					console.log('sending stats', data);
					chrome.tabs.sendMessage(that.currentTab.id, {
						event: 'show-stats',
						data: {
							stats: data.stats,
							hourRange: hour,
							date: data.date
						}
					});
				});
			} catch(e) {
				console.log('Got error!', e)
				console.log(e.stack)
				throw e;
			}
		});

		// Clicking "Clear" Button
		document.getElementsByClassName('clear-btn')[0].addEventListener('click', function () {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					event: 'clear-stats'
				})
			});
		});
	}

	Popup.prototype.init = function () {
		var that = this;
		that.bindEvents();

		that.slider = $('.hour-select').noUiSlider({
			start: [0, 24],
			connect: false,
			range: {
				'min': 0,
				'max': 24
			},
			step: 1
		}).on('slide change', function () {
			var lower =$('.hour-value-lower'),
				upper = $('.hour-value-upper')

			vals = that.slider.val();

			chrome.storage.sync.set({
				'hourRange': vals
			});

			lower.html((parseInt(vals[0], 10)) + ':00');
			upper.html((parseInt(vals[1], 10)) + ':00');
		});


		chrome.storage.sync.get('hourRange', function (values) {
			that.slider.val(values.hourRange).trigger('slide');
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

			that.slider.val(hours).trigger('change')
		});
	}

	var fillStats = function (url) {

		initLoading();
		var defer = $.Deferred();

		statsHelper.getStats(url, {}).then(function (data) {
			if (data === false) {
				$('.notReady').show();
				defer.reject();
			}
			endLoading();
			defer.resolve(data);
		});
		return defer;
	}

	var initLoading = function () {
		$('.notReady').hide();
	}

	var endLoading = function () {

	}

	popup = new Popup();
})(jQuery, statsHelper)