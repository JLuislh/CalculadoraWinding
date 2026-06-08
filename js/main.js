/* ============================================================
   Calculo Winding — main.js
   ============================================================ */

// ── BOBINAS / NÚCLEOS ──
// OD calculado a partir de DCR de datasheets.
// od_ok: true  = derivado de close-layer (una capa) → confiable
// od_ok: false = derivado de multi-layer / estimado  → MEDIR con calibrador
// ext_mat: true = material externo (bobina ya formada, no polvo T-xB)
const BOBINA_DATA = {
  'B-5002-6': {
    series: 'CHIP-5000', OD_mils: 67,  AL_nH: 2.71,
    len_mils: 87, corte_mils: 40.5, od_ok: false,
    nota: 'Serie 5000 · OD estimado (medir)'
  },
  'B-6500-6': {
    series: 'CHIP-6500', OD_mils: 110, AL_nH: 1.32,
    len_mils: 66, corte_mils: 23.5, od_ok: false,
    nota: 'Serie 6500 var.6 · AL de 2 muestras CL · OD estimado (medir)'
  },
  'B-8000-6': {
    series: 'CHIP-8000', OD_mils: 157, AL_nH: 2.37,
    len_mils: 87, corte_mils: 32.5, od_ok: true,
    nota: 'Serie 8000 · OD confirmado por close-layer'
  },
  'B-1003-6': {
    series: 'CHIP-10000', OD_mils: 165, AL_nH: 4.85,
    len_mils: 97.5, corte_mils: 50, od_ok: true,
    nota: 'Serie 10000 var.6 · OD confirmado por close-layer'
  },
  'B-1003-2': {
    series: 'CHIP-10000', OD_mils: 128, AL_nH: 4.00,
    len_mils: 97, corte_mils: 50.5, od_ok: false,
    nota: 'Serie 10000 var.2 · OD estimado de multi-layer (medir)'
  },
  'B-11000-M9': {
    series: 'CHIP-11000', OD_mils: 93, AL_nH: 17.73,
    len_mils: 101, corte_mils: 49, od_ok: true, ext_mat: true,
    nota: 'Serie 11000-M9 · TIYA/770G · OD calculado de 11110 (1000µH, AWG45, 237.5v)'
  },
  'B-11000-C5': {
    series: 'CHIP-11000', OD_mils: 131, AL_nH: 37.83,
    len_mils: 101, corte_mils: 49, od_ok: false, ext_mat: true,
    nota: 'Serie 11000-C5 · TIYA/770G · OD calculado de 11118 (4700µH, AWG47, 352.5v)'
  },
};

// ── POLVOS DISPONIBLES (Yuean Unifine, factura YA2020-12-15E) ──
// µr estimado según equivalencia Micrometals. DC bias = excelente en todos (polvo hierro).
// T-6B = Mix-6 (bobinas -6 actuales) · T-2B = Mix-2 (bobinas -2 actuales)
const POWDER_DATA = [
  { grade:'T-17B', mu: 4,   freq:'200-1000 MHz', AL_rel:'muy bajo', nota:'Muy alta frecuencia · bajo AL por tamaño' },
  { grade:'T-10B', mu: 6,   freq:'100-500 MHz',  AL_rel:'bajo',     nota:'Alta frecuencia · precio mayor' },
  { grade:'T-6B',  mu: 8.5, freq:'50-200 MHz',   AL_rel:'bajo',     nota:'★ ACTUAL bobinas -6 · referencia base' },
  { grade:'T-7B',  mu: 9,   freq:'50-200 MHz',   AL_rel:'bajo',     nota:'Similar a T-6B, ligeramente mayor AL' },
  { grade:'T-4B',  mu: 9,   freq:'30-100 MHz',   AL_rel:'bajo',     nota:'Similar a T-2B/-6B' },
  { grade:'T-2B',  mu: 10,  freq:'20-100 MHz',   AL_rel:'bajo+',    nota:'★ ACTUAL bobinas -2 · mayor AL que T-6B' },
  { grade:'T-8B',  mu: 35,  freq:'1-50 MHz',     AL_rel:'medio',    nota:'Mayor µ · más AL por tamaño · verificar ficha' },
];

// Serie/paquete seleccionada ('' = todas)
let selectedSeries = '';

// ── TIPOS DE ESMALTE ──
const WIRE_TYPES = {
  SE: {
    label:   'Single Enamel (SE)',
    clase:   'Clase A — 105°C',
    capas:   '1 capa',
    factorD: 1.03,
    ku:      0.45,
    nota:    'Una sola capa de esmalte. Económico, buen deslizamiento. Para bobinados de bajas exigencias térmicas.'
  },
  HE: {
    label:   'Heavy Enamel (HE)',
    clase:   'Clase B — 130°C',
    capas:   '2 capas',
    factorD: 1.06,
    ku:      0.42,
    nota:    'Doble capa. Mayor resistencia mecánica y dieléctrica. Buen balance para inductores de potencia.'
  },
  HAPTZ: {
    label:   'Heavy Amidez Polyester (HAPTZ)',
    clase:   'Clase H — 180°C',
    capas:   '2 capas gruesas',
    factorD: 1.08,
    ku:      0.40,
    nota:    '★ Máxima resistencia térmica y abrasión. Recomendado para inductores de potencia con alta corriente DC.'
  }
};

