import * as d3 from 'd3';
import MyChart from '../components/org-chart';


const list = require('./data.json');
const data = list.slice(0);

const WIDTH = 1200;
const HEIGHT = 800;


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
root.style.width = `100%`;
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
    {id: "Uranus", parentId: "Gaia"},
    {id: "new-node1", parentId: "Tartarus"},
    {id: "new-node2", parentId: "Tartarus"},

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


const mock4 = data.map(item => ({
    ...item,
    id: item.nodeId,
    parentId: item.parentNodeId,
}));

const myChart = new MyChart(root, WIDTH, HEIGHT);
myChart.data(mock1).render();



(window as any).mock1 = mock1;
(window as any).mock2 = mock2;
(window as any).mock3 = mock3;
(window as any).myChart = myChart;

(window as any).mock4 = mock4


