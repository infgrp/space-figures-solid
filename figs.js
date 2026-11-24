/* 공간도형 — 그림 모음 (TikZ 좌표를 그대로 3차원으로: x 오른쪽, y 위, z 앞쪽)
   그림 하나 = { P: {이름: [x,y,z]}, I: [항목...], size?: 화면 크기, at?: [dx,dy,dz] }
   항목: ["seg",a,b,o] 선분 · ["pt",a,o] 점 · ["lab",a,글,o] 이름표 · ["plane",[꼭짓점],o] 평면 · ["face",[꼭짓점],o] 입체의 면
         ["ra",꼭짓점,u,v,o] 직각 표시 · ["arc",꼭짓점,u,v,o] 각 · ["tick",a,b,o] 같은 길이 표시 · ["arrow",a,b,o]
         ["circ",중심,법선,반지름,o] · ["ell",중심,u,v,o] · ["sphere",중심,반지름,o] · ["cyl",밑면 중심,반지름,높이,o] · ["hemi",중심,반지름,o]
   o.p / o.e : 그 블록의 몇 번째 단계부터 / 까지 보이는지 · o.c : 색 (g 금 · m 분홍 · b 하늘 · r 빨강 · n 초록 · y 노랑 · 그 밖은 #hex)
   점은 이름(문자열) 또는 [x,y,z] */
