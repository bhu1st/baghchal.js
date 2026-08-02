# Explanation of the `points` Variable in Baghchal

In [`baghchal.html`](file:///x:/baghchal.net/baghchal-pro/baghchal.js/baghchal.html), the **`points`** variable acts as the **central state repository for the 5×5 Baghchal game board**.

It is a 1-dimensional array containing **25 objects** (indexed `0` to `24`), corresponding to the 25 line intersections on the board grid.

---

## 1. Data Structure of a Point Object

Each element in `points` is generated during `resetGame()`:

```javascript
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 5; x++) {
    points.push({
      x: 40 + x * 80,  // Canvas X pixel coordinate (40px padding + 80px cell size)
      y: 40 + y * 80,  // Canvas Y pixel coordinate
      piece: null,     // Current piece occupying this spot: null | "goat" | "tiger"
      r: y,            // Grid row index (0 to 4)
      c: x,            // Grid column index (0 to 4)
      highlight: false // Boolean: true if this spot is a valid target move
    });
  }
}
```

---

## 2. Grid Index Layout (0 to 24)

The 2D grid is flattened into a 1D array where `index = row * 5 + col`:

| Column 0 | Column 1 | Column 2 | Column 3 | Column 4 |
| :---: | :---: | :---: | :---: | :---: |
| **0** *(0,0)* | **1** *(0,1)* | **2** *(0,2)* | **3** *(0,3)* | **4** *(0,4)* |
| **5** *(1,0)* | **6** *(1,1)* | **7** *(1,2)* | **8** *(1,3)* | **9** *(1,4)* |
| **10** *(2,0)* | **11** *(2,1)* | **12** *(2,2)* | **13** *(2,3)* | **14** *(2,4)* |
| **15** *(3,0)* | **16** *(3,1)* | **17** *(3,2)* | **18** *(3,3)* | **19** *(3,4)* |
| **20** *(4,0)* | **21** *(4,1)* | **22** *(4,2)* | **23** *(4,3)* | **24** *(4,4)* |

* **Corner Tigers Initialization**:
  ```javascript
  [0, 4, 20, 24].forEach(i => points[i].piece = "tiger");
  ```
  Places tigers at the 4 board corners at game start.

---

## 3. How Movement & Adjacency Check (`isConnected`) Works

The `isConnected(i, j)` function checks whether a piece can legally move directly from point index `i` to point index `j` along a drawn board line.

```javascript
function isConnected(i, j) {
    const p1 = points[i], p2 = points[j];
    const dr = Math.abs(p1.r - p2.r), dc = Math.abs(p1.c - p2.c);
    if (dr > 1 || dc > 1) return false;
    return (dr + dc === 1) || (dr === 1 && dc === 1 && (p1.r + p1.c) % 2 === 0);
}
```

### Mathematical Breakdown:

1. **Row & Column Differences**:
   - `dr = |row_1 - row_2|`
   - `dc = |col_1 - col_2|`

2. **Distance Guard (`dr > 1 || dc > 1`)**:
   - Rejects any points that are more than 1 grid step apart in either dimension.

3. **Orthogonal Movement (`dr + dc === 1`)**:
   - Evaluates to `true` for 1 step horizontally (`dr=0, dc=1`) or vertically (`dr=1, dc=0`).
   - Every point on the Baghchal board is connected orthogonally to its immediate neighbors.

4. **Diagonal Movement (`dr === 1 && dc === 1 && (p1.r + p1.c) % 2 === 0`)**:
   - Evaluates to `true` for 1 step diagonally (`dr=1, dc=1`).
   - **Diagonal Parity Rule**: On a standard Baghchal board, diagonal lines only pass through points where `(row + col)` is **EVEN** (`(p1.r + p1.c) % 2 === 0`).
   - **Examples**:
     - `(0,0)`: $0+0 = 0$ (Even) $\to$ **Diagonal moves allowed** (e.g. to `(1,1)`).
     - `(2,2)`: $2+2 = 4$ (Even) $\to$ **Diagonal moves allowed** to all 4 diagonal neighbors.
     - `(0,1)`: $0+1 = 1$ (Odd) $\to$ **No diagonal moves** (horizontal/vertical only).

---

## 4. How `points` is Used Across Functions

1. **Click / Touch Hit Testing (`handleInput`)**:
   Determines which point node the player tapped on the HTML5 `<canvas>` using distance calculations:
   ```javascript
   const idx = points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 30);
   ```

2. **Movement & Adjacency Check (`isConnected`)**:
   Uses grid coordinates `r` and `c` of two point objects (`points[i]` & `points[j]`) to check if a valid line connection exists between them according to Baghchal rules.

3. **Tiger Capture & Jump Calculation (`getJump`)**:
   Calculates the midpoint coordinates between a Tiger's current position and target landing spot:
   ```javascript
   points.findIndex(p => p.r === (p1.r + dr / 2) && p.c === (p1.c + dc / 2));
   ```
   If a Goat (`piece === "goat"`) occupies this midpoint, it is captured and removed (`points[midIdx].piece = null`).

4. **Move Highlighting (`highlightMoves`)**:
   Sets `points[t].highlight = true` for valid target nodes when a piece is selected so the canvas can render yellow target rings.

5. **Canvas Rendering (`renderLoop`)**:
   Iterates through `points` to render:
   - Intersection dots (`arc(p.x, p.y, 5)`)
   - Yellow move target overlays (`highlight === true`)
   - Goat 🐐 / Tiger 🐯 emojis based on `p.piece`
