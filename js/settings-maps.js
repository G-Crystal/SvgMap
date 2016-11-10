$.widget('ui.settingsMaps', $.ui.interactiveMaps,
{
	currentArea: '',
	pointX: 0,
	pointY: 0,
	pointID: null,

	_create: function()
	{
		this.typeClick = 'dblclick';
		this._super();

        // add button download
		this.element.find('.wraper').append('<a><span class="download" title="Download"></span></a>');

        // event click buttun return
        this.element.find('.arrow-back').click(this, function(e)
        {
            if(e.data.levelMap == 1)
                e.data.element.find('.download').fadeOut();
           else if(e.data.levelMap == 3)
                e.data.element.find('.download').fadeIn();
        });

        // event click buttun download
        this.element.find('.download').click(this, function(e)
        {
            var fileData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(e.data.dataPoints)); //'data:text/json;charset=UTF-8,' + JSON.stringify(e.data.dataPoints);
            $(this).parent().attr('href', fileData).attr('download', e.data.currentMap + '.json');
        });

		// event click area
		this.element.on('click', '.land, .land-no-hover', this, function(e)
		{
            if(e.data.levelMap == 1)
                return;

			if (!e.data.timeoutId)
				e.data.timeoutId = setTimeout(function()
				{
                    e = e || window.event;
					e.data.timeoutId = null;

                    var maps = e.data.element.get(0).getBoundingClientRect();
                    e.data.pointX = e.clientX - maps.left;
                    e.data.pointY = e.clientY - maps.top;

					e.data.element.find('path').tooltip('close');
					$('.form-settings .add-point').show();
					$('.form-settings .edit-point, .form-settings .delete-point').hide();
					$('.wrap-settings').fadeIn(300);
				}, 300);
		});

        // event dblclick area
        this.element.on('dblclick', '.land, .land-no-hover', this, function(e)
        {
            if(e.data.levelMap == 2)
                e.data.element.find('.download').fadeIn();
            else if(e.data.levelMap == 3)
                e.data.element.find('.download').fadeOut();
        });

		// event mouseenter area
		this.element.on('mouseenter', 'path', this, function(e)
		{
			e.data.currentArea = $(this).attr('id');
		});

		// event click point
		this.element.on('click', '.maps circle', this, function(e)
		{
			e.preventDefault();
			$('.form-settings .add-point').hide();
			$('.form-settings .edit-point, .form-settings .delete-point').show();
			$('.wrap-settings').fadeIn(300);

			// get data point
			e.data.pointID = $(this).attr('data-id');
			var pointJSON = $.grep(e.data.dataPoints, function(d){ return d.id == e.data.pointID; })[0];

			$('.wrap-settings input[name=name]').val(pointJSON.name);
			$('.wrap-settings input[name=color]').val(pointJSON.color);
			$('.wrap-settings input[name=url]').val(pointJSON.url);
			$('.wrap-settings textarea').val(pointJSON.content);
			$('.wrap-settings input[name=image]').val(pointJSON.image);
		});

		// event close form
		$('.close-form').click(function()
		{
			$('.wrap-settings').fadeOut(300);
            $('.wrap-settings input, .wrap-settings textarea').not('input[name=color]').val('');
		});

		// add point and data
		$('.form-settings .add-point').click(this, function(e)
		{
			$('.wrap-settings').fadeOut(300);
            var date = new Date();

			// create json data
			var json = [{
				id:  e.data.currentArea + '-' + date.getTime(),
				name: $('.wrap-settings input[name=name]').val().trim(),
				color: $('.wrap-settings input[name=color]').val().trim(),
				url: $('.wrap-settings input[name=url]').val().trim(),
				content: $('.wrap-settings textarea').val().trim().replace('"', "'"),
				image: $('.wrap-settings input[name=image]').val().trim(),
				cx: e.data.pointX,
				cy: e.data.pointY
			}];

			var copyJSON = Object.assign({}, json[0]);
            var scale = 1200 / e.data.element.outerWidth();

            // zoom
			if(e.data.scale != 0)
			{
                var viewBox = e.data.element.find('svg').attr('viewBox').split(' ');
				json[0].cx = json[0].cx * scale + parseFloat(viewBox[0]);
				json[0].cy = json[0].cy * scale + parseFloat(viewBox[1]);
                copyJSON.cx =  json[0].cx / e.data.scale;
                copyJSON.cy =  json[0].cy / e.data.scale;
			}
			else
            {
                copyJSON.cx = json[0].cx *= scale;
                copyJSON.cy = json[0].cy *= scale;
            }

			// add point
			e.data.dataPoints.push(copyJSON);
			e.data._loadPoints(json);

			$('.wrap-settings input, .wrap-settings textarea').not('input[name=color]').val('');
		});

		// edit point
		$('.form-settings .edit-point').click(this, function(e)
		{
			// get data
			var editPoint = $.grep(e.data.dataPoints, function(d){ return d.id == e.data.pointID; })[0];
			editPoint.name = $('.wrap-settings input[name=name]').val().trim();
			editPoint.color = $('.wrap-settings input[name=color]').val().trim();
			editPoint.url = $('.wrap-settings input[name=url]').val().trim();
			editPoint.content = $('.wrap-settings textarea').val().trim().replace('"', "'");
			editPoint.image = $('.wrap-settings input[name=image]').val().trim();

			// edit data point from map
			e.data.element.find('.maps text[data-id=' + e.data.pointID + ']').text(editPoint.name);
			e.data.element.find('.maps circle[data-id=' + e.data.pointID + ']')
				.attr('fill', editPoint.color).parent().attr('href', editPoint.url);

			// edit tooltip
			var $tooltip = e.data.element.find('.maps div[data-id=' + e.data.pointID + ']');
			$tooltip.find('.point-content').html(editPoint.content);
			$tooltip.find('.point-image').remove();
			if(editPoint.image)
                $tooltip.prepend('<div class="point-image"><img src="' + editPoint.image + '"/></div>');

			$('.wrap-settings').fadeOut(300);
            $('.wrap-settings input, .wrap-settings textarea').not('input[name=color]').val('');
		});

		// delete point
		$('.form-settings .delete-point').click(this, function(e)
		{
			if(confirm('Are you sure you want to remove a point?'))
			{
				// remove point from map
				e.data.element.find('circle[data-id=' + e.data.pointID + ']').parent().remove();
				e.data.element.find('[data-id=' + e.data.pointID + ']').remove();

				// remove point from array
				var removePoint = $.grep(e.data.dataPoints, function(d){ return d.id == e.data.pointID; })[0];
				e.data.dataPoints.splice($.inArray(removePoint, e.data.dataPoints), 1);

				$('.wrap-settings').fadeOut(300);
                $('.wrap-settings input, .wrap-settings textarea').not('input[name=color]').val('');
			}
		});

        // add tooltip
        this.element.find('.download').tooltip(
        {
            position: { my: 'left center', at: 'right+10 center' }
        });

	}

});