import { 
    select, selectAll, tree,
} from 'd3';
import * as d3 from 'd3';


const MARGIN = {
    left: 20,
    top: 20,
    right: 20,
    bottom: 20,
};

const DIMENSIONS = {
    width: 800,
    height: 800,
};

const OPTIONS = {
    onNodeClick: d => d,
    maxDepth: 100,
}


d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
        if (typeof d === 'object') {
            if (d.id) {
                return d.id;
            }
        }
        return i;
    });
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection);
    selection.attr('class', selector);
    return selection;
};

const DURATION = 100;


(window as any).d3 = d3;


/* Function converts rgba objects to rgba color string 
{red:110,green:150,blue:255,alpha:1}  => rgba(110,150,255,1)
*/
function rgbaObjToColor({
  red,
  green,
  blue,
  alpha
}) {
  return `rgba(${red},${green},${blue},${alpha})`;
}

// Generate custom diagonal - play with it here - https://observablehq.com/@bumbeishvili/curved-edges?collection=@bumbeishvili/work-components
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



export default class OrgTreeChart{

    onNodeClick = d => d;
    maxDepth = 100;

    width = DIMENSIONS.width;
    height = DIMENSIONS.height;

    treemap = null;
    root: any = null;
    allNodes: any = [];

    svg: any = null;


    dropShadowId: any = null;

    backgroundColor: any = '#fafafa';


    defs: any = null;
    centerG: any = null;

    chart: any = null;

    depth: any = 300;
    duration: any = 100;
    strokeWidth:any = 4;
    defaultTextFill: any = '#2C3E50';




    constructor(private container: HTMLElement) {

        // TODO: set chart width and height
        // TODO: set chart margin

        select(container).style('width', `${this.width}px`)
                         .style('height', `${this.width}px`);
    }

