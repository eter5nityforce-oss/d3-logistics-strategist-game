// D3.js Map & UI Rendering
class Renderer {
    constructor(containerId) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Append SVG to container
        this.svg = d3.select(containerId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .style("max-width", "100%")
            .style("height", "auto")
            .style("background-color", "#1a1a2e"); // Match body bg

        // Main container for map elements that will be transformed
        this.container = this.svg.append("g");

        // Layers (Order matters for z-index)
        this.linkGroup = this.container.append("g").attr("class", "links-layer");
        this.nodeGroup = this.container.append("g").attr("class", "nodes-layer");
        this.packetGroup = this.container.append("g").attr("class", "packets-layer");

        // Zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                this.container.attr("transform", event.transform);
            });

        this.svg.call(this.zoom)
            .on("dblclick.zoom", null);

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.svg.attr("width", this.width).attr("height", this.height);
    }

    renderMap(gameState) {
        // Render Links
        const links = this.linkGroup.selectAll("line")
            .data(gameState.links, d => d.id);

        links.exit().remove();

        const linksEnter = links.enter().append("line")
            .attr("class", "link")
            .attr("stroke", "#533483")
            .attr("stroke-width", 2)
            .attr("opacity", 0.6);

        links.merge(linksEnter)
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Render Nodes
        const nodes = this.nodeGroup.selectAll("g")
            .data(gameState.nodes, d => d.id);

        nodes.exit().remove();

        const nodesEnter = nodes.enter().append("g")
            .attr("class", "node-group")
            .attr("cursor", "pointer")
            .attr("id", d => `node-${d.id}`);

        nodesEnter.append("circle")
            .attr("class", "node-circle")
            .attr("r", 15)
            .attr("fill", d => d.type === 'city' ? '#e94560' : '#0f3460')
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        nodesEnter.append("text")
            .attr("class", "node-label")
            .attr("dy", 25)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "12px")
            .text(d => d.label);

        nodes.merge(nodesEnter)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Initial stat update
        this.updateStats(gameState);
    }

    updateStats(gameState) {
        // Efficiently update text only
        this.nodeGroup.selectAll(".node-label")
            .text(d => {
                // d is bound data from parent group
                if (d.type === 'city') return `City (Dem: ${Math.floor(d.currentDemand)})`;
                if (d.type === 'factory') return `Factory (Sto: ${Math.floor(d.storage)})`;
                return d.label;
            });
    }

    renderPackets(gameState) {
        const packets = this.packetGroup.selectAll("circle")
            .data(gameState.packets, d => d.id);

        packets.exit().remove();

        const packetsEnter = packets.enter().append("circle")
            .attr("class", "packet")
            .attr("r", 5)
            .attr("fill", "#ffd700"); // Gold color for goods

        packets.merge(packetsEnter)
            .attr("cx", d => {
                const curr = d.path[d.currentNodeIndex];
                const next = d.path[d.currentNodeIndex + 1];
                if (!curr || !next) return 0; // Should not happen
                return curr.x + (next.x - curr.x) * d.progress;
            })
            .attr("cy", d => {
                const curr = d.path[d.currentNodeIndex];
                const next = d.path[d.currentNodeIndex + 1];
                if (!curr || !next) return 0;
                return curr.y + (next.y - curr.y) * d.progress;
            });
    }
}

window.Renderer = Renderer;
