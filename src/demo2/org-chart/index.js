/* eslint-disable */

import {
  select, stratify, hierarchy, tree, min, max,
  extent, cluster, selection, scaleLinear, linkHorizontal,
  zoom,
} from 'd3';
import {
  MARGIN, LINE_COLOR,
  NODE_FIXED_SIZE, NODE_FIXED_SIZE,
  VIEWMODE_H, VIEWMODE_V,
  MIN_FACTOR, MAX_FACTOR, ZOOM_STEP,
} from './config';
import { treeLineV, treeLineH, createChartNode, updateChartNode } from './helper';
import './style.scss';
import { generateUuid, objects, numbers, decorators } from 'util-kit';
import { DownloadOutlined } from '@ant-design/icons-svg';
import { renderIconDefinitionToSVGElement } from '@ant-design/icons-svg/es/helpers';
import domtoimage from 'dom-to-image';

const downloadIcon = renderIconDefinitionToSVGElement(DownloadOutlined, {
  extraSVGAttrs: { width: '1em', height: '1em', fill: 'currentColor' }
});



const { deepClone } = objects;
const { clamp } = numbers;
const { debounce } = decorators;

const noop = () => {};


export default class OrgChart {

    // list data passed in
    rawData = null;
    // hierarchy data
    hierarchyData = null;
    // data with layout x, y
    treeData = null;

    viewMode = VIEWMODE_V;   // 'v' | 'h'
    xValue = d => d.x;
    yValue = d => d.y;
    
    // used to zoom the chart
    factor = 1;
    center = {
      x: 0,
      y: 0,
    };

    svg = null;
    rootGroup = null;
    lineGroup = null;
    shapeGroup = null;

    behavior = {
      onAddChildClick: noop,
      onDeleteNodeClick: noop,
      onNodeClick: noop,
    };