    data(data: any[]) {
        const CHART_WIDTH = this.width - MARGIN.left - MARGIN.right;
        const CHART_HEIGHT = this.height - MARGIN.top - MARGIN.bottom;
        const NODE_MAX_WIDTH = 400;
        const NODE_MAX_HEIGHT = 200;

        this.treemap = tree().size([CHART_WIDTH, CHART_HEIGHT])
            .nodeSize([NODE_MAX_WIDTH + 100, NODE_MAX_HEIGHT + this.depth])


         //****************** ROOT node work ************************

        // Convert flat data to hierarchical
        const root = d3.stratify()
            .id(({
                nodeId
            }) => nodeId)
            .parentId(({
                parentNodeId
            }) => parentNodeId)
            (data)

        // Set child nodes enter appearance positions
        root.x0 = 0;
        root.y0 = 0;
        this.root = root;

        /** Get all nodes as array (with extended parent & children properties set)
            This way we can access any node's parent directly using node.parent - pretty cool, huh?
        */
        this.allNodes = this.treemap(root).descendants()


        
        

        // Assign direct children and total subordinate children's cound
        this.allNodes.forEach(d => {
            Object.assign(d.data, {
                directSubordinates: d.children ? d.children.length : 0,
                totalSubordinates: d.descendants().length - 1
            })
        })

        const children = this.root.children;

        if(children) {
            // Collapse all children at first
            children.forEach(d => this.collapse(d));

            // Then expand some nodes, which have `expanded` property set
            children.forEach(d => this.expandSomeNodes(d));
        }
        

        // *************************  DRAWING **************************
        //Add svg
        const svg = select(this.container)
            .patternify({
                tag: 'svg',
                selector: 'svg-chart-container'
            })
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('cursor', 'move')
            .style('background-color', this.backgroundColor);


        this.svg = svg;

        //Add container g element
        const chart = svg
            .patternify({
                tag: 'g',
                selector: 'chart'
            })
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        // Add one more container g element, for better positioning controls
        this.centerG = chart.patternify({
            tag: 'g',
            selector: 'center-group'
        })
            .attr('transform', `translate(${CHART_WIDTH/2},${NODE_MAX_HEIGHT / 2}) scale(1)`);

        this.chart = chart;

        // ************************** ROUNDED AND SHADOW IMAGE  WORK USING SVG FILTERS **********************

        //Adding defs element for rounded image
        this.defs = svg.patternify({
            tag: 'defs',
            selector: 'image-defs'
        });

        // Adding defs element for image's shadow
        const filterDefs = svg.patternify({
            tag: 'defs',
            selector: 'filter-defs'
        });

        // Adding shadow element - (play with svg filter here - https://bit.ly/2HwnfyL)
        const filter = filterDefs.patternify({
            tag: 'filter',
            selector: 'shadow-filter-element'
        })
            .attr('id', this.dropShadowId)
            .attr('y', `${-50}%`)
            .attr('x', `${-50}%`)
            .attr('height', `${200}%`)
            .attr('width', `${200}%`);

        // Add gaussian blur element for shadows - we can control shadow length with this
        filter.patternify({
            tag: 'feGaussianBlur',
            selector: 'feGaussianBlur-element'
        })
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', 3.1)
            .attr('result', 'blur');

        // Add fe-offset element for shadows -  we can control shadow positions with it
        filter.patternify({
            tag: 'feOffset',
            selector: 'feOffset-element'
        })
            .attr('in', 'blur')
            .attr('result', 'offsetBlur')
            .attr("dx", 4.28)
            .attr("dy", 4.48)
            .attr("x", 8)
            .attr("y", 8)

        // Add fe-flood element for shadows - we can control shadow color and opacity with this element
        filter.patternify({
            tag: 'feFlood',
            selector: 'feFlood-element'
        })
            .attr("in", "offsetBlur")
            .attr("flood-color", 'black')
            .attr("flood-opacity", 0.3)
            .attr("result", "offsetColor");

        // Add feComposite element for shadows
        filter.patternify({
            tag: 'feComposite',
            selector: 'feComposite-element'
        })
            .attr("in", "offsetColor")
            .attr("in2", "offsetBlur")
            .attr("operator", "in")
            .attr("result", "offsetBlur");

        // Add feMerge element for shadows
        const feMerge = filter.patternify({
            tag: 'feMerge',
            selector: 'feMerge-element'
        });

        // Add feMergeNode element for shadows
        feMerge.patternify({
            tag: 'feMergeNode',
            selector: 'feMergeNode-blur'
        })
            .attr('in', 'offsetBlur')

        // Add another feMergeNode element for shadows
        feMerge.patternify({
            tag: 'feMergeNode',
            selector: 'feMergeNode-graphic'
        })
            .attr('in', 'SourceGraphic')

        
        

        // Display tree contenrs
        this.update(this.root)



        //#########################################  UTIL FUNCS ##################################
        // This function restyles foreign object elements ()

        return this;

    }


