// Overlay UI Management
class UI {
    constructor(gameState) {
        this.gameState = gameState;
        this.moneyDisplay = document.getElementById('money-display');
        this.timeDisplay = document.getElementById('time-display');
        this.dashboard = document.getElementById('dashboard');
        this.eventLog = document.getElementById('event-log');
        this.chartContainer = document.getElementById('profit-chart');

        this.history = [];
        this.maxHistory = 60; // 60 data points (e.g. 60 seconds)

        this.setupChart();

        // Update interval for history
        this.lastHistoryUpdate = 0;
    }

    setupChart() {
        // D3 Chart setup
        const margin = {top: 10, right: 10, bottom: 20, left: 40};
        const width = this.chartContainer.clientWidth - margin.left - margin.right;
        const height = this.chartContainer.clientHeight - margin.top - margin.bottom;

        this.svgChart = d3.select("#profit-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        this.xScale = d3.scaleLinear().range([0, width]);
        this.yScale = d3.scaleLinear().range([height, 0]);

        this.line = d3.line()
            .x((d, i) => this.xScale(i))
            .y(d => this.yScale(d));

        this.path = this.svgChart.append("path")
            .attr("fill", "none")
            .attr("stroke", "#e94560") // Pink/Red
            .attr("stroke-width", 2);

        // Axes
        this.xAxisGroup = this.svgChart.append("g")
            .attr("transform", `translate(0,${height})`);
        this.yAxisGroup = this.svgChart.append("g");
    }

    update() {
        this.moneyDisplay.textContent = `Money: $${Math.floor(this.gameState.money)}`;
        this.timeDisplay.textContent = `Time: ${Math.floor(this.gameState.time)}`;

        // Update history every 1 second (game time)
        if (Math.floor(this.gameState.time) > this.lastHistoryUpdate) {
            this.lastHistoryUpdate = Math.floor(this.gameState.time);
            this.history.push(this.gameState.money);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
            this.updateChart();
        }
    }

    updateChart() {
        if (this.history.length < 2) return;

        // Update domains
        // x scale is based on history index (0 to length-1)
        this.xScale.domain([0, this.history.length - 1]);
        const min = d3.min(this.history);
        const max = d3.max(this.history);
        this.yScale.domain([Math.min(0, min), Math.max(2000, max)]); // Keep 0 visible, 2000 base

        // Update line
        this.path.datum(this.history)
            .attr("d", this.line);

        // Update axes
        // this.xAxisGroup.call(d3.axisBottom(this.xScale).ticks(5)); // Time ticks
        this.yAxisGroup.call(d3.axisLeft(this.yScale).ticks(5));
    }

    showGameOver(message) {
        // Simple alert or modal
        // Create a modal overlay
        const modal = d3.select("body").append("div")
            .attr("class", "modal-overlay")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background", "rgba(0,0,0,0.8)")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("z-index", "1000");

        const content = modal.append("div")
            .style("background", "#16213e")
            .style("padding", "40px")
            .style("border-radius", "8px")
            .style("text-align", "center")
            .style("border", "2px solid #e94560");

        content.append("h2")
            .text("Game Over")
            .style("color", "#fff");

        content.append("p")
            .text(message)
            .style("color", "#e0e0e0")
            .style("font-size", "1.2em");

        content.append("button")
            .text("Restart")
            .style("background", "#e94560")
            .style("color", "white")
            .style("border", "none")
            .style("padding", "10px 20px")
            .style("margin-top", "20px")
            .style("cursor", "pointer")
            .style("border-radius", "4px")
            .on("click", () => {
                location.reload();
            });
    }

    logEvent(message) {
        const div = document.createElement('div');
        div.className = 'event-msg';
        div.textContent = message;
        this.eventLog.prepend(div);
        // Clean up old messages
        if (this.eventLog.children.length > 5) {
            this.eventLog.removeChild(this.eventLog.lastChild);
        }
    }
}

window.UI = UI;
