$.widget('ui.interactiveMaps',
{
	pathMaps: 'maps/',
	typeClick: 'click',
	currentMap: 'cis',
	levelMap: 1,
	isArea: false,
	timeoutId: null,
	dataPoints: null,
	scale: 0,

	_create: function()
	{
		// initialization
		this.element.addClass('container-maps');
		this.element.append('<div class="wraper">' +
                '<span class="name-reg">CIS</span>' +
				'<span class="arrow-back" title="Return to CIS"></span>' +
				'<span class="list-reg" title="Regions List"></span>' +
				'<div class="regions default-skin"></div>' +
			'</div>');
		this.element.append('<div class="maps"></div>');

		// event click buttun return
		this.element.find('.arrow-back').click(this, function(e)
		{
            // show list regions
            $('.list-reg').show();

			if(e.data.levelMap == 2)
			{
				e.data.currentMap = 'cis';
				e.data.levelMap = 1;
                // hide arrow-back
                $(this).fadeOut();
                e.data.element.find('.name-reg').text('CIS');
			}
			else if(e.data.levelMap == 3)
            {
                $(this).attr('title', 'Return to CIS').tooltip('close').tooltip('open');
                var title = e.data.currentMap.charAt(0).toUpperCase() + e.data.currentMap.slice(1);
                e.data.element.find('.name-reg').text(title);
            }

			e.data._loadMaps();
            e.data.scale = 0;
		});

		// event click button area and load new map
		this.element.on('click', '.regions span', this, function(e)
		{
			e.data._clickArea(this, e);
		});

		// event click area and load new map
		this.element.on(this.typeClick, '.land, .land-no-hover', this, function(e)
		{
			if(e.data.typeClick == 'dblclick')
			{
				clearTimeout(e.data.timeoutId);
				e.data.timeoutId = null;
			}

			e.data._clickArea(this, e);
		});

		// event mouseenter button region
		this.element.on('mouseenter', '.land, .regions span', this, function(e)
		{
			var regionID = $(this).attr('id');
            var $path = e.data.element.find('path[id$=-' + regionID + '], path[id=' + regionID + ']');

            if($(this).prop('tagName') == 'SPAN')
            {
                e.data.element.find('path[class$=land-hover]').removeClass('land-hover');
                $path.addClass('land-hover');
            }

            var pathSize = $path[0].getBoundingClientRect();
            if(pathSize.width < 50 && pathSize.height < 50)
                $path.css('fill', '#DC292F');
		});

		// remove allocation
		this.element.on('mouseout', '.land, .regions', this, function(e)
		{
            e.data.element.find('.land').css('fill', '');
			e.data.element.find('path[class$=land-hover]').removeClass('land-hover');
		});

		// event click button List Regions
		this.element.find('.list-reg').click(this, function(e)
		{
			e.data.element.find('.regions').toggle('slow');
		});

		// add tooltip point
		this.element.on('mouseenter', 'circle', this, function(e)
		{
			e.data.element.find('path').tooltip('close');

			var $tooltip = e.data.element.find('.tooltip-point[data-id=' + $(this).attr('data-id') + ']');

            if(!$tooltip.find('.point-image').html() && !$tooltip.find('.point-content').html())
                return;

			$tooltip.css({
				top: (e.pageY - e.data.element.offset().top) + 20,
				left: e.pageX - 130
			});
			$tooltip.fadeIn(300);
		});

		// hide tooltip point
		this.element.on('mouseout', 'circle', function()
		{
			$('.tooltip-point').fadeOut(300);
		});

		// event click point link
		this.element.find('.maps').on('click', 'a', function(e)
		{
			if($(this).attr('href') == '')
				e.preventDefault();
		});

		// add tooltip

		this.element.find('.arrow-back').tooltip(
		{
			position: { my: 'left center', at: 'right+10 center' }
		});

		this.element.find('.list-reg').tooltip(
		{
			position: { my: 'right-10 center', at: 'left center' }
		});

		// load map CIS
		this._loadMaps();
	},

	_clickArea: function(element, e)
	{
	    // hide tooltip
        $(element).tooltip('close');

	    // show arrow-back button
	    this.element.find('.arrow-back').fadeIn();
        this.element.find('.name-reg').text($(element).attr('title'));

		if(this.levelMap > 1)
		{
            // edit title arrow-back
            var title = this.currentMap.charAt(0).toUpperCase() + this.currentMap.slice(1);
            this.element.find('.arrow-back').fadeIn().attr('title' ,'Return to ' + title);

			if(this.levelMap == 3)
            {
                var regionID = this.element.find('path').eq(0).attr('id');
                var url = this.element.find('circle[data-id^=' + regionID + ']').parent().attr('href');

                // redirect
                if(url)
                    window.location = url;

                return;
            }

            // hide list regions
            $('.list-reg').hide();
            // remove allocation
            this.element.find('.land').css('fill', '');

			// remove path, circle, text, regions
			var pathId = $(element).attr('id');
			e.data.element.find('path').not('[id=' + pathId + ']').remove();
			e.data.element.find('circle, text').not('[data-id^=' + pathId + ']').remove();
			e.data.element.find('.regions').empty();

			// get data path
			var $path = e.data.element.find('#' + pathId);
			var path = $path[0].getBBox();
			var scale = (path.width > path.height) ? 1050 / path.width: 650 / path.height;

			// doing path less width or height
            while(path.width * scale >= 1050 || path.height * scale >= 650)
                scale -= 0.01;

            var x =  (path.x * scale) - (1200 - path.width * scale) / 2;
            var y =  (path.y * scale) - (800 - path.height * scale) / 2;

			// edit margin text
			var $svgText = e.data.element.find('text').each(function()
			{
				$(this).css('font-size', 11 / scale).attr({
					x: parseInt($(this).attr('x')) - 10 + 10 / scale,
					y: parseInt($(this).attr('y')) + 10 - 10 / scale
				}).hide().fadeIn(1000);
			});

			// zoom
			e.data.element.find('circle').css({'r': 5 / scale, 'stroke-width': 1 / scale}).hide().fadeIn(1000);
			e.data.element.find('path, circle, text').css({
				'-webkit-transform': 'scale(' + scale +')',
				'-ms-transform': 'scale(' + scale +')',
				'transform': 'scale(' + scale +')'
			});
            e.data.element.find('path').removeClass('land').addClass('land-no-hover')
                    .removeClass('land-hover').css({'stroke': 'none' });
			e.data.element.find('svg').attr('viewBox', x + ' ' + y + ' 1200 800');

			e.data.scale = scale;
			e.data.levelMap++;
			return;
		}
        
		e.data.currentMap = $(element).attr('title').toLowerCase();
		e.data.levelMap++;
		e.data._loadMaps();
	},

	_loadPoints: function(data)
	{
		var widget = this;
		var $maps = this.element.find('.maps');

		$.each(data, function()
		{
			// add circle
			widget._appendToSVG('circle', {
				cx: this.cx,
				cy: this.cy,
				r: 5,
				fill: this.color,
				stroke: '#fff',
				'stroke-width': 1,
				'data-id': this.id
			}, this.url);

			// add text
			widget._appendToSVG('text', {
				x: this.cx + 10,
				y: this.cy - 10,
				fill: '#fff',
				text: this.name,
				'data-id': this.id
			});

			// add tooltip
			var $tooltip = $('<div class="tooltip-point" data-id="' + this.id + '">' +
					'<div class="point-content">' + this.content + '</div>' +
				'</div>');
			if(this.image)
				$tooltip.prepend('<div class="point-image"><img src="' + this.image + '"/></div>');
			$maps.append($tooltip);
		});
	},

	_loadMaps: function()
	{
		var $maps = this.element.find('.maps');
		var $regions = this.element.find('.regions');
		var currMaps = this.currentMap;
		var widget = this;

		// load maps
		$maps.load(this.pathMaps + currMaps + '.svg', function(e)
		{
			// load points
			$.getJSON(widget.pathMaps + 'data/' + currMaps + '.json?_=' + new Date().getTime(), function(data)
			{
				if(widget.levelMap == 3)
				{
					widget._loadPoints(widget.dataPoints);
					widget.levelMap = 2;
				}
				else
				{
					widget._loadPoints(data);
					widget.dataPoints = data;
				}
			});

			// remove buttons regions
			$regions.empty();

			// add buttons regions
			$maps.find('path').each(function()
			{
				var id = $(this).attr('id');
				id = (id.length > 2) ? id.substring(3) : id;
				var title = $(this).attr('title');
				var region = '<span title="' + title + '" id="' + $(this).attr('id') + '">' + id + '</span>';
				$regions.append(region);
			});

            // add scrollbar
            $('.regions').customScrollbar({fixedThumbHeight: 50, updateOnWindowResize: true});

			// add tooltip

			$regions.find('span').tooltip(
			{
				position: { my: 'right-5 center', at: 'left center' }
			});

			$maps.find('path').tooltip(
			{
				track: true,
				position: { my: 'left+15 top+25' }
			});
		});
	},

	_appendToSVG: function(tag, attrs, url)
	{
		var el = document.createElementNS('http://www.w3.org/2000/svg', tag);

		for (var k in attrs)
		{
			if(k == 'text')
			{
				$(el).text(attrs[k]);
				continue;
			}

			el.setAttribute(k, attrs[k]);
		}

		if(tag == 'circle')
		{
			var link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
			link.setAttribute('href', url);
			//link.setAttribute('target', '_blank');
			link.appendChild(el);
			el = link;
		}

		this.element.find('svg').get(0).appendChild(el);
	}
});