    // Function which collapses passed node and it's descendants
    collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(ch => this.collapse(ch));
            d.children = null;
        }
    }

    // Function which expands passed node and it's descendants 
    expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(ch => this.expand(ch));
            d._children = null;
        }
    }


    // This function basically redraws visible graph, based on nodes state
    update({
        x0,
        y0,
        x,
        y
    }) {

        //  Assigns the x and y position for the nodes
        const treeData = this.treemap(this.root);

        // Get tree nodes and links and attach some properties 
        const nodes = treeData.descendants()
            .map(d => {
                // If at least one property is already set, then we don't want to reset other properties
                if (d.width) return d;

                // Declare properties with deffault values
                let imageWidth = 100;
                let imageHeight = 100;
                let imageBorderColor = 'steelblue';
                let imageBorderWidth = 0;
                let imageRx = 0;
                let imageCenterTopDistance = 0;
                let imageCenterLeftDistance = 0;
                let borderColor = 'steelblue';
                let backgroundColor = 'steelblue';
                let width = d.data.width;
                let height = d.data.height;
                let dropShadowId = `none`;

                // Override default values based on data
                if (d.data.nodeImage && d.data.nodeImage.shadow) {
                    dropShadowId = `url(#${this.dropShadowId})`
                }
                if (d.data.nodeImage && d.data.nodeImage.width) {
                    imageWidth = d.data.nodeImage.width
                };
                if (d.data.nodeImage && d.data.nodeImage.height) {
                    imageHeight = d.data.nodeImage.height
                };
                if (d.data.nodeImage && d.data.nodeImage.borderColor) {
                    imageBorderColor = rgbaObjToColor(d.data.nodeImage.borderColor)
                };
                if (d.data.nodeImage && d.data.nodeImage.borderWidth) {
                    imageBorderWidth = d.data.nodeImage.borderWidth
                };
                if (d.data.nodeImage && d.data.nodeImage.centerTopDistance) {
                    imageCenterTopDistance = d.data.nodeImage.centerTopDistance
                };
                if (d.data.nodeImage && d.data.nodeImage.centerLeftDistance) {
                    imageCenterLeftDistance = d.data.nodeImage.centerLeftDistance
                };
                if (d.data.borderColor) {
                    borderColor = rgbaObjToColor(d.data.borderColor);
                }
                if (d.data.backgroundColor) {
                    backgroundColor = rgbaObjToColor(d.data.backgroundColor);
                }
                if (d.data.nodeImage &&
                    d.data.nodeImage.cornerShape.toLowerCase() == "circle") {
                    imageRx = Math.max(imageWidth, imageHeight);
                }
                if (d.data.nodeImage &&
                    d.data.nodeImage.cornerShape.toLowerCase() == "rounded") {
                    imageRx = Math.min(imageWidth, imageHeight) / 6;
                }

                // Extend node object with calculated properties
                return Object.assign(d, {
                    imageWidth,
                    imageHeight,
                    imageBorderColor,
                    imageBorderWidth,
                    borderColor,
                    backgroundColor,
                    imageRx,
                    width,
                    height,
                    imageCenterTopDistance,
                    imageCenterLeftDistance,
                    dropShadowId
                });
            });

        // Get all links
        const links = treeData.descendants().slice(1);

        // Set constant depth for each nodes
        nodes.forEach(d => d.y = d.depth * this.depth);

        // ------------------- FILTERS ---------------------

        // Add patterns for each node (it's needed for rounded image implementation)
        const patternsSelection = this.defs.selectAll('.pattern')
            .data(nodes, ({
                id
            }) => id);

        // Define patterns enter selection
        const patternEnterSelection = patternsSelection.enter().append('pattern')

        // Patters update selection
        const patterns = patternEnterSelection
            .merge(patternsSelection)
            .attr('class', 'pattern')
            .attr('height', 1)
            .attr('width', 1)
            .attr('id', ({
                id
            }) => id)

        // Add images to patterns
        const patternImages = patterns.patternify({
            tag: 'image',
            selector: 'pattern-image',
            data: d => [d]
        })
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', ({
                imageWidth
            }) => imageWidth)
            .attr('width', ({
                imageHeight
            }) => imageHeight)
            .attr('xlink:href', ({
                data
            }) => {
                console.log(data.nodeImage.url);
                return '/avatar.jpg';
                return data.nodeImage && data.nodeImage.url
            })
            .attr('viewbox', ({
                imageWidth,
                imageHeight
            }) => `0 0 ${imageWidth * 2} ${imageHeight}`)
            .attr('preserveAspectRatio', 'xMidYMin slice')

        // Remove patterns exit selection after animation
        patternsSelection.exit().transition().duration(this.duration).remove();

        // --------------------------  LINKS ----------------------
        // Get links selection
        const linkSelection = this.centerG.selectAll('path.link')
            .data(links, ({
                id
            }) => id);

        // Enter any new links at the parent's previous position.
        const linkEnter = linkSelection.enter()
            .insert('path', "g")
            .attr("class", "link")
            .attr('d', d => {
                const o = {
                    x: x0,
                    y: y0
                };
                return diagonal(o, o)
            });

        // Get links update selection
        const linkUpdate = linkEnter.merge(linkSelection);

        // Styling links
        linkUpdate
            .attr("fill", "none")
            .attr("stroke-width", ({
                data
            }) => data.connectorLineWidth || 2)
            .attr('stroke', ({
                data
            }) => {
                if (data.connectorLineColor) {
                    return rgbaObjToColor(data.connectorLineColor);
                }
                return 'green';
            })
            .attr('stroke-dasharray', ({
                data
            }) => {
                if (data.dashArray) {
                    return data.dashArray;
                }
                return '';
            })

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(this.duration)
            .attr('d', d => diagonal(d, d.parent));

        // Remove any  links which is exiting after animation
        const linkExit = linkSelection.exit().transition()
            .duration(this.duration)
            .attr('d', d => {
                const o = {
                    x: x,
                    y: y
                };
                return diagonal(o, o)
            })
            .remove();

        // --------------------------  NODES ----------------------
        // Get nodes selection
        const nodesSelection = this.centerG.selectAll('g.node')
            .data(nodes, ({
                id
            }) => id)

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = nodesSelection.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${x0},${y0})`)
            .attr('cursor', 'pointer')
            .on('click', (e, {
                data
            }) => {
                if ([...e.srcElement.classList].includes('node-button-circle')) {
                    return;
                }
                this.onNodeClick(data);
            });

        // Add background rectangle for the nodes 
        nodeEnter
            .patternify({
                tag: 'rect',
                selector: 'node-rect',
                data: d => [d]
            })
            .style("fill", ({
                _children
            }) => _children ? "lightsteelblue" : "#fff")



        // Defined node images wrapper group
        const nodeImageGroups = nodeEnter.patternify({
            tag: 'g',
            selector: 'node-image-group',
            data: d => [d]
        })

        // Add background rectangle for node image
        nodeImageGroups
            .patternify({
                tag: 'rect',
                selector: 'node-image-rect',
                data: d => [d]
            })



        // Node update styles
        const nodeUpdate = nodeEnter.merge(nodesSelection)
            .style('font', '12px sans-serif');



        // Add foreignObject element inside rectangle
        const fo = nodeUpdate
            .patternify({
                tag: 'foreignObject',
                selector: 'node-foreign-object',
                data: d => [d]
            })


        // Add foreign object 
        fo.patternify({
            tag: 'xhtml:div',
            selector: 'node-foreign-object-div',
            data: d => [d]
        })

        this.restyleForeignObjectElements();



        // Add Node button circle's group (expand-collapse button)
        const nodeButtonGroups = nodeEnter
            .patternify({
                tag: 'g',
                selector: 'node-button-g',
                data: d => [d]
            })
            .on('click', (e, d) => this.onButtonClick(d))

        // Add expand collapse button circle 
        nodeButtonGroups
            .patternify({
                tag: 'circle',
                selector: 'node-button-circle',
                data: d => [d]
            })

        // Add button text 
        nodeButtonGroups
            .patternify({
                tag: 'text',
                selector: 'node-button-text',
                data: d => [d]
            })
            .attr('pointer-events', 'none')

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .attr('opacity', 0)
            .duration(this.duration)
            .attr("transform", ({
                x,
                y
            }) => `translate(${x},${y})`)
            .attr('opacity', 1)

        // Move images to desired positions
        nodeUpdate.selectAll('.node-image-group')
            .attr('transform', ({
                imageWidth,
                width,
                imageHeight,
                height
            }) => {
                let x = -imageWidth / 2 - width / 2;
                let y = -imageHeight / 2 - height / 2;
                return `translate(${x},${y})`
            })

        // Style node image rectangles
        nodeUpdate.select('.node-image-rect')
            .attr('fill', ({
                id
            }) => `url(#${id})`)
            .attr('width', ({
                imageWidth
            }) => imageWidth)
            .attr('height', ({
                imageHeight
            }) => imageHeight)
            .attr('stroke', ({
                imageBorderColor
            }) => imageBorderColor)
            .attr('stroke-width', ({
                imageBorderWidth
            }) => imageBorderWidth)
            .attr('rx', ({
                imageRx
            }) => imageRx)
            .attr('y', ({
                imageCenterTopDistance
            }) => imageCenterTopDistance)
            .attr('x', ({
                imageCenterLeftDistance
            }) => imageCenterLeftDistance)
            .attr('filter', ({
                dropShadowId
            }) => dropShadowId)

        // Style node rectangles
        nodeUpdate.select('.node-rect')
            .attr('width', ({
                data
            }) => data.width)
            .attr('height', ({
                data
            }) => data.height)
            .attr('x', ({
                data
            }) => -data.width / 2)
            .attr('y', ({
                data
            }) => -data.height / 2)
            .attr('rx', ({
                data
            }) => data.borderRadius || 0)
            .attr('stroke-width', ({
                data
            }) => data.borderWidth || this.strokeWidth)
            .attr('cursor', 'pointer')
            .attr('stroke', ({
                borderColor
            }) => borderColor)
            .style("fill", ({
                backgroundColor
            }) => backgroundColor)

        // Move node button group to the desired position
        nodeUpdate.select('.node-button-g')
            .attr('transform', ({
                data
            }) => `translate(0,${data.height / 2})`)
            .attr('opacity', ({
                children,
                _children
            }) => {
                if (children || _children) {
                    return 1;
                }
                return 0;
            })

        // Restyle node button circle
        nodeUpdate.select('.node-button-circle')
            .attr('r', 16)
            .attr('stroke-width', ({
                data
            }) => data.borderWidth || this.strokeWidth)
            .attr('fill', this.backgroundColor)
            .attr('stroke', ({
                borderColor
            }) => borderColor)

        // Restyle button texts
        nodeUpdate.select('.node-button-text')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', this.defaultTextFill)
            .attr('font-size', ({
                children
            }) => {
                if (children) return 40;
                return 26;
            })
            .text(({
                children
            }) => {
                if (children) return '-';
                return '+';
            })
            .attr('y', 0)

        // Remove any exiting nodes after transition
        const nodeExitTransition = nodesSelection.exit()
            .attr('opacity', 1)
            .transition()
            .duration(this.duration)
            .attr("transform", d => `translate(${x},${y})`)
            .on('end', function (this: any) {
                d3.select(this).remove();
            })
            .attr('opacity', 0);

        // On exit reduce the node rects size to 0
        nodeExitTransition.selectAll('.node-rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', 0)
            .attr('y', 0);

        // On exit reduce the node image rects size to 0
        nodeExitTransition.selectAll('.node-image-rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', ({
                width
            }) => width / 2)
            .attr('y', ({
                height
            }) => height / 2)

        // Store the old positions for transition.
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }


    // Method which only expands nodes, which have property set "expanded=true"
    expandSomeNodes(d) {

        // If node has expanded property set
        if (d.data.expanded) {

            // Retrieve node's parent
            let parent = d.parent;

            // While we can go up 
            while (parent) {

                // Expand all current parent's children
                if (parent._children) {
                    parent.children = parent._children;
                }

                // Replace current parent holding object
                parent = parent.parent;
            }
        }

        // Recursivelly do the same for collapsed nodes
        if (d._children) {
            d._children.forEach(ch => this.expandSomeNodes(ch));
        }

        // Recursivelly do the same for expanded nodes 
        if (d.children) {
            d.children.forEach(ch => this.expandSomeNodes(ch));
        }
    }

    restyleForeignObjectElements() {

        this.svg.selectAll('.node-foreign-object')
            .attr('width', ({
                width
            }) => width)
            .attr('height', ({
                height
            }) => height)
            .attr('x', ({
                width
            }) => -width / 2)
            .attr('y', ({
                height
            }) => -height / 2)
        this.svg.selectAll('.node-foreign-object-div')
            .style('width', ({
                width
            }) => `${width}px`)
            .style('height', ({
                height
            }) => `${height}px`)
            .style('color', 'white')
            .html(({
                data
            }) => data.template)
    }

    // Toggle children on click.
    onButtonClick(d) {

        // If childrens are expanded
        if (d.children) {

            //Collapse them
            d._children = d.children;
            d.children = null;

            // Set descendants expanded property to false
            this.setExpansionFlagToChildren(d, false);
        } else {

            // Expand children
            d.children = d._children;
            d._children = null;

            // Set each children as expanded
            d.children.forEach(({
                data
            }) => data.expanded = true)
        }

        // Redraw Graph 
        this.update(d);
    }

    // This function changes `expanded` property to descendants
    setExpansionFlagToChildren({
        data,
        children,
        _children
    }, flag) {

        // Set flag to the current property
        data.expanded = flag;

        // Loop over and recursively update expanded children's descendants
        if (children) {
            children.forEach(d => {
                this.setExpansionFlagToChildren(d, flag)
            })
        }

        // Loop over and recursively update collapsed children's descendants
        if (_children) {
            _children.forEach(d => {
                this.setExpansionFlagToChildren(d, flag)
            })
        }
    }




    render() {

    }

}