(function (root) {
  "use strict";
  const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]), mul = (a, k) => a.map(v => v * k);
  const mid = (a, b) => mul(add(a, b), 0.5), lerp = (a, b, t) => add(a, mul(sub(b, a), t));
  const len = a => Math.hypot(...a), nrm = a => mul(a, 1 / len(a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const foot = (p, a, b) => { const d = sub(b, a); return add(a, mul(d, dot(sub(p, a), d) / dot(d, d))); };

  const seg = (a, b, o = {}) => ["seg", a, b, o], pt = (a, o = {}) => ["pt", a, o], lab = (a, t, o = {}) => ["lab", a, t, o];
  const plane = (ps, o = {}) => ["plane", ps, o], face = (ps, o = {}) => ["face", ps, o], ra = (c, u, v, o = {}) => ["ra", c, u, v, o];
  const arc = (c, u, v, o = {}) => ["arc", c, u, v, o], tick = (a, b, o = {}) => ["tick", a, b, o], arrow = (a, b, o = {}) => ["arrow", a, b, o];
  const circ = (c, n, r, o = {}) => ["circ", c, n, r, o], ell = (c, u, v, o = {}) => ["ell", c, u, v, o];
  const sph = (c, r, o = {}) => ["sphere", c, r, o], cyl = (c, r, h, o = {}) => ["cyl", c, r, h, o], hemi = (c, r, o = {}) => ["hemi", c, r, o];
  const R = s => `$\\rm ${s}$`;

  // 입체: 모서리 + (선택) 반투명 면 + 꼭짓점 이름
  function solid(P, edges, labs, o = {}) {
    const it = [];
    if (o.faces) for (const f of o.faces) it.push(face(f.split(""), { c: o.fc || "b", op: o.fop ?? 0.16, p: o.p, e: o.e }));
    for (const e of edges) it.push(seg(e[0], e[1], { w: 0.075, p: o.p, e: o.e }));
    for (const [n, an] of Object.entries(labs)) it.push(lab(n, R(n), { o: an, p: o.p, e: o.e }));
    return it;
  }
  const BOX_E = ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"];
  const BOX_L = { A: "l", B: "br", C: "r", D: "l", E: "l", F: "r", G: "r", H: "br" };
  const box = (w, h, d) => ({ A: [0, h, d], B: [w, h, d], C: [w, h, 0], D: [0, h, 0], E: [0, 0, d], F: [w, 0, d], G: [w, 0, 0], H: [0, 0, 0] });
  const boxFaces = ["ABCD", "EFGH", "ABFE", "DCGH", "ADHE", "BCGF"];
  // 정사면체 (TikZ: 한 변 a, 높이 h = √6a/3, 밑면 외접원 d = √3a/3, 회전 t)
  function tetra(a = 4, t = 60) {
    const h = Math.sqrt(6) * a / 3, d = Math.sqrt(3) * a / 3, c = x => Math.cos(x * Math.PI / 180), s = x => Math.sin(x * Math.PI / 180);
    return { A: [0, h, 0], B: [d * c(t + 120), 0, d * s(t + 120)], C: [d * c(t), 0, d * s(t)], D: [d * c(t + 240), 0, d * s(t + 240)], H: [0, 0, 0] };
  }
  const TET_E = ["AB", "AC", "AD", "BC", "CD", "DB"];
  const pyr = () => ({ A: [2, 3, 2], B: [0, 0, 4], C: [4, 0, 4], D: [4, 0, 0], E: [0, 0, 0] });
  const PYR_E = ["AB", "AC", "AD", "AE", "BC", "CD", "DE", "EB"];
  const PYR_L = { A: "a", B: "l", C: "r", D: "r", E: "bl" };
  const prism = () => ({ D: [0, 0, 0], E: [2, 0, 2], F: [3, 0, -2], A: [0, 3, 0], B: [2, 3, 2], C: [3, 3, -2] });
  const PRISM_E = ["AB", "BC", "CA", "DE", "EF", "FD", "AD", "BE", "CF"];
  const PRISM_L = { A: "l", B: "br", C: "r", D: "l", E: "b", F: "r" };
  // 수평 판 (위치 관계 그림의 노란 판) — 원점 기준 평행사변형
  const tile = (o = [0, 0, 0], w = 7, dz = 4, sk = 2) => [o, add(o, [w, 0, 0]), add(o, [w + sk, 0, -dz]), add(o, [sk, 0, -dz])];

  const F = {};

  // 표지: 정육면체와 대각 평면
  F.intro = () => { const P = box(2, 2, 2); return { P, size: 20, I: [...solid(P, BOX_E, BOX_L, { faces: boxFaces, fop: 0.08 }), face("BFHD".split(""), { c: "g", op: 0.3 }), face("AFC".split(""), { c: "m", op: 0.3 })] }; };

  // 평면의 결정: 직선 AB 를 품는 평면 여럿 → 점 C 를 더하면 하나
  F.planeDet = () => {
    const P = { A: [0.5, 0, 0], B: [2, 0, 0], C: [2.5, 0.68, -1.7], L0: [-0.4, 0, 0], L1: [3.4, 0, 0] };
    const fan = [[0, -0.5, -3, "n"], [0, 0.8, -2, "r"], [0, 2, 2, "b"], [0, -2, -2, "b"], [0, -0.8, 2, "r"], [0, 0.5, 3, "n"]];
    const I = fan.map(([, y, z, c], i) => plane([[0, 0, 0], [3, 0, 0], [3, y, z], [0, y, z]], { c, op: 0.26, e: i === 1 ? 99 : 0, grid: false }));
    I.push(plane([[0, 0, 0], [3, 0, 0], [3, 0.8, -2], [0, 0.8, -2]], { c: "g", op: 0.42, p: 1, grid: false }));
    I.push(seg("L0", "L1", { w: 0.09 }), pt("A"), pt("B"), lab("A", R("A"), { o: "b" }), lab("B", R("B"), { o: "b" }), pt("C", { p: 1 }), lab("C", R("C"), { o: "r", p: 1 }));
    return { P, size: 22, I };
  };
  // 평면이 결정되는 네 조건 (판 넷을 가로로)
  F.cond4 = () => {
    const I = [], P = {};
    const off = [[-17, 0, 0], [-8, 0, 0], [1, 0, 0], [10, 0, 0]];
    off.forEach((o, k) => {
      I.push(plane(tile(o), { c: "y", op: 0.26 }));
      const q = (x, z) => add(o, [x, 0, z]);
      I.push(lab(q(4.5, 1.6), `{g:(${k + 1})}`, { sz: 1.3 }));
      if (k === 0) I.push(pt(q(2, -1)), pt(q(5, -1)), pt(q(4, -3)));
      if (k === 1) I.push(seg(q(1, -1), q(5.5, -1), { c: "b" }), pt(q(4, -3)));
      if (k === 2) I.push(seg(q(1, -0.5), q(7, -3.5), { c: "b" }), seg(q(5.5, -0.5), q(2.5, -3.5), { c: "m" }));
      if (k === 3) I.push(seg(q(1, -1), q(6, -1), { c: "b" }), seg(q(2.4, -3), q(7.4, -3), { c: "m" }));
    });
    return { P, size: 34, I, yaw: 0, pitch: 0.55 };
  };
  // 삼각기둥 (문제)
  F.prismQ = (extra = []) => { const P = prism(); return { P, size: 18, I: [...solid(P, PRISM_E, PRISM_L, { faces: ["ABC", "DEF"], fop: 0.1 }), ...extra] }; };

  // 두 직선의 위치 관계 (판 셋)
  F.twoLines = () => {
    const I = [], off = [[-14, 0, 0], [-4, 0, 0], [6, 0, 0]];
    const names = ["한 점에서 만난다", "평행하다", "꼬인 위치"];
    off.forEach((o, k) => {
      const q = (x, y, z) => add(o, [x, y, z]);
      I.push(plane(tile(o, 8, 4, 2), { c: "y", op: 0.24 }), lab(q(4.5, -1.6, 1.6), `{g:${names[k]}}`, { sz: 1.15 }));
      if (k === 0) I.push(seg(q(1, 0, -0.5), q(7, 0, -3), { c: "b" }), seg(q(5.5, 0, -1), q(2.5, 0, -3.5), { c: "m" }), lab(q(7.6, 0, -3), "$l$", {}), lab(q(6.1, 0, -0.8), "$m$", {}));
      if (k === 1) I.push(seg(q(2.5, 0, -3), q(7.5, 0, -3), { c: "b" }), seg(q(1, 0, -1), q(6, 0, -1), { c: "m" }), lab(q(8.1, 0, -3), "$l$", {}), lab(q(6.6, 0, -1), "$m$", {}));
      if (k === 2) I.push(seg(q(1, 0, -1), q(6, 0, -1), { c: "m" }), seg(q(4.2, -2.6, -2.4), q(5.8, 3.4, -3.6), { c: "b" }), pt(q(4.9, 0, -2.95), { c: "b" }), lab(q(6.6, 0, -1), "$m$", {}), lab(q(6.1, 3.8, -3.6), "$l$", {}));
    });
    return { P: {}, size: 32, I, yaw: 0, pitch: 0.5 };
  };
  // 직선과 평면 (판 셋)
  F.linePlane = () => {
    const I = [], off = [[-14, 0, 0], [-4, 0, 0], [6, 0, 0]], names = ["포함된다", "한 점에서 만난다", "평행하다"];
    off.forEach((o, k) => {
      const q = (x, y, z) => add(o, [x, y, z]);
      I.push(plane(tile(o, 8, 4, 2), { c: "y", op: 0.24 }), lab(q(4.5, -1.6, 1.6), `{g:${names[k]}}`, { sz: 1.15 }), lab(q(1.4, 0.3, -0.6), "$\\alpha$", { sz: 1.2 }));
      if (k === 0) I.push(seg(q(6, 0, -1), q(3, 0, -3.5), { c: "b" }), lab(q(6.6, 0, -0.8), "$l$", {}));
      if (k === 1) I.push(seg(q(5.4, -2.6, -1.5), q(4.4, 3.4, -2.6), { c: "b" }), pt(q(4.97, 0, -1.97), { c: "b" }), lab(q(4.2, 3.8, -2.6), "$l$", {}));
      if (k === 2) I.push(seg(q(2.5, 2.4, -2), q(8.5, 2.4, -2), { c: "b" }), lab(q(9.1, 2.4, -2), "$l$", {}));
    });
    return { P: {}, size: 32, I, yaw: 0, pitch: 0.5 };
  };
  // 사각뿔 (밑면 정사각형)
  F.pyramid = (extra = [], o = {}) => { const P = Object.assign(pyr(), o.P || {}); return { P, size: 18, I: [...solid(P, PYR_E, PYR_L, { faces: ["BCDE"], fop: 0.12 }), ...extra] }; };
  // 두 평면의 위치 관계
  F.twoPlanes = () => {
    const I = [], L = [-9, 0, 0], Rr = [5, 0, 0];
    const q = (o, x, y, z) => add(o, [x, y, z]);
    // 만난다: 수평 β 와 기운 α 가 교선 l 에서
    I.push(plane([q(L, -3, 0, -2), q(L, 3, 0, -2), q(L, 3, 0, 2), q(L, -3, 0, 2)], { c: "y", op: 0.26 }));
    I.push(plane([q(L, -2.6, 2.6, -2), q(L, 2.6, -2.6, -2), q(L, 2.6, -2.6, 2), q(L, -2.6, 2.6, 2)], { c: "r", op: 0.26 }));
    I.push(seg(q(L, 0, 0, -2.2), q(L, 0, 0, 2.2), { c: "r", w: 0.11 }), lab(q(L, 0.3, 0.5, 2.6), "{r:교선} $\\Cr{l}$", { sz: 1.1 }));
    I.push(lab(q(L, -3.4, 0.2, 1.6), "$\\beta$", {}), lab(q(L, -2.9, 3.0, -2), "$\\alpha$", {}), lab(q(L, 0, -4.4, 2), "{g:한 직선에서 만난다}", { sz: 1.15 }));
    // 평행하다
    I.push(plane([q(Rr, 0, 0, -2), q(Rr, 6, 0, -2), q(Rr, 6, 0, 2), q(Rr, 0, 0, 2)], { c: "y", op: 0.26 }));
    I.push(plane([q(Rr, 0, 2.6, -2), q(Rr, 6, 2.6, -2), q(Rr, 6, 2.6, 2), q(Rr, 0, 2.6, 2)], { c: "r", op: 0.26 }));
    I.push(lab(q(Rr, -0.6, 0.2, 1.6), "$\\beta$", {}), lab(q(Rr, -0.6, 2.8, 1.6), "$\\alpha$", {}), lab(q(Rr, 3, -4.4, 2), "{g:평행하다}", { sz: 1.15 }));
    return { P: {}, size: 30, I, yaw: -0.35, pitch: 0.2 };
  };
  // 직육면체 (문제)
  F.cuboid = (w = 4, h = 2, d = 2, extra = [], o = {}) => { const P = Object.assign(box(w, h, d), o.P || {}); return { P, size: o.size || 20, I: [...solid(P, BOX_E, Object.assign({}, BOX_L, o.L || {}), { faces: boxFaces, fop: 0.07 }), ...extra] }; };

  // 예제: 평행한 두 평면 α, β 를 평면 γ 가 자른다 → 교선 l ∥ m
  F.parallelCut = () => {
    const P = { S: [1, 2, 0], P1: [1, 2, 3], R: [3, 0, 0], Q: [3, 0, 3] };
    const I = [
      plane([[0, 2, 0], [4, 2, 0], [4, 2, 3], [0, 2, 3]], { c: "y", op: 0.24 }), plane([[0, 0, 0], [4, 0, 0], [4, 0, 3], [0, 0, 3]], { c: "n", op: 0.24 }),
      plane([[0, 3, 0], [4, -1, 0], [4, -1, 3], [0, 3, 3]], { c: "r", op: 0.22 }),
      seg("S", "P1", { c: "b", w: 0.12 }), seg("R", "Q", { c: "m", w: 0.12 }),
      lab([1.15, 2.4, 3.5], "$\\Cb{l}$", {}), lab([3.2, 0.4, 3.5], "$\\Cm{m}$", {}),
      lab([4.5, 2, 2], "$\\alpha$", {}), lab([4.5, 0, 2], "$\\beta$", {}), lab([-0.5, 3.2, 1.5], "$\\gamma$", {}),
      arrow([1.6, 2, 1.5], [3.4, 0, 1.5], { p: 1, c: "g", dash: true }),
    ];
    return { P, size: 20, I };
  };
  // 문제: l ∥ α, l 을 품는 β 와 α 의 교선 m
  F.lineParPlane = () => {
    const I = [plane([[0, 0, 3], [4, 0, 3], [4, 0, -3], [0, 0, -3]], { c: "y", op: 0.24 }), plane([[0, -1.5, 1.5], [4, -1.5, 1.5], [4, 2, -2], [0, 2, -2]], { c: "n", op: 0.24 }),
      seg([0, 0, 0], [4, 0, 0], { c: "m", w: 0.11 }), seg([0.5, 1.5, -1.5], [3.5, 1.5, -1.5], { c: "b", w: 0.11 }),
      lab([4.1, 1.5, -1.5], "$\\Cb{l}$", {}), lab([4.4, 0.3, 0], "$\\Cm{m}$", {}), lab([4.4, 0, 2.6], "$\\alpha$", {}), lab([4.4, -1.4, 1.6], "$\\beta$", {})];
    return { P: {}, size: 20, I };
  };
  // 문제: α ∥ β, l ⊂ α
  F.lineInPar = () => ({ P: {}, size: 18, I: [plane([[-2, 2, 0], [2, 2, 0], [2, 2, 2.5], [-2, 2, 2.5]], { c: "y", op: 0.24 }), plane([[-2, 0, 0], [2, 0, 0], [2, 0, 2.5], [-2, 0, 2.5]], { c: "n", op: 0.24 }),
    seg([-1.4, 2, 1.8], [1.6, 2, 0.6], { c: "b", w: 0.11 }), lab([2.0, 2.4, 0.6], "$\\Cb{l}$", {}), lab([-2.6, 2, 2], "$\\alpha$", {}), lab([-2.6, 0, 2], "$\\beta$", {})] });
  // 예제: 점 P 를 지나 α 에 평행한 두 직선 l, m 이 정하는 평면 β → α ∥ β (귀류법)
  F.twoParLines = () => {
    const P = { P: [2, 2, 1.5] };
    const I = [plane([[-0.5, 0, -0.5], [4.5, 0, -0.5], [4.5, 0, 3.5], [-0.5, 0, 3.5]], { c: "y", op: 0.24 }), lab([5, 0, 3], "$\\alpha$", {}),
      seg([0, 2, 0.5], [4, 2, 2.5], { c: "b", w: 0.11 }), seg([0.6, 2, 3.2], [3.4, 2, -0.2], { c: "m", w: 0.11 }), pt("P"), lab("P", R("P"), { o: "a" }),
      lab([4.4, 2.2, 2.7], "$\\Cb{l}$", {}), lab([3.7, 2.2, -0.5], "$\\Cm{m}$", {}),
      plane([[-0.5, 2, -0.5], [4.5, 2, -0.5], [4.5, 2, 3.5], [-0.5, 2, 3.5]], { c: "n", op: 0.2, p: 1, e: 1 }), lab([5, 2, 3], "$\\beta$", { p: 1 }),
      // 귀류법: β 가 기울어 α 와 교선 n 을 만든다고 가정
      plane([[-0.5, 2.6, -0.5], [4.5, 1.4, -0.5], [4.5, 1.4, 3.5], [-0.5, 2.6, 3.5]], { c: "r", op: 0.18, p: 2, e: 2 }),
      seg([-0.5, 0, 1.5], [4.5, 0, 1.5], { c: "r", w: 0.1, p: 2, e: 2, dash: true }), lab([5, 0.4, 1.5], "$\\Cr{n}$", { p: 2, e: 2 }),
    ];
    return { P, size: 20, I };
  };
  // 세 평면 α ∥ β ∥ γ
  F.threePlanes = () => ({ P: {}, size: 18, I: ["n", "b", "y"].map((c, i) => plane([[-2, i, 0], [2, i, 0], [2, i, 2.5], [-2, i, 2.5]], { c, op: 0.24 })).concat(
    [lab([-2.6, 0, 2], "$\\gamma$", {}), lab([-2.6, 1, 2], "$\\beta$", {}), lab([-2.6, 2, 2], "$\\alpha$", {})]) });

  // 두 직선이 이루는 각: 꼬인 직선 l 을 내려 m 과 만나게
  F.skewAngle = () => {
    const P = { O: [2, 0, 2] };
    const I = [plane([[0, 0, 0], [0, 0, 4], [4.5, 0, 4], [4.5, 0, 0]], { c: "y", op: 0.22 }),
      seg([0.5, 0, 2], [3.5, 0, 2], { c: "m", w: 0.1 }), lab([4.0, 0, 2], "$\\Cm{m}$", {}),
      seg([0.5, 2, 3.5], [3.5, 2, 0.5], { c: "b", w: 0.1 }), lab([4.0, 2, 0.5], "$\\Cb{l}$", {}),
      arrow([1, 2, 3], [1, 0.15, 3], { dash: true, p: 1 }), arrow([3, 2, 1], [3, 0.15, 1], { dash: true, p: 1 }),
      seg([0.5, 0, 3.5], [3.5, 0, 0.5], { c: "b", w: 0.1, p: 1 }), lab([4.0, 0, 0.5], "$\\Cb{l'}$", { p: 1 }),
      pt("O", { p: 1 }), lab("O", R("O"), { o: "b", p: 1 }), arc("O", [3.5, 0, 2], [3.5, 0, 0.5], { r: 0.9, c: "g", p: 1 })];
    return { P, size: 20, I };
  };
  // 정육면체 (보기): AC ∥ EG, AB 와 EG, AC ⊥ FH
  F.cubeAngle = () => { const P = box(2, 2, 2); return { P, size: 18, I: [...solid(P, BOX_E, BOX_L, { faces: boxFaces, fop: 0.06 }),
    seg("A", "C", { c: "b", w: 0.09 }), seg("E", "G", { c: "b", w: 0.09 }), seg("F", "H", { c: "m", w: 0.09, p: 1 }),
    arc("A", "B", "C", { r: 0.55, c: "g", e: 0 }), arc([1, 0, 1], "F", "G", { r: 0.4, c: "g", p: 1 }), ra([1, 0, 1], "F", "G", { p: 1, c: "n" })] }; };
  // 정팔면체
  F.octa = () => { const h = Math.sqrt(8), P = { A: [0, h, 0], B: [-h, 0, 0], C: [0, 0, h], D: [h, 0, 0], E: [0, 0, -h], F: [0, -h, 0] };
    return { P, size: 18, I: [...solid(P, ["AB", "AC", "AD", "AE", "FB", "FC", "FD", "FE", "BC", "CD", "DE", "EB"], { A: "a", B: "l", C: "bl", D: "r", E: "ar", F: "b" }, { faces: ["ABF", "ADF"], fc: "b", fop: 0.1 })] }; };
  // 직선과 평면의 수직: 평면 위의 여러 직선과 모두 수직
  F.perpPlane = () => {
    const P = { O: [2, 0, 2], T: [2, 2.4, 2] };
    const I = [plane([[0, 0, 0], [0, 0, 4], [4.5, 0, 4], [4.5, 0, 0]], { c: "y", op: 0.22 }), lab([4.8, 0, 3.6], "$\\alpha$", {}),
      seg("O", "T", { c: "r", w: 0.12 }), seg("O", [2, -1.5, 2], { c: "r", w: 0.12, dash: true }), lab([2.3, 2.6, 2], "$\\Cr{l}$", {}),
      pt("O"), lab("O", R("O"), { o: "bl" })];
    [[0.5, 3.5, 3.5, 0.5], [0.5, 2, 3.5, 2], [0.5, 0.5, 3.5, 3.5]].forEach(([x0, z0, x1, z1], k) => {
      I.push(seg([x0, 0, z0], [x1, 0, z1], { c: "b", w: 0.08 }), ra("O", "T", [x1, 0, z1], { s: 0.5 }));
    });
    I.push(lab([3.9, 0.4, 2.6], "{b:수선의 발}", { sz: 1.0, p: 0 }));
    return { P, size: 20, I };
  };
  // 예제: l ⊥ m, l ⊥ n 이면 l ⊥ α (합동으로 증명)
  F.perpProof = () => {
    const O = [0, 0, 0], P = { O, P: [0, 2.2, 0], Q: [0, -2.2, 0], A: [2.4, 0, -0.6], B: [-1.2, 0, 2.2], C: [1.4, 0, 2.0] };
    const I = [plane([[-3, 0, -2.6], [3.4, 0, -2.6], [3.4, 0, 3], [-3, 0, 3]], { c: "y", op: 0.2 }), lab([3.7, 0, 2.6], "$\\alpha$", {}),
      seg("P", "Q", { c: "r", w: 0.11 }), lab([0.3, 2.9, 0], "$\\Cr{l}$", {}),
      seg(mul(P.A, -0.8), mul(P.A, 1.15), { c: "b", w: 0.08 }), seg(mul(P.B, -0.9), mul(P.B, 1.2), { c: "b", w: 0.08 }),
      lab(mul(P.A, 1.32), "$\\Cb{m}$", {}), lab(mul(P.B, 1.36), "$\\Cb{n}$", {}),
      seg(mul(P.C, -0.9), mul(P.C, 1.2), { c: "m", w: 0.08, p: 0 }), lab(mul(P.C, 1.36), "$\\Cm{q'}$", {}),
      seg([-2.6, 0, -1.2], [2.6, 0, 0.6], { c: "m", w: 0.07 }), lab([3.0, 0, 0.8], "$\\Cm{q}$", {}),
      pt("O"), lab("O", R("O"), { o: "bl" }), pt("P", { p: 1 }), pt("Q", { p: 1 }), lab("P", R("P"), { o: "r", p: 1 }), lab("Q", "$\\rm P'$", { o: "r", p: 1 }),
      seg("A", "B", { p: 1, w: 0.06 }), seg("B", "C", { p: 1, w: 0.06 }), pt("A", { p: 1 }), pt("B", { p: 1 }), pt("C", { p: 1 }),
      lab("A", R("A"), { o: "b", p: 1 }), lab("B", R("B"), { o: "l", p: 1 }), lab("C", R("C"), { o: "b", p: 1 }),
      ...["A", "B", "C"].flatMap(n => [seg("P", n, { p: 1, w: 0.05, c: "#c9b8ff" }), seg("Q", n, { p: 1, w: 0.05, c: "#c9b8ff" })]),
      tick("O", "P", { p: 1 }), tick("O", "Q", { p: 1 }), ra("O", "P", "C", { p: 2, c: "n" })];
    return { P, size: 20, I };
  };
  // 예제: 정사면체 ABCD, CD 의 중점 M → CD ⊥ 평면 ABM
  F.tetraMid = () => { const P = tetra(4, 60); P.M = mid(P.C, P.D);
    return { P, size: 18, I: [...solid(P, TET_E, { A: "a", B: "l", C: "b", D: "r" }), face(["A", "B", "M"], { c: "b", op: 0.3 }), seg("A", "M", { c: "b" }), seg("B", "M", { c: "b" }),
      pt("M"), lab("M", R("M"), { o: "br" }), tick("C", "M"), tick("M", "D"), ra("M", "A", "D", { p: 1, c: "n" }), ra("M", "B", "D", { p: 1, c: "n" })] }; };
  // 문제: 정육면체 AC ⊥ 평면 BFHD
  F.cubeBFHD = () => { const P = box(2, 2, 2); return { P, size: 18, I: [...solid(P, BOX_E, BOX_L, { faces: boxFaces, fop: 0.05 }), face("BFHD".split(""), { c: "y", op: 0.3 }),
    seg("A", "C", { c: "m", w: 0.09 }), seg("D", "B", { w: 0.07 }), seg("F", "H", { w: 0.07 })] }; };

  // 삼수선의 정리 (교과서 그림): 평면 α, 직선 l, H, O, P
  F.tp = (k) => {
    const P = { H: [2, 0, 2], O: [3.5, 0, 0.5], P: [3.5, 3, 0.5], l0: [0.3, 0, 0.3], l1: [3.8, 0, 3.8] };
    const red = "r", hi = (n) => ({ c: (k === 1 && n === "PH") || (k === 2 && n === "OH") || (k === 3 && n === "PO") ? "n" : "ink", w: 0.1 });
    const I = [plane([[0, 0, -1], [0, 0, 4], [4.5, 0, 4], [4.5, 0, -1]], { c: "y", op: 0.22 }), lab([4.8, 0, 3.6], "$\\alpha$", {}),
      seg("l0", "l1", { c: "g", w: 0.1 }), lab([0.0, 0, 0.0], "$\\Cg{l}$", {}),
      seg("H", "O", hi("OH")), seg("O", "P", hi("PO")), seg("H", "P", hi("PH")),
      pt("H"), pt("O"), pt("P"), lab("H", R("H"), { o: "bl" }), lab("O", R("O"), { o: "b" }), lab("P", R("P"), { o: "a" })];
    if (k) {
      I.push(ra("O", "P", "H", { c: k === 3 ? "n" : "ink" }));
      I.push(ra("H", "O", "l1", { c: k === 2 ? "n" : "ink" }));
      I.push(ra("H", "P", "l1", { c: k === 1 ? "n" : "ink" }));
      I.push(plane(["H", "O", "P"], { c: "n", op: 0.2, p: 0, grid: false }), lab([4.4, 2.2, 0.2], "{n:평면} $\\Cn{\\beta}$", { sz: 1.1 }));
    }
    return { P, size: 20, I };
  };
  // 예제: PO=2, OH=4, AH=2 → PA (실제 비율)
  F.tpEx = () => {
    const u = nrm([1, 0, 1]), v = nrm([1, 0, -1]), H = [2, 0, 2], O = add(H, mul(v, 4)), Pp = add(O, [0, 2, 0]), A = add(H, mul(u, -2)), B = add(H, mul(u, 2.6));
    const P = { H, O, P: Pp, A, B };
    const I = [plane([[-0.6, 0, -2.2], [-0.6, 0, 5], [6.6, 0, 5], [6.6, 0, -2.2]], { c: "y", op: 0.2 }), lab([6.9, 0, 4.6], "$\\alpha$", {}),
      seg("A", "B", { c: "g", w: 0.09 }), seg("H", "O"), seg("O", "P"), seg("H", "P", { c: "m" }), seg("A", "P", { c: "b", w: 0.1 }),
      ...["A", "B", "H", "O", "P"].map(n => pt(n)), lab("A", R("A"), { o: "l" }), lab("B", R("B"), { o: "r" }), lab("H", R("H"), { o: "bl" }), lab("O", R("O"), { o: "b" }), lab("P", R("P"), { o: "a" }),
      lab(mid(H, O), "$4$", { o: "b", c: "g" }), lab(mid(O, Pp), "$2$", { o: "r", c: "g" }), lab(mid(A, H), "$2$", { o: "b", c: "g" }),
      ra("O", "P", "H"), ra("H", "O", "B"), ra("H", "P", "B", { p: 1, c: "n" })];
    return { P, size: 20, I };
  };
  // 문제: 직육면체 AD=3, DC=4, AE=2, D 에서 EG 에 내린 수선의 발 I
  F.cuboidDI = () => { const P = box(4, 2, 3); P.I = foot(P.H, P.E, P.G);
    return F.cuboid(4, 2, 3, [seg("E", "G", { c: "b" }), seg("D", "I", { c: "m" }), pt("I"), lab("I", R("I"), { o: "b" }), ra("I", "D", "G", { c: "ink" })], { P: { I: P.I } }); };

  // 이면각
  F.dihedral = () => {
    const d = nrm([2, 0, 3]), a = nrm([3, 0, -2]), th = 50 * Math.PI / 180, b = add(mul(a, Math.cos(th)), [0, Math.sin(th), 0]);
    const A1 = [0, 0, 0], A2 = mul(d, 3.6), W = 4.4, O = mul(d, 1.6);
    const P = { O, A: add(O, mul(a, 3)), B: add(O, mul(b, 3)), A1, A2 };
    const I = [plane([A1, A2, add(A2, mul(a, W)), add(A1, mul(a, W))], { c: "y", op: 0.24 }), plane([A1, A2, add(A2, mul(b, W)), add(A1, mul(b, W))], { c: "n", op: 0.24 }),
      seg(mul(d, -0.3), mul(d, 3.9), { c: "g", w: 0.12 }), lab(mul(d, -0.7), "$\\Cg{l}$", {}),
      lab(add(A2, mul(a, W + 0.5)), "$\\alpha$", {}), lab(add(A2, mul(b, W + 0.5)), "$\\beta$", {}),
      seg("O", "A", { c: "b", p: 1 }), seg("O", "B", { c: "m", p: 1 }), pt("O", { p: 1 }), pt("A", { p: 1 }), pt("B", { p: 1 }),
      lab("O", R("O"), { o: "l", p: 1 }), lab("A", R("A"), { o: "b", p: 1 }), lab("B", R("B"), { o: "a", p: 1 }),
      ra("O", "A1", "A", { p: 1 }), ra("O", "A1", "B", { p: 1 }), arc("O", "A", "B", { r: 1.0, c: "g", p: 1 })];
    return { P, size: 20, I };
  };
  // 예제: 정사면체 두 면이 이루는 각 cos θ = 1/3
  F.tetraDihedral = () => { const P = tetra(4, 60); P.M = mid(P.B, P.C); P.H = [0, 0, 0];
    return { P, size: 18, I: [...solid(P, TET_E, { A: "a", B: "l", C: "b", D: "r" }), seg("A", "M", { c: "b" }), seg("D", "M", { c: "b" }), pt("M"), lab("M", R("M"), { o: "bl" }), tick("B", "M"), tick("M", "C"),
      arc("M", "A", "D", { r: 0.8, c: "g" }), lab([0.9, 0.5, 0.9], "$\\Cg{\\theta}$", { p: 0, sz: 1.3 }),
      ra("M", "A", "C", { p: 0, c: "ink" }), ra("M", "D", "C", { p: 0, c: "ink" }),
      seg("A", "H", { c: "m", dash: true, p: 1 }), pt("H", { p: 1 }), lab("H", R("H"), { o: "b", p: 1 }), ra("H", "A", "M", { p: 1, c: "ink" }),
      face(["A", "M", "H"], { c: "m", op: 0.28, p: 2 })] }; };
  // 생각 넓히기: 도로·진입로·건물
  F.building = () => {
    const P = { A: [0, 0, 1.5], B: [3, 0, 1.5], D: [3, 0, -1.5], C: [3, 3.2, -1.5] };
    const I = [plane([[-1, 0, 3], [6, 0, 3], [6, 0, -3.5], [-1, 0, -3.5]], { c: "n", op: 0.18 }),
      seg([-1, 0, 1.5], [6, 0, 1.5], { c: "#d8d8e8", w: 0.14 }), lab([6.4, 0, 1.5], "{g:도로}", { sz: 1.0 }),
      seg("B", "D", { c: "y", w: 0.12 }), lab(mid(P.B, P.D), "{y:진입로}", { o: "r", sz: 1.0 }),
      face([[2.4, 0, -1.0], [3.6, 0, -1.0], [3.6, 0, -2.0], [2.4, 0, -2.0]], { c: "b", op: 0.2 }),
      seg("D", "C", { c: "b", w: 0.14 }), seg("A", "C", { c: "m" }), seg("B", "C", { c: "m", dash: true }),
      ...["A", "B", "C", "D"].map(n => pt(n)), lab("A", R("A"), { o: "bl" }), lab("B", R("B"), { o: "b" }), lab("C", R("C"), { o: "a" }),
      ra("B", "A", "D"), ra("D", "B", "C"), arc("A", "B", "C", { r: 0.7, c: "g" })];
    return { P, size: 20, I };
  };

  // 정사영의 정의와 네 가지 모양
  F.projDef = () => {
    const I = [plane([[0, 0, 0], [0, 0, 6], [12.5, 0, 6], [12.5, 0, 0]], { c: "y", op: 0.2 }), lab([13, 0, 5.5], "$\\alpha$", {})];
    // 점
    I.push(pt([1, 3, 3]), pt([1, 0, 3], { c: "b" }), seg([1, 3, 3], [1, 0, 3], { dash: true, w: 0.05 }), lab([1, 3, 3], R("P"), { o: "r" }), lab([1, 0, 3], "$\\rm P'$", { o: "r" }), ra([1, 0, 3], [1, 3, 3], [2, 0, 3], { s: 0.35 }));
    // 선분
    I.push(seg([2.5, 2.5, 5], [3.5, 3.5, 1], { c: "m", w: 0.1, p: 1 }), seg([2.5, 0, 5], [3.5, 0, 1], { c: "m", w: 0.1, p: 1 }),
      seg([2.5, 2.5, 5], [2.5, 0, 5], { dash: true, w: 0.05, p: 1 }), seg([3.5, 3.5, 1], [3.5, 0, 1], { dash: true, w: 0.05, p: 1 }),
      lab([3.9, 3.7, 1], "$F$", { p: 1 }), lab([3.9, 0.3, 1], "$F'$", { p: 1 }));
    // 삼각형
    const T = [[5, 3, 3], [6, 2.5, 5], [7, 3.5, 1]];
    I.push(face(T, { c: "b", op: 0.35, p: 1 }), face(T.map(q => [q[0], 0, q[2]]), { c: "b", op: 0.25, p: 1 }), ...T.map(q => seg(q, [q[0], 0, q[2]], { dash: true, w: 0.05, p: 1 })),
      ...[[0, 1], [1, 2], [2, 0]].flatMap(([i, j]) => [seg(T[i], T[j], { w: 0.06, p: 1 }), seg([T[i][0], 0, T[i][2]], [T[j][0], 0, T[j][2]], { w: 0.06, p: 1 })]),
      lab([6, 3.6, 3], "$F$", { p: 1 }), lab([6, 0.4, 3], "$F'$", { p: 1 }));
    // 구 → 원
    I.push(sph([10, 3, 3], 1.5, { c: "n", op: 0.35, p: 1 }), circ([10, 0.02, 3], [0, 1, 0], 1.5, { fill: true, c: "n", p: 1 }),
      seg([8.5, 3, 3], [8.5, 0, 3], { dash: true, w: 0.05, p: 1 }), seg([11.5, 3, 3], [11.5, 0, 3], { dash: true, w: 0.05, p: 1 }),
      lab([10, 5, 3], "$F$", { p: 1 }), lab([10, 0.4, 5], "$F'$", { p: 1 }));
    return { P: {}, size: 30, I, yaw: -0.3, pitch: 0.3 };
  };
  // 직육면체 + 삼각형 AFC (정사영 문제)
  F.cuboidAFC = () => F.cuboid(4, 2, 3, [face(["A", "F", "C"], { c: "n", op: 0.3 }), seg("A", "F", { c: "n" }), seg("F", "C", { c: "n" }), seg("C", "A", { c: "n" })]);
  // 직선과 평면이 이루는 각 / 정사영의 길이
  F.lineAngle = (len = false) => {
    const P = { O: [1, 0, 3], A: [2, 1, 2], B: [3, 2, 1], A1: [2, 0, 2], B1: [3, 0, 1], T: [3.5, 2.5, 0.5], T1: [3.5, 0, 0.5] };
    const I = [plane([[0, 0, 0], [0, 0, 4], [4.5, 0, 4], [4.5, 0, 0]], { c: "y", op: 0.22 }), lab([4.8, 0, 3.6], "$\\alpha$", {}),
      seg("O", "T", { c: "b", w: 0.09 }), seg("O", "T1", { c: "m", w: 0.09 }), lab([3.9, 2.7, 0.4], len ? "" : "$\\Cb{l}$", {}), lab([3.9, 0, 0.4], len ? "" : "$\\Cm{l'}$", {}),
      arc("O", "T1", "T", { r: 0.8, c: "g" }), pt("O"), lab("O", R("O"), { o: "l" })];
    if (!len) I.push(seg([3, 2, 1], [3, 0, 1], { dash: true, w: 0.05 }), ra([3, 0, 1], [3, 2, 1], "O"));
    else I.push(seg("A", "B", { c: "r", w: 0.14 }), seg("A1", "B1", { c: "r", w: 0.14 }), seg("A", "A1", { dash: true, w: 0.05 }), seg("B", "B1", { dash: true, w: 0.05 }),
      ...["A", "B", "A1", "B1"].map(n => pt(n)), lab("A", R("A"), { o: "a" }), lab("B", R("B"), { o: "a" }), lab("A1", "$\\rm A'$", { o: "b" }), lab("B1", "$\\rm B'$", { o: "b" }),
      ra("A1", "A", "B1"), ra("B1", "B", "O"), lab([1.9, 0.35, 3.2], "$\\Cg{x^\\circ}$", { sz: 1.1 }));
    return { P, size: 20, I };
  };
  // 정사영의 넓이: 삼각형 ABC 를 α 위로
  F.areaProj = () => {
    const P = { B: [1, 0, 1], C: [3, 0, 3], H: [2, 0, 2], A2: [3.5, 0, 0.5], A: [3.5, 1, 0.5], A1: [3.5, -2, 0.5], B1: [1, -2, 1], C1: [3, -2, 3] };
    const I = [plane([[0, 0, 0], [0, 0, 4], [5, 0, 4], [5, 0, 0]], { c: "y", op: 0.16 }), plane([[0, -2, 0], [0, -2, 4], [5, -2, 4], [5, -2, 0]], { c: "n", op: 0.2 }),
      lab([5.3, 0, 3.6], "$\\beta$", {}), lab([5.3, -2, 3.6], "$\\alpha$", {}),
      face(["A", "B", "C"], { c: "b", op: 0.35 }), face(["A1", "B1", "C1"], { c: "b", op: 0.25 }), face(["A2", "B", "C"], { c: "m", op: 0.25, p: 0 }),
      ...[["A", "B"], ["B", "C"], ["C", "A"], ["A1", "B1"], ["B1", "C1"], ["C1", "A1"], ["A2", "B"], ["A2", "C"]].map(([a, b]) => seg(a, b, { w: 0.06 })),
      seg("A", "A1", { dash: true, w: 0.05 }), seg("B", "B1", { dash: true, w: 0.05 }), seg("C", "C1", { dash: true, w: 0.05 }),
      seg("A", "H", { c: "b", p: 1 }), seg("H", "A2", { c: "m", p: 1 }), ra("H", "A", "C", { p: 1 }), ra("H", "A2", "C", { p: 1 }), arc("H", "A2", "A", { r: 0.6, c: "g", p: 1 }),
      ...["A", "B", "C", "H", "A2", "A1", "B1", "C1"].map(n => pt(n, { w: 0.8 })),
      lab("A", R("A"), { o: "r" }), lab("B", R("B"), { o: "l" }), lab("C", R("C"), { o: "br" }), lab("H", R("H"), { o: "bl", p: 1 }), lab("A2", "$\\rm A''$", { o: "r" }),
      lab("A1", "$\\rm A'$", { o: "r" }), lab("B1", "$\\rm B'$", { o: "l" }), lab("C1", "$\\rm C'$", { o: "br" })];
    return { P, size: 20, I };
  };
  // 평면 α 위의 정사각형을 기울어진 평면 β 위로 (보기·문제)
  F.squareProj = (deg = 30, shape = "sq") => {
    const t = deg * Math.PI / 180, I = [plane([[-3, 0, -3], [3, 0, -3], [3, 0, 3], [-3, 0, 3]], { c: "n", op: 0.2 }), lab([3.4, 0, 2.8], "$\\beta$", {})];
    const tilt = (x, z) => [x, z * Math.sin(t) + 1.6, z * Math.cos(t)];
    I.push(plane([tilt(-3, -3), tilt(3, -3), tilt(3, 3), tilt(-3, 3)], { c: "y", op: 0.2 }), lab(add(tilt(3, 3), [0.4, 0, 0]), "$\\alpha$", {}));
    const pts = shape === "sq" ? [[-2, -2], [2, -2], [2, 2], [-2, 2]] : [[-1.6, -1.4], [1.6, -1.4], [0, 1.4]];
    const top = pts.map(([x, z]) => tilt(x, z)), bot = top.map(q => [q[0], 0, q[2]]);
    I.push(face(top, { c: "b", op: 0.4 }), face(bot, { c: "b", op: 0.3 }), ...top.map((q, i) => seg(q, top[(i + 1) % top.length], { w: 0.07 })), ...bot.map((q, i) => seg(q, bot[(i + 1) % bot.length], { w: 0.07 })),
      ...top.map((q, i) => seg(q, bot[i], { dash: true, w: 0.045 })));
    return { P: {}, size: 18, I };
  };
  // 예제: 정육면체 평면 AFC 와 EFGH → 정사영 EFG
  F.cubeAFC = () => { const P = box(2, 2, 2); return { P, size: 18, I: [...solid(P, BOX_E, BOX_L, { faces: boxFaces, fop: 0.05 }), face(["A", "F", "C"], { c: "n", op: 0.32 }),
    seg("A", "F", { c: "n" }), seg("F", "C", { c: "n" }), seg("C", "A", { c: "n" }), face(["E", "F", "G"], { c: "m", op: 0.35, p: 1 }), seg("E", "G", { c: "m", p: 1 })] }; };
  // 원기둥을 45° 평면으로 자른 타원
  F.cylCut = () => ({ P: {}, size: 18, I: [cyl([0, 0, 0], 2, 5, { c: "b", op: 0.18 }), circ([0, 0, 0], [0, 1, 0], 2, { c: "b" }),
    ell([0, 2.5, 0], [2, 2, 0], [0, 0, 2], { fill: true, c: "m" }), circ([0, 2.5, 0], [0, 1, 0], 2, { c: "g", dash: true }), lab([3.2, 4.5, 0], "$45^\\circ$", { c: "g" })] });
  // 생각 넓히기: 대피라미드
  F.pyramidGiza = () => { const P = { A: [0, 3.0, 0], B: [-2.3, 0, 2.3], C: [2.3, 0, 2.3], D: [2.3, 0, -2.3], E: [-2.3, 0, -2.3], O: [0, 0, 0], M: [0, 0, 2.3] };
    return { P, size: 18, I: [...solid(P, PYR_E, { A: "a", B: "l", C: "r", D: "r", E: "l" }, { faces: ["BCDE"], fc: "y", fop: 0.15 }), face(["A", "B", "C"], { c: "y", op: 0.35 }),
      face(["O", "B", "C"], { c: "m", op: 0.35 }), seg("A", "O", { dash: true }), seg("A", "M", { c: "b" }), seg("O", "M", { c: "m" }), lab([0.3, 1.5, 0], "$147$", { c: "g" }), lab([0, -0.6, 2.9], "$230$", { c: "g" })] }; };

  // 중단원 마무리용
  F.lineTwoPts = () => ({ P: { A: [-1, 2.2, 0.5], B: [1.6, 2.8, -0.5] }, size: 16, I: [seg([-3, 0, 1], [3, 0, -1], { c: "b", w: 0.11 }), lab([3.5, 0, -1], "$\\Cb{l}$", {}), pt("A"), pt("B"), lab("A", R("A"), { o: "a" }), lab("B", R("B"), { o: "a" })] });
  F.tpQ = () => { const f = F.tp(0); f.I = f.I.map(it => it[0] === "lab" && it[2] === "$\\rm P$" ? lab("P", R("A"), { o: "a" }) : it[0] === "lab" && it[2] === "$\\rm H$" ? lab("H", R("B"), { o: "bl" }) : it); return f; };
  F.cubeQ = () => F.cuboid(2, 2, 2, [], { size: 16 });
  F.segProj = () => F.lineAngle(true);
  F.triProj = () => F.squareProj(60, "tri");
  F.cuboidAF = () => F.cuboid(2, 2, 2, [seg("A", "F", { c: "m", w: 0.1 })], { size: 16 });
  F.tetraMN = (pts = "AB,CD") => { const P = tetra(4, 65); const [p, q] = pts.split(","); P.M = mid(P[p[0]], P[p[1]]); P.N = mid(P[q[0]], P[q[1]]);
    return { P, size: 18, I: [...solid(P, TET_E, { A: "a", B: "l", C: "b", D: "r" }), seg("M", "N", { c: "m" }), pt("M"), pt("N"), lab("M", R("M"), { o: "al" }), lab("N", R("N"), { o: "br" }),
      tick(p[0], "M"), tick("M", p[1]), tick(q[0], "N"), tick("N", q[1])] }; };
  F.tetraAH = () => { const P = { A: [0, 2, 0], B: [-2, 0, 1], C: [2, 0, 2], D: [1, 0, -2], H: [0, 0, 0] };
    return { P, size: 16, I: [...solid(P, TET_E, { A: "a", B: "l", C: "b", D: "r" }), seg("A", "H", { c: "m", dash: true }), pt("H"), lab("H", R("H"), { o: "b" }), lab(mid(P.C, P.D), "$12$", { o: "r", c: "g" })] }; };
  F.cubeDMG = () => { const P = box(2, 2, 2); P.M = [1, 0, 2]; P.I = [8 / 5, 0, 4 / 5];
    return F.cuboid(2, 2, 2, [seg("M", "G", { c: "b" }), seg("D", "I", { c: "m" }), seg("D", "M", { c: "m", w: 0.05 }), seg("D", "G", { c: "m", w: 0.05 }), face(["D", "M", "G"], { c: "m", op: 0.2 }),
      pt("M"), pt("I"), lab("M", R("M"), { o: "b" }), lab("I", R("I"), { o: "b" }), tick("E", "M"), tick("M", "F")], { P: { M: P.M, I: P.I }, size: 16 }); };
  F.pyramidA = (extra = []) => F.pyramid([lab(mid([2, 3, 2], [0, 0, 4]), "$a$", { o: "l", c: "g" }), lab(mid([0, 0, 4], [4, 0, 4]), "$1$", { o: "b", c: "g" }), ...extra]);
  F.ball = () => ({ P: {}, size: 18, I: [plane([[-4, 0, -3], [6, 0, -3], [6, 0, 3], [-4, 0, 3]], { c: "n", op: 0.18 }), sph([0, 2.6, 0], 1.5, { c: "g", op: 0.45 }),
    ell([1.5, 0.02, 0], [1.5 / Math.sin(Math.PI / 3), 0, 0], [0, 0, 1.5], { fill: true, c: "#20264a" }),
    ...[-1, 0, 1].map(k => arrow([-2 + k * 0.4, 5.4, k * 0.9], [-2 + 3.1 + k * 0.4, 0.2, k * 0.9], { c: "y", w: 0.05 })), lab([-2.8, 5.4, 0], "$60^\\circ$", { c: "g" })] });
  F.perpPlanes = () => ({ P: { A: [-1.8, 0, 1.2], B: [1.8, 0, 1.2], Pp: [0.4, 2.2, -1.8] }, size: 18, I: [plane([[-3, 0, -1.8], [3, 0, -1.8], [3, 0, 3], [-3, 0, 3]], { c: "y", op: 0.22 }),
    plane([[-3, 0, -1.8], [3, 0, -1.8], [3, 3.5, -1.8], [-3, 3.5, -1.8]], { c: "n", op: 0.22 }), lab([3.4, 0, 2.6], "$\\alpha$", {}), lab([3.4, 3.2, -1.8], "$\\beta$", {}),
    seg("A", "B", { c: "b" }), pt("A"), pt("B"), pt("Pp"), lab("A", R("A"), { o: "b" }), lab("B", R("B"), { o: "b" }), lab("Pp", R("P"), { o: "a" })] });
  F.hemiCut = () => ({ P: { A: [-2.5, 0, 0], B: [2.5, 0, 0], O: [0, 0, 0] }, size: 18, I: [hemi([0, 0, 0], 2.5, { c: "b", op: 0.2 }), circ([0, 0, 0], [0, 1, 0], 2.5, { c: "b" }),
    plane([[2.5, 0, -2.8], [2.5, 0, 2.8], [-1.8, 2.48, 2.8], [-1.8, 2.48, -2.8]], { c: "m", op: 0.2 }), pt("A"), pt("B"), pt("O"),
    lab("A", R("A"), { o: "l" }), lab("B", R("B"), { o: "r" }), lab("O", R("O"), { o: "b" }), lab([1.2, 0.3, 2.6], "$30^\\circ$", { c: "g" })] });
  F.tetraBCNM = () => { const P = tetra(4, 60); P.M = mid(P.D, P.B); P.N = mid(P.C, P.D);
    return { P, size: 18, I: [...solid(P, TET_E, { A: "a", B: "l", C: "b", D: "r" }), face(["A", "M", "N"], { c: "b", op: 0.3 }), face(["B", "C", "N", "M"], { c: "m", op: 0.28 }),
      seg("A", "M", { c: "b" }), seg("A", "N", { c: "b" }), seg("M", "N", { c: "b" }), pt("M"), pt("N"), lab("M", R("M"), { o: "al" }), lab("N", R("N"), { o: "br" }),
      tick("D", "M"), tick("M", "B"), tick("C", "N"), tick("N", "D")] }; };
  F.pyramidAP = () => { const P = pyr(); P.P = lerp(P.C, P.D, 0.75); return F.pyramid([seg("A", "P", { c: "m" }), seg("B", "D", { c: "b" }), pt("P"), lab("P", R("P"), { o: "br" })], { P: { P: P.P } }); };

  root.FIGS = F;
  root.FIGU = { add, sub, mul, mid, lerp, nrm, cross, dot };
})(typeof window !== "undefined" ? window : globalThis);
