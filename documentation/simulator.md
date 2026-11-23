# RackVision AI — Interactive 3D Simulator Architecture

## 1. Technical Implementation
The 3D simulator is engineered using **Three.js**, **React Three Fiber (R3F)**, and **Drei**. It transforms structured scene descriptors into an interactive physical simulation.

### Scene Hierarchy
```
<Canvas>
  ├── <PerspectiveCamera> / <OrthographicCamera>
  ├── <OrbitControls> / <PointerLockControls> (First-Person Walkthrough)
  ├── <ambientLight> & <directionalLight> & <pointLight>
  ├── <RoomShell> (Walls, Floor tiles, Ceiling grid)
  ├── <ServerRackGroup>
  │     └── <ServerRackItem> (Chassis, Blinking Status LEDs, Rack Label)
  ├── <CoolingUnitGroup> (CRAC Fans & Exhaust Grilles)
  ├── <PDUGroup> (Primary & Redundant Power Transformers)
  ├── <CableTrayGroup> (Overhead Wire-Mesh Pathways)
  ├── <ColdAisleContainment> (Translucent Cyan Panels)
  └── <AirflowParticles> (Instanced Mesh Laminar Flow Simulation)
```

## 2. Animated Physics & Simulation Features

### A. Airflow Particle Simulation
- **Cold Aisle Airflow**: Particles emerge from underfloor perforated grilles and flow upward into server rack front bezels with laminar velocity vectors $(\vec{v} = [0, 1.2, 0] \text{ m/s})$ colored in electric cyan (`#00F0FF`).
- **Hot Exhaust Dissipation**: Particles exit rack rear doors and rise toward ceiling return plenums with thermal velocity vectors colored in warm amber/red (`#EF4444`).

### B. Interactive Camera Modes
- **Perspective Orbit**: Free rotational 360-degree inspection with smooth damping.
- **Top-Down (Plan View)**: Blueprint-style orthogonal inspection for aisle alignment checks.
- **Front Elevation**: Horizontal cross-section view.
- **Side Elevation**: Aisle depth and clearance view.
- **First-Person Walkthrough**: WASD keyboard translation + mouse look at eye height (1.7m) enabling immersive physical walk-throughs.

### C. Live Component Inspection
Clicking any server rack opens a real-time telemetry card displaying:
- Rack ID and assigned aisle row
- Active IT power draw (kW)
- Thermal heat dissipation
- Connected dual A/B PDU feeds
- Blade server chassis count and status