    constructor(container, width, height, options) {
      this.container = container;
      this.width = width;
      this.height = height;
      this.svg = select(container)
                  .classed('org-chart', true)
                  .append('svg')
                    // .attr("viewBox", [0, 0, width, height])
                    .attr('width', this.width)
                    .attr('height', this.height)
                    .attr('cursor', 'move');
      
      this.downloadBtn = select(container).append('div').classed('download', true).html(downloadIcon);
      this.downloadBtn.on('click', this.downloadImage.bind(this))

      // set margin for the main drawing area
      const main = this.svg.append("g")
              .attr("font-family", "sans-serif")
              .attr("font-size", 10)
              .classed('main', true)
              .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
      
      // handle the zoom behavior from event
      const outer = main.append('g').classed('outer', true);

      // handle the zoom factor from data
      this.rootGroup = outer.append('g').classed('root', true);


      this.lineGroup = this.rootGroup.append("g")
              .attr("fill", "none")
              .attr("stroke", LINE_COLOR)
              .attr("stroke-width", 2)
              .classed('line-group', true);

      this.shapeGroup = this.rootGroup.append('g')
              .attr("stroke-linejoin", "round")
              .attr("stroke-width", 3)
              .classed('shape-group', true);

      // bind the zoom behavior
      const zoomFn = zoom().on("zoom", (e) => outer.attr('transform', e.transform))
      this.svg.call(zoomFn).on("dblclick.zoom", null);


      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          this.updateSize(width, height);
        }
      });
      resizeObserver.observe(this.container);

      // this.updateSize = this.updateSize.bind(this);
    }

    @debounce(10)
    updateSize(width, height) {
      this.width = width;
      this.height = height;
      this.svg.attr('width', this.width)
              .attr('height', this.height);
      this.calcLayout();
      this.render();
    }


    setViewMode(mode) {
      if ([VIEWMODE_V, VIEWMODE_H].indexOf(mode) === -1) {
        return;
      }
      if (mode === VIEWMODE_H) {
        this.viewMode = VIEWMODE_H;
        this.xValue = d => d.y;
        this.yValue = d => d.x;
      } else {
        this.viewMode = VIEWMODE_V;
        this.xValue = d => d.x;
        this.yValue = d => d.y;
      }
      this.calcLayout();
      this.render();
      return this;
    }


    data(data) {

      const list = deepClone(data);

      if (!Array.isArray(list) || list.length === 0) {
        return;
      }
      // clean data
      list.forEach((item) => {
        if (!item.parentId) {
          delete item.parentId
        }
      });
      const rootNodes = list.filter((item) => !item.parentId);
      // 如果存在多个根节点，则补上一个 fake 根节点
      if (rootNodes.length > 1) {
        const fakeRootId = generateUuid();
        const mock = { id: fakeRootId, name: '根节点' };
        rootNodes.forEach((item) => (item.parentId = fakeRootId));
        list.push(mock);
      } else if (rootNodes.length < 1) {
        alert('传入的数据列表不是一颗合法的树')
        throw new Error('data is not a tree');
      }
      // -------------------

      this.hierarchyData = stratify()(list);
      this.calcLayout();
      return this;
    }


    calcLayout() {
      if (!this.hierarchyData) {
        this.treeData = null;
        return this;
      }

      // MAX NODE SIZE:
      // Suppose the same width and height, then use scaleLinear to adjust width
      this.treeData = tree().nodeSize([NODE_FIXED_SIZE, NODE_FIXED_SIZE])(this.hierarchyData);
      const list = this.treeData.descendants();

      const [minX, maxX] = extent(list, this.xValue);
      const [minY, maxY] = extent(list, this.yValue);

      const w = maxX - minX + NODE_FIXED_SIZE;
      const h = maxY - minY + NODE_FIXED_SIZE;

      const factorX = (this.width - MARGIN.left - MARGIN.right) / w;
      const factorY = (this.height - MARGIN.top - MARGIN.bottom) / h;

      this.xScaler = scaleLinear()
          .domain([minX - NODE_FIXED_SIZE/2, maxX + NODE_FIXED_SIZE/2])
          .range([-w/2, w/2]);

      this.yScaler = scaleLinear()
          .domain([minY - NODE_FIXED_SIZE/2, maxY + NODE_FIXED_SIZE/2])
          .range([-h/2, h/2]);

      console.log(`range, x: ${-w/2}, ${w/2} | y: ${-h/2}, ${h/2}`)
      console.log(`factor x: ${factorX} | y: ${factorY}`)


      this.center = {
        x: w/2 ,
        y: h/2 ,
      }

      this.setFactor(Math.min(factorX, factorY));

      return this;

    }

    registerBehavior({ onAddChildClick, onDeleteNodeClick, onNodeClick}) {
      if (onAddChildClick) {
        this.behavior.onAddChildClick = onAddChildClick;
      }
      if (onDeleteNodeClick) {
        this.behavior.onDeleteNodeClick = onDeleteNodeClick;
      }
      if (onNodeClick) {
        this.behavior.onNodeClick = onNodeClick;
      }
    }


    toggleNode = (data) => {
      if (data.children && data.children.length > 0) {
        data._children = data.children;
        data.children = null;
      } else if (data._children && data._children.length > 0){
        data.children = data._children;
        data._children = null;
      }

      // this.calcLayout();
      this.render();
    }


    setFactor(factor) {
      this.factor = clamp(factor, MIN_FACTOR, MAX_FACTOR);
      this.rootGroup.attr('transform', `scale(${this.factor}) translate(${this.center.x}, ${this.center.y})`)
    }


    zoomIn() {
      const factor = clamp(this.factor + ZOOM_STEP, MIN_FACTOR, MAX_FACTOR);
      this.setFactor(factor);
    }

    zoomOut() {
      const factor = clamp(this.factor - ZOOM_STEP, MIN_FACTOR, MAX_FACTOR);
      this.setFactor(factor);
    }


    render() {
        if (!this.treeData) {
          return this;
        }
        
        // draw the links first
        const links = this.treeData.links();

        if (!links) {
          return this;
        }

        this.lineGroup
            .selectAll("path")
            .data(links)
            .join("path")
            // .transition()
            // .duration(1000)
            .attr("d", this.viewMode === VIEWMODE_H?
                (d) => treeLineH(d.source, d.target, [this.xScaler, this.yScaler], [this.xValue, this.yValue])
                :(d) => treeLineV(d.source, d.target, [this.xScaler, this.yScaler], [this.xValue, this.yValue])
            );

        const list = this.treeData.descendants();
        const me = this;

        const nodeUpdateSelection = this.shapeGroup.selectAll('.shape-group g.chart-node').data(list);
        nodeUpdateSelection.exit().remove();
        nodeUpdateSelection.enter().append(() => createChartNode())
          .merge(nodeUpdateSelection)
            .classed('chart-node', true)
            .attr("transform", d => `translate(${this.xScaler(this.xValue(d))},${this.yScaler(this.yValue(d))})`)
            .each(function(d) {
              updateChartNode(select(this), d, {...me.behavior, toggleNode: me.toggleNode}, me.viewMode)
            })

        return this;

    }



    async downloadImage() {
      // TODO hidden the decorator elements
      this.downloadBtn.style('display', 'none');
      return domtoimage.toJpeg(this.container).then((base64) => {
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = base64;
        a.download = "chart";
        a.click();
      }).finally(() => {
        // TODO recover the decorator elements
        this.downloadBtn.style('display', 'block');
      })
    }

}




