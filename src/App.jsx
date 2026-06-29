import { useState, useEffect, useRef, useCallback } from "react";
import { FOOD_NAMES, WHY_TEXT, T } from "./i18n.js";

import { TodaySummary, MealCheckButton, ProgressDashboard, WaterTracker, DayTypeAdjuster, useFavorites, ShareCard } from "./features.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// 식품 DB
// ─────────────────────────────────────────────────────────────────────────────
const FOOD_DB = {
  carbs: [
    { per100g: { carbs: 36,  protein: 2.5, fat: 0.3, kcal: 160 }, unit: "g" },
    { per100g: { carbs: 22,  protein: 1.5, fat: 0.1, kcal: 100 }, unit: "g" },
    { per100g: { carbs: 62,  protein: 11,  fat: 7,   kcal: 350 }, unit: "g" },
    { per100g: { carbs: 23,  protein: 1.2, fat: 0.3, kcal: 100 }, unit: "g" },
    { per100g: { carbs: 48,  protein: 9,   fat: 3,   kcal: 260 }, unit: "g" },
    { per100g: { carbs: 35,  protein: 3,   fat: 0.8, kcal: 160 }, unit: "g" },
    { per100g: { carbs: 66,  protein: 17,  fat: 7,   kcal: 389 }, unit: "g" },
    { per100g: { carbs: 17,  protein: 2,   fat: 0.1, kcal: 80  }, unit: "g" },
    { per100g: { carbs: 14,  protein: 0.3, fat: 0.2, kcal: 58  }, unit: "g" },
    { per100g: { carbs: 19,  protein: 3.3, fat: 1.2, kcal: 90  }, unit: "g" },
    { per100g: { carbs: 17,  protein: 1.6, fat: 0.1, kcal: 80  }, unit: "g" },
  ],
  protein: [
    { per100g: { carbs: 0,   protein: 31,  fat: 2,   kcal: 150 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0.6, protein: 6.5, fat: 5,   kcal: 72  }, unit: "개", isEgg: true  },
    { per100g: { carbs: 0,   protein: 25,  fat: 12,  kcal: 220 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 22,  fat: 3,   kcal: 120 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 28,  fat: 5,   kcal: 150 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 30,  fat: 1,   kcal: 130 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 24,  fat: 0.3, kcal: 100 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 26,  fat: 6,   kcal: 165 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 23,  fat: 4,   kcal: 140 }, unit: "g",  isEgg: false },
    { per100g: { carbs: 0,   protein: 20,  fat: 0.5, kcal: 90  }, unit: "g",  isEgg: false },
  ],
  fat: [
    { per100g: { carbs: 9,  protein: 2,  fat: 15,  kcal: 160 }, unit: "g"  },
    { per100g: { carbs: 22, protein: 21, fat: 49,  kcal: 579 }, unit: "g"  },
    { per100g: { carbs: 0,  protein: 0,  fat: 100, kcal: 884 }, unit: "ml" },
    { per100g: { carbs: 42, protein: 17, fat: 31,  kcal: 486 }, unit: "g"  },
    { per100g: { carbs: 20, protein: 25, fat: 50,  kcal: 598 }, unit: "g"  },
    { per100g: { carbs: 14, protein: 15, fat: 65,  kcal: 654 }, unit: "g"  },
    { per100g: { carbs: 0,  protein: 0,  fat: 100, kcal: 892 }, unit: "ml" },
    { per100g: { carbs: 23, protein: 18, fat: 50,  kcal: 573 }, unit: "g"  },
    { per100g: { carbs: 58, protein: 15, fat: 14,  kcal: 456 }, unit: "g"  },
    { per100g: { carbs: 0,  protein: 0,  fat: 100, kcal: 900 }, unit: "ml" },
  ],
};

// 끼니 정의 (운동일/휴식일 비율은 컴포넌트에서 처리)
function getMeals(postWorkoutSlot, t) {
  const base = [
    { id:1, icon:"★★★", accent:"#C9A84C", label:t.meal1label, name:t.meal1name,
      ratios:{ carbs:0.25, protein:0.25, fat:0.30 }, kcalRatio:0.25, tip:t.meal1tip },
    { id:2, icon:"★★",  accent:"#E8A87C", label:t.meal2label, name:t.meal2name,
      ratios:{ carbs:0.30, protein:0.30, fat:0.25 }, kcalRatio:0.30, tip:t.meal2tip },
    { id:3, icon:"★★",  accent:"#7CB9E8", label:t.meal3label, name:t.meal3name,
      ratios:{ carbs:0.30, protein:0.30, fat:0.20 }, kcalRatio:0.28, tip:t.meal3tip },
    { id:4, icon:"★★",  accent:"#8B9E6A", label:t.meal4label, name:t.meal4name,
      ratios:{ carbs:0.15, protein:0.15, fat:0.25 }, kcalRatio:0.17, tip:t.meal4tip },
  ];
  return base.map(m => m.id !== postWorkoutSlot ? m : {
    ...m, icon:"★★★★★", label:t.postWorkoutLabel(m.name),
    isPostWorkout:true, accent:"#A8D8A8",
    ratios:{ carbs:0.35, protein:0.35, fat:0.15 }, tip:t.postWorkoutTip,
  });
}

const CAT_COLOR = {
  carbs:   { color:"#C9A84C", bg:"#1A1608", icon:"🌾" },
  protein: { color:"#7CB9E8", bg:"#081420", icon:"🥩" },
  fat:     { color:"#8BA888", bg:"#0A1208", icon:"🥑" },
};

const PROT_MULTIPLIERS = [
  { value:1.4, label:"×1.4" }, { value:1.6, label:"×1.6" },
  { value:1.8, label:"×1.8" }, { value:2.0, label:"×2.0" },
  { value:3.0, label:"×3.0" },
];

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const FORM_DEFAULT = { age:"", weight:"", height:"", bodyFat:"", freq:"", goal:"cut", gender:"male", protMult:2.0, postWorkoutSlot:3 };
const LS_FORM    = "tls_form_v1";
const LS_WEIGHTS = "tls_weights_v1";
const LS_LANG    = "tls_lang_v1";

// ─────────────────────────────────────────────────────────────────────────────
// 계산 함수
// ─────────────────────────────────────────────────────────────────────────────
function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return Math.round(weight / ((height / 100) ** 2) * 10) / 10;
}
function getBMICategory(bmi, t) {
  if (bmi < 18.5) return { label:t.bmiUnderweight, color:"#7CB9E8" };
  if (bmi < 25)   return { label:t.bmiNormal,      color:"#8BA888" };
  if (bmi < 30)   return { label:t.bmiOverweight,  color:"#E8C850" };
  return               { label:t.bmiObese,       color:"#E87C7C" };
}
function calcBMR(age, weight, height, gender) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}
function calcTDEE(age, weight, height, freq, goal, gender) {
  const bmr = calcBMR(age, weight, height, gender);
  const act  = freq <= 1 ? 1.2 : freq <= 3 ? 1.375 : freq <= 5 ? 1.55 : 1.725;
  const tdee = bmr * act;
  return Math.round(goal === "cut" ? tdee * 0.8 : goal === "bulk" ? tdee * 1.1 : tdee);
}
function calcMacros(kcal, weight, protMult) {
  const protKcal  = Math.min(Math.round(weight * protMult) * 4, Math.round(kcal * 0.45));
  const protG     = Math.round(protKcal / 4);
  const remaining = kcal - protKcal;
  const carbKcal  = Math.round(remaining * (5 / 7));
  const fatKcal   = Math.round(remaining * (2 / 7));
  return {
    carbs:Math.round(carbKcal/4), protein:protG, fat:Math.round(fatKcal/9),
    carbKcal, protKcal, fatKcal,
    carbPct:Math.round(carbKcal/kcal*100),
    protPct:Math.round(protKcal/kcal*100),
    fatPct: Math.round(fatKcal /kcal*100),
  };
}
// 칼로리 기준 식품 계산 (부수 영양소 감안)
function calcFoodAmountByKcal(food, targetKcal, lang) {
  // 목표 칼로리에 맞는 식품량 계산
  const amt100 = (targetKcal / food.per100g.kcal) * 100;
  const amt = food.isEgg
    ? Math.max(1, Math.round(amt100 / 100))
    : Math.round(Math.max(amt100, food.per100g.fat > 50 ? 5 : 30));
  const ratio = food.isEgg ? amt : amt / 100;
  return {
    amount: amt,
    displayUnit: food.isEgg ? (lang === "en" ? "ea" : "개") : food.unit,
    kcal: Math.round(food.per100g.kcal * ratio),
    c:    Math.round(food.per100g.carbs * ratio),
    p:    Math.round(food.per100g.protein * ratio),
    f:    Math.round(food.per100g.fat * ratio),
  };
}

