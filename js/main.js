// Main Entry Point
window.onload = function() {
    console.log("Initializing D3 Logistics Strategist...");

    // Create Game State
    const gameState = new window.GameState();

    // Create Renderer
    const renderer = new window.Renderer('#game-container');

    // Create UI
    window.ui = new window.UI(gameState);

    // Create Simulation
    const gameLoop = new window.GameLoop(gameState);

    // Initialize Interaction
    const interaction = new window.Interaction(renderer.svg, gameState, renderer);

    // Start Game
    gameLoop.start();

    // Simple Render Loop (separate from simulation)
    function renderLoop() {
        if (window.ui) window.ui.update();

        if (renderer) {
            renderer.renderPackets(gameState);
            renderer.updateStats(gameState);
        }

        requestAnimationFrame(renderLoop);
    }
    renderLoop();
};