// ── TABLA AWG COMPLETA 10–44 ──
// d = diámetro del conductor en mm (bare wire)
const AWG_DATA = {
  10: { d: 2.5882 }, 11: { d: 2.3048 }, 12: { d: 2.0525 }, 13: { d: 1.8278 },
  14: { d: 1.6277 }, 15: { d: 1.4495 }, 16: { d: 1.2908 }, 17: { d: 1.1495 },
  18: { d: 1.0237 }, 19: { d: 0.9116 }, 20: { d: 0.8128 }, 21: { d: 0.7239 },
  22: { d: 0.6438 }, 23: { d: 0.5733 }, 24: { d: 0.5106 }, 25: { d: 0.4547 },
  26: { d: 0.4049 }, 27: { d: 0.3606 }, 28: { d: 0.3211 }, 29: { d: 0.2859 },
  30: { d: 0.2546 }, 31: { d: 0.2268 }, 32: { d: 0.2019 }, 33: { d: 0.1798 },
  34: { d: 0.1601 }, 35: { d: 0.1426 }, 36: { d: 0.1270 }, 37: { d: 0.1131 },
  38: { d: 0.1007 }, 39: { d: 0.0897 }, 40: { d: 0.0799 }, 41: { d: 0.0711 },
  42: { d: 0.0632 }, 43: { d: 0.0564 }, 44: { d: 0.0508 },
  45: { d: 0.0452 }, 46: { d: 0.0403 }, 47: { d: 0.0359 },
  48: { d: 0.0320 }, 49: { d: 0.0285 }
};

// Corrientes típicas por AWG a 400 A/cm²
const AWG_IMAX = {
  10: 32, 11: 25, 12: 20, 13: 16, 14: 13, 15: 10, 16: 8,
  17: 6.5, 18: 5.2, 19: 4.1, 20: 3.3, 21: 2.6, 22: 2.1,
  23: 1.6, 24: 1.3, 25: 1.0, 26: 0.8, 27: 0.6, 28: 0.5,
  29: 0.4, 30: 0.3
};

// ── CONVERSIÓN DE UNIDADES ──
function toMM(val, unit) {
  if (unit === 'mils') return val * 0.0254;
  if (unit === 'inch') return val * 25.4;
  return val;
}

function onDimUnitChange() {
  const unit = document.getElementById('dimUnit').value;
  const labels = { mils: 'mils', inch: 'pulgadas (inch)', mm: 'milímetros (mm)' };
  const u = labels[unit];
  document.getElementById('hintLen').textContent   = `${u} — largo total`;
  document.getElementById('hintCorte').textContent = `${u} — zona sin bobinar`;
  document.getElementById('hintOD').textContent    = u;
  document.getElementById('hintID').textContent    = `${u} — 0 si es sólido`;
  calc();
}

// ── REDONDEO DE VUELTAS ──
function roundTurns(Nexact) {
  const mode = document.getElementById('allowHalfTurns').value;
  if (mode === 'exact') return Math.max(0.5, parseFloat(Nexact.toFixed(2)));
  if (mode === 'full')  return Math.max(1,   Math.ceil(Nexact));
  return Math.max(0.5, Math.ceil(Nexact * 2) / 2);
}

function roundTurnsHalf(Nexact) {
  return Math.max(0.5, Math.ceil(Nexact * 2) / 2);
}

// ── ESTILOS DE EMBOBINADO ──
function onWindingStyleChange() {
  const msgs = {
    close:  'Close Layer: alambre enrollado helicoidalmente sin espacio entre vueltas. Máxima densidad de vueltas por capa.',
    single: 'Single Layer: una sola capa con separación uniforme entre vueltas. Menor capacitancia parásita.',
    multi:  'Multi Layer: múltiples capas apiladas. Mayor inductancia total pero mayor capacitancia parásita inter-capa.',
    pi:     'Pi Winding: distribución en tres secciones para minimizar capacitancia distribuida en alta frecuencia.',
  };
  document.getElementById('windingInfo').textContent =
    msgs[document.getElementById('windingStyle').value] || '';
  calc();
}

// ── TIPO DE ESMALTE ──
function onWireTypeChange() {
  const wt    = document.getElementById('wireType').value;
  const w     = WIRE_TYPES[wt];
  const box   = document.getElementById('wireInfo');
  const color = wt === 'HAPTZ' ? 'var(--accent)' : 'var(--text2)';
  box.innerHTML = `
    <div style="font-family:var(--display);font-size:13px;font-weight:700;color:${color};margin-bottom:6px">${w.label}</div>
    <div class="mat-info-grid">
      <div class="mat-info-item">Clase térmica: <span>${w.clase}</span></div>
      <div class="mat-info-item">Capas esmalte: <span>${w.capas}</span></div>
      <div class="mat-info-item">Factor Ø: <span>×${w.factorD}</span></div>
      <div class="mat-info-item">Ku típico: <span>${w.ku}</span></div>
      <div class="mat-info-item" style="grid-column:1/-1;color:var(--text3)">${w.nota}</div>
    </div>`;
  document.getElementById('Ku').value = w.ku;
  updateWireDiamInfo();
  calc();
}

// ── INFO DEL CALIBRE ──
function onAWGChange() {
  updateWireDiamInfo();
  calc();
}

function updateWireDiamInfo() {
  const awg  = parseInt(document.getElementById('AWG').value);
  const wt   = document.getElementById('wireType').value;
  const w    = WIRE_TYPES[wt];
  const wire = AWG_DATA[awg];
  if (!wire || !w) return;
  const dBare   = wire.d;
  const dCoated = (dBare * w.factorD).toFixed(3);
  const A_mm2   = (Math.PI * Math.pow(dBare / 2, 2)).toFixed(4);
  const J       = parseFloat(document.getElementById('Jdens').value) || 400;
  const I_est   = (J * parseFloat(A_mm2) / 100).toFixed(2);
  document.getElementById('wireDiamInfo').innerHTML =
    `AWG ${awg} &nbsp;·&nbsp; Ø conductor: <span style="color:var(--text)">${dBare}mm</span> &nbsp;·&nbsp; ` +
    `Ø con esmalte (${wt}): <span style="color:var(--accent)">${dCoated}mm</span> &nbsp;·&nbsp; ` +
    `Área: <span style="color:var(--text)">${A_mm2}mm²</span> &nbsp;·&nbsp; ` +
    `I @ ${J}A/cm²: <span style="color:var(--accent)">${I_est}A</span>`;
}

