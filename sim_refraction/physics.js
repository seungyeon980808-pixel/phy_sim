/* =========================================================================
   physics.js — PURE functions only (no DOM, no canvas, no state)
   수상 구조원 비유 = 빛의 굴절. 모래/물 또는 공기/매질에 모두 재사용된다.

   좌표계:
     - 원점 (0,0) = 구조원, 화면 왼쪽 아래.
     - x 오른쪽(+), y 위쪽(+).
     - 모래(해변): 0 <= y <= L,  물: y > L,  해안선: y = L.
     - 입수점 (x, L),  빠진 사람 (p, q),  q = L + d > L.
   ========================================================================= */

var Physics = (function () {
  "use strict";

  /* ===== 핵심 물리량 =====
     params = { beachWidth, L, d, p, v, vWater }
       d  : 해안선 → 사람 수직 거리 (q = L + d)
       v  : 모래(빠른 매질) 속력,  vWater : 물(느린 매질) 속력
       n  = v / vWater  (> 1)
  */

  function q(params) {
    return params.L + params.d;
  }

  function n(params) {
    return params.v / params.vWater;
  }

  // 모래 위 달리기 거리: (0,0) -> (x, L)
  function sandDist(x, params) {
    return Math.sqrt(x * x + params.L * params.L);
  }

  // 물 속 수영 거리: (x, L) -> (p, q)
  function waterDist(x, params) {
    var dx = params.p - x;
    return Math.sqrt(dx * dx + params.d * params.d);
  }

  // 총 시간  t(x) = sqrt(x^2+L^2)/v + n*sqrt((p-x)^2+d^2)/v
  function totalTime(x, params) {
    return sandDist(x, params) / params.v +
           n(params) * waterDist(x, params) / params.v;
  }

  /* ===== 각도 (연직 법선 기준) ===== */
  function sinTheta1(x, params) {
    var s = sandDist(x, params);
    return s === 0 ? 0 : x / s;
  }

  function sinTheta2(x, params) {
    var w = waterDist(x, params);
    return w === 0 ? 0 : (params.p - x) / w;
  }

  function theta1(x, params) {
    return Math.asin(Math.max(-1, Math.min(1, sinTheta1(x, params))));
  }

  function theta2(x, params) {
    return Math.asin(Math.max(-1, Math.min(1, sinTheta2(x, params))));
  }

  // 최소시간(굴절) 조건 좌변/우변:  sin(theta1)  vs  n*sin(theta2)
  function nSinTheta2(x, params) {
    return n(params) * sinTheta2(x, params);
  }

  /* ===== 최적 입수 위치 (t 최소) — t(x)는 x에 대해 볼록 → 삼분 탐색 ===== */
  function optimalX(params) {
    var lo = 0;
    var hi = Math.max(params.p, params.beachWidth);
    for (var i = 0; i < 200; i++) {
      var m1 = lo + (hi - lo) / 3;
      var m2 = hi - (hi - lo) / 3;
      if (totalTime(m1, params) < totalTime(m2, params)) {
        hi = m2;
      } else {
        lo = m1;
      }
    }
    return (lo + hi) / 2;
  }

  /* ===== 표시 영역(월드 좌표 범위) =====
     x: 0..Xmax,  y: 0..Ymax.  사람 위치 p 와 해변 폭 모두 담는다. */
  function world(params) {
    var qq = q(params);
    var Xmax = Math.max(params.beachWidth, params.p) * 1.08;
    if (Xmax <= 0) Xmax = 1;
    var Ymax = qq * 1.15;
    if (Ymax <= 0) Ymax = 1;
    return { Xmax: Xmax, Ymax: Ymax, q: qq };
  }

  /* ===== 월드 <-> 픽셀 변환 =====
     plot = { x, y, w, h } : 그릴 픽셀 사각형 (좌상단 기준)
     y는 위가 +이므로 픽셀로 변환할 때 뒤집는다. */
  function makeTransform(w, plot) {
    return {
      px: function (wx) { return plot.x + (wx / w.Xmax) * plot.w; },
      py: function (wy) { return plot.y + plot.h - (wy / w.Ymax) * plot.h; },
      invX: function (px) { return ((px - plot.x) / plot.w) * w.Xmax; },
      invY: function (py) { return ((plot.y + plot.h - py) / plot.h) * w.Ymax; }
    };
  }

  return {
    q: q,
    n: n,
    sandDist: sandDist,
    waterDist: waterDist,
    totalTime: totalTime,
    sinTheta1: sinTheta1,
    sinTheta2: sinTheta2,
    nSinTheta2: nSinTheta2,
    theta1: theta1,
    theta2: theta2,
    optimalX: optimalX,
    world: world,
    makeTransform: makeTransform
  };
})();
