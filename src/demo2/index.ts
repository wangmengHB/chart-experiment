import { transform } from '@babel/core';
import * as d3 from 'd3';
import OrgChart from './org-chart1';
import OrgTreeChart from './org-tree-chart';
import MyChart from './org-chart';


const list = require('./data.json');
const data = list.slice(0, 20);

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
    .onNodeClick(d=> {
        console.log(d+' node clicked');
        console.log(d);
    });


chart.render();

// const chart2 = new OrgTreeChart(document.getElementById('chart-demo'));
// chart2.data(data.map(item => ({...item, width: 100, height: 80})));
// chart2.render();


let chaos = d3.stratify()([
    {id: "Chaos"},
    {id: "Gaia", parentId: "Chaos"},
    {id: "Eros", parentId: "Chaos"},
    {id: "Erebus", parentId: "Chaos"},
    {id: "Tartarus", parentId: "Chaos"},
    {id: "Mountains", parentId: "Gaia"},
    {id: "Pontus", parentId: "Gaia"},
    {id: "Uranus", parentId: "Gaia"}
  ]);


( window as any).chaos = chaos;

const root = document.getElementById('chart-demo');

root.className = 'chart-container';
root.style.width = `${WIDTH}px`;
root.style.height = `${HEIGHT}px`;

// root.appendChild(chartDemo());

const mock1 = [
    {id: "Chaos"},
    {id: "Gaia", parentId: "Chaos"},
    {id: "Eros", parentId: "Chaos"},
    {id: "Erebus", parentId: "Chaos"},
    {id: "Tartarus", parentId: "Chaos"},
    {id: "Mountains", parentId: "Gaia"},
    {id: "Pontus", parentId: "Gaia"},
    {id: "Uranus", parentId: "Gaia"}
];


const mock2 = [
    {id: "Chaos2"},
    {id: "Gaia2", parentId: "Chaos2"},
    {id: "Eros2", parentId: "Chaos2"},
    {id: "Erebus2", parentId: "Chaos2"},
    {id: "Tartarus2", parentId: "Chaos2"},
    {id: "Mountains2", parentId: "Gaia2"},
    {id: "Pontus2", parentId: "Eros2"},
    {id: "Uranus2", parentId: "Eros2"}
];

const mock3 = [
    {id: "Chaos3"},
    {id: "Gaia3", parentId: "Chaos3"},
    {id: "Eros3", parentId: "Chaos3"},
    {id: "Erebus3", parentId: "Chaos3"},
    {id: "Tartarus3", parentId: "Chaos3"},
    {id: "Mountains3", parentId: "Gaia3"},
    {id: "Pontus3", parentId: "Gaia3"},
    {id: "Uranus3", parentId: "Gaia3"},
    {id: "Uranus6", parentId: "Gaia3"},
    {id: "Uranus7", parentId: "Gaia3"},
    {id: "Uranus8", parentId: "Gaia3"},
    {id: "Uranus9", parentId: "Gaia3"},
];



const myChart = new MyChart(root, WIDTH, HEIGHT);
myChart.data(mock1).render();



(window as any).mock1 = mock1;
(window as any).mock2 = mock2;
(window as any).mock3 = mock3;
(window as any).myChart = myChart;


