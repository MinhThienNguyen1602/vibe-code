(function () {
  "use strict";

  /* ==========================================================================
     1. PURE LOGIC: Tính toán phân số, tỉ lệ và nội dung sư phạm
     ========================================================================== */
  var MAX_DIVISIONS = 12;
  var BOARD_ORIGIN = 64;
  var BOARD_SIZE = 440;
  var SVG_NS = "http://www.w3.org/2000/svg";

  var FractionMath = {
    gcd: function (a, b) {
      var x = Math.abs(a);
      var y = Math.abs(b);
      while (y !== 0) {
        var t = y;
        y = x % y;
        x = t;
      }
      return x === 0 ? 1 : x;
    },

    simplify: function (num, den) {
      if (num === 0) {
        return { num: 0, den: 1, divisor: den, canSimplify: false, isWhole: true };
      }
      var divisor = FractionMath.gcd(num, den);
      var simpNum = num / divisor;
      var simpDen = den / divisor;
      return {
        num: simpNum,
        den: simpDen,
        divisor: divisor,
        canSimplify: divisor > 1 || simpDen === 1,
        isWhole: simpDen === 1
      };
    },

    isTerminatingDecimal: function (den) {
      var d = den;
      while (d % 2 === 0) d /= 2;
      while (d % 5 === 0) d /= 5;
      return d === 1;
    },

    formatDecimal: function (num, den) {
      if (num === 0) return "0";
      if (num === den) return "1";
      var simp = FractionMath.simplify(num, den);
      var val = num / den;
      if (FractionMath.isTerminatingDecimal(simp.den)) {
        return String(Number(val.toFixed(6)));
      }
      return "≈ " + Number(val.toFixed(4));
    },

    formatPercent: function (num, den) {
      if (num === 0) return "0%";
      if (num === den) return "100%";
      var simp = FractionMath.simplify(num, den);
      var pct = (num / den) * 100;
      var isExactAt2 = (10000 % simp.den) === 0;
      if (isExactAt2) {
        return Number(pct.toFixed(2)) + "%";
      }
      return "≈ " + Number(pct.toFixed(2)) + "%";
    },

    computeMetrics: function (num1, denom1, num2, denom2) {
      var prodNum = num1 * num2;
      var prodDen = denom1 * denom2;
      var simplified = FractionMath.simplify(prodNum, prodDen);
      return {
        a: num1,
        b: denom1,
        c: num2,
        d: denom2,
        prodNum: prodNum,
        prodDen: prodDen,
        simplified: simplified,
        decimalText: FractionMath.formatDecimal(prodNum, prodDen),
        percentText: FractionMath.formatPercent(prodNum, prodDen)
      };
    },

    buildExplanation: function (metrics, mode) {
      var a = metrics.a;
      var b = metrics.b;
      var c = metrics.c;
      var d = metrics.d;
      var prodNum = metrics.prodNum;
      var prodDen = metrics.prodDen;
      var simp = metrics.simplified;

      if (mode === "frac1") {
        return (
          "Đang xem riêng Phân số 1: hình vuông đơn vị được chia theo chiều dọc thành " +
          b +
          " cột bằng nhau và tô xanh " +
          a +
          " cột, biểu diễn phân số " +
          a +
          "/" +
          b +
          " diện tích."
        );
      }

      if (mode === "frac2") {
        return (
          "Đang xem riêng Phân số 2: hình vuông đơn vị được chia theo chiều ngang thành " +
          d +
          " hàng bằng nhau và tô cam " +
          c +
          " hàng, biểu diễn phân số " +
          c +
          "/" +
          d +
          " diện tích."
        );
      }

      if (prodNum === 0) {
        return (
          "Khi chồng " +
          a +
          "/" +
          b +
          " (cột xanh) với " +
          c +
          "/" +
          d +
          " (hàng cam), không có ô nào vừa thuộc cột được chọn vừa thuộc hàng được chọn. Do đó vùng giao nhau có 0/" +
          prodDen +
          " ô, tức kết quả bằng 0 (0%)."
        );
      }

      if (prodNum === prodDen) {
        return (
          "Toàn bộ " +
          b +
          " cột và " +
          d +
          " hàng đều được chọn nên vùng giao nhau phủ kín tất cả " +
          prodDen +
          "/" +
          prodDen +
          " ô vuông nhỏ — tương ứng trọn vẹn 1 hình vuông đơn vị (100%)."
        );
      }

      var text =
        "Hình vuông đơn vị được chia thành " +
        b +
        " × " +
        d +
        " = " +
        prodDen +
        " ô vuông nhỏ bằng nhau. Giao điểm giữa " +
        a +
        " cột xanh và " +
        c +
        " hàng cam tạo thành " +
        a +
        " × " +
        c +
        " = " +
        prodNum +
        " ô màu xanh lá đậm, chiếm " +
        metrics.percentText +
        " diện tích hình vuông.";

      if (simp.divisor > 1 && !simp.isWhole) {
        text +=
          " Phân số " +
          prodNum +
          "/" +
          prodDen +
          " rút gọn cho " +
          simp.divisor +
          " thành " +
          simp.num +
          "/" +
          simp.den +
          ".";
      }

      return text;
    }
  };

  /* ==========================================================================
     2. STATE MANAGEMENT: Trạng thái đơn nguồn & Hàm cập nhật thuần
     ========================================================================== */
  function createDefaultState() {
    return {
      denom1: 5,
      denom2: 4,
      selectedCols: new Set([0, 1, 2]),
      selectedRows: new Set([0, 1]),
      mode: "multiply" // "frac1" | "frac2" | "multiply"
    };
  }

  var state = createDefaultState();

  function syncSelectionCount(selectedSet, maxDenom, targetCount) {
    var clamped = Math.max(0, Math.min(maxDenom, targetCount));
    Array.from(selectedSet).forEach(function (idx) {
      if (idx >= maxDenom) selectedSet.delete(idx);
    });
    while (selectedSet.size < clamped) {
      for (var i = 0; i < maxDenom; i++) {
        if (!selectedSet.has(i)) {
          selectedSet.add(i);
          break;
        }
      }
    }
    while (selectedSet.size > clamped) {
      var indices = Array.from(selectedSet).sort(function (x, y) {
        return y - x;
      });
      selectedSet.delete(indices[0]);
    }
  }

  function setDenom1(newDenom) {
    state.denom1 = Math.max(1, Math.min(MAX_DIVISIONS, newDenom));
    Array.from(state.selectedCols).forEach(function (idx) {
      if (idx >= state.denom1) state.selectedCols.delete(idx);
    });
  }

  function setDenom2(newDenom) {
    state.denom2 = Math.max(1, Math.min(MAX_DIVISIONS, newDenom));
    Array.from(state.selectedRows).forEach(function (idx) {
      if (idx >= state.denom2) state.selectedRows.delete(idx);
    });
  }

  function toggleCol(colIdx) {
    if (colIdx < 0 || colIdx >= state.denom1) return;
    if (state.selectedCols.has(colIdx)) {
      state.selectedCols.delete(colIdx);
    } else {
      state.selectedCols.add(colIdx);
    }
  }

  function toggleRow(rowIdx) {
    if (rowIdx < 0 || rowIdx >= state.denom2) return;
    if (state.selectedRows.has(rowIdx)) {
      state.selectedRows.delete(rowIdx);
    } else {
      state.selectedRows.add(rowIdx);
    }
  }

  function toggleGridCell(colIdx, rowIdx) {
    if (state.mode === "frac1") {
      toggleCol(colIdx);
      return;
    }
    if (state.mode === "frac2") {
      toggleRow(rowIdx);
      return;
    }
    var colActive = state.selectedCols.has(colIdx);
    var rowActive = state.selectedRows.has(rowIdx);
    if (!colActive && !rowActive) {
      state.selectedCols.add(colIdx);
      state.selectedRows.add(rowIdx);
    } else if (colActive && !rowActive) {
      state.selectedRows.add(rowIdx);
    } else if (!colActive && rowActive) {
      state.selectedCols.add(colIdx);
    } else {
      state.selectedRows.delete(rowIdx);
    }
  }

  /* ==========================================================================
     3. SVG POOL & DOM REFERENCES
     ========================================================================== */
  function createSvgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, String(attrs[key]));
      });
    }
    return el;
  }

  var dom = {
    boardSvg: document.getElementById("fe-board-svg"),
    resetBtn: document.getElementById("fe-reset-btn"),
    modeButtons: Array.prototype.slice.call(document.querySelectorAll(".fe-seg-btn")),
    svgTopCaption: document.getElementById("fe-svg-top-caption"),
    svgLeftCaption: document.getElementById("fe-svg-left-caption"),
    svgColTabs: document.getElementById("fe-svg-col-tabs"),
    svgRowTabs: document.getElementById("fe-svg-row-tabs"),
    svgColLayers: document.getElementById("fe-svg-col-layers"),
    svgRowLayers: document.getElementById("fe-svg-row-layers"),
    svgIntersectLayers: document.getElementById("fe-svg-intersect-layers"),
    svgGridLines: document.getElementById("fe-svg-grid-lines"),
    svgHitCells: document.getElementById("fe-svg-hit-cells"),

    // Analysis DOM
    gridDimLabel: document.getElementById("fe-grid-dimension-label"),
    eqA: document.getElementById("fe-eq-a"),
    eqB: document.getElementById("fe-eq-b"),
    eqC: document.getElementById("fe-eq-c"),
    eqD: document.getElementById("fe-eq-d"),
    eqProdNum: document.getElementById("fe-eq-prod-num"),
    eqProdDen: document.getElementById("fe-eq-prod-den"),
    simpWrap: document.getElementById("fe-simplified-wrap"),
    simpFracBox: document.getElementById("fe-simp-frac-box"),
    eqSimpNum: document.getElementById("fe-eq-simp-num"),
    eqSimpDen: document.getElementById("fe-eq-simp-den"),
    eqWholeVal: document.getElementById("fe-eq-whole-val"),
    metricCells: document.getElementById("fe-metric-cells"),
    metricCellsSub: document.getElementById("fe-metric-cells-sub"),
    metricDecimal: document.getElementById("fe-metric-decimal"),
    metricPercent: document.getElementById("fe-metric-percent"),
    explainText: document.getElementById("fe-explain-text"),

    // Control DOM
    readoutF1: document.getElementById("fe-readout-f1"),
    readoutF2: document.getElementById("fe-readout-f2"),
    num1Input: document.getElementById("fe-num1-input"),
    num1Hint: document.getElementById("fe-num1-hint"),
    num1Dec: document.getElementById("fe-num1-dec"),
    num1Inc: document.getElementById("fe-num1-inc"),
    denom1Input: document.getElementById("fe-denom1-input"),
    denom1Dec: document.getElementById("fe-denom1-dec"),
    denom1Inc: document.getElementById("fe-denom1-inc"),

    num2Input: document.getElementById("fe-num2-input"),
    num2Hint: document.getElementById("fe-num2-hint"),
    num2Dec: document.getElementById("fe-num2-dec"),
    num2Inc: document.getElementById("fe-num2-inc"),
    denom2Input: document.getElementById("fe-denom2-input"),
    denom2Dec: document.getElementById("fe-denom2-dec"),
    denom2Inc: document.getElementById("fe-denom2-inc")
  };

  var svgPool = {
    colOverlays: [],
    rowOverlays: [],
    intersectCells: [],
    hitCells: [],
    vLines: [],
    hLines: [],
    colTabs: [],
    rowTabs: []
  };

  function initSvgPool() {
    var i, j;

    // Column color overlays (0..11) — màu được quản lý bởi class .fe-svg-col-layer trong style.css
    for (i = 0; i < MAX_DIVISIONS; i++) {
      var colRect = createSvgEl("rect", {
        class: "fe-svg-col-layer",
        y: BOARD_ORIGIN,
        height: BOARD_SIZE,
        opacity: "0"
      });
      dom.svgColLayers.appendChild(colRect);
      svgPool.colOverlays.push(colRect);
    }

    // Row color overlays (0..11) — màu được quản lý bởi class .fe-svg-row-layer trong style.css
    for (j = 0; j < MAX_DIVISIONS; j++) {
      var rowRect = createSvgEl("rect", {
        class: "fe-svg-row-layer",
        x: BOARD_ORIGIN,
        width: BOARD_SIZE,
        opacity: "0"
      });
      dom.svgRowLayers.appendChild(rowRect);
      svgPool.rowOverlays.push(rowRect);
    }

    // Intersection highlight cells & hit cells (12x12) — dùng event delegation trên #fe-board-svg
    for (j = 0; j < MAX_DIVISIONS; j++) {
      svgPool.intersectCells[j] = [];
      svgPool.hitCells[j] = [];
      for (i = 0; i < MAX_DIVISIONS; i++) {
        var interRect = createSvgEl("rect", {
          class: "fe-svg-intersect-layer",
          rx: "2",
          opacity: "0"
        });
        dom.svgIntersectLayers.appendChild(interRect);
        svgPool.intersectCells[j][i] = interRect;

        var hitRect = createSvgEl("rect", {
          class: "fe-svg-cell-hit",
          "data-col": i,
          "data-row": j
        });
        dom.svgHitCells.appendChild(hitRect);
        svgPool.hitCells[j][i] = hitRect;
      }
    }

    // Vertical division lines (1..11) — màu được quản lý bởi class .fe-svg-grid-line trong style.css
    for (i = 1; i < MAX_DIVISIONS; i++) {
      var vLine = createSvgEl("line", {
        class: "fe-svg-grid-line",
        x1: 0,
        y1: BOARD_ORIGIN,
        x2: 0,
        y2: BOARD_ORIGIN + BOARD_SIZE,
        opacity: "0"
      });
      vLine.style.transform = "translateX(" + (BOARD_ORIGIN + BOARD_SIZE) + "px)";
      dom.svgGridLines.appendChild(vLine);
      svgPool.vLines.push(vLine);
    }

    // Horizontal division lines (1..11)
    for (j = 1; j < MAX_DIVISIONS; j++) {
      var hLine = createSvgEl("line", {
        class: "fe-svg-grid-line",
        x1: BOARD_ORIGIN,
        y1: 0,
        x2: BOARD_ORIGIN + BOARD_SIZE,
        y2: 0,
        opacity: "0"
      });
      hLine.style.transform = "translateY(" + (BOARD_ORIGIN + BOARD_SIZE) + "px)";
      dom.svgGridLines.appendChild(hLine);
      svgPool.hLines.push(hLine);
    }

    // Interactive Column Header Tabs (top)
    for (i = 0; i < MAX_DIVISIONS; i++) {
      var colTabG = createSvgEl("g", {
        class: "fe-svg-header-tab fe-svg-col-tab",
        role: "button",
        tabindex: "0",
        "data-col": i,
        "aria-label": "Bật/tắt cột " + (i + 1)
      });
      var colTabBg = createSvgEl("rect", {
        class: "fe-svg-tab-bg",
        y: 28,
        height: 26,
        rx: 6
      });
      var colTabText = createSvgEl("text", {
        class: "fe-svg-tab-text",
        y: 45,
        "text-anchor": "middle",
        "font-size": "12",
        "font-weight": "700",
        "font-family": "IBM Plex Mono, monospace"
      });
      colTabText.textContent = String(i + 1);
      colTabG.appendChild(colTabBg);
      colTabG.appendChild(colTabText);
      dom.svgColTabs.appendChild(colTabG);
      svgPool.colTabs.push({ g: colTabG, bg: colTabBg, text: colTabText });
    }

    // Interactive Row Header Tabs (left)
    for (j = 0; j < MAX_DIVISIONS; j++) {
      var rowTabG = createSvgEl("g", {
        class: "fe-svg-header-tab fe-svg-row-tab",
        role: "button",
        tabindex: "0",
        "data-row": j,
        "aria-label": "Bật/tắt hàng " + (j + 1)
      });
      var rowTabBg = createSvgEl("rect", {
        class: "fe-svg-tab-bg",
        x: 28,
        width: 26,
        rx: 6
      });
      var rowTabText = createSvgEl("text", {
        class: "fe-svg-tab-text",
        x: 41,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": "12",
        "font-weight": "700",
        "font-family": "IBM Plex Mono, monospace"
      });
      rowTabText.textContent = String(j + 1);
      rowTabG.appendChild(rowTabBg);
      rowTabG.appendChild(rowTabText);
      dom.svgRowTabs.appendChild(rowTabG);
      svgPool.rowTabs.push({ g: rowTabG, bg: rowTabBg, text: rowTabText });
    }
  }

  /* ==========================================================================
     4. RENDER FUNCTIONS: Cập nhật SVG, Phân tích toán học & Controls
     ========================================================================== */
  function renderBoard() {
    var b = state.denom1;
    var d = state.denom2;
    var a = state.selectedCols.size;
    var c = state.selectedRows.size;
    var colW = BOARD_SIZE / b;
    var rowH = BOARD_SIZE / d;
    var showFrac1 = state.mode === "frac1" || state.mode === "multiply";
    var showFrac2 = state.mode === "frac2" || state.mode === "multiply";
    var showIntersect = state.mode === "multiply";

    dom.svgTopCaption.textContent = "Phân số 1 (Cột): " + a + " / " + b;
    dom.svgLeftCaption.textContent = "Phân số 2 (Hàng): " + c + " / " + d;
    dom.svgTopCaption.classList.toggle("fe-svg-caption-muted", !showFrac1);
    dom.svgLeftCaption.classList.toggle("fe-svg-caption-muted", !showFrac2);

    var i, j;

    // Update column overlays & top tabs
    for (i = 0; i < MAX_DIVISIONS; i++) {
      var colOverlay = svgPool.colOverlays[i];
      var colTab = svgPool.colTabs[i];
      var isColVisible = i < b;
      var isColSelected = isColVisible && state.selectedCols.has(i);

      if (isColVisible) {
        colOverlay.setAttribute("x", BOARD_ORIGIN + i * colW);
        colOverlay.setAttribute("width", colW);
        colOverlay.style.opacity = showFrac1 && isColSelected ? "1" : "0";

        var tabGap = Math.min(4, colW * 0.12);
        var tabW = Math.max(12, colW - tabGap * 2);
        var tabX = BOARD_ORIGIN + i * colW + (colW - tabW) / 2;
        colTab.g.style.display = "";
        colTab.g.setAttribute("aria-pressed", isColSelected ? "true" : "false");
        colTab.g.classList.toggle("fe-is-selected", isColSelected);
        colTab.bg.setAttribute("x", tabX);
        colTab.bg.setAttribute("width", tabW);
        colTab.text.setAttribute("x", BOARD_ORIGIN + i * colW + colW / 2);
      } else {
        colOverlay.style.opacity = "0";
        colTab.g.style.display = "none";
      }
    }

    // Update row overlays & left tabs
    for (j = 0; j < MAX_DIVISIONS; j++) {
      var rowOverlay = svgPool.rowOverlays[j];
      var rowTab = svgPool.rowTabs[j];
      var isRowVisible = j < d;
      var isRowSelected = isRowVisible && state.selectedRows.has(j);

      if (isRowVisible) {
        rowOverlay.setAttribute("y", BOARD_ORIGIN + j * rowH);
        rowOverlay.setAttribute("height", rowH);
        rowOverlay.style.opacity = showFrac2 && isRowSelected ? "1" : "0";

        var rTabGap = Math.min(4, rowH * 0.12);
        var rTabH = Math.max(12, rowH - rTabGap * 2);
        var rTabY = BOARD_ORIGIN + j * rowH + (rowH - rTabH) / 2;
        rowTab.g.style.display = "";
        rowTab.g.setAttribute("aria-pressed", isRowSelected ? "true" : "false");
        rowTab.g.classList.toggle("fe-is-selected", isRowSelected);
        rowTab.bg.setAttribute("y", rTabY);
        rowTab.bg.setAttribute("height", rTabH);
        rowTab.text.setAttribute("y", BOARD_ORIGIN + j * rowH + rowH / 2);
      } else {
        rowOverlay.style.opacity = "0";
        rowTab.g.style.display = "none";
      }
    }

    // Update divider lines using smooth CSS transform
    for (i = 0; i < svgPool.vLines.length; i++) {
      var colIndex = i + 1;
      var vLine = svgPool.vLines[i];
      if (colIndex < b) {
        vLine.style.transform = "translateX(" + (BOARD_ORIGIN + colIndex * colW) + "px)";
        vLine.style.opacity = "1";
      } else {
        vLine.style.transform = "translateX(" + (BOARD_ORIGIN + BOARD_SIZE) + "px)";
        vLine.style.opacity = "0";
      }
    }

    for (j = 0; j < svgPool.hLines.length; j++) {
      var rowIndex = j + 1;
      var hLine = svgPool.hLines[j];
      if (rowIndex < d) {
        hLine.style.transform = "translateY(" + (BOARD_ORIGIN + rowIndex * rowH) + "px)";
        hLine.style.opacity = "1";
      } else {
        hLine.style.transform = "translateY(" + (BOARD_ORIGIN + BOARD_SIZE) + "px)";
        hLine.style.opacity = "0";
      }
    }

    // Update intersection cells & hit grid
    var inset = Math.min(3, Math.min(colW, rowH) * 0.07);
    for (j = 0; j < MAX_DIVISIONS; j++) {
      for (i = 0; i < MAX_DIVISIONS; i++) {
        var interCell = svgPool.intersectCells[j][i];
        var hitCell = svgPool.hitCells[j][i];
        var inside = i < b && j < d;

        if (inside) {
          var cx = BOARD_ORIGIN + i * colW;
          var cy = BOARD_ORIGIN + j * rowH;

          hitCell.style.display = "";
          hitCell.setAttribute("x", cx);
          hitCell.setAttribute("y", cy);
          hitCell.setAttribute("width", colW);
          hitCell.setAttribute("height", rowH);

          var bothSelected =
            showIntersect && state.selectedCols.has(i) && state.selectedRows.has(j);
          interCell.setAttribute("x", cx + inset);
          interCell.setAttribute("y", cy + inset);
          interCell.setAttribute("width", Math.max(2, colW - inset * 2));
          interCell.setAttribute("height", Math.max(2, rowH - inset * 2));
          interCell.style.opacity = bothSelected ? "1" : "0";
        } else {
          hitCell.style.display = "none";
          interCell.style.opacity = "0";
        }
      }
    }

    // Mode buttons state
    dom.modeButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-mode") === state.mode;
      btn.classList.toggle("fe-is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function renderAnalysis() {
    var a = state.selectedCols.size;
    var b = state.denom1;
    var c = state.selectedRows.size;
    var d = state.denom2;
    var m = FractionMath.computeMetrics(a, b, c, d);

    dom.gridDimLabel.textContent = "Lưới " + b + " × " + d + " = " + m.prodDen + " ô";
    dom.eqA.textContent = String(m.a);
    dom.eqB.textContent = String(m.b);
    dom.eqC.textContent = String(m.c);
    dom.eqD.textContent = String(m.d);
    dom.eqProdNum.textContent = String(m.prodNum);
    dom.eqProdDen.textContent = String(m.prodDen);

    if (m.simplified.isWhole) {
      dom.simpWrap.classList.remove("fe-is-hidden");
      dom.simpFracBox.classList.add("fe-is-hidden");
      dom.eqWholeVal.classList.remove("fe-is-hidden");
      dom.eqWholeVal.textContent = String(m.simplified.num);
    } else if (m.simplified.divisor > 1) {
      dom.simpWrap.classList.remove("fe-is-hidden");
      dom.simpFracBox.classList.remove("fe-is-hidden");
      dom.eqWholeVal.classList.add("fe-is-hidden");
      dom.eqSimpNum.textContent = String(m.simplified.num);
      dom.eqSimpDen.textContent = String(m.simplified.den);
    } else {
      dom.simpWrap.classList.add("fe-is-hidden");
    }

    dom.metricCells.textContent = m.prodNum + " / " + m.prodDen + " ô";
    dom.metricCellsSub.textContent = a + " cột × " + c + " hàng";
    dom.metricDecimal.textContent = m.decimalText;
    dom.metricPercent.textContent = m.percentText;
    dom.explainText.textContent = FractionMath.buildExplanation(m, state.mode);
  }

  function renderControls() {
    var a = state.selectedCols.size;
    var b = state.denom1;
    var c = state.selectedRows.size;
    var d = state.denom2;

    dom.readoutF1.textContent = a + " / " + b;
    dom.readoutF2.textContent = c + " / " + d;

    if (!(document.activeElement === dom.denom1Input && dom.denom1Input.value === "")) {
      dom.denom1Input.value = String(b);
    }
    dom.denom1Dec.disabled = b <= 1;
    dom.denom1Inc.disabled = b >= MAX_DIVISIONS;

    dom.num1Input.max = String(b);
    if (!(document.activeElement === dom.num1Input && dom.num1Input.value === "")) {
      dom.num1Input.value = String(a);
    }
    dom.num1Hint.textContent = "0 – " + b;
    dom.num1Dec.disabled = a <= 0;
    dom.num1Inc.disabled = a >= b;

    if (!(document.activeElement === dom.denom2Input && dom.denom2Input.value === "")) {
      dom.denom2Input.value = String(d);
    }
    dom.denom2Dec.disabled = d <= 1;
    dom.denom2Inc.disabled = d >= MAX_DIVISIONS;

    dom.num2Input.max = String(d);
    if (!(document.activeElement === dom.num2Input && dom.num2Input.value === "")) {
      dom.num2Input.value = String(c);
    }
    dom.num2Hint.textContent = "0 – " + d;
    dom.num2Dec.disabled = c <= 0;
    dom.num2Inc.disabled = c >= d;
  }

  function render() {
    renderBoard();
    renderAnalysis();
    renderControls();
  }

  /* ==========================================================================
     5. EVENT BINDINGS
     ========================================================================== */
  function blockNonNaturalKeys(e) {
    if (e.key === "-" || e.key === "+" || e.key === "." || e.key === "," || e.key === "e" || e.key === "E") {
      e.preventDefault();
    }
  }

  function bindNaturalNumberInput(inputEl, getBounds, onValidCommit) {
    inputEl.addEventListener("keydown", blockNonNaturalKeys);

    inputEl.addEventListener("input", function () {
      var raw = inputEl.value.trim();
      if (raw === "") return;
      var parsed = Math.floor(Number(raw));
      if (!Number.isFinite(parsed)) return;
      var bounds = getBounds();
      if (parsed < bounds.min) return;
      var clamped = Math.min(bounds.max, parsed);
      if (parsed > bounds.max) {
        inputEl.value = String(clamped);
      }
      onValidCommit(clamped);
      render();
    });

    function normalizeOnFinish() {
      var bounds = getBounds();
      var raw = inputEl.value.trim();
      var parsed = raw === "" ? NaN : Math.floor(Number(raw));
      var nextVal = Number.isFinite(parsed)
        ? Math.max(bounds.min, Math.min(bounds.max, parsed))
        : bounds.fallback;
      inputEl.value = String(nextVal);
      onValidCommit(nextVal);
      render();
    }

    inputEl.addEventListener("change", normalizeOnFinish);
    inputEl.addEventListener("blur", normalizeOnFinish);
  }

  function handleBoardTargetAction(target) {
    if (!target || !dom.boardSvg.contains(target)) return;

    var hasCol = target.hasAttribute("data-col");
    var hasRow = target.hasAttribute("data-row");

    if (hasCol && hasRow) {
      toggleGridCell(
        parseInt(target.getAttribute("data-col"), 10),
        parseInt(target.getAttribute("data-row"), 10)
      );
      render();
    } else if (hasCol) {
      toggleCol(parseInt(target.getAttribute("data-col"), 10));
      render();
    } else if (hasRow) {
      toggleRow(parseInt(target.getAttribute("data-row"), 10));
      render();
    }
  }

  function bindEvents() {
    // Một listener click duy nhất trên #fe-board-svg cho toàn bộ ô lưới, thẻ cột và thẻ hàng
    dom.boardSvg.addEventListener("click", function (e) {
      var target = e.target.closest("[data-col], [data-row]");
      handleBoardTargetAction(target);
    });

    dom.boardSvg.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var target = e.target.closest("[data-col], [data-row]");
      if (!target) return;
      e.preventDefault();
      handleBoardTargetAction(target);
    });

    bindNaturalNumberInput(
      dom.denom1Input,
      function () {
        return { min: 1, max: MAX_DIVISIONS, fallback: state.denom1 };
      },
      function (val) {
        setDenom1(val);
      }
    );

    bindNaturalNumberInput(
      dom.denom2Input,
      function () {
        return { min: 1, max: MAX_DIVISIONS, fallback: state.denom2 };
      },
      function (val) {
        setDenom2(val);
      }
    );

    bindNaturalNumberInput(
      dom.num1Input,
      function () {
        return { min: 0, max: state.denom1, fallback: state.selectedCols.size };
      },
      function (val) {
        syncSelectionCount(state.selectedCols, state.denom1, val);
      }
    );

    bindNaturalNumberInput(
      dom.num2Input,
      function () {
        return { min: 0, max: state.denom2, fallback: state.selectedRows.size };
      },
      function (val) {
        syncSelectionCount(state.selectedRows, state.denom2, val);
      }
    );

    dom.denom1Dec.addEventListener("click", function () {
      setDenom1(state.denom1 - 1);
      render();
    });

    dom.denom1Inc.addEventListener("click", function () {
      setDenom1(state.denom1 + 1);
      render();
    });

    dom.denom2Dec.addEventListener("click", function () {
      setDenom2(state.denom2 - 1);
      render();
    });

    dom.denom2Inc.addEventListener("click", function () {
      setDenom2(state.denom2 + 1);
      render();
    });

    dom.num1Dec.addEventListener("click", function () {
      syncSelectionCount(state.selectedCols, state.denom1, state.selectedCols.size - 1);
      render();
    });

    dom.num1Inc.addEventListener("click", function () {
      syncSelectionCount(state.selectedCols, state.denom1, state.selectedCols.size + 1);
      render();
    });

    dom.num2Dec.addEventListener("click", function () {
      syncSelectionCount(state.selectedRows, state.denom2, state.selectedRows.size - 1);
      render();
    });

    dom.num2Inc.addEventListener("click", function () {
      syncSelectionCount(state.selectedRows, state.denom2, state.selectedRows.size + 1);
      render();
    });

    dom.modeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.mode = btn.getAttribute("data-mode") || "multiply";
        render();
      });
    });

    dom.resetBtn.addEventListener("click", function () {
      state = createDefaultState();
      render();
    });
  }

  initSvgPool();
  bindEvents();
  render();
})();
