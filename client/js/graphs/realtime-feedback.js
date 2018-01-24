function init() {
  let data = [];

  const element = document.querySelector('div.graph.realtime-feedback');

  let { height, width } = element.getBoundingClientRect();
  let globalX = 0;

  width = width;
  const duration = width;
  const max = width;
  const step = 10;

  const graph = d3.select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3.scaleLinear().domain([0, width]).range([0, width]);
  const y = d3.scaleLinear().domain([0, 1]).range([height - 20, 20]);

  const gridLines = d3.line()
    .x(d => d.x)
    .y(d => d.y);

  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y));

  const smoothLine = d3.line().curve(d3.curveCardinal)
    .x(d => x(d.x))
    .y(d => y(d.y));

  const lineArea = d3.area()
    .x(d => x(d.x))
    .y0(y(0))
    .y1(d => y(d.y))
    .curve(d3.curveCardinal);

  // Draw the grid
  // x axis
  const grid_size = 20;

  for (let i = 0; i < max; i += grid_size) {
    graph.append('path').datum([{ x: i, y: 0 }, { x: i, y: height }])
      .attr('class', 'gridlines')
      .attr('d', gridLines);
  }

  // y axis
  for (let i = 0; i < height; i += grid_size) {
    graph.append('path').datum([{ x: 0, y: i }, { x: width, y: i }])
      .attr('class', 'gridlines')
      .attr('d', gridLines);
  }

  const occupied = graph.append('g')
    .attr('width', width)
    .attr('height', 20)
    .attr('class', 'status occupied');

  occupied.append('text')
    .attr('x', 3)
    .attr('y', 16)
    .attr('font-size', '12px')
    .text('occupied');

  occupied.append('path').datum([{ x: 0, y: 20 }, { x: width, y: 20 }])
    .attr('class', 'value')
    .attr('d', gridLines);

  const vacant = graph.append('g')
    .attr('width', width)
    .attr('height', 20)
    .attr('class', 'status vacant')
    .attr('transform', 'translate(0, ' + (height - 20) + ')');

  vacant.append('text')
    .attr('x', 3)
    .attr('y', 12)
    .attr('font-size', '12px')
    .text('vacant');

  vacant.append('path').datum([{ x: 0, y: 0 }, { x: width, y: 0 }])
    .attr('class', 'value')
    .attr('d', gridLines);

  // X Axis
  const xAxis = d3.axisBottom().scale(x);
  const axisX = graph.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

  // append holder for our chart lines
  const path = graph.append('path');

  let current = 0;
  function tick() {
    current = current === 0 ? 1 : 0;

    let point = {
      x: globalX,
      y: current
    };

    data.push(point);
    globalX += step;

    path.datum(data)
      .attr('class', 'line')
      .attr('d', line);

    // shift left
    x.domain([globalX - (max - step), globalX]);

    axisX.transition()
      .duration(duration)
      .ease(d3.easeLinear, 1)
      .call(xAxis);

    path.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 1)
      .attr('transform', 'translate(' + x(globalX - max) + ')')
      .on('end', tick);

    if (data.length > 50) data.shift();
  }
  tick();
}

export default { init };
