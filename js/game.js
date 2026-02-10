// Game State Management

// Ensure Utils is available if running in Node.js environment for testing
if (typeof window === 'undefined') {
    global.window = {};
    // Mock Utils for Node environment if not present
    if (!global.window.Utils) {
        global.window.Utils = {
            generateUUID: function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            distance: function(x1, y1, x2, y2) {
                return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            }
        };
    }
}

class GameState {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.packets = [];
        this.money = 2000;
        this.time = 0;
        this.isRunning = false;

        // Settings
        this.costs = {
            city: 500,
            factory: 1000,
            linkBase: 100, // Cost per unit distance
            maintenancePerNode: 1, // per tick/second
            maintenancePerLink: 0.5
        };
    }

    addNode(type, x, y) {
        // Basic validation
        if (!['city', 'factory'].includes(type)) {
            console.error("Invalid node type:", type);
            return null;
        }

        const id = window.Utils.generateUUID();
        const node = new Node(id, type, x, y);
        this.nodes.push(node);
        return node;
    }

    addLink(sourceId, targetId) {
        if (sourceId === targetId) return null;

        // Check if link exists (undirected graph logic for existence, but directed for data structure if needed)
        // Let's assume links are bidirectional for transport, but we store one object.
        const exists = this.links.find(l =>
            (l.source.id === sourceId && l.target.id === targetId) ||
            (l.source.id === targetId && l.target.id === sourceId)
        );
        if (exists) return null;

        const source = this.nodes.find(n => n.id === sourceId);
        const target = this.nodes.find(n => n.id === targetId);

        if (source && target) {
            const link = new Link(source, target);
            this.links.push(link);
            return link;
        }
        return null;
    }

    removeNode(nodeId) {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.links = this.links.filter(l => l.source.id !== nodeId && l.target.id !== nodeId);
    }
}

class Node {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type; // 'city', 'factory'
        this.x = x;
        this.y = y;
        this.label = type === 'city' ? 'City' : 'Factory';

        // Simulation Stats
        this.storage = 0;
        this.capacity = 500;
        this.productionRate = type === 'factory' ? 5 : 0; // units per second
        this.demandRate = type === 'city' ? 2 : 0; // units per second
        this.currentDemand = 0; // Accumulated unmet demand for cities
    }
}

class Link {
    constructor(source, target) {
        this.id = window.Utils.generateUUID();
        this.source = source; // Node object
        this.target = target; // Node object
        this.distance = window.Utils.distance(source.x, source.y, target.x, target.y);
        this.capacity = 10; // Max packets at once? Or throughput?
        this.speed = 100; // Pixels per second
    }
}

class Packet {
    constructor(sourceId, targetId, path) {
        this.id = window.Utils.generateUUID();
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.path = path; // Array of Links
        this.currentLinkIndex = 0;
        this.progress = 0; // 0 to 1
        this.value = 100;
    }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, Node, Link, Packet };
} else {
    window.GameState = GameState;
    window.Node = Node;
    window.Link = Link;
    window.Packet = Packet;
}
