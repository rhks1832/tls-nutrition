import { useState, useEffect, useCallback } from "react";

const gold  = "#C9A84C";
const bg    = "#0A0A0A";
const card  = "#111111";
const line  = "#1C1C1C";
const dim   = "#888";
const muted = "#AAA";
const soft  = "#CCC";
const fg    = "#E8E4DC";

const LS_CHECK   = "tls_meal_check_v1";
const LS_WATER   = "tls_water_ml_v1";
const LS_GOAL_W  = "tls_goal_weight_v1";
const LS_FAV     = "tls_favorites_v1";
const LS_WORKOUT = "tls_workout_today_v1";

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayStr() { return localDateStr(); }
function loadLS(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function SectionTitle({ children, color = gold }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: fg, letterSpacing: "-0.01em" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 오늘의 진행 현황 — 실시간 반영 + 자정 초기화 안내
// ─────────────────────────────────────────────────────────────────────────────
export function TodaySummary({ result, lang, fontNumber, checks={}, water={}, updateChecks, updateWater }) {
  if (!result) return null;

  const todayChecks = checks[todayStr()] || [false, false, false, false];
  const doneMeals   = todayChecks.filter(Boolean).length;
  const waterMl     = water[todayStr()] || 0;
  const weightKg    = result.weightKg || 70;
  const waterGoalMl = Math.round(weightKg * 33);
  const waterPct    = Math.min(waterMl / waterGoalMl * 100, 100);
  const mealPct     = Math.round(doneMeals / 4 * 100);
  const mealColor   = mealPct === 100 ? "#8BA888" : mealPct >= 50 ? gold : "#7CB9E8";

  const resetNote = lang === "en" ? "Resets at midnight" : "자정에 자동 초기화";
  const lbl = lang === "en"
    ? { title: "Today's Progress", meal: `${doneMeals} / 4 Meals`, water: `${waterMl} / ${waterGoalMl} ml`,
        done: "All done! 💪", half: "Halfway", go: "Let's go" }
    : { title: "오늘 진행 현황", meal: `${doneMeals} / 4끼`, water: `${waterMl} / ${waterGoalMl} ml`,
        done: "모두 완료! 💪", half: "절반 완료", go: "시작해보세요" };

  return (
    <div style={{ background: "#0F1A0F", border: "1px solid #1E3A1E", borderRadius: 14, padding: "20px 20px", marginBottom: 16 }}>
      {/* 타이틀 + 자정 초기화 안내 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 22, borderRadius: 2, background: "#8BA888", flexShrink: 0 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: fg }}>{lbl.title}</div>
        </div>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.04em", textAlign: "right" }}>🕛 {resetNote}</div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {/* 식단 달성 */}
        <div style={{ flex: 1, background: bg, borderRadius: 10, padding: "14px 12px", border: `1px solid ${mealColor}40` }}>
          <div style={{ fontSize: 11, color: muted, letterSpacing: "0.08em", marginBottom: 8 }}>{lbl.meal}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: mealColor, fontFamily: fontNumber, lineHeight: 1 }}>{mealPct}%</div>
          <div style={{ height: 4, background: "#1A1A1A", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
            <div style={{ width: `${mealPct}%`, height: "100%", background: mealColor, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 11, color: mealPct === 100 ? "#8BA888" : dim, marginTop: 6 }}>
            {mealPct === 100 ? lbl.done : mealPct >= 50 ? lbl.half : lbl.go}
          </div>
        </div>
        {/* 물 섭취 */}
        <div style={{ flex: 1, background: bg, borderRadius: 10, padding: "14px 12px", border: "1px solid #7CB9E840" }}>
          <div style={{ fontSize: 11, color: muted, letterSpacing: "0.08em", marginBottom: 8 }}>{lbl.water}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#7CB9E8", fontFamily: fontNumber, lineHeight: 1 }}>{Math.round(waterPct)}%</div>
          <div style={{ height: 4, background: "#0D1826", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
            <div style={{ width: `${waterPct}%`, height: "100%", background: "#7CB9E8", transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 11, color: dim, marginTop: 6 }}>{waterMl} ml</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1-b. 끼니별 완료 체크 버튼
// ─────────────────────────────────────────────────────────────────────────────
export function MealCheckButton({ mealIndex, lang, checks={}, updateChecks }) {
  const done = (checks[todayStr()] || [])[mealIndex] || false;

  function toggle() {
    const arr = [...(checks[todayStr()] || [false, false, false, false])];
    arr[mealIndex] = !arr[mealIndex];
    const next = { ...checks, [todayStr()]: arr };
    if (updateChecks) updateChecks(next);
    else saveLS(LS_CHECK, next);
  }

  const lbl = lang === "en" ? (done ? "✓  Done" : "Mark Done") : (done ? "✓  완료" : "완료 체크");

  return (
    <button onClick={toggle}
      style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 8,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
        background: done ? "#8BA888" : "#0D1A0D",
        color: done ? "#0A0A0A" : "#8BA888",
        border: `1px solid ${done ? "#8BA888" : "#2A4A2A"}` }}>
      {lbl}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 물 섭취 트래커
// ─────────────────────────────────────────────────────────────────────────────
export function WaterTracker({ result, lang, fontNumber, water={}, updateWater }) {
  const [inputMl, setInputMl] = useState("");

  if (!result) return null;

  const weightKg    = result.weightKg || 70;
  const waterGoalMl = Math.round(weightKg * 33);
  const waterMl     = water[todayStr()] || 0;
  const pct         = Math.min(waterMl / waterGoalMl * 100, 100);

  function addMl(ml) {
    const next = Math.max(0, waterMl + ml);
    const w = { ...water, [todayStr()]: next };
    if (updateWater) updateWater(w); else saveLS(LS_WATER, w);
  }
  function submitInput() {
    const v = parseInt(inputMl);
    if (!isNaN(v) && v >= 0) {
      const w = { ...water, [todayStr()]: Math.min(v, waterGoalMl + 1000) };
      if (updateWater) updateWater(w); else saveLS(LS_WATER, w);
    }
    setInputMl("");
  }
  function reset() {
    const w = { ...water, [todayStr()]: 0 };
    if (updateWater) updateWater(w); else saveLS(LS_WATER, w);
  }

  const lbl = lang === "en"
    ? { title: "Water Intake", goal: `Daily goal: ${waterGoalMl} ml`, input: "Enter ml", add: "+250ml", add2: "+500ml", reset: "Reset" }
    : { title: "물 섭취 트래커", goal: `하루 목표: ${waterGoalMl} ml (${weightKg}kg × 33ml)`, input: "ml 직접 입력", add: "+250ml", add2: "+500ml", reset: "초기화" };

  const segments = 10;
  const mlPerSeg = waterGoalMl / segments;

  return (
    <div style={{ background: "#080D14", border: "1px solid #1A2A3A", borderRadius: 14, padding: "20px 20px", marginBottom: 16 }}>
      <SectionTitle color="#7CB9E8">{lbl.title}</SectionTitle>
      <div style={{ fontSize: 12, color: dim, marginBottom: 14 }}>{lbl.goal}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 48, fontWeight: 700, color: "#7CB9E8", fontFamily: fontNumber, lineHeight: 1 }}>{waterMl}</span>
        <span style={{ fontSize: 18, color: dim }}>/ {waterGoalMl} ml</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {Array.from({ length: segments }).map((_, i) => {
          const segFilled  = waterMl >= (i + 1) * mlPerSeg;
          const segPartial = !segFilled && waterMl > i * mlPerSeg;
          const partPct    = segPartial ? ((waterMl - i * mlPerSeg) / mlPerSeg * 100) : 0;
          return (
            <div key={i} style={{ flex: 1, height: 24, borderRadius: 4, background: "#0D1826", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                width: segFilled ? "100%" : `${partPct}%`,
                background: "#7CB9E8", transition: "width 0.3s" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: "#333" }}>0</span>
        <span style={{ fontSize: 10, color: pct >= 100 ? "#7CB9E8" : "#333" }}>{waterGoalMl} ml</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: bg, border: "1px solid #1A2A3A", borderRadius: 8, overflow: "hidden" }}>
          <input type="number" value={inputMl} onChange={e => setInputMl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitInput()} placeholder={lbl.input}
            style={{ flex: 1, background: "transparent", border: "none", color: fg, padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <span style={{ fontSize: 11, color: dim, padding: "0 12px" }}>ml</span>
        </div>
        <button onClick={submitInput}
          style={{ background: "#7CB9E8", color: "#0A0A0A", border: "none", borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => addMl(250)} style={{ flex: 1, background: "#0D1826", color: "#7CB9E8", border: "1px solid #1A2A3A", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{lbl.add}</button>
        <button onClick={() => addMl(500)} style={{ flex: 1, background: "#0D1826", color: "#7CB9E8", border: "1px solid #1A2A3A", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{lbl.add2}</button>
        <button onClick={reset} style={{ background: bg, color: dim, border: `1px solid ${line}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{lbl.reset}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5&6. 운동일/휴식일 칼로리 조정 — 두 버튼 (좌: 운동일 / 우: 휴식일)
// ─────────────────────────────────────────────────────────────────────────────
export function DayTypeAdjuster({ result, lang, fontNumber, onAdjusted }) {
  const [isWorkout, setIsWorkout] = useState(() => {
    const d = loadLS(LS_WORKOUT, {});
    return d[todayStr()] !== undefined ? !!d[todayStr()] : true;
  });

  if (!result) return null;

  const adjKcal    = isWorkout ? Math.round(result.kcal * 1.10) : Math.round(result.kcal * 0.90);
  const adjCarbs   = isWorkout ? Math.round(result.macros.carbs * 1.20) : Math.round(result.macros.carbs * 0.85);
  const adjProtein = result.macros.protein;
  const adjFat     = isWorkout ? Math.round(result.macros.fat * 0.90) : Math.round(result.macros.fat * 1.10);

  function setMode(workout) {
    setIsWorkout(workout);
    const d = loadLS(LS_WORKOUT, {});
    d[todayStr()] = workout;
    saveLS(LS_WORKOUT, d);
  }

  const lbl = lang === "en"
    ? { title: "Daily Calorie Adjustment", workout: "Training Day", rest: "Rest Day",
        carbUp: "+20%", carbDown: "−15%", calUp: "+10%", calDown: "−10%",
        tip: isWorkout
          ? "Training Day — Load more carbs for fuel. All 4 meals updated automatically."
          : "Rest Day — Reduce carbs to match lower energy needs. All 4 meals updated automatically." }
    : { title: "칼로리 조정", workout: "운동일", rest: "휴식일",
        carbUp: "+20%", carbDown: "−15%", calUp: "+10%", calDown: "−10%",
        tip: isWorkout
          ? "운동일 — 탄수화물을 더 채워 퍼포먼스를 높이세요. 1~4끼 전체에 자동 반영됩니다."
          : "휴식일 — 에너지 소비가 적으니 탄수화물을 줄이세요. 1~4끼 전체에 자동 반영됩니다." };

  return (
    <div style={{ background: isWorkout ? "#0A1408" : "#140A08", border: `1px solid ${isWorkout ? "#2A4A1A" : "#4A2A1A"}`, borderRadius: 14, padding: "20px 20px", marginBottom: 16 }}>
      <SectionTitle color={isWorkout ? "#A8D8A8" : "#E8A87C"}>{lbl.title}</SectionTitle>

      {/* 운동일 / 휴식일 두 버튼 — 왼쪽: 운동일, 오른쪽: 휴식일 */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 10, overflow: "hidden", border: "1px solid #2A2A2A" }}>
        <button onClick={() => setMode(true)}
          style={{ flex: 1, padding: "12px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, fontWeight: 700, transition: "all 0.15s",
            background: isWorkout ? "#A8D8A8" : "transparent",
            color: isWorkout ? "#0A0A0A" : "#555" }}>
          ⚡ {lbl.workout}
        </button>
        <button onClick={() => setMode(false)}
          style={{ flex: 1, padding: "12px 8px", borderLeft: "1px solid #2A2A2A", border: "none", borderLeft: "1px solid #2A2A2A", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, fontWeight: 700, transition: "all 0.15s",
            background: !isWorkout ? "#E8A87C" : "transparent",
            color: !isWorkout ? "#0A0A0A" : "#555" }}>
          😴 {lbl.rest}
        </button>
      </div>

      {/* 수치 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Total", v: adjKcal.toLocaleString(), u: "kcal", c: gold, badge: isWorkout ? lbl.calUp : lbl.calDown },
          { l: lang === "en" ? "Carbs" : "탄수화물", v: adjCarbs, u: "g", c: "#C9A84C", badge: isWorkout ? lbl.carbUp : lbl.carbDown },
          { l: lang === "en" ? "Protein" : "단백질", v: adjProtein, u: "g", c: "#7CB9E8", badge: "=" },
          { l: lang === "en" ? "Fat" : "지방", v: adjFat, u: "g", c: "#8BA888", badge: isWorkout ? "−10%" : "+10%" },
        ].map(({ l, v, u, c, badge }) => (
          <div key={l} style={{ flex: 1, background: bg, borderRadius: 8, padding: "12px 6px", textAlign: "center", border: `1px solid ${c}25`, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: muted, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: fontNumber, lineHeight: 1 }}>{v}<span style={{ fontSize: 9, marginLeft: 1 }}>{u}</span></div>
            <div style={{ fontSize: 9, color: c, marginTop: 4, opacity: 0.7 }}>{badge}</div>
          </div>
        ))}
      </div>

      {/* 끼니별 상세 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4].map(n => {
          const r = [
            { carbs: 0.25, protein: 0.25, fat: 0.30, kcalR: 0.25 },
            { carbs: 0.30, protein: 0.30, fat: 0.25, kcalR: 0.30 },
            { carbs: 0.30, protein: 0.30, fat: 0.20, kcalR: 0.28 },
            { carbs: 0.15, protein: 0.15, fat: 0.25, kcalR: 0.17 },
          ][n - 1];
          return (
            <div key={n} style={{ background: bg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: soft, fontWeight: 600, minWidth: 40 }}>{lang === "en" ? `Meal ${n}` : `${n}끼`}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 12, color: gold, fontFamily: fontNumber, fontWeight: 700 }}>{Math.round(adjKcal*r.kcalR)}<span style={{ fontSize: 9, color: dim }}>kcal</span></span>
                <span style={{ fontSize: 11, color: "#C9A84C" }}>{Math.round(adjCarbs*r.carbs)}g<span style={{ fontSize: 9, color: dim }}>탄</span></span>
                <span style={{ fontSize: 11, color: "#7CB9E8" }}>{Math.round(adjProtein*r.protein)}g<span style={{ fontSize: 9, color: dim }}>단</span></span>
                <span style={{ fontSize: 11, color: "#8BA888" }}>{Math.round(adjFat*r.fat)}g<span style={{ fontSize: 9, color: dim }}>지</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: bg, borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${isWorkout ? "#A8D8A8" : "#E8A87C"}` }}>
        <p style={{ fontSize: 12, color: soft, lineHeight: 1.7, margin: 0 }}>{lbl.tip}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. 즐겨찾기 훅
// ─────────────────────────────────────────────────────────────────────────────
export function useFavorites() {
  const [favs, setFavs] = useState(() => loadLS(LS_FAV, { carbs: [], protein: [], fat: [] }));
  function toggleFav(category, idx) {
    const cur = loadLS(LS_FAV, { carbs: [], protein: [], fat: [] });
    const arr = cur[category] || [];
    cur[category] = arr.includes(idx) ? arr.filter(i => i !== idx) : [...arr, idx];
    saveLS(LS_FAV, cur);
    setFavs({ ...cur });
  }
  function isFav(category, idx) { return (favs[category] || []).includes(idx); }
  return { toggleFav, isFav };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 진행률 대시보드
// ─────────────────────────────────────────────────────────────────────────────
export function ProgressDashboard({ weightLog, lang, fontNumber, weightUnitDisplay }) {
  const [goalWeight, setGoalWeight] = useState(() => loadLS(LS_GOAL_W, ""));
  const [editing, setEditing]       = useState(false);
  const [inputVal, setInputVal]     = useState("");

  const sorted  = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.length > 0 ? sorted[sorted.length - 1].weight : null;
  const start   = sorted.length > 0 ? sorted[0].weight : null;

  let weeklyChange = null;
  if (sorted.length >= 2) {
    const days = (new Date(sorted[sorted.length-1].date) - new Date(sorted[0].date)) / 86400000;
    if (days > 0) weeklyChange = ((sorted[sorted.length-1].weight - sorted[0].weight) / days * 7).toFixed(2);
  }

  let etaStr = null;
  if (goalWeight && current && weeklyChange && weeklyChange !== "0.00") {
    const rem = goalWeight - current;
    if ((rem < 0 && weeklyChange < 0) || (rem > 0 && weeklyChange > 0)) {
      const eta = new Date();
      eta.setDate(eta.getDate() + Math.round(Math.abs(rem / weeklyChange) * 7));
      etaStr = eta.toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "short", day: "numeric" });
    }
  }

  const pct = (goalWeight && start !== null && current !== null && +start !== +goalWeight)
    ? Math.max(0, Math.min(100, Math.round(Math.abs(current - start) / Math.abs(goalWeight - start) * 100)))
    : null;

  const lbl = lang === "en"
    ? { title: "Progress Dashboard", goal: "Goal", current: "Current", start: "Start", eta: "Est. Date", noData: "Log weight to see progress", setGoal: "Set Goal", save: "Save", perWeek: "/ week" }
    : { title: "진행률 대시보드", goal: "목표", current: "현재", start: "시작", eta: "예상 달성일", noData: "체중을 기록하면 진행률이 표시됩니다", setGoal: "목표 설정", save: "저장", perWeek: "/ 주" };

  return (
    <div style={{ background: "#0A0A14", border: "1px solid #1A1A2A", borderRadius: 14, padding: "20px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionTitle color="#7CB9E8">{lbl.title}</SectionTitle>
        <button onClick={() => { setEditing(!editing); setInputVal(goalWeight ? String(goalWeight) : ""); }}
          style={{ fontSize: 12, color: gold, background: "transparent", border: `1px solid ${gold}44`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          {lbl.setGoal}
        </button>
      </div>
      {editing && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: bg, border: `1px solid ${line}`, borderRadius: 8, overflow: "hidden" }}>
            <input type="number" step="0.1" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder={lang === "en" ? "e.g. 154" : "예) 70"}
              style={{ flex: 1, background: "transparent", border: "none", color: fg, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            <span style={{ fontSize: 11, color: dim, padding: "0 12px" }}>{weightUnitDisplay}</span>
          </div>
          <button onClick={() => { const v = parseFloat(inputVal); if (!isNaN(v)) { setGoalWeight(v); saveLS(LS_GOAL_W, v); } setEditing(false); }}
            style={{ background: gold, color: "#0A0A0A", border: "none", borderRadius: 8, padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {lbl.save}
          </button>
        </div>
      )}
      {current === null ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#444", fontSize: 13 }}>{lbl.noData}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: pct !== null ? 14 : 0 }}>
            {[[lbl.current, `${current}${weightUnitDisplay}`, gold], [lbl.start, start !== null ? `${start}${weightUnitDisplay}` : "—", dim], [lbl.goal, goalWeight ? `${goalWeight}${weightUnitDisplay}` : "—", "#8BA888"]].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, background: bg, borderRadius: 8, padding: "12px 8px", textAlign: "center", border: `1px solid ${line}` }}>
                <div style={{ fontSize: 9, color: muted, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: fontNumber }}>{v}</div>
              </div>
            ))}
          </div>
          {pct !== null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: soft }}>달성률</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: gold, fontFamily: fontNumber }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: "#111", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: gold, transition: "width 0.5s" }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            {weeklyChange !== null && (
              <div style={{ flex: 1, background: bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${line}` }}>
                <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", marginBottom: 3 }}>{lbl.perWeek}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: weeklyChange < 0 ? "#8BA888" : "#E87C7C", fontFamily: fontNumber }}>
                  {weeklyChange > 0 ? "+" : ""}{weeklyChange}{weightUnitDisplay}
                </div>
              </div>
            )}
            {etaStr && (
              <div style={{ flex: 2, background: bg, borderRadius: 8, padding: "10px 12px", border: "1px solid #8BA88830" }}>
                <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", marginBottom: 3 }}>{lbl.eta}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#8BA888" }}>{etaStr}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. 데일리 체크 카드 — 끼니/물 직접 조작 + 저장 이미지에 날짜시간 워터마크
// ─────────────────────────────────────────────────────────────────────────────
export function ShareCard({ weightLog, result, lang, fontNumber, checks={}, water={}, updateChecks, updateWater }) {
  const [generating, setGenerating] = useState(false);

  const sorted  = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.length > 0 ? sorted[sorted.length - 1].weight : null;
  const start   = sorted.length > 1 ? sorted[0].weight : null;
  const diff    = (start !== null && current !== null) ? (current - start).toFixed(1) : null;

  const todayChecks = checks[todayStr()] || [false, false, false, false];
  const doneMeals   = todayChecks.filter(Boolean).length;
  const waterMl     = water[todayStr()] || 0;
  const weightKg    = result?.weightKg || 70;
  const waterGoalMl = Math.round(weightKg * 33);
  const waterDone   = waterMl >= waterGoalMl;

  // 끼니 체크 토글
  function toggleCheck(i) {
    const arr = [...(checks[todayStr()] || [false, false, false, false])];
    arr[i] = !arr[i];
    const next = { ...checks, [todayStr()]: arr };
    if (updateChecks) updateChecks(next);
  }

  // 물 빠른 추가
  function addWater(ml) {
    const cur = water[todayStr()] || 0;
    const next = Math.max(0, cur + ml);
    const w = { ...water, [todayStr()]: next };
    if (updateWater) updateWater(w);
  }

  const lbl = lang === "en"
    ? { title: "Daily Check Card", btn: "📤 Save Card", generating: "Creating…", noData: "Generate a plan to use this card",
        mealNames: ["Meal 1","Meal 2","Meal 3","Meal 4"], water: "Water", done: "Done", add250: "+250ml", add500: "+500ml" }
    : { title: "데일리 체크 카드", btn: "📤 카드 저장", generating: "만드는 중…", noData: "식단을 먼저 생성해 주세요",
        mealNames: ["1끼","2끼","3끼","4끼"], water: "물 섭취", done: "완료", add250: "+250ml", add500: "+500ml" };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  }

  async function generate() {
    if (generating || !result) return;
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1080;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.strokeStyle = "#C9A84C33"; ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, 1020, 1020);

      // 로고 워터마크
      const logo = new Image(); logo.crossOrigin = "anonymous";
      await new Promise(res => { logo.onload = res; logo.onerror = res; logo.src = "/logo.jpg"; });
      ctx.globalAlpha = 0.05;
      ctx.drawImage(logo, 340, 290, 400, 400);
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.fillStyle = "#AAA"; ctx.font = "24px sans-serif";
      ctx.fillText("THE LAST SET", 540, 100);
      ctx.fillStyle = "#C9A84C"; ctx.font = "bold 56px sans-serif";
      ctx.fillText("I Will Succeed", 540, 175);
      ctx.fillStyle = "#555"; ctx.font = "22px sans-serif";
      ctx.fillText(todayStr(), 540, 215);

      ctx.strokeStyle = "#C9A84C44"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(120, 245); ctx.lineTo(960, 245); ctx.stroke();

      // 끼니 체크
      const mealY = 300;
      ctx.textAlign = "left"; ctx.font = "bold 26px sans-serif"; ctx.fillStyle = "#888";
      ctx.fillText(lang === "en" ? "MEAL CHECKLIST" : "식단 체크리스트", 120, mealY);

      todayChecks.forEach((done, i) => {
        const y = mealY + 50 + i * 64;
        ctx.fillStyle = done ? "#8BA888" : "#1A1A1A";
        roundRect(ctx, 120, y-26, 44, 44, 8); ctx.fill();
        if (done) {
          ctx.fillStyle = "#0A0A0A"; ctx.font = "bold 24px sans-serif";
          ctx.textAlign = "center"; ctx.fillText("✓", 142, y+6);
        }
        ctx.textAlign = "left";
        ctx.font = done ? "bold 30px sans-serif" : "30px sans-serif";
        ctx.fillStyle = done ? "#F0EBE1" : "#444";
        ctx.fillText(lbl.mealNames[i], 186, y+6);
        if (done) {
          ctx.fillStyle = "#8BA888"; ctx.font = "20px sans-serif";
          ctx.textAlign = "right"; ctx.fillText(lbl.done, 960, y+6);
        }
      });

      ctx.strokeStyle = "#C9A84C44";
      ctx.beginPath(); ctx.moveTo(120, 600); ctx.lineTo(960, 600); ctx.stroke();

      // 물 섭취
      const waterY = 650;
      ctx.textAlign = "left"; ctx.font = "bold 26px sans-serif"; ctx.fillStyle = "#888";
      ctx.fillText(lang === "en" ? "WATER INTAKE" : "물 섭취", 120, waterY);
      const barX=120, barY=waterY+20, barW=840, barH=32;
      ctx.fillStyle = "#0D1826"; roundRect(ctx, barX, barY, barW, barH, 8); ctx.fill();
      const fillW = Math.min(waterMl/waterGoalMl, 1) * barW;
      ctx.fillStyle = waterDone ? "#8BA888" : "#7CB9E8";
      if (fillW > 0) { roundRect(ctx, barX, barY, fillW, barH, 8); ctx.fill(); }
      ctx.textAlign = "center"; ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = fillW > 100 ? "#0A0A0A" : "#555";
      ctx.fillText(`${waterMl} / ${waterGoalMl} ml`, 540, barY+22);

      // 체중 변화
      if (diff !== null) {
        ctx.strokeStyle = "#C9A84C44";
        ctx.beginPath(); ctx.moveTo(120, 740); ctx.lineTo(960, 740); ctx.stroke();
        ctx.textAlign = "center"; ctx.font = "bold 72px sans-serif";
        ctx.fillStyle = parseFloat(diff) < 0 ? "#8BA888" : parseFloat(diff) > 0 ? "#E87C7C" : "#C9A84C";
        ctx.fillText(`${parseFloat(diff)>=0?"+":""}${diff}kg`, 540, 840);
        ctx.font = "26px sans-serif"; ctx.fillStyle = "#555";
        ctx.fillText(`${start}kg → ${current}kg`, 540, 888);
      }

      // 푸터
      ctx.textAlign = "center"; ctx.font = "22px sans-serif"; ctx.fillStyle = "#333";
      ctx.fillText("@musclefit_jjoah  ·  TLS.muscle_jjoah", 540, 980);

      // ── 날짜/시간 워터마크 ──
      const now = new Date();
      const stamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.translate(1060, 50);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#C9A84C";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(stamp, 0, 0);
      ctx.restore();

      const link = document.createElement("a");
      link.download = `TLS_daily_${todayStr()}.png`;
      link.href = canvas.toDataURL("image/png"); link.click();
    } catch(e) { console.error(e); }
    setGenerating(false);
  }

  return (
    <div style={{ background: "#14100A", border: "1px solid #2A1E0A", borderRadius: 14, padding: "20px 20px", marginBottom: 16 }}>
      <SectionTitle color={gold}>{lbl.title}</SectionTitle>

      {!result ? (
        <div style={{ fontSize: 13, color: dim, textAlign: "center", padding: "10px 0" }}>{lbl.noData}</div>
      ) : (
        <>
          {/* 미리보기 + 직접 조작 */}
          <div style={{ background: bg, borderRadius: 10, padding: "16px 14px", marginBottom: 14, border: `1px solid ${line}` }}>
            <div style={{ fontSize: 10, color: muted, letterSpacing: "0.2em", textAlign: "center", marginBottom: 6 }}>THE LAST SET · {todayStr()}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: gold, textAlign: "center", marginBottom: 14, fontFamily: fontNumber }}>I Will Succeed</div>

            {/* 끼니 체크 — 직접 클릭 가능 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {todayChecks.map((done, i) => (
                <button key={i} onClick={() => toggleCheck(i)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: done ? "#0D1A0D" : "#0D0D0D", borderRadius: 6, padding: "10px 12px",
                    border: `1px solid ${done ? "#2A4A2A" : "#1A1A1A"}`,
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: done ? "#8BA888" : "#1A1A1A",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, color: "#0A0A0A", fontWeight: 700, flexShrink: 0 }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 14, color: done ? fg : "#444", fontWeight: done ? 600 : 400 }}>{lbl.mealNames[i]}</span>
                  </div>
                  {done && <span style={{ fontSize: 12, color: "#8BA888" }}>{lbl.done}</span>}
                </button>
              ))}
            </div>

            {/* 물 섭취 — 직접 조작 */}
            <div style={{ background: waterDone ? "#0D1A0D" : "#0D1826", borderRadius: 8, padding: "12px 12px", border: `1px solid ${waterDone ? "#2A4A2A" : "#1A2A3A"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: waterDone ? "#8BA888" : "#7CB9E8", fontWeight: 600 }}>💧 {lbl.water}</span>
                <span style={{ fontSize: 13, color: waterDone ? "#8BA888" : "#7CB9E8", fontFamily: fontNumber, fontWeight: 700 }}>{waterMl} / {waterGoalMl} ml</span>
              </div>
              <div style={{ height: 5, background: "#1A1A1A", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${Math.min(waterMl/waterGoalMl*100,100)}%`, height:"100%", background: waterDone?"#8BA888":"#7CB9E8", transition:"width 0.3s" }} />
              </div>
              {/* 물 조정 버튼 */}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => addWater(250)}
                  style={{ flex: 1, background: "#0D1826", color: "#7CB9E8", border: "1px solid #1A2A3A", borderRadius: 6, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {lbl.add250}
                </button>
                <button onClick={() => addWater(500)}
                  style={{ flex: 1, background: "#0D1826", color: "#7CB9E8", border: "1px solid #1A2A3A", borderRadius: 6, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {lbl.add500}
                </button>
                <button onClick={() => addWater(-250)}
                  style={{ background: bg, color: dim, border: `1px solid ${line}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  −
                </button>
              </div>
            </div>

            {diff !== null && (
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: parseFloat(diff)<0?"#8BA888":"#E87C7C", fontFamily: fontNumber }}>
                  {parseFloat(diff)>=0?"+":""}{diff}kg
                </span>
                <span style={{ fontSize: 11, color: dim, marginLeft: 8 }}>{start}→{current}kg</span>
              </div>
            )}
          </div>

          <button onClick={generate} disabled={generating}
            style={{ width: "100%", background: generating?"#1A1A1A":"#1A1408", color: generating?dim:gold,
              border:`1px solid ${gold}55`, borderRadius: 8, padding: "13px", fontSize: 13, fontWeight: 700,
              cursor: generating?"not-allowed":"pointer", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {generating ? lbl.generating : lbl.btn}
          </button>
        </>
      )}
    </div>
  );
}
