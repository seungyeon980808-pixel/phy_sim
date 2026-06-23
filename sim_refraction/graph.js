/* =========================================================================
   graph.js — 시간 vs 입수위치 그래프 + 기록된 "이산" 데이터 점 관리
   절대 연속 곡선을 그리지 않는다. 기록 버튼으로 찍은 점만 표시한다.
   x축 = 입수위치, y축 = 총 시간.
   ========================================================================= */

var Graph = (function () {
  "use strict";

  var C = {
    main: "#0969da",
    sub: "#0e7490",
    text: "#0d1117",
    border: "#d0d7de",
    muted: "#57606a",
    point: "#0969da",
    current: "#cf222e"
  };
  var MONO = "'IBM Plex Mono', monospace";
  var PAD = { left: 48, right: 16, top: 14, bottom: 32 };

  var points = [];   // 기록된 이산 점: [{ x, t }]

  function add(x, t) { points.push({ x: x, t: t }); }
  function clear() { points = []; }
  function count() { return points.length; }

  /* state = { current: {x, t}, showPrev: bool } */
  function draw(ctx, cssW, cssH, params, state) {
    ctx.clearRect(0, 0, cssW, cssH);

    var plot = {
      x: PAD.left, y: PAD.top,
      w: cssW - PAD.left - PAD.right,
      h: cssH - PAD.top - PAD.bottom
    };

    // x축 범위: 0 .. 해변 폭
    var xMax = params.beachWidth || 1;

    // y축(시간) 범위: 기록점 + 현재점 + 양 끝값으로 자동
    var ts = [];
    if (state.current) ts.push(state.current.t);
    points.forEach(function (p) { ts.push(p.t); });
    ts.push(Physics.totalTime(0, params));
    ts.push(Physics.totalTime(xMax, params));
    var tMin = Math.min.apply(null, ts);
    var tMax = Math.max.apply(null, ts);
    if (tMax - tMin < 1e-6) { tMax = tMin + 1; }
    var pad = (tMax - tMin) * 0.12;
    tMin -= pad; tMax += pad;

    function px(x) { return plot.x + (x / xMax) * plot.w; }
    function py(t) { return plot.y + plot.h - ((t - tMin) / (tMax - tMin)) * plot.h; }

    // 축
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y);
    ctx.lineTo(plot.x, plot.y + plot.h);
    ctx.lineTo(plot.x + plot.w, plot.y + plot.h);
    ctx.stroke();

    // 축 라벨
    ctx.fillStyle = C.muted;
    ctx.font = "11px " + MONO;
    ctx.textAlign = "center";
    ctx.fillText("0", plot.x, plot.y + plot.h + 14);
    ctx.fillText(xMax.toFixed(0), plot.x + plot.w, plot.y + plot.h + 14);
    ctx.fillText("입수위치", plot.x + plot.w / 2, plot.y + plot.h + 26);
    ctx.save();
    ctx.translate(12, plot.y + plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("총 시간", 0, 0);
    ctx.restore();
    ctx.textAlign = "right";
    ctx.fillText(tMax.toFixed(1), plot.x - 6, plot.y + 8);
    ctx.fillText(tMin.toFixed(1), plot.x - 6, plot.y + plot.h);

    // 기록된 이산 점 (토글이 켜져 있을 때만)
    if (state.showPrev) {
      points.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.t), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = C.point;
        ctx.fill();
      });
    }

    // 현재 위치 표식 (옅은 마커 — 데이터가 아니라 안내)
    if (state.current) {
      var cx = px(state.current.x);
      var cy = py(state.current.t);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(cx, plot.y);
      ctx.lineTo(cx, plot.y + plot.h);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.current;
      ctx.stroke();
    }
  }

  return { add: add, clear: clear, count: count, draw: draw };
})();
