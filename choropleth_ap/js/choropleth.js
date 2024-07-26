var width = 1440, // размер svg элемента
	height = 750

var color = d3.scale
	.linear()
	.range(['#ffffff', '#001990']) //от какого и до какого цвета
	.domain([0, 100]) // Максимальное и минимальное значение в диапазоне которых будет цветавая растяжка

var div = d3
	.select('#my_dataviz') // добавляем div для подсказок (tooltip)
	.append('div')
	.attr('class', 'tooltip')
	.style('opacity', 0)

var svg = d3
	.select('#my_dataviz') // добавляем svg для картограммы
	.append('svg')
	.attr('width', width)
	.attr('height', height)
	.style('margin', '10px auto')

var projection = d3.geo
	.albers()
	.rotate([-105, 0])
	.center([-10, 65])
	.parallels([52, 64])
	.scale(1075) // масштаб картограммы внутри svg элемента
	.translate([width / 2, height / 2])

var path = d3.geo.path().projection(projection)

//Reading map file and data

queue()
	.defer(d3.json, 'https://vittuwork.github.io/choropleth_ap/map/russia.json') // подключение topojson с картой
	.defer(d3.csv, 'https://vittuwork.github.io/choropleth_ap/data/dataset.csv') // подключение датасета
	.await(ready)

//Начинаем рисовать картограмму

function ready(error, map, data) {
	var rateById = {}
	var nameById = {}

	data.forEach(function (d) {
		rateById[d.map_region_name] = +d.scrap
		nameById[d.map_region_name] = d.region_name_rus
	})

	//Drawing Choropleth
	features = topojson.feature(map, map.objects.name) //  "name" мы берем из russia.json, открыв файл в редакторе в самом начале файла есть "objects":{"name"
	_Global_features = features

	svg
		.append('g')
		.attr('class', 'region')
		.selectAll('path')
		// .data(topojson.object(map, map.objects.russia).geometries)
		// .data(topojson.feature(map, map.objects.russia).features) //<-- in case topojson.v1.js
		.data(features.features)
		.enter()
		.append('path')
		.attr('d', path)
		.style('fill', function (d) {
			return color(rateById[d.properties.NAME_1])
		})
		.style('opacity', 0.8)

		// добавление событий при наведении мыши на объект
		.on('mouseover', function (d) {
			d3.select(this).transition().duration(300).style('opacity', 1)
			div.transition().duration(300).style('opacity', 1)
			div
				.html(
					"<span style='font-size:18px;font-weight:700'>" +
						rateById[d.properties.NAME_1] +
						'%' +
						'</span>' +
						'<br/>' +
						nameById[d.properties.NAME_1]
				) // вывод значений из датасета в подсказку
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 30 + 'px')
		})
		.on('mouseout', function () {
			d3.select(this).transition().duration(300).style('opacity', 0.8)
			div.transition().duration(300).style('opacity', 0)
		})

	// добавление, 10 самых больших городов, на карту

	d3.tsv(
		'https://vittuwork.github.io/choropleth_ap/data/cities.tsv',
		function (error, data) {
			var city = svg
				.selectAll('g.city')
				.data(data)
				.enter()
				.append('g')
				.attr('class', 'city')
				.attr('transform', function (d) {
					return 'translate(' + projection([d.lon, d.lat]) + ')'
				})

			city
				.append('circle') // добавление точек
				.attr('r', 2)
				.style('fill', 'red')
				.style('opacity', 0.75)

			city
				.append('text') // // добавление названий городов
				.attr('x', 5)
				.text(function (d) {
					return d.City
				})
		}
	)
} // <-- Закончили рисовать картограмму

// Добавление легенды
var colorScale = d3.scale
	.linear()
	.domain([0, 100]) // перечень значений из датасета (мин.–макс.), по которым надо добавлять цвет
	.range(['#ffffff', '#2b3990']) //Цвет, от какого и до какого нужно сделать растяжку

// append a defs (for definition) element to your SVG
var svgLegend = d3
	.select('#legend')
	.append('svg')
	.attr('width', 600)
	.attr('height', 60)

var defs = svgLegend.append('defs')

// append a linearGradient element to the defs and give it a unique id
var linearGradient = defs.append('linearGradient').attr('id', 'linear-gradient')

// horizontal gradient
linearGradient
	.attr('x1', '0%')
	.attr('y1', '0%')
	.attr('x2', '100%')
	.attr('y2', '0%')

// append multiple color stops by using D3's data/enter step
linearGradient
	.selectAll('stop')
	.data([
		{
			offset: '0%',
			color: '#ffffff',
		},
		{
			offset: '100%',
			color: '#001990',
		},
	])
	.enter()
	.append('stop')
	.attr('offset', function (d) {
		return d.offset
	})
	.attr('stop-color', function (d) {
		return d.color
	})

// append title
svgLegend
	.append('text')
	.attr('class', 'legendTitle')
	.attr('x', 0)
	.attr('y', 20)
	.style('text-anchor', 'left')
	.text('% от всего потребления АП')

// draw the rectangle and fill with gradient
svgLegend
	.append('rect')
	.attr('x', 10)
	.attr('y', 30)
	.attr('width', 300)
	.attr('height', 15)
	.style('fill', 'url(#linear-gradient)')

//create tick marks
var xLeg = d3.scale.linear().domain([0, 100]).range([0, 289])

var axisLeg = d3.svg
	.axis(xLeg)
	.scale(xLeg)
	.tickSize(13)
	.tickValues([0, 100])
	.tickFormat(function (n) {
		return n + '%'
	})

svgLegend
	.attr('class', 'axis')
	.append('g')
	.attr('transform', 'translate(10, 35)')
	.call(axisLeg)