// ── SUGERENCIA AUTOMÁTICA DE AWG ──
// Itera de fino (44) a grueso (10) → devuelve el AWG más fino que aguanta Imax a densidad J
function suggestAWG(Imax, J) {
  const A_needed_mm2 = (Imax / J) * 100;
  const d_needed     = 2 * Math.sqrt(A_needed_mm2 / Math.PI);
  for (let awg = 49; awg >= 10; awg--) {
    if (AWG_DATA[awg] && AWG_DATA[awg].d >= d_needed) return awg;
  }
  return 10;
}

function showAWGSuggestion(suggested, current, Imax) {
  const box = document.getElementById('awgSuggestionBox');
  const ws  = AWG_DATA[suggested];
  const wc  = AWG_DATA[current];
  if (!ws || !wc) { box.innerHTML = ''; return; }
  const J   = parseFloat(document.getElementById('Jdens').value) || 400;
  const A_s = (Math.PI * Math.pow(ws.d / 2, 2)).toFixed(3);
  const I_s = (J * parseFloat(A_s) / 100).toFixed(2);

  if (suggested === current) {
    box.innerHTML = `<div class="alert alert-ok">✓ AWG ${current} correcto para ${Imax}A — capacidad ~${I_s}A @ ${J}A/cm²</div>`;
  } else if (suggested < current) {
    box.innerHTML = `<div class="alert alert-warn">⚠ Para ${Imax}A se recomienda mínimo <strong>AWG ${suggested}</strong>
      (Ø${ws.d}mm, ~${I_s}A). AWG ${current} puede sobrecalentarse.
      <a href="#" onclick="document.getElementById('AWG').value=${suggested};onAWGChange();return false;"
         style="color:var(--warn);font-weight:600">→ Usar AWG ${suggested}</a></div>`;
  } else {
    const A_c = (Math.PI * Math.pow(wc.d / 2, 2)).toFixed(3);
    const I_c = (J * parseFloat(A_c) / 100).toFixed(2);
    box.innerHTML = `<div class="alert alert-ok">✓ AWG ${current} (Ø${wc.d}mm, ~${I_c}A) tiene margen extra. Mínimo recomendado: AWG ${suggested}.</div>`;
  }
}

// ── ANÁLISIS DE FRECUENCIA (efecto piel) ──
// δ(µm) = 66.1/√f(MHz) para cobre a 20°C.
// AWG óptimo: el más grueso cuyo Ø ≤ 2δ (todo el conductor conduce, sin desperdicio de cobre).
// R_ac/R_dc ≈ d/(4δ) cuando d >> δ; ≈ 1 cuando d ≤ 2δ.
function skinDepth_um(freqMHz) {
  return freqMHz > 0 ? 66.1 / Math.sqrt(freqMHz) : Infinity;
}

// Devuelve el AWG más grueso (menor número) cuyo Ø ≤ 2δ
function optimalAWGforFreq(freqMHz) {
  if (freqMHz <= 0) return null;
  const dLimit_um = 2 * skinDepth_um(freqMHz);
  for (let awg = 10; awg <= 49; awg++) {
    if (AWG_DATA[awg] && AWG_DATA[awg].d * 1000 <= dLimit_um) return awg;
  }
  return 49; // ni el más fino baja del límite → usar el más fino disponible
}

// Estima R_ac/R_dc para un AWG dado a frecuencia f
function acDcRatio(awg, freqMHz) {
  if (freqMHz <= 0 || !AWG_DATA[awg]) return 1;
  const d_um = AWG_DATA[awg].d * 1000;
  const delta = skinDepth_um(freqMHz);
  const x = d_um / delta;
  if (x <= 2) return 1 + Math.pow(x, 4) / 192; // efecto piel despreciable
  return x / 4 + 0.26;                           // asintótico para alambre grueso
}

// Polvos T-xB cuyo rango de frecuencia cubre f (parsea "20-100 MHz")
function powdersForFreq(freqMHz) {
  if (freqMHz <= 0) return [];
  return POWDER_DATA.filter(p => {
    const m = p.freq.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!m) return false;
    return freqMHz >= parseFloat(m[1]) && freqMHz <= parseFloat(m[2]);
  });
}

function renderFreqAnalysis(freqMHz, currentAWG) {
  const box = document.getElementById('freqBox');
  if (!box) return;
  if (freqMHz <= 0) { box.innerHTML = ''; return; }

  const delta   = skinDepth_um(freqMHz);
  const optAWG  = optimalAWGforFreq(freqMHz);
  const ratio   = acDcRatio(currentAWG, freqMHz);
  const optD    = AWG_DATA[optAWG] ? (AWG_DATA[optAWG].d).toFixed(4) : '—';
  const curD    = AWG_DATA[currentAWG] ? AWG_DATA[currentAWG].d * 1000 : 0;

  // Color del ratio: verde <1.1, amarillo <1.5, rojo ≥1.5
  let ratioColor = 'var(--accent)';
  if (ratio >= 1.5)      ratioColor = 'var(--danger)';
  else if (ratio >= 1.1) ratioColor = 'var(--warn)';

  const powders = powdersForFreq(freqMHz);
  const matTxt = powders.length
    ? powders.map(p => `<strong style="color:var(--accent2)">${p.grade}</strong> (µ≈${p.mu})`).join(' · ')
    : '<span style="color:var(--warn)">ningún T-xB cubre esta frecuencia — verificar ficha o usar ferrita</span>';

  let acWarn = '';
  if (ratio >= 1.5) {
    acWarn = `<div class="alert alert-warn" style="margin-top:8px">⚠ A ${freqMHz} MHz el AWG ${currentAWG} (Ø${curD.toFixed(0)}µm) sufre fuerte efecto piel: ` +
      `R_ac ≈ <strong>${ratio.toFixed(2)}× R_dc</strong>. El DCR calculado (DC) subestima la pérdida real. ` +
      `Usar AWG ${optAWG} o más fino, o hilo Litz.</div>`;
  } else if (ratio >= 1.1) {
    acWarn = `<div class="alert alert-ok" style="border-color:var(--warn);color:var(--text2);margin-top:8px">ℹ R_ac ≈ ${ratio.toFixed(2)}× R_dc a ${freqMHz} MHz — efecto piel moderado.</div>`;
  }

  box.innerHTML = `
    <div class="mat-info-grid" style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px">
      <div class="mat-info-item">Profundidad de piel δ: <span style="color:var(--accent)">${delta.toFixed(2)} µm</span></div>
      <div class="mat-info-item">Ø útil máx (2δ): <span style="color:var(--accent)">${(2 * delta).toFixed(2)} µm</span></div>
      <div class="mat-info-item">AWG óptimo @ ${freqMHz} MHz: <span style="color:var(--accent2)">AWG ${optAWG}</span> <span style="color:var(--text3);font-size:10px">(Ø${optD}mm)</span></div>
      <div class="mat-info-item">R_ac/R_dc (AWG ${currentAWG}): <span style="color:${ratioColor}">${ratio.toFixed(2)}×</span></div>
      <div class="mat-info-item" style="grid-column:1/-1;color:var(--text3)">Polvo T-xB apto para ${freqMHz} MHz: ${matTxt}</div>
    </div>${acWarn}`;
}

