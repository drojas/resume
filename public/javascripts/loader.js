var referrer = document.referrer.split('/')[2];
var domain = document.URL.split('/')[2];
var wrapper = $('#wrapper');
var loading = $('#loading');

loading.on('end', function(){
	loading.remove();
	$('body').trigger('loaded');
});

if (referrer !== domain) {

	var path = $('<small/>', {
		'id': 'path',
		'html': window.location.pathname === '/'? '/resume': window.location.pathname
	}).appendTo(loading);

	var hash = $('<small/>', {
		'id': 'hash',
		'html': window.location.hash
	}).appendTo(loading);

	loading.position({
	    my: "center",
	    at: "center",
	    of: $(document),
	    collision: "flipfit"
	});
	loading.fadeIn(600);

	$(window).load(function(){
		loading.fadeOut(600, function(){
			wrapper.fadeIn(300, function(){
				loading.trigger('end');
			});
		});
	});
} else {

	$(document).ready(function(){
		wrapper.show();
		loading.trigger('end');
	});
}