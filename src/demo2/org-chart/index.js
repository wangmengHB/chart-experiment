/* eslint-disable */

import {
  select, stratify, hierarchy, tree, min, max,
  extent, cluster, selection, scaleLinear, linkHorizontal
} from 'd3';
import {
  MARGIN, LINE_COLOR, RECT_COLOR,
  NODE_WIDTH, NODE_HEIGHT,
  VIEWMODE_H, VIEWMODE_V,
} from './config';
import { treeLineV, treeLineH, createChartNode, updateChartNode } from './helper';
import './style.scss';

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
    xRatio = 1;
    yRatio = 1;

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
                  .append('svg').attr("viewBox", [0, 0, width, height])
                  .classed('org-chart', true);
      this.rootGroup = this.svg.append("g")
              .attr("font-family", "sans-serif")
              .attr("font-size", 10);

      this.lineGroup = this.rootGroup.append("g")
              .attr("fill", "none")
              .attr("stroke", LINE_COLOR)
              .attr("stroke-width", 2)
              .classed('line-group', true);

      this.shapeGroup = this.rootGroup.append('g')
              .attr("stroke-linejoin", "round")
              .attr("stroke-width", 3)
              .classed('shape-group', true);


      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          this.updateSize(width, height);
        }
      });
      resizeObserver.observe(this.container);
    }

    updateSize(width, height) {
      this.width = width;
      this.height = height;
      this.SIZE = [width, height];
      this.svg.attr("viewBox", [0, 0, width, height]);
      this.calcLayout();
      this.render();
    }


    toggleViewMode() {
      const prev = this.viewMode;
      if (prev === VIEWMODE_V) {
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


    data(list) {
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
      this.treeData = tree().nodeSize([NODE_WIDTH, NODE_HEIGHT])(this.hierarchyData);
      const list = this.treeData.descendants();

      const [minX, maxX] = extent(list, this.xValue);
      const [minY, maxY] = extent(list, this.yValue);

      this.xScaler = scaleLinear()
          .domain([minX - NODE_WIDTH/2, maxX + NODE_WIDTH/2])
          .range([0, this.width - MARGIN.right]);

      this.yScaler = scaleLinear()
          .domain([minY - NODE_HEIGHT/2, maxY + NODE_HEIGHT/2])
          .range([0, this.height - MARGIN.bottom]);

      this.xRatio = (this.width - MARGIN.right - MARGIN.left) / (maxX - minX + NODE_WIDTH);
      this.yRatio = (this.height - MARGIN.bottom - MARGIN.top) / (maxY - minY + NODE_HEIGHT);

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


    render() {
        if (!this.treeData) {
          return this;
        }
        // set the view offset
        this.rootGroup
          .attr("transform", `translate(${MARGIN.left}, ${ MARGIN.top })`);

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
            .each(function(d, i, nodes) {
              updateChartNode(select(this), d, [me.xRatio, me.yRatio], {...me.behavior, toggleNode: me.toggleNode}, me.viewMode)
            })

        return this;

    }



}