// ── SELECTOR DE SERIE ──
function initSeriesButtons() {
  document.getElementById('seriesGroup').addEventListener('click', e => {
    const btn = e.target.closest('.series-btn');
    if (!btn) return;
    document.querySelectorAll('.series-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSeries = btn.dataset.series;
    calc();
  });
}

// ── PRESET BOBINA — carga AL, OD y dimensiones al panel manual ──
function loadBobina() {
  const key = document.getElementById('bobinaPreset').value;
  const warn = document.getElementById('bobinaODwarn');
  if (!key || !BOBINA_DATA[key]) { warn.style.display = 'none'; return; }
  const b = BOBINA_DATA[key];
  document.getElementById('ALval').value       = b.AL_nH;
  document.getElementById('bobbinOD').value    = b.OD_mils;
  document.getElementById('bobbinLen').value   = b.len_mils;
  document.getElementById('bobbinCorte').value = b.corte_mils;
  document.getElementById('bobbinID').value    = 0;
  document.getElementById('dimUnit').value     = 'mils';

  if (b.ext_mat) {
    warn.style.display = '';
    warn.innerHTML = `ℹ Material externo (TIYA/770G) — bobina ya formada, no fabricada con polvo T-xB. ` +
      `AL=${b.AL_nH} nH/N² confirmado de registros de producción (13 muestras close-layer). ` +
      (b.od_ok ? '' : `OD ${b.OD_mils} mils estimado — medir con calibrador y corregir arriba.`);
  } else if (!b.od_ok) {
    warn.style.display = '';
    warn.innerHTML = `⚠ OD ${b.OD_mils} mils es estimado (back-calculado de embobinado multi-capa, no medido). ` +
      `Medir con calibrador el OD real del núcleo y corregir el campo "Diámetro externo (OD)" arriba.`;
  } else {
    warn.style.display = 'none';
  }

  onDimUnitChange();
  calc();
}

function buildBobinaSelect() {
  const sel = document.getElementById('bobinaPreset');
  sel.innerHTML = '<option value="">— seleccionar bobina —</option>';
  Object.entries(BOBINA_DATA).forEach(([key, b]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${key} · ${b.series} · OD ${b.OD_mils}mil${b.od_ok ? '' : ' ⚠'} · AL ${b.AL_nH} nH/N²`;
    sel.appendChild(opt);
  });
}

// ── SELECCIÓN AUTOMÁTICA DE MATERIAL ──
// Dado L, Imax, DCRmax → busca todas las combinaciones bobina+AWG+esmalte viables
function autoSelect(L_uH, Imax_A, DCRmax_val, rho, J, seriesFilter) {
  const L_nH = L_uH * 1000;
  const results = [];

  Object.entries(BOBINA_DATA).forEach(([bobinaKey, bobina]) => {
    if (seriesFilter && bobina.series !== seriesFilter) return;
    // Bobinas ext_mat (pre-formadas, ej. 11000) solo aparecen si su serie está seleccionada
    if (!seriesFilter && bobina.ext_mat) return;
    const Nexact = Math.sqrt(L_nH / bobina.AL_nH);
    const N      = roundTurnsHalf(Nexact);
    const OD_mm  = bobina.OD_mils * 0.0254;
    const lefMM  = (bobina.len_mils - bobina.corte_mils) * 0.0254;

    ['SE', 'HE', 'HAPTZ'].forEach(wt => {
      const wtype = WIRE_TYPES[wt];
      const candidates = [];

      for (let awg = 49; awg >= 24; awg--) {
        const wire = AWG_DATA[awg];
        if (!wire) continue;

        const dCoat    = wire.d * wtype.factorD;
        const A_cm2    = Math.PI * Math.pow((wire.d / 10) / 2, 2);
        const Nper     = lefMM > 0 ? Math.floor(lefMM / dCoat) : 0;
        if (Nper === 0) continue;

        const layers   = Math.ceil(N / Nper);
        if (layers > 15) continue;

        const OD_eff      = OD_mm + (layers - 1) * dCoat;
        // El espesor acumulado de capas no puede superar el radio del núcleo
        // (si lo supera, el embobinado sería más grueso que el núcleo mismo)
        const windingH    = (layers - 1) * dCoat;
        if (windingH > OD_mm / 2) continue;

        const MLT_mm   = Math.PI * OD_eff;
        const Lwire_cm = N * MLT_mm / 10;
        const DCR      = (rho * 1e-6) * Lwire_cm / A_cm2;
        const I_wire   = J * A_cm2;
        const iOk      = I_wire >= Imax_A;

        if (DCR <= DCRmax_val) {
          candidates.push({ bobina: bobinaKey, series: bobina.series,
            N, Nexact, AWG: awg, wireType: wt, layers, Nper,
            DCR, Lwire_cm, I_wire, iOk, AL_nH: bobina.AL_nH });
        }
      }

      if (!candidates.length) return;
      // Ordenar: primero los que aguantan la corriente (iOk),
      // luego menos capas, luego más fino (AWG mayor)
      candidates.sort((a, b) =>
        (b.iOk - a.iOk) || (a.layers - b.layers) || (b.AWG - a.AWG)
      );
      results.push(candidates[0]);
    });
  });

  // Ordenar: menos capas → AWG más fino (mayor número) → SE<HE<HAPTZ
  const wtOrd = { SE: 0, HE: 1, HAPTZ: 2 };
  results.sort((a, b) =>
    a.layers - b.layers || b.AWG - a.AWG || wtOrd[a.wireType] - wtOrd[b.wireType]
  );
  return results;
}

function renderAutoSelect(candidates, Imax_A) {
  const box = document.getElementById('autoSelectBox');
  const L_uH   = parseFloat(document.getElementById('Ltarget').value) || 1.0;
  const DCRmax = parseFloat(document.getElementById('DCRmax').value)  || 0.009;
  const rho    = parseFloat(document.getElementById('rho').value)     || 1.724;
  const J      = parseFloat(document.getElementById('Jdens').value)   || 400;

  // Sin candidatos O todos los candidatos fallan corriente → sugerir núcleo nuevo
  const viables = candidates.filter(c => c.iOk);
  if (!candidates.length || !viables.length) {
    renderNewCoreSuggestion(L_uH, Imax_A, DCRmax, rho, J, box);
    return;
  }

  const rows = candidates.map(c => {
    const dcrPct  = ((1 - c.DCR / parseFloat(document.getElementById('DCRmax').value)) * 100).toFixed(0);
    const iOk     = c.I_wire >= Imax_A;
    const iStr    = iOk
      ? `<span style="color:var(--accent)">${(c.I_wire * 1000).toFixed(0)}mA ✓</span>`
      : `<span style="color:var(--warn)">${(c.I_wire * 1000).toFixed(0)}mA ⚠</span>`;
    const layerCol = c.layers === 1
      ? `<span style="color:var(--accent)">${c.layers}</span>`
      : `<span style="color:var(--warn)">${c.layers}</span>`;
    const dcrCol   = `${(c.DCR * 1000).toFixed(1)}mΩ <span style="color:var(--text3);font-size:10px">(${dcrPct}% margen)</span>`;
    const loadLink = `<a href="#" class="as-load"
      data-bobina="${c.bobina}" data-awg="${c.AWG}" data-wt="${c.wireType}"
      style="color:var(--accent2);font-size:11px">→ cargar</a>`;

    return `<tr>
      <td><span style="color:var(--accent);font-weight:600">${c.bobina}</span><br>
          <span style="color:var(--text3);font-size:10px">${c.series}</span></td>
      <td style="color:var(--text)">${c.N} <span style="color:var(--text3);font-size:10px">(${parseFloat(c.Nexact).toFixed(2)})</span></td>
      <td style="color:var(--text)">AWG ${c.AWG}</td>
      <td style="color:var(--text2)">${c.wireType}</td>
      <td>${layerCol}</td>
      <td style="font-family:var(--mono);font-size:11px">${dcrCol}</td>
      <td>${iStr}</td>
      <td>${loadLink}</td>
    </tr>`;
  }).join('');

  box.innerHTML = `
    <table class="as-table">
      <thead><tr>
        <th>Bobina</th><th>N</th><th>AWG</th><th>Esmalte</th>
        <th>Capas</th><th>DCR</th><th>I alambre</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Eventos "cargar"
  box.querySelectorAll('.as-load').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const b = BOBINA_DATA[a.dataset.bobina];
      if (!b) return;
      document.getElementById('bobinaPreset').value  = a.dataset.bobina;
      document.getElementById('AWG').value           = a.dataset.awg;
      document.getElementById('wireType').value      = a.dataset.wt;
      document.getElementById('ALval').value         = b.AL_nH;
      document.getElementById('bobbinOD').value      = b.OD_mils;
      document.getElementById('bobbinLen').value     = b.len_mils;
      document.getElementById('bobbinCorte').value   = b.corte_mils;
      document.getElementById('bobbinID').value      = 0;
      document.getElementById('dimUnit').value       = 'mils';
      document.getElementById('windingStyle').value  = 'close';
      onDimUnitChange();
      onWireTypeChange();
      onWindingStyleChange();
      calc();
      document.getElementById('manualSection').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ── SUGERENCIA DE MATERIAL DE NÚCLEO ──
// Todos los polvos T-xB son polvo de hierro → DC bias excelente → válidos para alta corriente.
// El AL depende del polvo (µr) Y del tamaño del núcleo (OD, Ae, le).
// Mayor µr → más AL por tamaño → núcleo más compacto para mismo AL.
function suggestMaterial(AL_nH, Imax_A) {
  const AL = parseFloat(AL_nH);

  // AL > 20: rango de bobina 11,000-M9 (TIYA/770G, no T-xB)
  if (AL > 20) return {
    tipo: 'Bobina 11,000-M9 (TIYA/770G)',
    mix:  'Material externo ya formado · no disponible como polvo',
    nota: 'AL en rango de serie 11000 · usar bobina pre-formada disponible'
  };

  // AL ≤ 3: rango de T-6B (bobinas -6 actuales)
  if (AL <= 3) return {
    tipo: '★ T-6B o T-7B',
    mix:  'Igual que bobinas -6 actuales (µ≈8.5–9)',
    nota: 'Mismo polvo · solo necesitas un núcleo más grande · DC bias estable >10A'
  };

  // AL 3–5: rango de T-2B (bobinas -2 actuales)
  if (AL <= 5) return {
    tipo: '★ T-2B o T-4B',
    mix:  'Igual que bobinas -2 actuales (µ≈10)',
    nota: 'Mayor µr que T-6B → más AL por tamaño · bueno para alta corriente'
  };

  // AL 5–12: T-2B en núcleo grande, o si T-8B tiene µ≈35 es mucho más compacto
  if (AL <= 12) return {
    tipo: 'T-2B (núcleo más grande) o T-8B',
    mix:  'T-2B µ≈10 en núcleo mayor · T-8B µ≈35 si tienes ficha técnica',
    nota: 'Con T-2B necesitas más OD para alcanzar este AL · T-8B sería más compacto'
  };

  // AL 12–50: T-8B si confirmas µ≈35
  if (AL <= 50) return {
    tipo: 'T-8B (verificar)',
    mix:  'T-8B µ≈35 (según equivalencia Mix) · confirmar con ficha Yuean',
    nota: 'T-2B/-6B requerirían núcleo muy grande · T-8B sería opción compacta'
  };

  // AL > 50: ninguno de los T-xB disponibles alcanza sin núcleo enorme
  return {
    tipo: 'Fuera de rango — T-xB no práctico',
    mix:  'Necesitarías ferrita MnZn o MPP externo',
    nota: 'Ningún T-xB disponible alcanza este AL en tamaño razonable'
  };
}

// ── NÚCLEO SUGERIDO (diseño inverso) ──
// Cuando ningún núcleo existente cumple, estima las dimensiones de uno nuevo.
// Fórmula: para DCR = DCRmax con N vueltas single-layer:
//   OD_mm = DCRmax × A_cm2 × 10 / (ρ × 1e-6 × N × π)
//   AL_nH = L_nH / N²
//   lefMM  = N × dCoat_mm
function suggestNewCore(L_uH, Imax_A, DCRmax_val, rho, J) {
  const L_nH = L_uH * 1000;
  const awg  = Math.min(suggestAWG(Imax_A, J), 49);
  const wire = AWG_DATA[awg];
  if (!wire) return [];

  const results = [];

  ['SE', 'HE'].forEach(wt => {
    const wtype    = WIRE_TYPES[wt];
    const dCoat_mm = wire.d * wtype.factorD;
    const A_cm2    = Math.PI * Math.pow((wire.d / 10) / 2, 2);

    [2, 3, 4, 6, 8, 10, 15, 20, 30, 50].forEach(N => {
      // OD necesario para que DCR = DCRmax en single-layer
      const OD_mm   = DCRmax_val * A_cm2 * 10 / (rho * 1e-6 * N * Math.PI);
      const OD_mils = OD_mm / 0.0254;
      if (OD_mils < 20 || OD_mils > 900) return;

      const AL_nH  = L_nH / (N * N);
      if (AL_nH < 0.1 || AL_nH > 500) return;

      const lefMils = (N * dCoat_mm) / 0.0254;
      if (lefMils < 5 || lefMils > 500) return;

      // Estimación del largo total: efectivo + corte (~40%)
      const lenMils   = Math.ceil(lefMils * 1.45 / 5) * 5;
      const corteMils = Math.round((lenMils - lefMils) / 5) * 5;

      // Verificar DCR con estos parámetros
      const DCR = rho * 1e-6 * N * (Math.PI * OD_mm / 10) / A_cm2;
      if (DCR > DCRmax_val * 1.05) return; // pequeña tolerancia numérica

      const mat = suggestMaterial(AL_nH.toFixed(2), Imax_A);
      results.push({ N, OD_mils: Math.round(OD_mils), OD_mm: OD_mm.toFixed(1),
        AL_nH: AL_nH.toFixed(2), lefMils: lefMils.toFixed(1),
        lenMils, corteMils, AWG: awg, wireType: wt, DCR, mat });
    });
  });

  // Una entrada por N (preferir SE por ser más compacto)
  const seen = new Set();
  return results.filter(r => { if (seen.has(r.N)) return false; seen.add(r.N); return true; });
}

function renderNewCoreSuggestion(L_uH, Imax_A, DCRmax_val, rho, J, box) {
  const rows = suggestNewCore(L_uH, Imax_A, DCRmax_val, rho, J);

  if (!rows.length) {
    box.innerHTML = '<div class="alert alert-warn">⚠ No se puede estimar núcleo — revisa los valores de entrada.</div>';
    return;
  }

  const tableRows = rows.map((r, i) => `
    <tr>
      <td style="color:var(--accent);font-weight:600">${r.N}</td>
      <td style="color:var(--text);font-family:var(--mono)">${r.OD_mils} <span style="color:var(--text3);font-size:10px">(${r.OD_mm}mm)</span></td>
      <td style="color:var(--text);font-family:var(--mono)">${r.AL_nH}</td>
      <td style="color:var(--text2);font-family:var(--mono)">${r.lefMils}</td>
      <td style="color:var(--text2);font-family:var(--mono)">${r.lenMils} / ${r.corteMils}</td>
      <td style="color:var(--text2)">AWG ${r.AWG} ${r.wireType}</td>
      <td>
        <span style="color:var(--accent2);font-weight:600;font-size:11px">${r.mat.tipo}</span><br>
        <span style="color:var(--text2);font-size:10px;font-family:var(--mono)">${r.mat.mix}</span>
      </td>
      <td><a href="#" class="nc-load" data-idx="${i}"
          style="color:var(--accent2);font-size:11px">→ cargar</a></td>
    </tr>`).join('');

  box.innerHTML = `
    <div style="margin-bottom:10px">
      <span style="font-family:var(--display);font-size:12px;color:var(--warn);font-style:italic">
        Ningún núcleo disponible cumple — estimación de núcleo necesario (single-layer, DCR = límite):
      </span>
    </div>
    <table class="as-table">
      <thead><tr>
        <th>N vueltas</th><th>OD requerido</th><th>AL (nH/N²)</th>
        <th>Lef (mils)</th><th>Largo / Corte (mils)</th><th>Alambre</th>
        <th>Material sugerido</th><th></th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--text3)">
      ★ OD y largo son mínimos para single-layer · AL es el valor que debe medir el núcleo con LCR ·
      Material basado en AL requerido e Imax — verificar con hoja de datos del fabricante
    </div>`;

  // Eventos "→ cargar" — llena el panel de detalle con los parámetros del núcleo sugerido
  box.querySelectorAll('.nc-load').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const r = rows[parseInt(a.dataset.idx)];
      if (!r) return;
      document.getElementById('ALval').value       = r.AL_nH;
      document.getElementById('bobbinOD').value    = r.OD_mils;
      document.getElementById('bobbinLen').value   = r.lenMils;
      document.getElementById('bobbinCorte').value = r.corteMils;
      document.getElementById('bobbinID').value    = 0;
      document.getElementById('dimUnit').value     = 'mils';
      document.getElementById('AWG').value         = r.AWG;
      document.getElementById('wireType').value    = r.wireType;
      document.getElementById('windingStyle').value = 'close';
      document.getElementById('allowHalfTurns').value = 'half';
      onDimUnitChange();
      onWireTypeChange();
      onWindingStyleChange();
      calc();
      document.getElementById('manualSection').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ── GENERAR SELECT DE AWG ──
function buildAWGSelect() {
  const sel    = document.getElementById('AWG');
  const groups = [
    { label: '── Grueso   AWG 10–16 ──', range: [10, 16] },
    { label: '── Medio    AWG 17–26 ──', range: [17, 26] },
    { label: '── Fino     AWG 27–36 ──', range: [27, 36] },
    { label: '── Muy fino AWG 37–44 ──', range: [37, 44] },
    { label: '── Ultra fino AWG 45–49 ──', range: [45, 49] },
  ];
  sel.innerHTML = '';
  groups.forEach(g => {
    const og = document.createElement('optgroup');
    og.label = g.label;
    for (let awg = g.range[0]; awg <= g.range[1]; awg++) {
      const wire = AWG_DATA[awg]; if (!wire) continue;
      const A    = (Math.PI * Math.pow(wire.d / 2, 2)).toFixed(4);
      const imax = AWG_IMAX[awg] ? ` · ~${AWG_IMAX[awg]}A` : '';
      const opt  = document.createElement('option');
      opt.value       = awg;
      opt.textContent = `AWG ${String(awg).padStart(2, '0')} — Ø${wire.d}mm · ${A}mm²${imax}`;
      if (awg === 36) opt.selected = true;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  });
}

// ── CÁLCULO PRINCIPAL ──
function calc() {
  const L_uH   = parseFloat(document.getElementById('Ltarget').value)     || 1.0;
  const Imax   = parseFloat(document.getElementById('Imax').value)         || 9.2;
  const DCRmax = parseFloat(document.getElementById('DCRmax').value)       || 0.009;
  const AL_nH  = parseFloat(document.getElementById('ALval').value)        || 10;
  const rho    = parseFloat(document.getElementById('rho').value)           || 1.724;
  const J      = parseFloat(document.getElementById('Jdens').value)         || 400;
  const awg    = parseInt(document.getElementById('AWG').value)             || 36;
  const unit   = document.getElementById('dimUnit').value;
  const freq   = parseFloat(document.getElementById('freqMHz').value)       || 0;

  const lenRaw   = parseFloat(document.getElementById('bobbinLen').value)   || 0;
  const corteRaw = parseFloat(document.getElementById('bobbinCorte').value) || 0;
  const ODraw    = parseFloat(document.getElementById('bobbinOD').value)    || 0;
  const IDraw    = parseFloat(document.getElementById('bobbinID').value)    || 0;

  // Convertir todo a mm
  const lenMM   = toMM(lenRaw,   unit);
  const corteMM = toMM(corteRaw, unit);
  const OD_mm   = toMM(ODraw,    unit);
  const ID_mm   = toMM(IDraw,    unit);
  const lefMM   = Math.max(0.01, lenMM - corteMM);

  // ── Selección automática ──
  const candidates = autoSelect(L_uH, Imax, DCRmax, rho, J, selectedSeries);
  renderAutoSelect(candidates, Imax);

  // ── Vueltas ──
  const L_nH   = L_uH * 1000;
  const Nexact = Math.sqrt(L_nH / AL_nH);
  const N      = roundTurns(Nexact);

  // ── Alambre ──
  const wt      = document.getElementById('wireType').value;
  const wire    = AWG_DATA[awg];
  const wtype   = WIRE_TYPES[wt];
  const factorD = wtype ? wtype.factorD : 1.06;
  const dBare   = wire  ? wire.d : 1.27;
  const dCoat   = dBare * factorD;
  const A_cm2   = Math.PI * Math.pow((dBare / 10) / 2, 2);

  // ── Capas ──
  const Nper_layer = dCoat > 0 ? Math.floor(lefMM / dCoat) : 0;
  const layers     = Nper_layer > 0 ? Math.ceil(N / Nper_layer) : '∞';

  // ── MLT corregido por capas: MLT_avg = π × (OD + (n-1)×dCoat) ──
  const nLayers   = typeof layers === 'number' ? Math.max(1, layers) : 1;
  const OD_eff_mm = OD_mm + (nLayers - 1) * dCoat;
  const MLT_mm    = Math.PI * OD_eff_mm;
  const MLT_cm    = MLT_mm / 10;
  const Lwire_cm  = N * MLT_cm;

  // ── DCR ──
  const DCR = (rho * 1e-6) * Lwire_cm / A_cm2;

  // ── AL back-calculado ──
  const AL_back = N > 0 ? (L_nH / (N * N)).toFixed(3) : '—';

  // ── Sugerencia AWG ──
  const awgSugg = suggestAWG(Imax, J);
  showAWGSuggestion(awgSugg, awg, Imax);
  updateWireDiamInfo();

  // ── Análisis de frecuencia (efecto piel) ──
  renderFreqAnalysis(freq, awg);

  // ── Métricas ──
  document.getElementById('rN').textContent         = N;
  document.getElementById('rNexact').textContent    = Nexact.toFixed(3);
  document.getElementById('rDCR').textContent       = DCR.toFixed(5);
  document.getElementById('rLwire').textContent     = Lwire_cm.toFixed(1);
  document.getElementById('rLef').textContent       = (lefMM / 0.0254).toFixed(1);
  document.getElementById('rMLT').textContent       = MLT_mm.toFixed(2);
  document.getElementById('rNperlayer').textContent = Nper_layer;
  document.getElementById('rLayers').textContent    = layers;
  document.getElementById('rALback').textContent    = AL_back;

  // ── Info de dimensiones ──
  document.getElementById('dimInfo').innerHTML =
    `Largo: <span style="color:var(--text)">${lenMM.toFixed(2)}mm</span> &nbsp;·&nbsp; ` +
    `Corte: <span style="color:var(--text)">${corteMM.toFixed(2)}mm</span> &nbsp;·&nbsp; ` +
    `<strong>Largo efectivo: <span style="color:var(--accent)">${lefMM.toFixed(2)}mm = ${(lefMM / 0.0254).toFixed(1)} mils</span></strong><br>` +
    `OD: <span style="color:var(--text)">${OD_mm.toFixed(2)}mm</span> &nbsp;·&nbsp; ` +
    `ID: <span style="color:var(--text)">${ID_mm.toFixed(2)}mm</span> &nbsp;·&nbsp; ` +
    `MLT${nLayers > 1 ? ` (${nLayers} capas)` : ''} = <span style="color:var(--accent)">${MLT_mm.toFixed(2)}mm</span>`;

  // ── Info de capas ──
  const layerTxt = Nper_layer > 0
    ? `Largo efectivo ${lefMM.toFixed(2)}mm ÷ Ø alambre ${dCoat.toFixed(3)}mm = ` +
      `<span style="color:var(--accent)">${Nper_layer} vueltas/capa</span> &nbsp;·&nbsp; ` +
      `${N} vueltas totales → <span style="color:var(--accent)">${layers} capa(s)</span>` +
      (nLayers > 1 ? ` &nbsp;·&nbsp; <span style="color:var(--warn)">MLT corregido (${nLayers} capas)</span>` : '')
    : 'Ingresa las dimensiones de la bobina para calcular capas.';
  document.getElementById('layerInfo').innerHTML = layerTxt;

  // ── Barra de fórmula ──
  const modeLabel = document.getElementById('allowHalfTurns').value;
  document.getElementById('formulaBar').textContent =
    `N = √(${L_nH.toFixed(0)} nH / ${AL_nH} nH/N²) = ${Nexact.toFixed(3)} → ${N} vueltas (${modeLabel})` +
    `  |  AL real = ${AL_back} nH/N²  |  MLT = ${MLT_mm.toFixed(2)}mm` +
    `  |  DCR = ${DCR.toFixed(5)} Ω  |  L_wire = ${Lwire_cm.toFixed(1)} cm`;

  // ── Status ──
  const dcrOk = DCR <= DCRmax;
  const awgOk = awgSugg >= awg;

  document.getElementById('statusRow').innerHTML = `
    <div class="status-item">
      <div class="status-dot" style="background:${dcrOk ? 'var(--accent)' : 'var(--danger)'}"></div>
      <span style="color:${dcrOk ? 'var(--accent)' : 'var(--danger)'}">
        DCR = ${DCR.toFixed(5)}Ω ${dcrOk ? '< ✓' : '> ✗'} máx ${DCRmax}Ω
      </span>
    </div>
    <div class="status-item">
      <div class="status-dot" style="background:${awgOk ? 'var(--accent)' : 'var(--warn)'}"></div>
      <span style="color:${awgOk ? 'var(--accent)' : 'var(--warn)'}">
        AWG ${awg} ${awgOk ? '✓ OK para' : '⚠ pequeño para'} ${Imax}A @ ${J}A/cm²
      </span>
    </div>
    <div class="status-item">
      <div class="status-dot" style="background:${typeof layers === 'number' ? 'var(--accent)' : 'var(--warn)'}"></div>
      <span style="color:${typeof layers === 'number' ? 'var(--accent)' : 'var(--warn)'}">
        ${typeof layers === 'number' ? `${layers} capa(s) de bobinado` : 'Definir largo efectivo'}
      </span>
    </div>`;

  // ── Alertas ──
  let alerts = '';
  if (!dcrOk)
    alerts += `<div class="alert alert-warn">⚠ DCR ${DCR.toFixed(5)}Ω excede el límite de ${DCRmax}Ω. Usar AWG más grueso o ajustar el AL del núcleo.</div>`;
  if (!awgOk)
    alerts += `<div class="alert alert-warn">⚠ Para ${Imax}A se recomienda AWG ${awgSugg} o mayor. El AWG ${awg} puede sobrecalentarse.</div>`;
  if (nLayers > 1)
    alerts += `<div class="alert alert-ok" style="border-color:var(--border2);color:var(--text3)">ℹ ${nLayers} capas — MLT promedio: ${MLT_mm.toFixed(2)}mm. Para bobinado multi-sección el DCR puede diferir ±20%.</div>`;
  if (dcrOk && awgOk)
    alerts += `<div class="alert alert-ok">✓ Diseño válido: ${N} vueltas · AWG ${awg} ${wt} · L=${L_uH}µH · DCR=${DCR.toFixed(4)}Ω ≤ ${DCRmax}Ω</div>`;

  document.getElementById('alertsBox').innerHTML = alerts;
  document.getElementById('overallBadge').innerHTML = (dcrOk && awgOk)
    ? '<span class="badge badge-green">DISEÑO VÁLIDO</span>'
    : '<span class="badge badge-warn">REVISAR</span>';
}

// ── INICIALIZACIÓN ──
document.addEventListener('DOMContentLoaded', () => {
  initSeriesButtons();
  buildBobinaSelect();
  buildAWGSelect();
  onWireTypeChange();
  onDimUnitChange();
  onWindingStyleChange();
  calc();
});
