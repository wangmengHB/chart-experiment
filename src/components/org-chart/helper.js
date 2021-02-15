/* eslint-disable */

import { select, create } from 'd3';
import {
  RECT_COLOR,
  NODE_PADDING, NODE_FIXED_SIZE, PADDING_RATIO, RECT_RATIO,
  VIEWMODE_H, VIEWMODE_V,
} from './config'
import { numbers } from 'util-kit';

const { clamp } = numbers;




// Generate custom diagonal - play with it here - https://observablehq.com/@bumbeishvili/curved-edges?collection=@bumbeishvili/work-components
export function diagonalV(s, t, scalers, getters) {
    // Calculate some variables based on source and target (s,t) coordinates
    const [ xScaler, yScaler ] = scalers;
    const [ xValue, yValue ] = getters;

    const x = xScaler(xValue(s));
    const y = yScaler(yValue(s));
    const ex = xScaler(xValue(t));
    const ey = yScaler(yValue(t));
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

export function treeLineH(s, t, scalers, getters) {
  // Calculate some variables based on source and target (s,t) coordinates
  const [ xScaler, yScaler ] = scalers;
  const [ xValue, yValue ] = getters;

  const x = xScaler(xValue(s));
  const y = yScaler(yValue(s));
  const ex = xScaler(xValue(t));
  const ey = yScaler(yValue(t));

  const path = `
      M ${x} ${y}
      L ${x + (ex - x)/2} ${y}
      L ${x + (ex - x)/2} ${ey}
      L ${ex} ${ey}
  `
  return path;
}

export function treeLineV(s, t, scalers, getters) {
  // Calculate some variables based on source and target (s,t) coordinates
  const [ xScaler, yScaler ] = scalers;
  const [ xValue, yValue ] = getters;

  const x = xScaler(xValue(s));
  const y = yScaler(yValue(s));
  const ex = xScaler(xValue(t));
  const ey = yScaler(yValue(t));

  const path = `
      M ${x} ${y}
      L ${x} ${y + (ey - y)/2}
      L ${ex} ${y + (ey - y)/2}
      L ${ex} ${ey}
  `
  return path;
}



export function getSizeByLevel(viewMode, level, custmize = false) {

  const size = [ NODE_FIXED_SIZE, NODE_FIXED_SIZE ];
  let result = size.map(item => item * clamp(PADDING_RATIO, 0, 1) - NODE_PADDING);


  if (custmize) {
    // TODO: 如果需要定制每一层的尺寸，需要实现这个部分：

  }

  // 期望是个矩形, 缩小高度
  result[1] = result[1] / clamp(RECT_RATIO, 1, 1000);

  // if (viewMode === VIEWMODE_H) {
  //   result = result.reverse();
  // }

  return result;

}



export function createChartNode() {
  // TODO 1: custmize the shape drawing later
  // TODO 2: bind the event callback
  // TODO 3: bind the data model to UI
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  const content = document.createElement('div');
  content.className = "node-foreign-div";

  content.innerHTML = `
   <h2 class="node-title"></h2>
   <div class="node-desc"></div>
   <div class="action-panel">
    <button class="btn detail">Detail</button>
    <button class="btn del">Delete</button>
    <button class="btn add">add +</button>
   </div>
   <div class="collapse-icon">
   </div>
  `


  content.innerHTML = `
   <h2 class="node-title"></h2>
   <div class="node-desc"></div>
   <div class="collapse-icon">
   </div>
  `

  foreignObject.appendChild(content);
  g.appendChild(rect);
  g.appendChild(foreignObject);

  return g;
}


const preventWrapper = (fn, d) => (e) => {
  e.preventDefault();
  e.stopPropagation();
  fn(d);
}


export function updateChartNode(nodeSelection, d, behavior, viewMode) {
  const { depth, height, data } = d;
  const { name, id } = data;
  const level = d.ancestors().length - 1;
  const [node_width, node_height ] = getSizeByLevel(viewMode, level);

  nodeSelection.select('rect')
      .attr('width', node_width)
      .attr('height', node_height)
      .attr('fill', RECT_COLOR)
      .attr('transform', `translate(${-(node_width)/2}, ${-(node_height)/2})`)
      .attr('opacity', 1)
      .attr('rx', 4)
      .attr('ry', 4)

  let foreignWidth = node_width + NODE_PADDING;
  let foreignHeight = node_height + NODE_PADDING;

  const divSelection = nodeSelection.select('foreignObject')
      .attr('width', foreignWidth)
      .attr('height', foreignHeight)
      .attr('transform', `translate(${-foreignWidth/2}, ${-(foreignHeight)/2})`)

  divSelection.selectAll('.action-panel').selectAll('.btn')
      .each(function(){

        const selection = select(this);

        if (selection.classed('detail')) {
          selection.on('click', preventWrapper(behavior.onNodeClick, d))
        }
        if (selection.classed('del')) {
          selection.on('click', preventWrapper(behavior.onNodeClick, d))
        }
        if (selection.classed('add')) {
          selection.on('click', preventWrapper(behavior.onNodeClick, d))
        }
      })

  divSelection.select('.node-title').text(name)
  // divSelection.select('.node-desc').text(id)


  if (viewMode === VIEWMODE_H) {
    divSelection.select('.collapse-icon').classed('horizontal', true);
  } else {
    divSelection.select('.collapse-icon').classed('horizontal', false);
  }

  if (d.children && d.children.length > 0) {
    divSelection.select('.collapse-icon').text('-').classed('hidden', false);
  } else if (d._children && d._children.length > 0) {
    divSelection.select('.collapse-icon').text('+').classed('hidden', false);
  } else {
    divSelection.select('.collapse-icon').classed('hidden', true);
  }

  divSelection.select('.collapse-icon').on('click', preventWrapper(behavior.toggleNode, d));


}

