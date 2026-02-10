# D3 물류 전략가 게임 (D3 Logistics Strategist)

A sophisticated browser-based strategy game where players design, build, and optimize a global supply chain network using D3.js.

## Overview

In **D3 Logistics Strategist**, you act as a supply chain manager. Your goal is to build a profitable network by connecting Factories (Supply) to Cities (Demand). You must manage your budget, optimize routes, and adapt to changing market conditions and random events.

## Features

1.  **Interactive Map**: A zoomable, panable infinite canvas built with D3.js.
2.  **Network Construction**:
    *   **Place Nodes**: Build **Factories** (produce goods) and **Cities** (consume goods).
    *   **Build Links**: Drag from one node to another to create transport routes.
3.  **Real-time Simulation**:
    *   **Goods Flow**: Watch packets travel along your network in real-time.
    *   **Economy**: Track money, construction costs, maintenance fees, and delivery revenue.
    *   **Supply & Demand**: Factories produce stock; Cities generate demand. Goods only move if there is a path and demand.
4.  **Pathfinding**: Autonomous routing using Dijkstra's algorithm. Goods automatically find the shortest path to a destination.
5.  **Dynamic Dashboard**:
    *   Real-time **Profit Chart** visualization using D3.
    *   Live stats on Money and Time.
    *   Event log for game notifications.
6.  **Event System**: Random events like "Economic Boom" (increased demand) or "Strikes" (halted production) challenge your strategy.
7.  **Win/Lose Conditions**:
    *   **Victory**: Amass $10,000 in profit.
    *   **Defeat**: Go bankrupt (Money < 0).

## Architecture

The project follows a modular architecture:
*   `index.html`: Main entry point and UI structure.
*   `js/main.js`: Bootstraps the game components.
*   `js/game.js`: Manages the `GameState` (data model for nodes, links, economy).
*   `js/renderer.js`: Handles all D3.js visual rendering (SVG, transitions, zoom).
*   `js/simulation.js`: The core `GameLoop` handling logic, physics, and pathfinding.
*   `js/interaction.js`: Manages user inputs (clicks, drags) and tool switching.
*   `js/ui.js`: Controls the overlay dashboard and D3 charts.
*   `js/events.js`: Generates random game events.
*   `js/utils.js`: Helper functions.

## Demo: How to Run

Since this is a client-side web application, you can run it using any static file server.

### Prerequisites
*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   Internet connection (to load D3.js from CDN).

### Steps

1.  **Clone or Download** the repository.
2.  **Start a Local Server**:
    *   **Python 3**:
        ```bash
        python3 -m http.server
        ```
    *   **Node.js (http-server)**:
        ```bash
        npx http-server .
        ```
    *   **VS Code**: Right-click `index.html` and select "Open with Live Server".
3.  **Open in Browser**:
    *   Navigate to `http://localhost:8000` (or whatever port your server uses).
4.  **Play**:
    *   Select **Build Factory** ($1000) and click on the map.
    *   Select **Build City** ($500) and click on the map.
    *   **Drag** from the Factory to the City to create a road.
    *   Watch goods flow and profit grow!

## Controls
*   **Select Tool**: View node details (hover/click).
*   **Build City**: Place a city.
*   **Build Factory**: Place a factory.
*   **Create Link**: Click and drag from one node to another (works in any mode).
*   **Pan/Zoom**: Click and drag background to pan; Scroll to zoom.