function calcFoodAmount(food, targetG, category, lang) {
  const nk = category === "fat" ? "fat" : category === "protein" ? "protein" : "carbs";
  if (food.isEgg) {
    const count = Math.max(1, Math.round(targetG / food.per100g.protein));
    return { amount:count, displayUnit: lang === "en" ? "ea" : "개",
      kcal:Math.round(food.per100g.kcal*count), c:Math.round(food.per100g.carbs*count),
      p:Math.round(food.per100g.protein*count), f:Math.round(food.per100g.fat*count) };
  }
  const amt = Math.round(Math.max((targetG/food.per100g[nk])*100, category==="fat"?5:50));
  return { amount:amt, displayUnit:food.unit,
    kcal:Math.round(food.per100g.kcal*amt/100), c:Math.round(food.per100g.carbs*amt/100),
    p:Math.round(food.per100g.protein*amt/100), f:Math.round(food.per100g.fat*amt/100) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 언어 전환 버튼
// ─────────────────────────────────────────────────────────────────────────────
function LangToggle({ lang, setLang, style }) {
  return (
    <div style={{ display:"flex", gap:4, ...style }}>
      {["ko","en"].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{ padding:"5px 10px", borderRadius:6, fontSize:11, fontWeight:lang===l?700:400,
            cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
            background: lang===l ? "#C9A84C" : "transparent",
            color: lang===l ? "#0A0A0A" : "#666",
            border:`1px solid ${lang===l ? "#C9A84C" : "#2A2A2A"}` }}>
          {l === "ko" ? "🇰🇷 KR" : "🇺🇸 EN"}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FoodSelector
// ─────────────────────────────────────────────────────────────────────────────
function FoodSelector({ category, targetG, color, lang, toggleFav, isFav }) {
  const [sel, setSel] = useState(0);
  const foods = FOOD_DB[category];
  const names = FOOD_NAMES[lang][category];
  const why   = WHY_TEXT[lang][category];
  const t     = T[lang];
  const food  = foods[sel];
  const calc  = calcFoodAmount(food, targetG, category, lang);

  return (
    <div style={{ background:"#0A0A0A", borderRadius:10, padding:16, border:`1px solid ${color}18` }}>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
        {foods.map((f, i) => {
          const fav = isFav ? isFav(category, i) : false;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:2 }}>
              <button onClick={() => setSel(i)}
                style={{ padding:"5px 10px", borderRadius:4, fontSize:11, cursor:"pointer",
                  fontFamily:"inherit", transition:"all 0.15s",
                  border:`1px solid ${sel===i ? color : "#222"}`,
                  background: sel===i ? `${color}18` : "transparent",
                  color: sel===i ? color : "#666", fontWeight:sel===i?700:400 }}>
                {names[i]}
              </button>
              {toggleFav && (
                <button onClick={() => toggleFav(category, i)}
                  style={{ fontSize:10, background:"transparent", border:"none", cursor:"pointer",
                    color:fav?"#F5C842":"#2A2A2A", padding:"0 2px", lineHeight:1 }}>★</button>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:"#F0EBE1", letterSpacing:"-0.02em" }}>{names[sel]}</div>
          <div style={{ fontSize:10, color:"#3A3A3A", marginTop:3, letterSpacing:"0.06em", textTransform:"uppercase" }}>{t.mealTargetSolo}</div>
        </div>
        <div style={{ textAlign:"right", background:`${color}10`, border:`1px solid ${color}30`, borderRadius:10, padding:"10px 16px" }}>
          <div style={{ fontSize:32, fontWeight:700, color, lineHeight:1, fontFamily:t.fontNumber, letterSpacing:"0.02em" }}>{calc.amount}</div>
          <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{calc.displayUnit}</div>
        </div>
      </div>
      <p style={{ fontSize:12, color:"#555", lineHeight:1.7, margin:"0 0 10px", fontStyle:"italic" }}>{why[sel]}</p>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {[["kcal",`${calc.kcal}kcal`],["탄",`${calc.c}g`],["단",`${calc.p}g`],["지",`${calc.f}g`]].map(([l,v]) => (
          <div key={l} style={{ background:"#111", borderRadius:4, padding:"4px 8px", fontSize:11, border:"1px solid #1C1C1C" }}>
            <span style={{ color:"#444" }}>{l} </span><span style={{ color:"#777" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FoodRow — 식품 선택 행 (MealFoodPanel 에서 사용)
// ─────────────────────────────────────────────────────────────────────────────
function FoodRow({ names, why, sel, setSel, calc, color, label }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:color }} />
        <span style={{ fontSize:10, letterSpacing:"0.12em", color:"#555", textTransform:"uppercase" }}>{label}</span>
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
        {names.map((name, i) => (
          <button key={i} onClick={() => setSel(i)}
            style={{ padding:"5px 10px", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"inherit",
              border:`1px solid ${sel===i ? color : "#222"}`,
              background: sel===i ? `${color}18` : "transparent",
              color: sel===i ? color : "#666", fontWeight:sel===i?700:400 }}>
            {name}
          </button>
        ))}
      </div>
      <div style={{ background:"#0A0A0A", borderRadius:10, padding:14, border:`1px solid ${color}18` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#F0EBE1" }}>{names[sel]}</div>
          <div style={{ textAlign:"right", background:`${color}10`, border:`1px solid ${color}30`, borderRadius:8, padding:"8px 14px" }}>
            <div style={{ fontSize:28, fontWeight:700, color, lineHeight:1, letterSpacing:"0.02em" }}>{calc.amount}</div>
            <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{calc.displayUnit}</div>
          </div>
        </div>
        <p style={{ fontSize:12, color:"#555", lineHeight:1.6, margin:"0 0 8px", fontStyle:"italic" }}>{why[sel]}</p>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {[["kcal",`${calc.kcal}kcal`],["탄",`${calc.c}g`],["단",`${calc.p}g`],["지",`${calc.f}g`]].map(([l,v]) => (
            <div key={l} style={{ background:"#111", borderRadius:4, padding:"4px 8px", fontSize:11, border:"1px solid #1C1C1C" }}>
              <span style={{ color:"#444" }}>{l} </span><span style={{ color:"#777" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MealFoodPanel — 칼로리 기준 식품 계산 (부수 영양소 감안)
// ─────────────────────────────────────────────────────────────────────────────
function MealFoodPanel({ mealCarbs, mealProtein, mealFat, mealKcal, lang, t, toggleFav, isFav }) {
  const [selP, setSelP] = useState(0);
  const [selC, setSelC] = useState(0);
  const [selF, setSelF] = useState(0);

  const gold = "#C9A84C";

  const pFood  = FOOD_DB.protein[selP];
  const pCalc  = calcFoodAmount(pFood, mealProtein, "protein", lang);
  const remainKcalAfterP = Math.max(0, mealKcal - pCalc.kcal);
  const remainFatAfterP  = Math.max(0, mealFat - pCalc.f);
  const carbKcalTarget = Math.round(remainKcalAfterP * (mealCarbs * 4 / (mealCarbs * 4 + remainFatAfterP * 9 + 1)));
  const cFood = FOOD_DB.carbs[selC];
  const cCalc = calcFoodAmountByKcal(cFood, Math.max(carbKcalTarget, 50), lang);
  const remainKcalAfterPC = Math.max(0, remainKcalAfterP - cCalc.kcal);
  const fFood = FOOD_DB.fat[selF];
  const fCalc = calcFoodAmountByKcal(fFood, Math.max(remainKcalAfterPC, 20), lang);

  const totalKcal = pCalc.kcal + cCalc.kcal + fCalc.kcal;
  const totalC    = pCalc.c + cCalc.c + fCalc.c;
  const totalP    = pCalc.p + cCalc.p + fCalc.p;
  const totalF    = pCalc.f + cCalc.f + fCalc.f;
  const diffKcal  = totalKcal - mealKcal;
  const diffColor = Math.abs(diffKcal) <= mealKcal * 0.1 ? "#8BA888" : Math.abs(diffKcal) <= mealKcal * 0.2 ? gold : "#E87C7C";

  const pNames = FOOD_NAMES[lang].protein;
  const cNames = FOOD_NAMES[lang].carbs;
  const fNames = FOOD_NAMES[lang].fat;
  const pWhy   = WHY_TEXT[lang].protein;
  const cWhy   = WHY_TEXT[lang].carbs;
  const fWhy   = WHY_TEXT[lang].fat;

  return (
    <div>
      {/* 총합 요약 */}
      <div style={{ background:"#0F0F0F", borderRadius:10, padding:"12px 14px", marginBottom:16, border:`1px solid ${diffColor}44` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:11, color:"#666" }}>{lang==="en" ? "Total this meal" : "이 끼니 합계"}</span>
          <span style={{ fontSize:13, fontWeight:700, color:diffColor }}>
            {totalKcal}kcal
            <span style={{ fontSize:10, marginLeft:6, color:diffColor, opacity:0.8 }}>
              ({diffKcal >= 0 ? "+" : ""}{diffKcal} vs {mealKcal})
            </span>
          </span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[["탄",totalC,"#C9A84C"],["단",totalP,"#7CB9E8"],["지",totalF,"#8BA888"]].map(([l,v,c]) => (
            <div key={l} style={{ flex:1, background:"#1A1A1A", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#555", marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}g</div>
            </div>
          ))}
        </div>
      </div>
      <FoodRow names={pNames} why={pWhy} sel={selP} setSel={setSelP}
        calc={pCalc} color="#7CB9E8" label={t.proteinLabel} />
      <FoodRow names={cNames} why={cWhy} sel={selC} setSel={setSelC}
        calc={cCalc} color="#C9A84C" label={t.carbsLabel} />
      <FoodRow names={fNames} why={fWhy} sel={selF} setSel={setSelF}
        calc={fCalc} color="#8BA888" label={t.fatLabel} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 체중 그래프
// ─────────────────────────────────────────────────────────────────────────────
function WeightGraph({ entries, t, weightUnit = "kg" }) {
  if (entries.length < 2) return (
    <div style={{ textAlign:"center", padding:"32px 0", color:"#444", fontSize:13 }}>{t.noGraph}</div>
  );
  const sorted  = [...entries].sort((a,b) => a.date.localeCompare(b.date));
  const weights = sorted.map(e => e.weight);
  const minW = Math.min(...weights) - 1, maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;
  const W=320,H=140,PL=36,PR=12,PT=12,PB=28, gW=W-PL-PR, gH=H-PT-PB;
  const toX = i => PL + (i/(sorted.length-1))*gW;
  const toY = w => PT + (1-(w-minW)/range)*gH;
  const pts  = sorted.map((e,i) => `${toX(i)},${toY(e.weight)}`).join(" ");
  const area = `M${toX(0)},${toY(sorted[0].weight)} `+sorted.slice(1).map((e,i)=>`L${toX(i+1)},${toY(e.weight)}`).join(" ")+` L${toX(sorted.length-1)},${H-PB} L${toX(0)},${H-PB} Z`;
  const last = sorted[sorted.length-1].weight;
  const diff = (last-sorted[0].weight).toFixed(1);
  const dc = diff < 0 ? "#8BA888" : diff > 0 ? "#E87C7C" : "#888";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>{t.weightTrend}</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#F0EBE1", fontFamily:t.fontNumber }}>{last}{weightUnit}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:9, color:"#555", marginBottom:4 }}>{t.startVs}</div>
          <div style={{ fontSize:16, fontWeight:700, color:dc, fontFamily:t.fontNumber }}>{diff>0?"+":""}{diff}{weightUnit}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", overflow:"visible" }}>
        {[0,0.25,0.5,0.75,1].map(t2 => {
          const y=PT+t2*gH;
          return <g key={t2}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#1C1C1C" strokeWidth="1"/><text x={PL-4} y={y+4} textAnchor="end" fill="#888" fontSize="9">{(maxW-t2*range).toFixed(1)}</text></g>;
        })}
        {sorted.map((e,i) => {
          if (sorted.length<=7 || i%Math.ceil(sorted.length/5)===0 || i===sorted.length-1)
            return <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fill="#888" fontSize="8">{e.date.slice(5)}</text>;
          return null;
        })}
        <path d={area} fill="#C9A84C" opacity="0.06"/>
        <polyline points={pts} fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round"/>
        {sorted.map((e,i) => <circle key={i} cx={toX(i)} cy={toY(e.weight)} r="3" fill="#C9A84C" stroke="#0A0A0A" strokeWidth="1.5"/>)}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 소셜 버튼
// ─────────────────────────────────────────────────────────────────────────────
const INSTA_SVG = <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const YT_SVG   = <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;

function SocialButtons({ t }) {
  return (
    <div>
      <div style={{ fontSize:11, color:"#888", textAlign:"center", marginBottom:10, letterSpacing:"0.08em" }}>{t.socialCta}</div>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <a href="instagram://user?username=musclefit_jjoah" onClick={e=>{e.preventDefault();window.location.href="instagram://user?username=musclefit_jjoah";}}
          style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#833AB4,#FD1D1D,#F77737)", borderRadius:10, padding:"10px 16px", textDecoration:"none", cursor:"pointer" }}>
          {INSTA_SVG}
          <span style={{ fontSize:12, fontWeight:700, color:"white" }}>Instagram</span>
        </a>
        <a href="vnd.youtube://www.youtube.com/channel/UC6b4mvYVgT4p33WWweBqaWg" onClick={e=>{e.preventDefault();window.location.href="vnd.youtube://www.youtube.com/channel/UC6b4mvYVgT4p33WWweBqaWg";}}
          style={{ display:"flex", alignItems:"center", gap:7, background:"#FF0000", borderRadius:10, padding:"10px 16px", textDecoration:"none", cursor:"pointer" }}>
          {YT_SVG}
          <span style={{ fontSize:12, fontWeight:700, color:"white" }}>YouTube</span>
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 끼니별 운동일/휴식일 버튼 + 조정된 수치 표시
// ─────────────────────────────────────────────────────────────────────────────
function MealDayToggle({ baseKcal, baseMacros, ratios, kcalRatio, accent, lang, fontNumber, t, toggleFav, isFav }) {
  const [mode, setMode] = useState("workout");

  const adjKcal    = mode==="workout" ? Math.round(baseKcal*1.10) : Math.round(baseKcal*0.90);
  const adjCarbs   = mode==="workout" ? Math.round(baseMacros.carbs*1.20) : Math.round(baseMacros.carbs*0.85);
  const adjProtein = baseMacros.protein;
  const adjFat     = mode==="workout" ? Math.round(baseMacros.fat*0.90) : Math.round(baseMacros.fat*1.10);
  const mKcal = Math.round(adjKcal * kcalRatio);
  const mC    = Math.round(adjCarbs   * ratios.carbs);
  const mP    = Math.round(adjProtein * ratios.protein);
  const mF    = Math.round(adjFat     * ratios.fat);

  const wLabel = lang==="en" ? "Training" : "운동일";
  const rLabel = lang==="en" ? "Rest"     : "휴식일";

  return (
    <div>
      <div style={{ display:"flex", gap:0, marginBottom:14, borderRadius:8, overflow:"hidden", border:`1px solid ${accent}40` }}>
        <button onClick={() => setMode("workout")}
          style={{ flex:1, padding:"10px 8px", border:"none", cursor:"pointer", fontFamily:"inherit",
            fontSize:13, fontWeight:700, transition:"all 0.15s",
            background: mode==="workout" ? accent : "transparent",
            color: mode==="workout" ? "#0A0A0A" : "#666" }}>
          ⚡ {wLabel}
        </button>
        <button onClick={() => setMode("rest")}
          style={{ flex:1, padding:"10px 8px", border:"none", cursor:"pointer", fontFamily:"inherit",
            fontSize:13, fontWeight:700, transition:"all 0.15s",
            background: mode==="rest" ? "#E8A87C" : "transparent",
            color: mode==="rest" ? "#0A0A0A" : "#666",
            borderLeft:`1px solid ${accent}40` }}>
          😴 {rLabel}
        </button>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[
          { l:"kcal", v:mKcal.toLocaleString(), u:"", c:"#C9A84C" },
          { l:lang==="en"?"Carbs":"탄", v:mC, u:"g", c:"#C9A84C" },
          { l:lang==="en"?"Prot":"단",  v:mP, u:"g", c:"#7CB9E8" },
          { l:lang==="en"?"Fat":"지",   v:mF, u:"g", c:"#8BA888" },
        ].map(({ l, v, u, c }) => (
          <div key={l} style={{ flex:1, background:"#161616", borderRadius:8, padding:"10px 6px",
            textAlign:"center", border:`1px solid ${c}25`, minWidth:0 }}>
            <div style={{ fontSize:9, color:"#666", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{l}</div>
            <div style={{ fontSize:15, fontWeight:700, color:c, fontFamily:fontNumber }}>{v}{u}</div>
          </div>
        ))}
      </div>
      <MealFoodPanel mealCarbs={mC} mealProtein={mP} mealFat={mF} mealKcal={mKcal} lang={lang} t={t} toggleFav={toggleFav} isFav={isFav} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LS_LANG) || "ko"; } catch { return "ko"; }
  });
  const t = T[lang];
  const [weightUnit, setWeightUnit] = useState("kg");

  const [form, setForm] = useState(() => {
    try { return { ...FORM_DEFAULT, ...JSON.parse(localStorage.getItem(LS_FORM)||"{}") }; }
    catch { return FORM_DEFAULT; }
  });
  const [result,    setResult]    = useState(null);
  const [page,      setPage]      = useState("home"); // "home"|"diet"|"calendar"|"about"|"about"
  const [activeTab, setActiveTab] = useState("meals");
  const [openMeal,  setOpenMeal]  = useState(null);
  const [openCat,   setOpenCat]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const { toggleFav, isFav }      = useFavorites();
  const resultRef = useRef(null);

  // ── 전역 공유 상태: 완료체크 + 물 섭취 ──
  const todayKey = localDateStr();
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tls_meal_check_v1") || "{}"); } catch { return {}; }
  });
  const [water, setWater] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tls_water_ml_v1") || "{}"); } catch { return {}; }
  });

  function updateChecks(newChecks) {
    setChecks(newChecks);
    try { localStorage.setItem("tls_meal_check_v1", JSON.stringify(newChecks)); } catch {}
  }
  function updateWater(newWater) {
    setWater(newWater);
    try { localStorage.setItem("tls_water_ml_v1", JSON.stringify(newWater)); } catch {}
  }

  const [weightLog, setWeightLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_WEIGHTS)||"[]"); } catch { return []; }
  });
  const today = localDateStr();
  const [calMonth,      setCalMonth]      = useState(() => today.slice(0,7));


  const [inputWeight,   setInputWeight]   = useState("");
  const [selectedDate,  setSelectedDate]  = useState(today);

  const handleSetLang = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem(LS_LANG, l); } catch {}
  }, []);

  const set = useCallback((k, v) => {
    setForm(f => {
      const next = { ...f, [k]:v };
      try { localStorage.setItem(LS_FORM, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // 자정 초기화 — localStorage + React state 동시 초기화
  useEffect(() => {
    function checkMidnight() {
      const now  = localDateStr();
      const last = localStorage.getItem("tls_last_date_v1") || "";
      if (last && last !== now) {
        const empty = {};
        setChecks(empty);
        setWater(empty);
        try {
          localStorage.setItem("tls_meal_check_v1", JSON.stringify(empty));
          localStorage.setItem("tls_water_ml_v1",   JSON.stringify(empty));
        } catch {}
      }
      localStorage.setItem("tls_last_date_v1", now);
    }
    checkMidnight();
    const iv = setInterval(checkMidnight, 60000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 앱 시작 시 저장 폼 → 자동 생성
  useEffect(() => {
    const { age, weight, height, bodyFat, freq, goal, gender, protMult, postWorkoutSlot } = form;
    if (!age || !weight || !height || !bodyFat || !freq) return;
    const savedLang = (() => { try { return localStorage.getItem(LS_LANG)||"ko"; } catch { return "ko"; } })();
    const weightKg  = savedLang==="en" ? +weight*0.453592 : +weight;
    const heightCm  = savedLang==="en" ? +height*2.54     : +height;
    const kcal   = calcTDEE(+age, weightKg, heightCm, +freq, goal, gender);
    const macros = calcMacros(kcal, weightKg, protMult);
    setResult({ kcal, macros, gender, protMult, postWorkoutSlot, weightKg });
    setPage("diet");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    if (!window.confirm(t.resetConfirm)) return;
    localStorage.removeItem(LS_FORM);
    setForm(FORM_DEFAULT);
    setResult(null);
    setPage("home");
  }

  function generate() {
    const { age, weight, height, bodyFat, freq, goal, gender, protMult, postWorkoutSlot } = form;
    if (!age || !weight || !height || !bodyFat || !freq) return;
    const weightKg = lang==="en" ? +weight*0.453592 : +weight;
    const heightCm = lang==="en" ? +height*2.54     : +height;
    const kcal   = calcTDEE(+age, weightKg, heightCm, +freq, goal, gender);
    const macros = calcMacros(kcal, weightKg, protMult);
    setResult({ kcal, macros, gender, protMult, postWorkoutSlot, weightKg });
    setActiveTab("meals"); setOpenMeal(null);
    setPage("diet");
  }

  function saveWeight() {
    if (!inputWeight || isNaN(+inputWeight)) return;
    const updated = weightLog.filter(e=>e.date!==selectedDate).concat({ date:selectedDate, weight:+inputWeight });
    updated.sort((a,b)=>a.date.localeCompare(b.date));
    setWeightLog(updated);
    try { localStorage.setItem(LS_WEIGHTS, JSON.stringify(updated)); } catch {}
    setInputWeight("");
  }
  function deleteWeight(date) {
    const updated = weightLog.filter(e=>e.date!==date);
    setWeightLog(updated);
    try { localStorage.setItem(LS_WEIGHTS, JSON.stringify(updated)); } catch {}
  }

  // 이미지 저장 — 끼니 카드 펼쳐진 상태로 캡처
  async function saveMealImage(mealId) {
    if (saving) return;
    setSaving(true);
    // 해당 끼니 펼치기
    setOpenMeal(mealId);
    await new Promise(r => setTimeout(r, 400)); // 애니메이션 대기
    try {
      const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js");
      const el = document.getElementById(`meal-card-${mealId}`);
      if (!el) { setSaving(false); return; }
      const raw = await html2canvas(el, {
        backgroundColor:"#0A0A0A", scale:2, useCORS:true, logging:false,
        ignoreElements: e => e.dataset && e.dataset.noCapture==="true",
      });
      const canvas = document.createElement("canvas");
      canvas.width=raw.width; canvas.height=raw.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle="#0A0A0A"; ctx.fillRect(0,0,raw.width,raw.height);
      ctx.drawImage(raw,0,0);
      // 워터마크
      await new Promise(res => {
        const img=new Image(); img.crossOrigin="anonymous";
        img.onload=()=>{ const r=img.width/img.height; const w=raw.width*0.42; const h=w/r;
          ctx.globalAlpha=0.07; ctx.drawImage(img,(raw.width-w)/2,(raw.height-h)/2,w,h); ctx.globalAlpha=1; res(); };
        img.onerror=()=>res(); img.src="/logo.jpg";
      });
      const link=document.createElement("a");
      link.download=`TLS_meal${mealId}_${today}.png`;
      link.href=canvas.toDataURL("image/png"); link.click();
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  // 캘린더
  const [calYear, calMonthNum] = calMonth.split("-").map(Number);
  const firstDay    = new Date(calYear, calMonthNum-1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthNum, 0).getDate();
  const calCells = [];
  for (let i=0; i<firstDay; i++) calCells.push(null);
  for (let d=1; d<=daysInMonth; d++) calCells.push(d);
  function prevMonth() { const d=new Date(calYear,calMonthNum-2,1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }
  function nextMonth() { const d=new Date(calYear,calMonthNum,  1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }

  const gold="#C9A84C", bg="#0A0A0A", card="#111111", line="#1C1C1C";
  const dim="#888", muted="#AAA", soft="#CCC", fg="#E8E4DC";

  const meals = result ? getMeals(result.postWorkoutSlot, t) : [];

  // 슬라이드 헬퍼
  function slideStyle(target) {
    const isActive = page === target;
    const order = ["home","diet","calendar","about"];
    const curIdx = order.indexOf(page);
    const tarIdx = order.indexOf(target);
    const isLeft = tarIdx < curIdx;
    return {
      transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
      transform: isActive ? "translateX(0)" : isLeft ? "translateX(-100%)" : "translateX(100%)",
      opacity: isActive ? 1 : 0,
      pointerEvents: isActive ? "auto" : "none",
      position: isActive ? "relative" : "absolute",
      top:0, left:0, width:"100%", boxSizing:"border-box",
    };
  }

  return (
    <div style={{ minHeight:"100vh", background:bg, color:fg, fontFamily:t.fontBody, overflowX:"hidden", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(/logo.jpg)", backgroundSize:"50%", backgroundPosition:"center", backgroundRepeat:"no-repeat", opacity:0.04, pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:560, margin:"0 auto", padding:"0 20px 80px", boxSizing:"border-box" }}>

        {/* ── 헤더 (항상 표시) ── */}
        <div style={{ paddingTop:40, marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <LangToggle lang={lang} setLang={handleSetLang} />
          </div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <div style={{ position:"relative", width:120, height:120 }}>
              <img src="/logo.jpg" alt="TLS" style={{ width:"100%", height:"100%", borderRadius:20, objectFit:"cover", border:`1px solid ${line}`, display:"block" }} />
              <div style={{ position:"absolute", inset:-1, borderRadius:20, boxShadow:`0 0 32px ${gold}22`, pointerEvents:"none" }} />
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, letterSpacing:"0.35em", color:muted, textTransform:"uppercase", marginBottom:8 }}>The Last Set</div>
            <h1 style={{ fontSize:38, fontWeight:400, lineHeight:1.2, margin:"0 0 8px", color:fg, letterSpacing:lang==="en"?"0.05em":"0.15em", fontFamily:t.fontBody }}>
              {t.appTitle}
            </h1>
            <div style={{ width:40, height:1, background:gold, margin:"12px auto", opacity:0.5 }} />
            <p style={{ fontSize:13, color:soft, margin:0, whiteSpace:"pre-line", lineHeight:1.8 }}>{t.appDesc}</p>
            <div style={{ marginTop:16 }}><SocialButtons t={t} /></div>
          </div>
        </div>

        {/* ── 탭 네비게이션 (항상 표시) ── */}
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {[{ id:"diet", label:t.tabDiet }, { id:"calendar", label:t.tabCalendar }].map(({ id, label }) => {
            const active = id==="diet" ? (page==="home"||page==="diet") : page==="calendar";
            return (
              <button key={id} onClick={() => setPage(id==="diet" ? (result?"diet":"home") : "calendar")}
                style={{ flex:1, padding:"12px", borderRadius:8, cursor:"pointer", fontFamily:"inherit",
                  border:`1px solid ${active?gold:line}`, background:active?"#1A1408":card,
                  color:active?gold:dim, fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", transition:"all 0.18s" }}>
                {label}
              </button>
            );
          })}
          <button onClick={() => setPage("about")}
            style={{ padding:"12px 14px", borderRadius:8, cursor:"pointer", fontFamily:"inherit",
              border:`1px solid ${page==="about"?"#7CB9E8":line}`,
              background: page==="about" ? "#080D14" : card,
              color: page==="about" ? "#7CB9E8" : dim,
              fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", transition:"all 0.18s", flexShrink:0 }}>
            {lang==="en" ? "About" : "소개"}
          </button>
        </div>

        {/* ════════════ 슬라이드 컨테이너 ════════════ */}
        <div style={{ position:"relative", overflow:"hidden" }}>

          {/* ── HOME: 입력 폼 ── */}
          <div style={slideStyle("home")}>
            <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"28px 22px", marginBottom:24 }}>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:10, color:"#333", letterSpacing:"0.08em" }}>{t.autoSaved}</div>
                <button onClick={resetForm} style={{ fontSize:11, color:dim, background:"transparent", border:`1px solid ${line}`, borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit" }}>{t.reset}</button>
              </div>

              {/* 성별 */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:10 }}>{t.gender}</div>
                <div style={{ display:"flex", gap:10 }}>
                  {[{v:"male",l:t.male,i:"♂",n:"BMR +5"},{v:"female",l:t.female,i:"♀",n:"BMR −161"}].map(({v,l,i,n})=>(
                    <button key={v} onClick={()=>set("gender",v)}
                      style={{ flex:1, padding:"13px 8px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                        background:form.gender===v?gold:bg, color:form.gender===v?"#0A0A0A":soft,
                        border:`1px solid ${form.gender===v?gold:line}` }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{i}</div>
                      <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.05em" }}>{l}</div>
                      <div style={{ fontSize:10, marginTop:2, opacity:0.65 }}>{n}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 수치 입력 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
                {[
                  { key:"age",     label:t.age,     unit:lang==="en"?"yrs":"세",  ph:`예) ${t.phAge}`     },
                  { key:"weight",  label:t.weight,  unit:lang==="en"?"lbs":"kg",  ph:`예) ${t.phWeight}`  },
                  { key:"height",  label:t.height,  unit:lang==="en"?"in":"cm",   ph:`예) ${t.phHeight}`  },
                  { key:"bodyFat", label:t.bodyFat, unit:"%",                     ph:`예) ${t.phBodyFat}` },
                  { key:"freq",    label:t.freq,    unit:lang==="en"?"x":"회",    ph:`예) ${t.phFreq}`    },
                ].map(({key,label,unit,ph})=>(
                  <div key={key} style={{ gridColumn:key==="freq"?"span 2":"span 1", minWidth:0 }}>
                    <div style={{ fontSize:9, letterSpacing:"0.15em", color:muted, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
                    <div style={{ display:"flex", alignItems:"center", background:bg, border:`1px solid ${line}`, borderRadius:8, overflow:"hidden" }}>
                      <input type="number" value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                        style={{ flex:1, background:"transparent", border:"none", color:fg, padding:"13px 12px", fontSize:14, outline:"none", fontFamily:"inherit", minWidth:0 }} />
                      <span style={{ fontSize:11, color:dim, padding:"0 12px", flexShrink:0 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 단백질 배수 */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:10 }}>{t.protTarget}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {PROT_MULTIPLIERS.map(({value,label},idx)=>(
                    <button key={value} onClick={()=>set("protMult",value)}
                      style={{ flex:1, padding:"10px 4px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                        background:form.protMult===value?"#0D1A2A":bg, color:form.protMult===value?"#7CB9E8":dim,
                        border:`1px solid ${form.protMult===value?"#7CB9E8":line}` }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>{label}</div>
                      <div style={{ fontSize:9, marginTop:2, opacity:0.7 }}>{t.protDescs[idx]}</div>
                    </button>
                  ))}
                </div>
                {form.weight && <div style={{ fontSize:12, color:dim, marginTop:8 }}>{t.protGoal(Math.round(+form.weight*form.protMult))}</div>}
              </div>

              {/* 운동 후 끼니 */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:10 }}>{t.postWorkout}</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2,3,4].map(n=>(
                    <button key={n} onClick={()=>set("postWorkoutSlot",n)}
                      style={{ flex:1, padding:"12px 6px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                        background:form.postWorkoutSlot===n?"#0A1808":bg, color:form.postWorkoutSlot===n?"#A8D8A8":dim,
                        border:`1px solid ${form.postWorkoutSlot===n?"#A8D8A8":line}` }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>⚡</div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{n}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:dim, marginTop:8 }}>{t.postWorkoutDesc(form.postWorkoutSlot)}</div>
              </div>

              {/* 목표 */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:10 }}>{t.goalLabel}</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[{v:"cut",l:t.cut,s:t.cutSub},{v:"maintain",l:t.maintain,s:t.maintainSub},{v:"bulk",l:t.bulk,s:t.bulkSub}].map(({v,l,s})=>(
                    <button key={v} onClick={()=>set("goal",v)}
                      style={{ flex:1, padding:"13px 8px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                        background:form.goal===v?gold:bg, color:form.goal===v?"#0A0A0A":soft,
                        border:`1px solid ${form.goal===v?gold:line}` }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{l}</div>
                      <div style={{ fontSize:11, marginTop:3, opacity:0.7 }}>{s}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={generate}
                style={{ width:"100%", background:gold, color:"#0A0A0A", border:"none", borderRadius:8,
                  padding:16, fontSize:13, fontWeight:700, letterSpacing:"0.1em",
                  cursor:"pointer", fontFamily:"inherit", textTransform:"uppercase" }}>
                {t.generate}
              </button>
              <div style={{ display:"flex", justifyContent:"center", marginTop:14 }}>
                <LangToggle lang={lang} setLang={handleSetLang} />
              </div>
            </div>
          </div>{/* END HOME */}

          {/* ── DIET: 결과 페이지 ── */}
          <div style={slideStyle("diet")}>
            {/* 뒤로가기 + 날짜 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <button onClick={()=>setPage("home")}
                style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:`1px solid ${line}`,
                  color:dim, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                ← {lang==="en" ? "Back to Form" : "입력으로 돌아가기"}
              </button>
              <div style={{ fontSize:11, color:dim, letterSpacing:"0.05em" }}>{today}</div>
            </div>

            {result && (
              <div ref={resultRef}>
                {/* 칼로리 요약 */}
                <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"26px 22px", marginBottom:20 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                    <div style={{ background:result.gender==="male"?"#0A1420":"#1A0A1A", border:`1px solid ${result.gender==="male"?"#1E4060":"#601E40"}`, borderRadius:4, padding:"4px 12px", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:result.gender==="male"?"#7CB9E8":"#E87CB9" }}>
                      {result.gender==="male"?t.maleLabel:t.femaleLabel}
                    </div>
                    <div style={{ background:"#0A1208", border:"1px solid #1E3020", borderRadius:4, padding:"4px 12px", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"#8BA888" }}>Protein ×{result.protMult}</div>
                    <div style={{ background:"#0A1208", border:"1px solid #A8D8A822", borderRadius:4, padding:"4px 12px", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A8D8A8" }}>⚡ Meal {result.postWorkoutSlot}</div>
                  </div>
                  <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:8 }}>{t.dailyTarget}</div>
                  <div style={{ fontSize:44, fontWeight:700, color:gold, lineHeight:1, letterSpacing:"0.02em", marginBottom:4, fontFamily:t.fontNumber }}>
                    {result.kcal.toLocaleString()}<span style={{ fontSize:16, marginLeft:6, color:dim, fontWeight:400 }}>kcal</span>
                  </div>
                  <div style={{ display:"flex", gap:2, marginTop:18, borderRadius:4, overflow:"hidden", height:5 }}>
                    <div style={{ width:`${result.macros.carbPct}%`, background:gold }} />
                    <div style={{ width:`${result.macros.protPct}%`, background:"#7CB9E8" }} />
                    <div style={{ width:`${result.macros.fatPct}%`,  background:"#8BA888" }} />
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    {[
                      {label:t.carbs,  g:result.macros.carbs,   kcal:result.macros.carbKcal, color:gold,      pct:result.macros.carbPct},
                      {label:t.protein,g:result.macros.protein, kcal:result.macros.protKcal, color:"#7CB9E8", pct:result.macros.protPct},
                      {label:t.fat,    g:result.macros.fat,     kcal:result.macros.fatKcal,  color:"#8BA888", pct:result.macros.fatPct},
                    ].map(({label,g,kcal,color,pct})=>(
                      <div key={label} style={{ flex:1, background:bg, borderRadius:8, padding:"14px 10px", borderTop:`2px solid ${color}`, minWidth:0 }}>
                        <div style={{ fontSize:9, color:muted, marginBottom:5, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label} {pct}%</div>
                        <div style={{ fontSize:18, fontWeight:700, color, fontFamily:t.fontNumber }}>{g}g</div>
                        <div style={{ fontSize:10, color:dim, marginTop:3 }}>{kcal} kcal</div>
                      </div>
                    ))}
                  </div>
                  {/* BMI */}
                  {(()=>{
                    const bmi=calcBMI(+form.weight, lang==="en"?+form.height*2.54:+form.height);
                    if (!bmi) return null;
                    const cat=getBMICategory(bmi,t);
                    const pct=Math.min(Math.max((bmi-15)/(40-15)*100,0),100);
                    return (
                      <div style={{ marginTop:12, background:bg, borderRadius:8, padding:"14px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ fontSize:9, color:muted, letterSpacing:"0.15em", textTransform:"uppercase" }}>{t.bmiLabel}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:16, fontWeight:700, color:cat.color, fontFamily:t.fontNumber }}>{bmi}</span>
                            <span style={{ fontSize:10, color:cat.color, background:`${cat.color}18`, padding:"2px 8px", borderRadius:4 }}>{cat.label}</span>
                          </div>
                        </div>
                        <div style={{ height:4, background:"#1A1A1A", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:cat.color, transition:"width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })()}
                  {/* 성별 포인트 */}
                  <div style={{ marginTop:12, background:bg, borderRadius:8, padding:"14px 16px", borderLeft:`2px solid ${result.gender==="male"?"#7CB9E822":"#E87CB922"}` }}>
                    <div style={{ fontSize:9, color:muted, marginBottom:5, letterSpacing:"0.15em", textTransform:"uppercase" }}>{result.gender==="male"?t.maleFocus:t.femaleFocus}</div>
                    <p style={{ fontSize:12, color:soft, lineHeight:1.75, margin:0 }}>{result.gender==="male"?t.maleTip:t.femaleTip}</p>
                  </div>
                </div>

                {/* 운동일/휴식일 조정 */}
                <DayTypeAdjuster result={result} lang={lang} fontNumber={t.fontNumber} />
                {/* 물 섭취 */}
                <WaterTracker result={result} lang={lang} fontNumber={t.fontNumber}
                  water={water} updateWater={updateWater} />
                {/* 오늘의 요약 */}
                <TodaySummary result={result} lang={lang} fontNumber={t.fontNumber}
                  checks={checks} water={water} updateChecks={updateChecks} updateWater={updateWater} />

                {/* 서브 탭 */}
                <div style={{ display:"flex", gap:6, marginBottom:20 }}>
                  {[{id:"meals",label:t.subMeals},{id:"macros",label:t.subMacros}].map(({id,label})=>(
                    <button key={id} onClick={()=>setActiveTab(id)}
                      style={{ flex:1, padding:"12px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s",
                        border:`1px solid ${activeTab===id?gold:line}`, background:activeTab===id?"#1A1408":card,
                        color:activeTab===id?gold:dim, fontSize:11, fontWeight:activeTab===id?700:400,
                        letterSpacing:"0.08em", textTransform:"uppercase" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* 끼니별 탭 */}
                {activeTab==="meals" && (
                  <div>

                    {/* 끼니 카드 */}
                    {meals.map(meal => {
                      const open = openMeal === meal.id;
                      return (
                        <div key={meal.id} id={`meal-card-${meal.id}`}
                          style={{ background:card, border:`1px solid ${meal.isPostWorkout?"#A8D8A822":line}`, borderLeft:`2px solid ${meal.accent}`, borderRadius:12, marginBottom:12, overflow:"hidden" }}>

                          {/* 완료 체크 + 상세보기 + 저장 버튼 */}
                          <div data-no-capture="true" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 16px", borderBottom:`1px solid ${line}`, gap:8 }}>
                            <MealCheckButton mealIndex={meal.id-1} lang={lang}
                              checks={checks} updateChecks={updateChecks} />
                            <button onClick={()=>setOpenMeal(open?null:meal.id)}
                              style={{ fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                                background: open ? `${meal.accent}22` : "#1A1A1A",
                                color: open ? meal.accent : "#888",
                                border:`1px solid ${open ? meal.accent+"44" : line}`, flexShrink:0 }}>
                              {open ? (lang==="en"?"▲ Close":"▲ 닫기") : (lang==="en"?"▼ Details":"▼ 상세보기")}
                            </button>
                            <button onClick={()=>saveMealImage(meal.id)} disabled={saving}
                              style={{ background:"transparent", border:"none", cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", flexShrink:0 }}>
                              <span style={{ fontSize:10, color:meal.isPostWorkout?"#A8D8A8":meal.accent, letterSpacing:"0.06em" }}>
                                {saving?t.saving:t.saveMeal(meal.label)}
                              </span>
                            </button>
                          </div>

                          {/* 헤더 */}
                          <button onClick={()=>setOpenMeal(open?null:meal.id)}
                            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              <div style={{ width:42, height:42, borderRadius:8, background:bg, border:`1px solid ${meal.accent}44`, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1, padding:4 }}>
                                {meal.icon==="★★★★★" ? (<><div style={{ fontSize:11, color:"#F5C842", lineHeight:1, letterSpacing:1 }}>★★</div><div style={{ fontSize:11, color:"#F5C842", lineHeight:1, letterSpacing:1 }}>★★★</div></>) : (<div style={{ fontSize:meal.icon.length<=2?13:11, color:"#F5C842", lineHeight:1, letterSpacing:1 }}>{meal.icon}</div>)}
                              </div>
                              <div style={{ textAlign:"left" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:fg }}>{meal.label}</div>
                              </div>
                            </div>
                            <div style={{ fontSize:16, color:dim, transform:open?"rotate(90deg)":"none", transition:"transform 0.2s" }}>›</div>
                          </button>

                          {/* 펼쳐진 내용 */}
                          {open && (
                            <div style={{ borderTop:`1px solid ${line}` }}>
                              <div style={{ margin:"14px 20px 0", background:bg, borderRadius:8, padding:"12px 14px", borderLeft:`2px solid ${meal.accent}44` }}>
                                <div style={{ fontSize:9, color:muted, marginBottom:5, letterSpacing:"0.15em", textTransform:"uppercase" }}>{meal.isPostWorkout?t.postWorkoutGuide:t.mealGuide}</div>
                                <p style={{ fontSize:12, color:soft, lineHeight:1.8, margin:0 }}>{meal.tip}</p>
                              </div>

                              {/* 운동일/휴식일 토글 + 끼니별 수치 자동 조정 */}
                              <div style={{ margin:"14px 20px 0" }}>
                                <MealDayToggle
                                  baseKcal={result.kcal}
                                  baseMacros={result.macros}
                                  ratios={meal.ratios}
                                  kcalRatio={meal.kcalRatio}
                                  accent={meal.accent}
                                  lang={lang}
                                  fontNumber={t.fontNumber}
                                  t={t}
                                  toggleFav={toggleFav}
                                  isFav={isFav} />
                              </div>
                              <div style={{ height:20 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 영양소별 탭 */}
                {activeTab==="macros" && (
                  <div>
                    {["carbs","protein","fat"].map(key=>{
                      const meta=CAT_COLOR[key]; const isOpen=openCat===key;
                      const totalG=key==="carbs"?result.macros.carbs:key==="protein"?result.macros.protein:result.macros.fat;
                      const catLabel=key==="carbs"?t.carbs:key==="protein"?t.protein:t.fat;
                      return (
                        <div key={key} style={{ background:card, border:`1px solid ${line}`, borderRadius:12, marginBottom:12, overflow:"hidden" }}>
                          <button onClick={()=>setOpenCat(isOpen?null:key)}
                            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              <div style={{ width:36, height:36, background:meta.bg, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, border:`1px solid ${meta.color}18`, flexShrink:0 }}>{meta.icon}</div>
                              <div style={{ textAlign:"left" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:meta.color }}>{catLabel}</div>
                                <div style={{ fontSize:10, color:dim, marginTop:2 }}>{t.selectCount}</div>
                              </div>
                            </div>
                            <div style={{ fontSize:16, color:dim, transform:isOpen?"rotate(90deg)":"none", transition:"transform 0.2s" }}>›</div>
                          </button>
                          {isOpen && (
                            <div style={{ borderTop:`1px solid ${line}`, padding:"14px 20px 18px" }}>
                              <FoodSelector category={key} targetG={totalG} color={meta.color} lang={lang} toggleFav={toggleFav} isFav={isFav} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>{/* END DIET */}

          {/* ── CALENDAR: 나의 기록 ── */}
          <div style={slideStyle("calendar")}>
            {/* 식단 페이지로 돌아가기 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <button onClick={()=>setPage(result?"diet":"home")}
                style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:`1px solid ${line}`,
                  color:dim, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                ← {lang==="en" ? "Back to Diet" : "식단으로 돌아가기"}
              </button>
              <div style={{ fontSize:11, color:dim }}>{today}</div>
            </div>
            {/* 공유 카드 */}
            {/* 진행률 대시보드 */}
            <ProgressDashboard weightLog={weightLog} lang={lang} fontNumber={t.fontNumber} weightUnitDisplay={lang==="en"?weightUnit:"kg"} />
            <ShareCard weightLog={weightLog} result={result} lang={lang} fontNumber={t.fontNumber} fontBody={t.fontBody}
              checks={checks} water={water} updateChecks={updateChecks} updateWater={updateWater} />
            {/* 캘린더 */}
            <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"22px 20px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <button onClick={prevMonth} style={{ background:"transparent", border:`1px solid ${line}`, color:soft, borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>‹</button>
                <div style={{ fontSize:14, fontWeight:700, color:fg }}>{calYear}. {String(calMonthNum).padStart(2,"0")}</div>
                <button onClick={nextMonth} style={{ background:"transparent", border:`1px solid ${line}`, color:soft, borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>›</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:6 }}>
                {t.days.map((d,i)=><div key={d} style={{ textAlign:"center", fontSize:10, color:i===0?"#E87C7C":i===6?"#7CB9E8":muted, padding:"4px 0" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                {calCells.map((d,idx)=>{
                  if (!d) return <div key={idx}/>;
                  const dateStr=`${calMonth}-${String(d).padStart(2,"0")}`;
                  const entry=weightLog.find(e=>e.date===dateStr);
                  const isToday=dateStr===today, isSel=dateStr===selectedDate;
                  return (
                    <button key={idx} onClick={()=>{ setSelectedDate(dateStr); setInputWeight(entry?String(entry.weight):""); }}
                      style={{ aspectRatio:"1", padding:"4px 2px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:44,
                        background:isSel?gold:isToday?"#1A1408":"transparent", color:isSel?"#0A0A0A":isToday?gold:fg,
                        border:`1px solid ${isSel?gold:isToday?gold+"44":line}` }}>
                      <div style={{ fontSize:12, fontWeight:isSel||isToday?700:400 }}>{d}</div>
                      {entry && <div style={{ fontSize:9, color:isSel?"#0A0A0A99":"#8BA888", marginTop:1, fontWeight:600 }}>{entry.weight}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* 체중 입력 */}
            <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"22px 20px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase" }}>{t.weightInput(selectedDate)}</div>
                {lang==="en" && (
                  <div style={{ display:"flex", gap:6 }}>
                    {["kg","lbs"].map(u=>(
                      <button key={u} onClick={()=>setWeightUnit(u)}
                        style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:weightUnit===u?700:400, transition:"all 0.15s",
                          background:weightUnit===u?gold:"transparent", color:weightUnit===u?"#0A0A0A":dim,
                          border:`1px solid ${weightUnit===u?gold:line}` }}>
                        {u.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", background:bg, border:`1px solid ${line}`, borderRadius:8, overflow:"hidden" }}>
                  <input type="number" step="0.1" value={inputWeight} onChange={e=>setInputWeight(e.target.value)} placeholder={t.weightPlaceholder}
                    style={{ flex:1, background:"transparent", border:"none", color:fg, padding:"13px 12px", fontSize:16, outline:"none", fontFamily:"inherit", minWidth:0 }} />
                  <span style={{ fontSize:12, color:dim, padding:"0 14px", flexShrink:0 }}>{lang==="en"?weightUnit:"kg"}</span>
                </div>
                <button onClick={saveWeight}
                  style={{ background:gold, color:"#0A0A0A", border:"none", borderRadius:8, padding:"0 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>{t.save}</button>
              </div>
            </div>
            {/* Weight Trend */}
            <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"22px 20px", marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:16 }}>{t.weightTrend}</div>
              <WeightGraph entries={weightLog} t={t} weightUnit={lang==="en"?weightUnit:"kg"} />
            </div>
            {/* 기록 목록 */}
            {weightLog.length > 0 && (
              <div style={{ background:card, border:`1px solid ${line}`, borderRadius:16, padding:"22px 20px", marginBottom:16 }}>
                <div style={{ fontSize:9, letterSpacing:"0.2em", color:muted, textTransform:"uppercase", marginBottom:14 }}>{t.recordList}</div>
                <div style={{ maxHeight:280, overflowY:"auto" }}>
                  {[...weightLog].sort((a,b)=>b.date.localeCompare(a.date)).map((entry,i,arr)=>{
                    const prev=arr[i+1];
                    const diff=prev?(entry.weight-prev.weight).toFixed(1):null;
                    const dc=diff<0?"#8BA888":diff>0?"#E87C7C":"#666";
                    return (
                      <div key={entry.date} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${line}`:"none" }}>
                        <div>
                          <div style={{ fontSize:13, color:fg }}>{entry.date}</div>
                          {diff!==null && <div style={{ fontSize:10, color:dc, marginTop:2 }}>{diff>0?"+":""}{diff}kg {t.prevDay}</div>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ fontSize:18, fontWeight:700, color:gold, fontFamily:t.fontNumber }}>{entry.weight}{lang==="en"?weightUnit:"kg"}</div>
                          <button onClick={()=>deleteWeight(entry.date)} style={{ background:"transparent", border:`1px solid ${line}`, color:dim, borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>{/* END CALENDAR */}

          {/* ── ABOUT: 선수 소개 ── */}
          <div style={slideStyle("about")}>
            {/* 뒤로가기 */}
            <button onClick={() => setPage(result ? "diet" : "home")}
              style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:`1px solid ${line}`,
                color:dim, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:12, marginBottom:16 }}>
              ← {lang==="en" ? "Back" : "뒤로가기"}
            </button>

            {/* 히어로 사진 */}
            <div style={{ position:"relative", borderRadius:16, overflow:"hidden", marginBottom:20, border:`1px solid ${line}` }}>
              <img src="/profile.jpg" alt="좌용관" style={{ width:"100%", display:"block", objectFit:"cover", objectPosition:"center top", maxHeight:480 }} />
              {/* 그라디언트 오버레이 */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60%",
                background:"linear-gradient(to top, #0A0A0A 0%, transparent 100%)" }} />
              {/* 이름 오버레이 */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"24px 20px" }}>
                <div style={{ fontSize:11, letterSpacing:"0.3em", color:"#AAA", textTransform:"uppercase", marginBottom:6 }}>
                  NPCA ASIA PRO · ICN PRO
                </div>
                <div style={{ fontSize:32, fontWeight:700, color:"#F0EBE1", letterSpacing:"-0.01em", lineHeight:1.1 }}>
                  좌용관
                </div>
                <div style={{ fontSize:16, color:"#C9A84C", letterSpacing:"0.1em", marginTop:4 }}>
                  JWA YONG GWAN
                </div>
              </div>
            </div>

            {/* 시합 경력 */}
            <div style={{ background:card, border:`1px solid ${line}`, borderRadius:14, padding:"20px 20px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:4, height:22, borderRadius:2, background:"#C9A84C", flexShrink:0 }} />
                <div style={{ fontSize:18, fontWeight:700, color:"#F0EBE1" }}>{lang==="en" ? "Competition Record" : "시합 경력"}</div>
              </div>

              {[
                { year:"2026", items:[
                  { name:"WNGP 오산 피지크", result:"그랑프리 🏆", color:"#C9A84C", highlight:true },
                  { name:"몬스터짐 × 블랙크롬 피지크 B클래스", result:"1위 🥇", color:"#C9A84C", highlight:true },
                ]},
                { year:"2025", items:[
                  { name:"ICN SEOUL 피지크", result:"그랑프리 🏆", badge:"PRO CARD", color:"#C9A84C", highlight:true },
                  { name:"PCA 광주 피지크", result:"1위 🥇", color:"#C9A84C", highlight:false },
                  { name:"WNGP BOB", result:"4위", color:"#888", highlight:false },
                ]},
                { year:"2024", items:[
                  { name:"내추럴 프로 퀄리파이어", result:"써드콜", color:"#888", highlight:false },
                  { name:"MONSTERGYM 피지크", result:"4위", color:"#888", highlight:false },
                ]},
                { year:"2023", items:[
                  { name:"NPCA 아시아 챔피언십 프로전", result:"우승 🏆", badge:"ASIA PRO", color:"#7CB9E8", highlight:true },
                  { name:"NABBA AOC 버뮤다모델", result:"3위 🥉", color:"#8BA888", highlight:false },
                  { name:"PCA 피지크", result:"3위 🥉", color:"#8BA888", highlight:false },
                ]},
                { year:"2022", items:[
                  { name:"NPCA 피지크", result:"그랑프리 🏆", badge:"KOREA PRO", color:"#C9A84C", highlight:true },
                  { name:"NPCA 경북 피지크", result:"그랑프리 🏆", color:"#C9A84C", highlight:false },
                  { name:"NPCA 전북 피지크", result:"그랑프리 🏆", color:"#C9A84C", highlight:false },
                  { name:"ICN 피지크", result:"2위 🥈", color:"#AAA", highlight:false },
                ]},
                { year:"2021", items:[
                  { name:"PCA 피지크", result:"4위", color:"#888", highlight:false },
                ]},
                { year:"2018", items:[
                  { name:"피트니스스타 피지크", result:"6위", color:"#888", highlight:false },
                ]},
                { year:"2017", items:[
                  { name:"미스터 군산 -175cm 피지크", result:"병풍", color:"#888", highlight:false },
                ]},
                { year:"2014", items:[
                  { name:"미스터 제주 -65kg", result:"병풍", color:"#888", highlight:false },
                ]},
              ].map(({ year, items }) => (
                <div key={year} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#555", letterSpacing:"0.15em", fontWeight:700, marginBottom:8, borderBottom:`1px solid #1A1A1A`, paddingBottom:6 }}>
                    {year}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {items.map(({ name, result, badge, color, highlight }, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        background: highlight ? `${color}10` : "transparent",
                        border: highlight ? `1px solid ${color}30` : "1px solid transparent",
                        borderRadius:8, padding: highlight ? "10px 12px" : "6px 4px" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize: highlight ? 13 : 12, color: highlight ? "#F0EBE1" : "#888", fontWeight: highlight ? 600 : 400, lineHeight:1.4 }}>{name}</div>
                          {badge && (
                            <div style={{ fontSize:10, color:"#7CB9E8", background:"#0D1826", borderRadius:4, padding:"2px 8px", marginTop:4, display:"inline-block", letterSpacing:"0.1em" }}>
                              {badge}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: highlight ? 14 : 12, fontWeight: highlight ? 700 : 400, color, marginLeft:12, flexShrink:0 }}>{result}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 프로 카드 배지 */}
            <div style={{ background:"#0A1408", border:"1px solid #2A4A1A", borderRadius:14, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#8BA888", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:12 }}>
                {lang==="en" ? "Pro Card Holder" : "프로 카드 보유"}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {["NPCA KOREA PRO", "NPCA ASIA PRO", "ICN PRO"].map(badge => (
                  <div key={badge} style={{ flex:1, background:"#1A3A1A", border:"1px solid #3A6A3A", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#8BA888", letterSpacing:"0.03em", lineHeight:1.3 }}>{badge}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TLS 텍스트 로고 */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:14, padding:"8px 0" }}>
              <img src="/tls-logo-text.png" alt="The Last Set"
                style={{ width:"65%", maxWidth:300, opacity:0.75 }} />
            </div>

            {/* 올인원 워시 홍보 */}
            <div style={{ background:"#0A1008", border:"1px solid #C9A84C44", borderRadius:12, padding:"16px 20px", marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#C9A84C", letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:6, fontWeight:600 }}>Coming July 2026</div>
              <div style={{ fontSize:17, fontWeight:700, color:"#F0EBE1", marginBottom:6 }}>
                {lang==="en" ? "All-in-One Wash" : "올인원 워시 — 7월 정식 런칭"}
              </div>
              <div style={{ fontSize:13, color:"#888", lineHeight:1.7 }}>
                {lang==="en" ? "Shower. Recover. Repeat. One product does it all." : "운동 끝난 그 순간부터\n샤워·케어·회복까지 단 하나로."}
              </div>
            </div>

            {/* TLS 온라인 PT 신청 버튼 */}
            <a href="https://forms.gle/61TB4zdSjzh3iM2N7"
              onClick={e => { e.preventDefault(); window.open("https://forms.gle/61TB4zdSjzh3iM2N7", "_blank"); }}
              style={{ display:"block", textDecoration:"none", marginBottom:8 }}>
              <div style={{ background:"linear-gradient(135deg, #C9A84C, #F5C842)", borderRadius:12, padding:"18px 20px",
                display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:11, color:"#0A0A0A", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:4, fontWeight:600, opacity:0.7 }}>
                    {lang==="en" ? "Personal Training" : "퍼스널 트레이닝"}
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, color:"#0A0A0A", letterSpacing:"0.02em" }}>
                    {lang==="en" ? "Apply for TLS Online PT" : "TLS 온라인 PT 신청"}
                  </div>
                  <div style={{ fontSize:12, color:"#0A0A0A", opacity:0.65, marginTop:4 }}>
                    {lang==="en" ? "Fill out the application form →" : "신청서 작성하기 →"}
                  </div>
                </div>
                <div style={{ width:48, height:48, borderRadius:12, background:"rgba(0,0,0,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#0A0A0A">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6zm2-5h8v1H8v-1zm0-3h8v1H8v-1zm0-3h5v1H8v-1z"/>
                  </svg>
                </div>
              </div>
            </a>
            {/* 작성 후 DM 필수 안내 */}
            <div style={{ textAlign:"center", fontSize:12, color:"#C9A84C", fontWeight:700,
              letterSpacing:"0.08em", marginBottom:16, padding:"8px 0",
              borderTop:"1px solid #C9A84C33", borderBottom:"1px solid #C9A84C33" }}>
              {lang==="en" ? "⚠ DM required after submission" : "⚠ 작성 후 DM 필수"}
            </div>

          </div>{/* END ABOUT */}

        </div>{/* END SLIDE CONTAINER */}

        {/* 하단 소셜 + 저작권 */}
        <div style={{ borderTop:`1px solid ${line}`, marginTop:12, padding:"24px 0 16px", textAlign:"center" }}>
          <SocialButtons t={t} />
          <div style={{ fontSize:10, color:"#444", letterSpacing:"0.15em", marginTop:16 }}>{t.copyright}</div>
        </div>

      </div>
    </div>
  );
}
