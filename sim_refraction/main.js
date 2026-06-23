/* =========================================================================
   main.js — 상태 관리 · 이벤트 연결 · 그리기 오케스트레이션
   ========================================================================= */

(function () {
  "use strict";

  /* ===== STATE ===== */
  var params = {
    beachWidth: 100,
    L: 30,
    d: 40,      // 해안선 → 사람 수직 거리 (q = L + d)
    p: 80,
    v: 8,       // 모래(빠른 매질) 속력
    vWater: 5   // 물(느린 매질) 속력
  };

  var state = {
    x: 40,             // 현재 입수위치
    mode: "analogy",   // "analogy" | "light"
    advanced: false
  };

  /* ===== DOM ===== */
  var $ = function (id) { return document.getElementById(id); };
  var sceneCanvas = $("scene");
  var graphCanvas = $("graph");
  var sceneCtx, graphCtx;

  /* ===== CANVAS (devicePixelRatio 대응) ===== */
  function setupCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  /* ===== TEXT (모드별) ===== */
  function applyModeText() {
    var light = state.mode === "light";
    $("page-title").textContent = light
      ? "빛의 굴절 — 최소 시간의 경로"
      : "수상 구조원의 최단 시간 경로";
    $("page-sub").textContent = light
      ? "입사점을 옮겨 입사각·굴절각과 스넬 법칙을 확인해 보자."
      : "입수위치를 바꿔 총 시간이 최소가 되는 지점을 찾아보자.";
    $("x-label").textContent = light ? "입사점 위치" : "입수위치";
    $("btn-mode").textContent = light ? "비유로 돌아가기" : "비유 종료";
    $("match-hint").textContent = light
      ? "두 값이 같아지면 스넬 법칙이 성립 — 빛이 실제로 굴절하는 지점."
      : "두 값이 같아지는 입수위치가 최소시간(굴절) 지점.";
    $("light-note").hidden = !light;
  }

  /* ===== 그리기 ===== */
  function renderScene() {
    Scene.draw(sceneCtx, sceneCanvas.clientWidth, sceneCanvas.clientHeight, params, state);
  }

  function renderGraph() {
    var t = Physics.totalTime(state.x, params);
    Graph.draw(graphCtx, graphCanvas.clientWidth, graphCanvas.clientHeight, params, {
      current: { x: state.x, t: t },
      showPrev: $("chk-prev").checked
    });
  }

  function updateReadouts() {
    var t = Physics.totalTime(state.x, params);
    $("x-readout").textContent = state.x.toFixed(1);
    $("t-readout").textContent = t.toFixed(2);
    $("n-readout").textContent = Physics.n(params).toFixed(2);

    // 심화 readout
    $("adv-box").hidden = !state.advanced;
    if (state.advanced) {
      $("lhs-val").textContent = Physics.sinTheta1(state.x, params).toFixed(3);
      $("rhs-val").textContent = Physics.nSinTheta2(state.x, params).toFixed(3);
      $("formula").textContent = "t(x) = √(x²+L²)/v + n·√((p−x)²+(q−L)²)/v";
    }
  }

  function renderAll() {
    renderScene();
    renderGraph();
    updateReadouts();
  }

  /* ===== 슬라이더 범위 동기화 ===== */
  function syncSlider() {
    var s = $("x-slider");
    s.max = params.beachWidth;
    if (state.x > params.beachWidth) { state.x = params.beachWidth; }
    s.value = state.x;
  }

  /* ===== 세부설정 읽기 + 검증 ===== */
  function readSettings() {
    var beach = parseFloat($("set-beach").value);
    var L = parseFloat($("set-L").value);
    var d = parseFloat($("set-d").value);
    var p = parseFloat($("set-p").value);
    var v = parseFloat($("set-v").value);
    var vw = parseFloat($("set-vw").value);

    // 기본 유효성 (양수, q > L 보장)
    if (isFinite(beach) && beach >= 1) params.beachWidth = beach;
    if (isFinite(L) && L >= 1) params.L = L;
    if (isFinite(d) && d >= 1) params.d = d;       // q = L + d > L 보장
    if (isFinite(p) && p >= 0) params.p = p;
    if (isFinite(v) && v > 0) params.v = v;

    // 물 속력 < 모래 속력 (n > 1) 강제. 위반 시 클램프 + 시각 경고.
    var vwInput = $("set-vw");
    if (isFinite(vw) && vw > 0 && vw < params.v) {
      params.vWater = vw;
      vwInput.classList.remove("invalid");
    } else {
      params.vWater = Math.max(0.1, params.v * 0.9);
      vwInput.value = params.vWater.toFixed(1);
      vwInput.classList.add("invalid");
    }

    syncSlider();
    renderAll();
  }

  /* ===== 이벤트 연결 ===== */
  function wire() {
    $("x-slider").addEventListener("input", function (e) {
      state.x = parseFloat(e.target.value);
      renderAll();
    });

    $("btn-record").addEventListener("click", function () {
      Graph.add(state.x, Physics.totalTime(state.x, params));
      if (!$("chk-prev").checked) { $("chk-prev").checked = true; }
      renderGraph();
    });

    $("btn-clear").addEventListener("click", function () {
      Graph.clear();
      renderGraph();
    });

    $("chk-prev").addEventListener("change", renderGraph);

    $("btn-advanced").addEventListener("click", function () {
      state.advanced = !state.advanced;
      $("btn-advanced").classList.toggle("active", state.advanced);
      renderAll();
    });

    $("btn-mode").addEventListener("click", function () {
      state.mode = state.mode === "light" ? "analogy" : "light";
      $("btn-mode").classList.toggle("active", state.mode === "light");
      applyModeText();
      renderAll();
    });

    ["set-beach", "set-L", "set-d", "set-p", "set-v", "set-vw"].forEach(function (id) {
      $(id).addEventListener("change", readSettings);
    });

    window.addEventListener("resize", function () {
      sceneCtx = setupCanvas(sceneCanvas);
      graphCtx = setupCanvas(graphCanvas);
      renderAll();
    });
  }

  /* ===== INIT ===== */
  function init() {
    sceneCtx = setupCanvas(sceneCanvas);
    graphCtx = setupCanvas(graphCanvas);
    syncSlider();
    applyModeText();
    wire();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
