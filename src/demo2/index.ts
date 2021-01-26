import { transform } from '@babel/core';
import * as d3 from 'd3';
import OrgChart from './org-chart';
import OrgTreeChart from './org-tree-chart';

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


function diagonal(s, t) {

    // Calculate some variables based on source and target (s,t) coordinates
    const x = s.x;
    const y = s.y;
    const ex = t.x;
    const ey = t.y;
    let xrvs = ex - x < 0 ? -1 : 1;
    let yrvs = ey - y < 0 ? -1 : 1;
    let rdef = 35;
    let rInitial = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;
    let r = Math.abs(ey - y) / 2 < rInitial ? Math.abs(ey - y) / 2 : rInitial;
    let h = Math.abs(ey - y) / 2 - r;
    let w = Math.abs(ex - x) - r * 2;

    // Build the path
    const path = `
         M ${x} ${y}
         L ${x} ${y + h * yrvs}
         C  ${x} ${y + h * yrvs + r * yrvs} ${x} ${y + h * yrvs + r * yrvs} ${x + r * xrvs} ${y + h * yrvs + r * yrvs}
         L ${x + w * xrvs + r * xrvs} ${y + h * yrvs + r * yrvs}
         C ${ex}  ${y + h * yrvs + r * yrvs} ${ex}  ${y + h * yrvs + r * yrvs} ${ex} ${ey - h * yrvs}
         L ${ex} ${ey}
       `
    // Return result
    return path;
}


function separation(a, b) {
    return a.parent == b.parent ? 1 : 2;
    return (a.parent == b.parent ? 1 : 2) / a.depth;
}

let NODE_WIDTH = 100;
let NODE_HEIGHT = 200;

const tree = data => {
    const root = d3.hierarchy(data);
    
    return d3.tree()
        // .size([WIDTH, HEIGHT])
        .nodeSize([NODE_WIDTH, NODE_HEIGHT])
        // .separation(separation)
        .size([WIDTH - NODE_WIDTH - 100, HEIGHT - NODE_HEIGHT - 100])
        (root);
}


function chartDemo() {

    const root = tree(chaos);

    const minX = d3.min(root.descendants(), d => d.x);
    const maxX = d3.max(root.descendants(), d => d.x);

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, WIDTH, HEIGHT]);

    
    const g = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${NODE_WIDTH - minX},${NODE_HEIGHT/2 + 50})`);
      
    const link = g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.1)
      .attr("stroke-width", 1.5)
    .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d => diagonal(d.source, d.target));
    
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
  
    node.append("circle")
        .attr("fill", d => d.children ? "#555" : "#999")
        .attr("r", 2.5);
  
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.id)
      .clone(true).lower()
        .attr("stroke", "white");



    const rect = g.append('g')
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll('rect')
        .data(root.descendants())
        .join('g')
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .append('rect')
        .attr('width', NODE_WIDTH)
        .attr('height', NODE_HEIGHT)
        .attr('fill', 'green')
        .attr('transform', `translate(${-NODE_WIDTH/2}, ${-NODE_HEIGHT/2})`)
        .attr('opacity', 0.1)
    
    return svg.node();
}


const root = document.getElementById('chart-demo');

root.className = 'chart-container';
root.style.width = `${WIDTH}px`;
root.style.height = `${HEIGHT}px`;

root.appendChild(chartDemo());


// d3.select().append(chartDemo())


