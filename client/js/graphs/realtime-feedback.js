const Room = (function () {
  const delay = 10000;

  let state = 0;
  let timeout = null;

  return {
    getState: function () {
      return state;
    },

    activate: function () {
      clearTimeout(timeout);
      state = 1;
      timeout = null;
    },

    deactivate: function () {
      if (state == 1) {
        timeout = setTimeout(function () {
          state = 0;
          timeout = null;
        }, delay);
      }
    }
  };
})();

function init() {
  let data = [];
  let room_data = [];

  let sensor_state = 0;

  const protocol = window.location.protocol == 'https' ? 'wss' : 'ws';

  // Set up websocket
  const ws = new WebSocket(protocol + '://' + window.location.host);

  ws.onerror = function () {
    console.error('[WS] Connection error');
  };

  ws.onopen = function () {
    console.info('[WS] Client connected');
  };

  ws.onclose = function () {
    console.warn('[WS] Client closed');
  };

  ws.onmessage = function (e) {
    const data = JSON.parse(e.data);
    if (typeof data.status !== 'undefined') {
      sensor_state = data.status;
      if (data.status == 1) {
        Room.activate();
      } else {
        Room.deactivate();
      }
    }
  };

  // PIR Sensor graph
  const element01 = document.querySelector('div.graph.realtime-feedback');
  const element02 = document.querySelector('div.graph.occupancy-feedback');
  let { height, width } = element01.getBoundingClientRect();
  let globalX = 0;

  width = width;
  const duration = 200;
  const max = width;
  const step = 1;

  // pir graph
  const graph = d3.select(element01)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const occupancy = d3.select(element02)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3.scaleLinear().domain([0, width]).range([0, width]);
  const y = d3.scaleLinear().domain([0, 1]).range([height - 20, 20]);

  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y));

  const smoothLine = d3.line().curve(d3.curveCardinal)
    .x(d => x(d.x))
    .y(d => y(d.y));

  const lineArea = d3.area()
    .x(d => x(d.x))
    .y0(y(0))
    .y1(d => y(d.y));

  setupGraph(graph, 'active', 'inactive', max, width, height);
  setupGraph(occupancy, 'occupied', 'vacant', max, width, height);

  // X Axis
  const xAxis = d3.axisBottom().scale(x);
  const axisX = graph.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

  // append holder for our chart lines
  const path = graph.append('path');
  const areaPath = graph.append('path');

  // append holder for our room chart lines
  const room_activity = occupancy.append('path');
  const room_areaActivity = occupancy.append('path');
  const room_path = occupancy.append('path');
  const room_areaPath = occupancy.append('path');

  function tick() {
    let point = {
      x: globalX,
      y: sensor_state
    };

    let room_point = {
      x: globalX,
      y: Room.getState()
    };

    globalX += step;
    data.push(point);
    room_data.push(room_point);

    path.datum(data)
      .attr('class', 'line')
      .attr('d', line);

    room_activity.datum(data)
      .attr('class', 'line activity')
      .attr('d', line);

    room_path.datum(room_data)
      .attr('class', 'line')
      .attr('d', line);

    areaPath.datum(data)
      .attr('class', 'area')
      .attr('d', lineArea);

    room_areaActivity.datum(data)
      .attr('class', 'area activity')
      .attr('d', lineArea);

    room_areaPath.datum(room_data)
      .attr('class', 'area')
      .attr('d', lineArea);

    // shift left
    x.domain([globalX - (max - step), globalX]);

    axisX.transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .call(xAxis);

    path.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('transform', 'translate(' + x(globalX - max) + ')');

    room_activity.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('transform', 'translate(' + x(globalX - max) + ')');

    room_path.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('transform', 'translate(' + x(globalX - max) + ')');

    room_areaActivity.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('transform', 'translate(' + x(globalX - max) + ')');

    areaPath.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('transform', 'translate(' + x(globalX - max) + ')');

    room_areaPath.attr('transform', null)
      .transition()
      .duration(duration)
      .ease(d3.easeLinear, 2)
      .attr('tranform', 'translate(' + x(globalX - max) + ')')
      .on('end', tick);

    if (data.length > 500) data.shift();
  }
  tick();
}

function setupGraph(graph, top, bottom, max, width, height) {
  const gridLines = d3.line()
    .x(d => d.x)
    .y(d => d.y);

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

  // setup boundaries
  const active = graph.append('g')
    .attr('width', width)
    .attr('height', 19)
    .attr('class', 'status occupied');

  active.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', 19);

  active.append('text')
    .attr('x', 3)
    .attr('y', 16)
    .attr('font-size', '12px')
    .text(top);

  active.append('path').datum([{ x: 0, y: 19 }, { x: width, y: 19 }])
    .attr('class', 'value')
    .attr('d', gridLines);

  const inactive = graph.append('g')
    .attr('width', width)
    .attr('height', 20)
    .attr('class', 'status vacant')
    .attr('transform', 'translate(0, ' + (height - 19) + ')');

  inactive.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', 19);

  inactive.append('text')
    .attr('x', 3)
    .attr('y', 12)
    .attr('font-size', '12px')
    .text(bottom);

  inactive.append('path').datum([{ x: 0, y: 0 }, { x: width, y: 0 }])
    .attr('class', 'value')
    .attr('d', gridLines);
}

export default { init };
