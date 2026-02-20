// User Interaction Logic
class Interaction {
    constructor(svg, gameState, renderer) {
        this.svg = svg;
        this.gameState = gameState;
        this.renderer = renderer;
        this.currentTool = 'select'; // 'select', 'city', 'factory'

        // Temp line for linking
        this.dragLine = this.renderer.container.append("line")
            .attr("stroke", "#e94560")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("opacity", 0)
            .attr("pointer-events", "none"); // Don't block events

        // Bind UI buttons
        this.setupUI();

        // Bind SVG events
        this.svg.on("click", (event) => this.handleMapClick(event));

        // Initial binding (if any nodes exist)
        this.bindNodeInteractions();
    }

    setupUI() {
        d3.select("#tool-select").on("click", () => this.setTool('select'));
        d3.select("#tool-city").on("click", () => this.setTool('city'));
        d3.select("#tool-factory").on("click", () => this.setTool('factory'));
    }

    setTool(tool) {
        this.currentTool = tool;
        d3.selectAll(".tool-btn").classed("active", false);
        d3.select(`#tool-${tool}`).classed("active", true);
        console.log("Tool selected:", tool);
    }

    handleMapClick(event) {
        // Ignore clicks on existing nodes (handled by node click listeners if any, or stopPropagation)
        // But here we are on SVG background.
        if (event.defaultPrevented) return; // Dragged or handled

        // Get coordinates relative to the transformed container
        // d3.pointer returns [x, y] relative to the target.
        // If we click on SVG, we need to transform it.
        const transform = d3.zoomTransform(this.renderer.svg.node());
        const point = d3.pointer(event, this.renderer.svg.node());
        const [x, y] = transform.invert(point);

        if (this.currentTool === 'city') {
            if (this.gameState.money >= this.gameState.costs.city) {
                this.gameState.money -= this.gameState.costs.city;
                this.gameState.addNode('city', x, y);
                this.updateMap();
            } else {
                console.log("Not enough money!");
            }
        } else if (this.currentTool === 'factory') {
            if (this.gameState.money >= this.gameState.costs.factory) {
                this.gameState.money -= this.gameState.costs.factory;
                this.gameState.addNode('factory', x, y);
                this.updateMap();
            } else {
                console.log("Not enough money!");
            }
        }
    }

    updateMap() {
        this.renderer.renderMap(this.gameState);
        if (window.ui) window.ui.update();
        this.bindNodeInteractions();
    }

    bindNodeInteractions() {
        const nodes = d3.selectAll(".node-group");

        const drag = d3.drag()
            .on("start", (event, d) => this.dragStarted(event, d))
            .on("drag", (event, d) => this.dragged(event, d))
            .on("end", (event, d) => this.dragEnded(event, d));

        nodes.call(drag);

        // Also handle click on node for selection or info
        nodes.on("click", (event, d) => {
            event.stopPropagation(); // Prevent map click
            console.log("Node clicked:", d);
            // Show info in UI?
        });
    }

    dragStarted(event, d) {
        // Prevent zoom
        event.sourceEvent.stopPropagation();

        this.dragSource = d;
        this.dragLine
            .attr("x1", d.x)
            .attr("y1", d.y)
            .attr("x2", d.x)
            .attr("y2", d.y)
            .attr("opacity", 1);
    }

    dragged(event, d) {
        // Get mouse position relative to container
        // event.x/y are relative to the subject (d.x/d.y) + change
        // But d3.drag on node might be tricky with transforms.
        // d3.pointer(event, this.renderer.container.node()) is safer.
        const [x, y] = d3.pointer(event, this.renderer.container.node());
        this.dragLine
            .attr("x2", x)
            .attr("y2", y);
    }

    dragEnded(event, d) {
        this.dragLine.attr("opacity", 0);

        // Check what we dropped on
        // We can check if the mouse is over another node
        // event.sourceEvent.target might work

        // Or calculate distance to all nodes
        const [x, y] = d3.pointer(event, this.renderer.container.node());

        // Find node close to x,y
        const target = this.gameState.nodes.find(n => {
            if (n.id === d.id) return false;
            const dist = window.Utils.distance(n.x, n.y, x, y);
            return dist < 20; // Radius + buffer
        });

        if (target) {
            console.log("Link created from", d.id, "to", target.id);
            // Calculate link cost
            const dist = window.Utils.distance(d.x, d.y, target.x, target.y);
            const cost = Math.floor(dist * (this.gameState.costs.linkBase / 100)); // e.g. 1 per unit

            if (this.gameState.money >= cost) {
                const link = this.gameState.addLink(d.id, target.id);
                if (link) {
                    this.gameState.money -= cost;
                    this.updateMap();
                }
            } else {
                console.log("Not enough money for link!");
            }
        }

        this.dragSource = null;
    }
}

window.Interaction = Interaction;
