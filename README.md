# Baghchal.js

An independent, lightweight JavaScript library and HTML5 Canvas renderer for the traditional Nepali board game **Baghchal** (Tigers & Goats), powered by the **Online Baghchal Exchange (OBX)** notation standard ([bhu1st/obx](https://github.com/bhu1st/obx)).

---

## 🌟 Key Features

* **OBX Notation Support**: Parses and outputs standard OBX strings representing any game state.
* **HTML5 Canvas Renderer**: Renders the 5×5 Baghchal board dynamically into any HTML container element.
* **Smart Move Generator (`nextMove`)**: Calculates legal moves for Tigers and Goats, prioritizing Tiger capture jumps and strategic Goat placements.
* **Particle Explosion Animations**: Displays looping red blood particle explosion effects on nodes where Goat captures occur.
* **Piece Count Validation**: Automatically validates game piece limits (max 4 Tigers, max 20 total Goats) and surfaces descriptive warnings for invalid state strings.
* **Zero Dependencies**: Pure Vanilla JavaScript with zero external runtime dependencies.

---

## 🚀 Quick Start

### 1. Include the Library

Include [`baghchal.js`](baghchal.js) in your HTML document:

```html
<script src="baghchal.js"></script>
```

### 2. Add a Target Container

```html
<div id="myBaghchalBoard"></div>
```

### 3. Initialize the Board

```javascript
// Initialize board with an OBX state string
const game = new Baghchal('#myBaghchalBoard', 'TXXXT/XXXXX/XXGXX/XXXXX/TXXXT t @19 c0 mC3', {
    width: 380,
    loopCaptureAnimation: true,
    showStateInfo: true
});
```

---

## 📖 Usage Examples

### Example 1: Generate Next Recommended Move

```javascript
// Calculate next move for the active player (Tiger or Goat)
const recommendedMove = game.nextMove();
console.log("Recommended Move:", recommendedMove); // e.g. "mA1C3"
```

Or call the static move generator directly without rendering a DOM board:

```javascript
const obx = "TXXXT/XGXXX/XXXXX/XXXXX/TXXXT g @19 c1 mA1C3";
const nextMove = Baghchal.nextMove(obx);
console.log("Next Move:", nextMove);
```

### Example 2: Parse OBX State & Access Details

```javascript
const state = Baghchal.parseOBX("TXXXT/XGXXX/XXXXX/XXXXX/TXXXT g @19 c1 mA1C3");

console.log("Turn:", state.turn);                // "goat"
console.log("Tigers Count:", state.tigerCount);  // 4
console.log("Goats Unplaced:", state.goatsToPlace); // 19
console.log("Captured Goats:", state.capturedGoats); // 1
console.log("Is Valid State:", state.isValid);   // true
```

### Example 3: Tiger Capture Move with Live Particle Loop

When an OBX string contains a capture move notation (e.g. `mA1C3` jumping over `B2`), `Baghchal.js` automatically renders a looping particle explosion on the captured node (`B2`):

```javascript
// Tiger at A1 jumps over B2 eating Goat, landing at C3
game.setObx("TXXXT/XGXXX/XXXXX/XXXXX/TXXXT g @19 c1 mA1C3");
```

### Example 4: Invalid Piece Count Warning

If an OBX string exceeds maximum allowed game piece limits (max 4 Tigers, max 20 Goats):

```javascript
const game = new Baghchal('#myBaghchalBoard', 'TTTTT/GGGGG/GGGGG/GGGGG/TGGGT g @5 c5 -');
// Renders warning banner: "⚠️ Warning: Invalid number of allowed game pieces!"
```

---

## 🛠️ API Reference

### `new Baghchal(container, obxString, options)`

Creates and mounts a Baghchal canvas board instance into `container`.

#### Options:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `width` | `number` | `380` | Maximum board canvas width in pixels |
| `loopCaptureAnimation` | `boolean` | `true` | Loops particle explosion on capture moves |
| `showStateInfo` | `boolean` | `true` | Displays OBX state info box below canvas |
| `themeColor` | `string` | `"rgb(0, 64, 65)"` | Primary board border & line color |
| `accentColor` | `string` | `"#ffff00"` | Highlight & text accent color |

#### Instance Methods:

* **`game.setObx(obxString)`**: Updates the board state to a new OBX string.
* **`game.nextMove()`**: Returns the next calculated move in OBX notation (e.g., `"mA1C3"`).
* **`game.destroy()`**: Clears the canvas and unmounts the instance from the DOM.

#### Static Helper Methods:

* **`Baghchal.parseOBX(obxString)`**: Parses an OBX string into state objects.
* **`Baghchal.nextMove(obxOrState)`**: Computes the next best move.
* **`Baghchal.coordToIndex("C3")`**: Converts coordinate `C3` to grid index `12`.
* **`Baghchal.indexToCoord(12)`**: Converts grid index `12` to coordinate `C3`.
* **`Baghchal.isConnected(i, j, points)`**: Checks adjacency/connection between two grid points.
* **`Baghchal.getJump(fromIdx, toIdx, points)`**: Calculates jump midpoint index for tiger captures.

---

## ♟️ OBX Notation Format

The **Online Baghchal Exchange (OBX)** string format is structured as:

`[Board Grid] [Turn] @[Unplaced Goats] c[Captured Goats] [Last Move]`

### Components:
* **Board Grid**: 5 rows separated by `/`. `T` = Tiger, `G` = Goat, `X` = Empty.
* **Turn**: `g` for Goat turn, `t` for Tiger turn.
* **@[Unplaced]**: Remaining goats to place (e.g. `@20` down to `@0`).
* **c[Captured]**: Number of goats captured by Tigers (e.g. `c0` to `c5`).
* **Last Move**: Notation of previous move (e.g. `mC3` for placement, `mA1C3` for jump/move, or `-` for initial).

---

## 🎨 Interactive Demos

* **[demo.html](demo.html)**: Interactive OBX Playground & Move Generator.
* **[tutorial.html](tutorial.html)**: 5-Lesson Interactive Rules & Capture Tutorial with clickable OBX examples.

---

## 📜 License

[MIT License](LICENSE) • Copyright (c) 2026 Bhupal Sapkota
