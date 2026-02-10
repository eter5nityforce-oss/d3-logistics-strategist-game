// Core Simulation Loop
class GameLoop {
    constructor(gameState) {
        this.gameState = gameState;
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.tickRate = 1000 / 60; // 60 FPS
        this.simulationSpeed = 1;

        // Stats
        this.totalTicks = 0;
        this.nextMaintenance = 1; // Seconds until next maintenance

        // Event System
        if (typeof window !== 'undefined' && window.EventSystem) {
            this.eventSystem = new window.EventSystem(this.gameState);
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            // requestAnimationFrame is browser only
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame((t) => this.loop(t));
            }
        }
    }

    stop() {
        this.isRunning = false;
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000; // in seconds
        this.lastTime = timestamp;

        // Cap deltaTime to avoid huge jumps if tab inactive
        const cappedDelta = Math.min(deltaTime, 0.1);

        this.update(cappedDelta * this.simulationSpeed);

        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    update(dt) {
        this.gameState.time += dt;
        this.totalTicks++;

        // Update Nodes (Production / Demand)
        this.gameState.nodes.forEach(node => {
            if (node.type === 'factory') {
                // Produce goods
                node.storage += node.productionRate * dt;
                if (node.storage > node.capacity) node.storage = node.capacity;
            } else if (node.type === 'city') {
                // Increase demand
                node.currentDemand += node.demandRate * dt;
                if (node.currentDemand > node.capacity) node.currentDemand = node.capacity;
            }
        });

        // Trigger Maintenance Costs every 1 second (game time)
        this.nextMaintenance -= dt;
        if (this.nextMaintenance <= 0) {
            this.deductMaintenance();
            this.nextMaintenance = 1;
        }

        // Check Win/Lose
        this.checkWinLose();

        // Check Events
        if (this.eventSystem) {
            this.eventSystem.checkEvents(this.gameState.time);
        }

        // Spawn Packets
        this.spawnPackets();

        // Move Packets
        this.movePackets(dt);
    }

    deductMaintenance() {
        let cost = 0;
        cost += this.gameState.nodes.length * this.gameState.costs.maintenancePerNode;
        cost += this.gameState.links.length * this.gameState.costs.maintenancePerLink;

        this.gameState.money -= cost;
    }

    checkWinLose() {
        // Safe check for UI
        if (typeof window !== 'undefined' && window.ui && window.ui.showGameOver) {
            if (this.gameState.money < 0) {
                this.stop();
                window.ui.showGameOver("Bankruptcy! You ran out of money.");
            }
            if (this.gameState.money >= 10000) {
                this.stop();
                window.ui.showGameOver("Victory! You are a Logistics Tycoon.");
            }
        }
    }

    spawnPackets() {
        // Simple logic: every factory checks for cities with demand
        if (this.totalTicks % 60 !== 0) return; // Every 60 ticks (~1s)

        const factories = this.gameState.nodes.filter(n => n.type === 'factory');
        const cities = this.gameState.nodes.filter(n => n.type === 'city');

        factories.forEach(factory => {
            if (factory.storage >= 1) { // Needs at least 1 unit
                let targetCity = null;
                let pathNodes = null;
                // Sort cities by demand
                const sortedCities = cities.sort((a, b) => b.currentDemand - a.currentDemand);

                for (const city of sortedCities) {
                    if (city.currentDemand > 0) {
                        const p = this.dijkstra(factory, city);
                        if (p && p.length > 1) { // Path must have at least 2 nodes (start, end)
                            targetCity = city;
                            pathNodes = p;
                            break;
                        }
                    }
                }

                if (targetCity && pathNodes) {
                    factory.storage -= 1;
                    // Create packet
                    const packet = {
                        id: (typeof window !== 'undefined' && window.Utils) ? window.Utils.generateUUID() : 'packet-' + Math.random(),
                        sourceId: factory.id,
                        targetId: targetCity.id,
                        path: pathNodes, // Array of Nodes
                        currentNodeIndex: 0, // Index in path array
                        progress: 0, // 0 to 1 between current and next node
                        value: 100 // Revenue per packet
                    };
                    this.gameState.packets.push(packet);
                }
            }
        });
    }

    movePackets(dt) {
        for (let i = this.gameState.packets.length - 1; i >= 0; i--) {
            const p = this.gameState.packets[i];

            if (p.currentNodeIndex >= p.path.length - 1) {
                // Already arrived? Should be handled.
                this.gameState.packets.splice(i, 1);
                this.packetArrived(p);
                continue;
            }

            const currentNode = p.path[p.currentNodeIndex];
            const nextNode = p.path[p.currentNodeIndex + 1];

            // Find link speed/distance
            // Optimization: Cache link or look it up efficiently
            // For now, search links
            const link = this.gameState.links.find(l =>
                (l.source.id === currentNode.id && l.target.id === nextNode.id) ||
                (l.source.id === nextNode.id && l.target.id === currentNode.id)
            );

            if (!link) {
                // Link broken? Teleport or delete packet?
                // Delete packet
                this.gameState.packets.splice(i, 1);
                continue;
            }

            // Calculate speed relative to link distance
            const speed = link.speed; // e.g. 100 px/s
            const progressIncrement = (speed * dt) / link.distance;

            p.progress += progressIncrement;

            if (p.progress >= 1) {
                // Reached next node
                p.currentNodeIndex++;
                p.progress = 0;

                if (p.currentNodeIndex >= p.path.length - 1) {
                    // Reached destination
                    this.gameState.packets.splice(i, 1);
                    this.packetArrived(p);
                }
            }
        }
    }

    packetArrived(packet) {
        const target = this.gameState.nodes.find(n => n.id === packet.targetId);
        if (target && target.type === 'city') {
            target.currentDemand = Math.max(0, target.currentDemand - 1);
            this.gameState.money += packet.value;
        }
    }

    dijkstra(startNode, endNode) {
        const distances = {};
        const previous = {};
        const queue = [];

        this.gameState.nodes.forEach(node => {
            distances[node.id] = Infinity;
            previous[node.id] = null;
            queue.push(node.id);
        });

        distances[startNode.id] = 0;

        while (queue.length > 0) {
            let minNodeId = null;
            let minDist = Infinity;

            queue.forEach(id => {
                if (distances[id] < minDist) {
                    minDist = distances[id];
                    minNodeId = id;
                }
            });

            if (minNodeId === null) break;
            if (minNodeId === endNode.id) break;

            const index = queue.indexOf(minNodeId);
            queue.splice(index, 1);

            // Neighbors
            this.gameState.links.forEach(link => {
                let neighborId = null;
                if (link.source.id === minNodeId) neighborId = link.target.id;
                else if (link.target.id === minNodeId) neighborId = link.source.id;

                if (neighborId && queue.includes(neighborId)) {
                    const alt = distances[minNodeId] + link.distance;
                    if (alt < distances[neighborId]) {
                        distances[neighborId] = alt;
                        previous[neighborId] = minNodeId; // Store node ID only
                    }
                }
            });
        }

        // Reconstruct path (Nodes)
        const path = [];
        let curr = endNode.id;
        if (previous[curr] !== null || curr === startNode.id) {
            // Check reachability: if curr != startNode and previous[curr] is null, then unreachable
            // But the condition previous[curr] !== null covers it except for startNode case.
            // If disconnected, previous[endNode.id] is null.

            // Reconstruct backwards
            while (curr !== null) {
                const node = this.gameState.nodes.find(n => n.id === curr);
                path.unshift(node);
                if (curr === startNode.id) break;
                curr = previous[curr];
            }
            if (path[0].id === startNode.id) return path;
        }
        return null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
} else {
    window.GameLoop = GameLoop;
}
