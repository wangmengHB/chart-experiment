import * as d3 from 'd3';
import OrgChart from './org-chart';

const data = require('./data.json');

(window as any).d3 = d3;


const WIDTH = 1200;
const HEIGHT = 800;

const container = document.createElement('div');
container.className = 'chart-container';
container.style.width = `${WIDTH}px`;
container.style.height = `${HEIGHT}px`;
document.body.appendChild(container);





const chart = new OrgChart();

(chart as any).container(container)
    .data(data)
    .svgWidth(WIDTH)
    .svgHeight(HEIGHT)
    .initialZoom(0.6)
    .onNodeClick(d=> console.log(d+' node clicked'))
    .render();

