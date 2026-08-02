/**
 * Baghchal.js - Independent Baghchal & OBX Engine Library
 * Standard OBX Notation & Engine based on github.com/bhu1st/obx
 */

(function (global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        global.Baghchal = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    const COLS = ["A", "B", "C", "D", "E"];

    // Utility: Coordinate <-> Index Converters
    function coordToIndex(coord) {
        if (!coord || coord.length < 2) return -1;
        const c = coord.charAt(0).toUpperCase();
        const r = parseInt(coord.charAt(1), 10);
        const colIdx = COLS.indexOf(c);
        if (colIdx === -1 || isNaN(r) || r < 1 || r > 5) return -1;
        return (r - 1) * 5 + colIdx;
    }

    function indexToCoord(idx) {
        if (idx < 0 || idx >= 25) return "";
        const c = COLS[idx % 5];
        const r = Math.floor(idx / 5) + 1;
        return c + r;
    }

    // Grid Adjacency & Jump Math
    function isConnected(i, j, points) {
        const p1 = points[i], p2 = points[j];
        const dr = Math.abs(p1.r - p2.r), dc = Math.abs(p1.c - p2.c);
        if (dr > 1 || dc > 1) return false;
        return (dr + dc === 1) || (dr === 1 && dc === 1 && (p1.r + p1.c) % 2 === 0);
    }

    function getJump(tIdx, targetIdx, points) {
        const p1 = points[tIdx], p2 = points[targetIdx];
        const dr = p2.r - p1.r, dc = p2.c - p1.c;
        if ((Math.abs(dr) === 2 && dc === 0) || (Math.abs(dc) === 2 && dr === 0) || (Math.abs(dr) === 2 && Math.abs(dc) === 2 && (p1.r + p1.c) % 2 === 0)) {
            const midR = p1.r + dr / 2;
            const midC = p1.c + dc / 2;
            return points.findIndex(p => p.r === midR && p.c === midC);
        }
        return -1;
    }

    // Core OBX Parser
    function parseOBX(obxString) {
        const cleanObx = (obxString || "").trim();
        const parts = cleanObx.split(/\s+/);

        let boardStr = parts[0] || "TXXXT/XXXXX/XXXXX/XXXXX/TXXXT";
        let turnStr = parts[1] || "g";

        let goatsToPlace = 20;
        let capturedGoats = 0;
        let lastMove = "-";

        for (let i = 2; i < parts.length; i++) {
            const p = parts[i];
            if (p.startsWith("@")) {
                goatsToPlace = parseInt(p.substring(1), 10);
            } else if (p.startsWith("c")) {
                capturedGoats = parseInt(p.substring(1), 10);
            } else if (p.startsWith("m") || p === "-") {
                lastMove = p;
            }
        }

        // Build 25 points grid
        const points = [];
        const rows = boardStr.split("/");
        let goatOnBoardCount = 0;
        let tigerCount = 0;

        for (let r = 0; r < 5; r++) {
            const rowStr = rows[r] || "XXXXX";
            for (let c = 0; c < 5; c++) {
                const char = rowStr.charAt(c) || "X";
                let piece = null;
                if (char === "T" || char === "t") { piece = "tiger"; tigerCount++; }
                else if (char === "G" || char === "g") { piece = "goat"; goatOnBoardCount++; }

                points.push({
                    x: 50 + c * 80,
                    y: 50 + r * 80,
                    piece: piece,
                    r: r,
                    c: c,
                    highlight: false
                });
            }
        }

        const turn = (turnStr.toLowerCase() === "t" || turnStr.toLowerCase() === "tiger") ? "tiger" : "goat";
        const goatsPlaced = 20 - goatsToPlace;
        const totalGoats = goatOnBoardCount + Math.max(0, goatsToPlace) + Math.max(0, capturedGoats);

        // Validation of Game Piece Limits (Max 4 Tigers, Max 20 Goats)
        const warnings = [];
        if (tigerCount > 4) {
            warnings.push(`Found ${tigerCount} Tigers (max 4 allowed)`);
        }
        if (totalGoats > 20) {
            warnings.push(`Found ${totalGoats} total Goats (max 20 allowed)`);
        }

        const isValid = warnings.length === 0;
        const validationError = isValid ? null : warnings.join(", ");

        // Detect if last move is a capture move
        let captureMoveDetails = null;
        let rawMove = lastMove.startsWith("m") ? lastMove.substring(1) : lastMove;
        if (rawMove.length === 4) {
            const fromCoord = rawMove.substring(0, 2);
            const toCoord = rawMove.substring(2, 4);
            const fromIdx = coordToIndex(fromCoord);
            const toIdx = coordToIndex(toCoord);
            if (fromIdx !== -1 && toIdx !== -1) {
                const midIdx = getJump(fromIdx, toIdx, points);
                if (midIdx !== -1) {
                    captureMoveDetails = {
                        fromIdx: fromIdx,
                        toIdx: toIdx,
                        midIdx: midIdx,
                        fromCoord: fromCoord,
                        toCoord: toCoord,
                        midCoord: indexToCoord(midIdx),
                        midX: points[midIdx].x,
                        midY: points[midIdx].y,
                        angle: Math.atan2(points[toIdx].y - points[fromIdx].y, points[toIdx].x - points[fromIdx].x)
                    };
                }
            }
        }

        return {
            rawOBX: cleanObx,
            boardStr: boardStr,
            turn: turn,
            tigerCount: tigerCount,
            goatOnBoardCount: goatOnBoardCount,
            totalGoats: totalGoats,
            goatsToPlace: Math.max(0, goatsToPlace),
            goatsPlaced: goatsPlaced,
            capturedGoats: capturedGoats,
            lastMove: lastMove,
            points: points,
            captureMoveDetails: captureMoveDetails,
            isValid: isValid,
            validationError: validationError
        };
    }

    // Move Generator
    function getAllLegalMoves(state) {
        const moves = [];
        const points = state.points;
        const pType = state.turn;

        points.forEach((p, i) => {
            if (p.piece === pType) {
                points.forEach((_, j) => {
                    if (!points[j].piece) {
                        if (pType === "tiger") {
                            let mid = getJump(i, j, points);
                            if (mid !== -1 && points[mid].piece === "goat") {
                                moves.push({ f: i, t: j, c: mid, isCapture: true });
                            }
                            if (isConnected(i, j, points)) {
                                moves.push({ f: i, t: j, c: -1, isCapture: false });
                            }
                        } else if (state.goatsPlaced >= 20 && isConnected(i, j, points)) {
                            moves.push({ f: i, t: j, c: -1, isCapture: false });
                        }
                    }
                });
            }
        });
        return moves;
    }

    function generateNextMove(obxOrState) {
        const state = typeof obxOrState === 'string' ? parseOBX(obxOrState) : obxOrState;

        if (state.turn === "goat" && state.goatsToPlace > 0) {
            // Goat Placement Phase
            // Pick strategic position (Center C3 -> Corners -> Center lines -> any empty)
            const preferredIndices = [12, 6, 8, 16, 18, 7, 11, 13, 17, 0, 4, 20, 24];
            let targetIdx = -1;
            for (let idx of preferredIndices) {
                if (!state.points[idx].piece) {
                    targetIdx = idx;
                    break;
                }
            }
            if (targetIdx === -1) {
                targetIdx = state.points.findIndex(p => !p.piece);
            }
            if (targetIdx !== -1) {
                return "m" + indexToCoord(targetIdx);
            }
        }

        // Piece Movement Phase (or Tiger move)
        const legalMoves = getAllLegalMoves(state);
        if (legalMoves.length === 0) return "-";

        // If tiger has captures, prioritize capture moves!
        const captures = legalMoves.filter(m => m.isCapture);
        if (captures.length > 0) {
            const bestCap = captures[0];
            return "m" + indexToCoord(bestCap.f) + indexToCoord(bestCap.t);
        }

        // Regular move (prefer moving towards center)
        legalMoves.sort((a, b) => {
            const distA = Math.hypot(state.points[a.t].r - 2, state.points[a.t].c - 2);
            const distB = Math.hypot(state.points[b.t].r - 2, state.points[b.t].c - 2);
            return distA - distB;
        });

        const bestMove = legalMoves[0];
        return "m" + indexToCoord(bestMove.f) + indexToCoord(bestMove.t);
    }

    // Main Baghchal Class for Rendering in DOM
    class Baghchal {
        constructor(targetContainer, obxString, options = {}) {
            this.container = typeof targetContainer === 'string' ? document.querySelector(targetContainer) : targetContainer;
            if (!this.container) throw new Error("Baghchal: Invalid target container element");

            this.options = Object.assign({
                width: 380,
                height: 380,
                loopCaptureAnimation: true,
                showStateInfo: true,
                themeColor: "rgb(0, 64, 65)",
                accentColor: "#ffff00"
            }, options);

            this.anims = [];
            this.particles = [];
            this.isDestroyed = false;
            this.lastLoopBiteTime = 0;

            this.initDOM();
            this.setObx(obxString || "TXXXT/XXXXX/XXXXX/XXXXX/TXXXT g @20 c0 -");
            this.startLoop();
        }

        initDOM() {
            this.container.innerHTML = "";
            this.container.style.display = "flex";
            this.container.style.flexDirection = "column";
            this.container.style.alignItems = "center";
            this.container.style.gap = "8px";

            // Canvas Element
            this.canvas = document.createElement("canvas");
            this.canvas.width = 420;
            this.canvas.height = 420;
            this.canvas.style.width = "100%";
            this.canvas.style.maxWidth = this.options.width + "px";
            this.canvas.style.height = "auto";
            this.canvas.style.aspectRatio = "1/1";
            this.canvas.style.background = "#e0d5c1";
            this.canvas.style.border = `4px solid ${this.options.themeColor}`;
            this.canvas.style.borderRadius = "8px";
            this.canvas.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
            this.ctx = this.canvas.getContext("2d");
            this.container.appendChild(this.canvas);

            // Info Box
            if (this.options.showStateInfo) {
                this.infoBox = document.createElement("div");
                this.infoBox.style.width = "100%";
                this.infoBox.style.maxWidth = this.options.width + "px";
                this.infoBox.style.fontFamily = "monospace";
                this.infoBox.style.fontSize = "11px";
                this.infoBox.style.background = "rgba(0,0,0,0.6)";
                this.infoBox.style.color = this.options.accentColor;
                this.infoBox.style.padding = "8px 12px";
                this.infoBox.style.borderRadius = "8px";
                this.infoBox.style.border = "1px solid rgba(255,255,255,0.2)";
                this.infoBox.style.boxSizing = "border-box";
                this.infoBox.style.wordBreak = "break-all";
                this.container.appendChild(this.infoBox);
            }
        }

        setObx(obxString) {
            this.state = parseOBX(obxString);
            this.anims = [];
            this.particles = [];
            this.lastLoopBiteTime = 0;
            this.updateInfoBox();

            if (this.state.captureMoveDetails && this.options.loopCaptureAnimation) {
                this.triggerCaptureExplosion(this.state.captureMoveDetails);
            }
        }

        updateInfoBox() {
            if (!this.infoBox) return;
            const s = this.state;
            const turnEmoji = s.turn === "goat" ? "🐐 Goat" : "🐯 Tiger";
            let capText = s.captureMoveDetails ? ` [CAPTURE DETECTED: ${s.captureMoveDetails.fromCoord}->${s.captureMoveDetails.toCoord} (eats ${s.captureMoveDetails.midCoord})]` : "";

            let warningHtml = "";
            if (!s.isValid) {
                warningHtml = `<div style="margin-top:6px; color:#ff4d4d; font-weight:bold; background:rgba(255,0,0,0.25); padding:6px 10px; border-radius:6px; border:1px solid #ff4d4d;">⚠️ Warning: Invalid number of allowed game pieces! (${s.validationError})</div>`;
            }

            this.infoBox.innerHTML = `
                <div><strong>OBX:</strong> ${s.rawOBX}</div>
                <div style="margin-top:4px;"><strong>Turn:</strong> ${turnEmoji} | <strong>Tigers:</strong> ${s.tigerCount}/4 | <strong>Goats Left:</strong> ${s.goatsToPlace} | <strong>Captured:</strong> ${s.capturedGoats}${capText}</div>
                ${warningHtml}
            `;
        }

        triggerCaptureExplosion(cap) {
            const x = cap.midX;
            const y = cap.midY;

            for (let i = 0; i < 35; i++) {
                this.particles.push({
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color: 'rgba(230, 0, 0, '
                });
            }
        }

        render() {
            if (this.isDestroyed || !this.ctx) return;
            const ctx = this.ctx;
            const now = performance.now();

            // Clear Background
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "#e0d5c1";
            ctx.fillRect(0, 0, 420, 420);

            // Draw Board Grid
            ctx.strokeStyle = "rgba(0, 64, 65, 0.8)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath(); ctx.moveTo(50, 50 + i * 80); ctx.lineTo(370, 50 + i * 80); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(50 + i * 80, 50); ctx.lineTo(50 + i * 80, 370); ctx.stroke();
            }
            ctx.beginPath(); ctx.moveTo(50, 50); ctx.lineTo(370, 370); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(370, 50); ctx.lineTo(50, 370); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(210, 50); ctx.lineTo(370, 210); ctx.lineTo(210, 370); ctx.lineTo(50, 210); ctx.closePath(); ctx.stroke();

            // Draw Grid Labels (ABCDE horizontally, 12345 vertically)
            ctx.font = "bold 13px 'Segoe UI', monospace";
            ctx.fillStyle = "rgba(0, 64, 65, 0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const cols = ["A", "B", "C", "D", "E"];
            cols.forEach((col, i) => {
                const x = 50 + i * 80;
                ctx.fillText(col, x, 20);   // Top
                ctx.fillText(col, x, 400);  // Bottom
            });

            const rows = ["1", "2", "3", "4", "5"];
            rows.forEach((row, i) => {
                const y = 50 + i * 80;
                ctx.fillText(row, 20, y);   // Left
                ctx.fillText(row, 400, y);  // Right
            });

            // Draw Points and Pieces
            const points = this.state.points;
            points.forEach((p, i) => {
                ctx.fillStyle = "rgb(0, 64, 65)";
                ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();

                if (p.piece) {
                    ctx.font = "38px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.piece === "tiger" ? "🐯" : "🐐", p.x, p.y);
                }
            });

            // Loop Capture Particle Explosion Animation if Present
            if (this.options.loopCaptureAnimation && this.state.captureMoveDetails) {
                if (now - this.lastLoopBiteTime > 1000) {
                    this.lastLoopBiteTime = now;
                    this.triggerCaptureExplosion(this.state.captureMoveDetails);
                }
            }

            // Draw Blood Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.035;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                } else {
                    ctx.fillStyle = p.color + p.life + ')';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        startLoop() {
            const self = this;
            function loop() {
                if (self.isDestroyed) return;
                self.render();
                requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        }

        nextMove() {
            return generateNextMove(this.state);
        }

        destroy() {
            this.isDestroyed = true;
            this.container.innerHTML = "";
        }
    }

    // Attach Static Methods to Class
    Baghchal.parseOBX = parseOBX;
    Baghchal.nextMove = generateNextMove;
    Baghchal.coordToIndex = coordToIndex;
    Baghchal.indexToCoord = indexToCoord;
    Baghchal.isConnected = isConnected;
    Baghchal.getJump = getJump;

    return Baghchal;
}));
