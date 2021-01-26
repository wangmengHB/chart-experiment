import { select, stratify, hierarchy, tree, min, max } from 'd3';
import { MARGIN } from './config';
import { diagonal } from './util';
import './style.less';









const NODE_WIDTH = 100;
const NODE_HEIGHT = 200;



function layout(data, containerSize, nodeSize) {
    // TODO: add some logic to improve the layout

    const root = hierarchy(data);
    return tree()
        .nodeSize([nodeSize[0], nodeSize[1]])
        .size([
            containerSize[0] - MARGIN.left - MARGIN.right - NODE_WIDTH, 
            containerSize[1] - MARGIN.top - MARGIN.bottom - NODE_HEIGHT - 50,
        ])
        (root);
}




export default class OrgChart {

    private treeData: any = null;
    private maxX: number = 0;
    private minX: number = 0;
    private maxY: number = 0;
    private minY: number = 0;

    private svg: any = null;
    private rootGroup: any = null;
    private lineGroup: any = null;
    private shapeGroup: any = null;


    constructor(private container: HTMLElement, private width, private height, options?) {
        this.svg = select(container)
                    .style('width', `${width}px`).style('height', `${height}px`)
                    .append('svg').attr("viewBox", [0, 0, width, height])
                    .classed('org-chart', true);
        this.rootGroup = this.svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10);

        this.lineGroup = this.rootGroup.append("g")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.3)
                .attr("stroke-width", 4)
                .classed('line-group', true);

        this.shapeGroup = this.rootGroup.append('g')
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .classed('shape-group', true);

        

    }


    data(list: any) {
        const data = stratify()(list);
        this.treeData = layout(data, [this.width, this.height], [NODE_WIDTH, NODE_HEIGHT]);
        this.minX = min(this.treeData.descendants(), d => d.x);
        this.maxX = max(this.treeData.descendants(), d => d.x);
        this.minY = min(this.treeData.descendants(), d => d.y);
        this.maxY = max(this.treeData.descendants(), d => d.y);
        return this;
    }


    render() {

        // set the view offset
        this.rootGroup.attr("transform", `translate(${NODE_WIDTH - this.minX},${NODE_HEIGHT/2 + 50})`);
        
        // draw the links first
        this.lineGroup
            .selectAll("path")
            .data(this.treeData.links())
            .join("path")
            .transition()
            .duration(10)
            .attr("d", d => diagonal(d.source, d.target));
        

        // TODO: customize the node drawing later
        this.shapeGroup
            .selectAll('.shape-group g')
            .data(this.treeData.descendants())
            .join('g')
            .transition()
            .duration(10)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .each(function(this: any, d) {

                // TODO 1: custmize the shape drawing later
                // TODO 2: bind the event callback
                // TODO 3: bind the data model to UI

                let rect = select(this).select('rect');
                let text = select(this).select('text');

                if (!rect.node()) {
                    rect = select(this).append('rect');
                }
                if (!text.node()) {
                    text = select(this).append('text');
                }
                
                rect
                    .attr('width', NODE_WIDTH)
                    .attr('height', NODE_HEIGHT)
                    .attr('fill', 'rgb(51, 182, 208)')
                    .attr('transform', `translate(${-NODE_WIDTH/2}, ${-NODE_HEIGHT/2})`)
                    .attr('opacity', 1);
                
                text
                    .attr("dy", "0.31em")
                    .attr("y", 0)
                    .attr("text-anchor", 'middle')
                    .text(d => d.data.id)
                    
            })

        return this;


    }


        
}




