import React, { useMemo, useRef, useState } from "react";

// ========= Types =========
type Participant = {
  id: string;
  name: string;
  family: boolean;
  owner: boolean;
  mgmt: boolean;
};

type Layout = {
  onlyF: Participant[];
  onlyO: Participant[];
  onlyM: Participant[];
  fAndO: Participant[];
  fAndM: Participant[];
  oAndM: Participant[];
  all: Participant[];
};

// ========= Utilities =========
const genId = (() => {
  let i = 0;
  return () => `id_${Date.now().toString(36)}_${i++}`;
})();

// 3つの円のサイズ/座標
const WIDTH = 900;
const HEIGHT = 720;
const OFFSET_X = 30; // 全体の微調整（左右）
const OFFSET_Y = 0;  // 全体の微調整（上下）

const R = 210;
const CX = 320;
const CY = 300;

const R2 = 210;
const CX2 = 500;
const CY2 = 300;

const R3 = 260;
const CX3 = 440;
const CY3 = 480;

// ========= 分類ロジック =========
function classify(people: Participant[]): Layout {
  const out: Layout = {
    onlyF: [],
    onlyO: [],
    onlyM: [],
    fAndO: [],
    fAndM: [],
    oAndM: [],
    all: [],
  };

  for (const p of people) {
    const f = p.family;
    const o = p.owner;
    const m = p.mgmt;

    const s = (x: boolean) => (x ? 1 : 0);
    const sum = s(f) + s(o) + s(m);

    if (sum === 3) out.all.push(p);
    else if (sum === 2) {
      if (f && o) out.fAndO.push(p);
      else if (f && m) out.fAndM.push(p);
      else if (o && m) out.oAndM.push(p);
    } else if (sum === 1) {
      if (f) out.onlyF.push(p);
      else if (o) out.onlyO.push(p);
      else out.onlyM.push(p);
    }
  }
  return out;
}

// ========= 領域ボックス =========
const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};
const itemStyle: React.CSSProperties = {
  fontSize: 13,
};

function regionBox(
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  items: Participant[]
) {
  return (
    <g key={`${title}-${x}-${y}`}>
      <foreignObject x={x} y={y} width={w} height={h} style={{ overflow: "hidden" }}>
        <div
          style={{
            fontFamily:
              "'Noto Sans JP','IPAPGothic','Meiryo',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
          xmlns="http://www.w3.org/1999/xhtml"
        >
          <div style={labelStyle}>{title}</div>
          {items.length > 0 && (
            <div style={{ ...itemStyle, display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((p) => (
                <span key={p.id} style={{ color: "#0b7280" }}>・{p.name}</span>
              ))}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

// ========= 本体コンポーネント =========
export default function ThreeCircleBot() {
  const [name, setName] = useState("");
  const [flags, setFlags] = useState<{ f: boolean; o: boolean; m: boolean }>({
    f: false,
    o: false,
    m: false,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 初期データ（空スタート）
  const [people, setPeople] = useState<Participant[]>([]);

  const layout = useMemo(() => classify(people), [people]);

  // 追加
  const add = () => {
    const n = name.trim();
    if (!n) return;
    const p: Participant = {
      id: genId(),
      name: n,
      family: flags.f,
      owner: flags.o,
      mgmt: flags.m,
    };
    setPeople((prev) => [...prev, p]);
    setName("");
    setFlags({ f: false, o: false, m: false });
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* ヘッダ */}
      <header className="mx-auto max-w-6xl px-4 py-3">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          スリーサークル図（家族／所有／経営）
        </h1>
      </header>

      {/* 入力UI */}
      <div className="mx-auto max-w-6xl px-4">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="氏名（例：山田 太郎）"
              style={{ padding: "4px 6px", width: 220 }}
            />
          </div>

          <label>
            <input
              type="checkbox"
              checked={flags.f}
              onChange={(e) => setFlags((s) => ({ ...s, f: e.target.checked }))}
            />{" "}
            家族
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.o}
              onChange={(e) => setFlags((s) => ({ ...s, o: e.target.checked }))}
            />{" "}
            所有
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.m}
              onChange={(e) => setFlags((s) => ({ ...s, m: e.target.checked }))}
            />{" "}
            経営
          </label>

          <button onClick={add} style={{ padding: "4px 10px" }}>
            追加
          </button>
        </div>
      </div>

      {/* 図 */}
      <div className="mx-auto max-w-6xl px-2 mt-4">
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg
            ref={svgRef}
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          >
            <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
              {/* タイトル */}
              <text
                x={WIDTH / 2 - 100}
                y={60}
                fontSize={16}
                fontWeight={600}
                fill="#111827"
              >
                スリーサークル自動生成Bot
              </text>

              {/* 円（家族） */}
              <circle cx={CX} cy={CY} r={R} fill="rgba(59,130,246,0.18)" stroke="gray" />
              {/* 円（所有） */}
              <circle cx={CX2} cy={CY2} r={R2} fill="rgba(16,185,129,0.18)" stroke="gray" />
              {/* 円（経営） */}
              <circle cx={CX3} cy={CY3} r={R3} fill="rgba(234,179,8,0.18)" stroke="gray" />

              {/* 軸ラベル */}
              <text x={CX - 20} y={CY - R - 12} fontSize={12} fontWeight={600}>
                家族 Family
              </text>
              <text x={CX2 - 20} y={CY2 - R2 - 12} fontSize={12} fontWeight={600}>
                所有 Ownership
              </text>
              <text x={CX3 - 20} y={CY3 + R3 + 24} fontSize={12} fontWeight={600}>
                経営 Management
              </text>

              {/* ── ラベル配置（ご指定の微調整を反映） ───────────────── */}

              {/* 単独領域 */}
              {regionBox(CX - R + 40, CY - 40, 160, 120, "家族のみ", layout.onlyF)}   // OKのまま
              {regionBox(CX2 + 100, CY - 40, 160, 120, "所有のみ", layout.onlyO)}   // 少し左へ（+120 → +100）
              {regionBox(CX3 + 0,   CY3 + 60, 200, 120, "経営のみ", layout.onlyM)}  // 左下へ（x: +30→0, y: +40→+60）

              {/* 2つ重なり */}
              {regionBox(CX + 20,  CY - 100, 160, 120, "家族×所有", layout.fAndO)}  // 右上へ
              {regionBox(CX - 100, CY + 60, 160, 120, "家族×経営", layout.fAndM)}   // 下へ（+20 → +60）
              {regionBox(CX2 + 40,  CY2 + 40, 160, 120, "所有×経営", layout.oAndM)} // 少し左＆下（+60, +20 → +40, +40）

              {/* 3つ重なり */}
              {regionBox(CX + 20,  CY + 20,  200, 120, "家族×所有×経営", layout.all)} // 右下へ
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
