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




const ul = d3.select('#chart-demo')
            .append('ul');

ul.append('li');
ul.append('li');

// ul.selectAll('li').data([1,2,3]).text(d => 'data is ' + d).enter().append('li').text(d => 'data is ' + d);


ul.selectAll("li")
   .data([10, 20, 30, 25, 15])
   .text(function(d) { return "This is pre-existing element and the value is " + d; })
   .enter()
   .append("li")
   .text(function(d) 
      { return "This is dynamically created element and the value is " + d; });

ul.selectAll("li")
    .data([10, 20, 30,])
    .exit()
    .remove();
    



const chart = new OrgChart();

(chart as any).container(container)
    .data(data)
    .svgWidth(WIDTH)
    .svgHeight(HEIGHT)
    .initialZoom(0.6)
    .onNodeClick(d=> {
        console.log(d+' node clicked');
        console.log(d);
    })
    .render();

