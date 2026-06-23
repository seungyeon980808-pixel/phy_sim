/* =========================================================================
   scene.js — 메인 장면 그리기 (해변/물/구조원/입수점/사람/경로/각도/축)
   비유(analogy) 모드와 빛(light) 모드를 라벨만 바꿔 동일 물리로 그린다.
   상태 state = { x, mode: "analogy"|"light", advanced: bool }
   ========================================================================= */

var Scene = (function () {
  "use strict";

  /* ===== 색상 (라이트 테마) ===== */
  var C = {
    main: "#0969da",
    sub: "#0e7490",
    text: "#0d1117",
    border: "#d0d7de",
    sandFill: "#f3ead1",   // 모래 / 공기
    waterFill: "#dcebf7",  // 물 / 매질
    runPath: "#0e7490",    // 달리기 / 입사 광선
    swimPath: "#0969da",   // 수영 / 굴절 광선
    normal: "#8c959f",
    muted: "#57606a"
  };

  var PAD = { left: 46, right: 24, top: 22, bottom: 38 };
  var FONT = "'IBM Plex Sans KR', sans-serif";
  var MONO = "'IBM Plex Mono', monospace";

  /* ===== 모드별 라벨 ===== */
  function labels(mode) {
    if (mode === "light") {
      return {
        lower: "진공 / 공기  (n₁ = 1)",
        upper: "매질  (굴절률 n)",
        entry: "입사점",
        runPath: "입사 광선",
        swimPath: "굴절 광선",
        a1: "입사각 θ₁",
        a2: "굴절각 θ₂",
        srcMark: "광원",
        dstMark: "도달점",
        v1: "c",
        v2: "c/n"
      };
    }
    return {
      lower: "모래 (해변)",
      upper: "물",
      entry: "입수점",
      runPath: "달리기",
      swimPath: "수영",
      a1: "θ₁",
      a2: "θ₂",
      srcMark: "구조원",
      dstMark: "빠진 사람",
      v1: "v",
      v2: "v/n"
    };
  }

  function dot(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }

  /* ===== 메인 ===== */
  function draw(ctx, cssW, cssH, params, state) {
    var x = state.x;
    var mode = state.mode;
    var adv = state.advanced;
    var L = labels(mode);

    ctx.clearRect(0, 0, cssW, cssH);

    var plot = {
      x: PAD.left,
      y: PAD.top,
      w: cssW - PAD.left - PAD.right,
      h: cssH - PAD.top - PAD.bottom
    };
    var W = Physics.world(params);
    var T = Physics.makeTransform(W, plot);

    var yL = T.py(params.L);   // 해안선 픽셀 y
    var qy = T.py(W.q);

    /* --- 영역 채우기 (물 위, 모래 아래) --- */
    ctx.fillStyle = C.waterFill;
    ctx.fillRect(plot.x, plot.y, plot.w, yL - plot.y);
    ctx.fillStyle = C.sandFill;
    ctx.fillRect(plot.x, yL, plot.w, plot.y + plot.h - yL);

    /* --- 해안선 / 경계면 --- */
    ctx.beginPath();
    ctx.moveTo(plot.x, yL);
    ctx.lineTo(plot.x + plot.w, yL);
    ctx.strokeStyle = C.sub;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* --- 축 (심화 모드) --- */
    if (adv) {
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plot.x, plot.y);                 // y축
      ctx.lineTo(plot.x, plot.y + plot.h);
      ctx.lineTo(plot.x + plot.w, plot.y + plot.h); // x축
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = "12px " + MONO;
      ctx.textAlign = "left";
      ctx.fillText("x", plot.x + plot.w - 10, plot.y + plot.h - 6);
      ctx.fillText("y", plot.x + 6, plot.y + 12);
    }

    /* --- 좌표 픽셀 위치 --- */
    var src = { x: T.px(0), y: T.py(0) };           // 구조원 / 광원 (0,0)
    var entry = { x: T.px(x), y: yL };              // 입수점 (x, L)
    var dst = { x: T.px(params.p), y: qy };         // 사람 / 도달점 (p, q)

    /* --- 경로 --- */
    ctx.lineCap = "round";
    ctx.beginPath();                                // 달리기 / 입사 광선
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(entry.x, entry.y);
    ctx.strokeStyle = C.runPath;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();                                // 수영 / 굴절 광선
    ctx.moveTo(entry.x, entry.y);
    ctx.lineTo(dst.x, dst.y);
    ctx.strokeStyle = C.swimPath;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* --- 법선 (입수점의 연직선, 점선) --- */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = C.normal;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(entry.x, entry.y - 46);
    ctx.lineTo(entry.x, entry.y + 46);
    ctx.stroke();
    ctx.restore();

    /* --- 각도 호 (심화 모드) --- */
    if (adv) {
      var r = 26;
      // θ₁ : 아래쪽 법선(+y, 각 PI/2) → 입수점→광원 방향
      var aDownNormal = Math.PI / 2;
      var aToSrc = Math.atan2(src.y - entry.y, src.x - entry.x);
      ctx.strokeStyle = C.runPath;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(entry.x, entry.y, r, Math.min(aDownNormal, aToSrc), Math.max(aDownNormal, aToSrc));
      ctx.stroke();
      var m1 = (aDownNormal + aToSrc) / 2;
      ctx.fillStyle = C.runPath;
      ctx.font = "12px " + FONT;
      ctx.textAlign = "center";
      ctx.fillText(L.a1, entry.x + (r + 16) * Math.cos(m1), entry.y + (r + 16) * Math.sin(m1) + 4);

      // θ₂ : 위쪽 법선(-y, 각 -PI/2) → 입수점→사람 방향
      var aUpNormal = -Math.PI / 2;
      var aToDst = Math.atan2(dst.y - entry.y, dst.x - entry.x);
      ctx.strokeStyle = C.swimPath;
      ctx.beginPath();
      ctx.arc(entry.x, entry.y, r, Math.min(aUpNormal, aToDst), Math.max(aUpNormal, aToDst));
      ctx.stroke();
      var m2 = (aUpNormal + aToDst) / 2;
      ctx.fillStyle = C.swimPath;
      ctx.fillText(L.a2, entry.x + (r + 18) * Math.cos(m2), entry.y + (r + 18) * Math.sin(m2) + 4);
    }

    /* --- 속력 라벨 (심화 모드) --- */
    if (adv) {
      ctx.font = "13px " + MONO;
      ctx.textAlign = "center";
      ctx.fillStyle = C.runPath;
      ctx.fillText(L.v1, (src.x + entry.x) / 2 - 10, (src.y + entry.y) / 2 - 6);
      ctx.fillStyle = C.swimPath;
      ctx.fillText(L.v2, (entry.x + dst.x) / 2 + 12, (entry.y + dst.y) / 2 - 6);
    }

    /* --- 점 마커 --- */
    dot(ctx, src.x, src.y, 6, C.sub);
    dot(ctx, dst.x, dst.y, 6, C.main);
    dot(ctx, entry.x, entry.y, 5, "#cf222e");

    /* --- 좌표 라벨 (심화 모드) --- */
    if (adv) {
      ctx.font = "12px " + MONO;
      ctx.fillStyle = C.text;
      ctx.textAlign = "left";
      ctx.fillText("(0, 0)", src.x + 8, src.y + 16);
      ctx.fillText("(p, q)", dst.x + 8, dst.y - 8);
      ctx.fillText("(x, L)", entry.x + 8, entry.y - 8);
    }

    /* --- 인물/지점 이름 라벨 (항상) --- */
    ctx.font = "12px " + FONT;
    ctx.fillStyle = C.text;
    ctx.textAlign = "left";
    ctx.fillText(L.srcMark, src.x + 8, src.y - 8);
    ctx.fillText(L.dstMark, dst.x + 8, dst.y + 16);

    /* --- 영역 이름 라벨 (항상) --- */
    ctx.font = "13px " + FONT;
    ctx.textAlign = "left";
    ctx.fillStyle = C.sub;
    ctx.fillText(L.upper, plot.x + 10, plot.y + 18);
    ctx.fillStyle = C.muted;
    ctx.fillText(L.lower, plot.x + 10, plot.y + plot.h - 10);

    /* --- 입수점 라벨 (항상, 작게) --- */
    ctx.font = "12px " + FONT;
    ctx.fillStyle = "#cf222e";
    ctx.textAlign = "center";
    ctx.fillText(L.entry, entry.x, entry.y + 30);
  }

  return { draw: draw };
})();
