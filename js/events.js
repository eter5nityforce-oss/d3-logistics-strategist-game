// Random Events System
class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.lastEventTime = 0;
        this.eventInterval = 10; // Try event every 10 seconds
    }

    checkEvents(time) {
        if (time - this.lastEventTime > this.eventInterval) {
            this.lastEventTime = time;
            if (Math.random() < 0.3) { // 30% chance every 10s
                this.triggerRandomEvent();
            }
        }
    }

    triggerRandomEvent() {
        const events = [
            {
                name: "Economic Boom",
                desc: "Demand increases by 50%!",
                effect: () => {
                    this.gameState.nodes.forEach(n => {
                        if (n.type === 'city') n.demandRate *= 1.5;
                    });
                    setTimeout(() => {
                        this.gameState.nodes.forEach(n => {
                            if (n.type === 'city') n.demandRate /= 1.5;
                        });
                        if (window.ui) window.ui.logEvent("Economic Boom ended.");
                    }, 10000); // Lasts 10s
                }
            },
            {
                name: "Factory Strike",
                desc: "Production halted for 5 seconds!",
                effect: () => {
                    const originalRates = new Map();
                    this.gameState.nodes.forEach(n => {
                        if (n.type === 'factory') {
                            originalRates.set(n.id, n.productionRate);
                            n.productionRate = 0;
                        }
                    });
                    setTimeout(() => {
                        this.gameState.nodes.forEach(n => {
                            if (n.type === 'factory') {
                                n.productionRate = originalRates.get(n.id) || 5;
                            }
                        });
                        if (window.ui) window.ui.logEvent("Strike ended.");
                    }, 5000);
                }
            },
            {
                name: "Tax Hike",
                desc: "Government deducts $500.",
                effect: () => {
                    this.gameState.money -= 500;
                }
            },
            {
                name: "Subsidy",
                desc: "Government grants $300.",
                effect: () => {
                    this.gameState.money += 300;
                }
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        console.log("Event:", event.name);

        if (window.ui && window.ui.logEvent) {
            window.ui.logEvent(`${event.name}: ${event.desc}`);
        }

        event.effect();
    }
}

window.EventSystem = EventSystem;
