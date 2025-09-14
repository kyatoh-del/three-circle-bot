import React, { useState, useMemo, useRef } from "react";

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

const genId = () => Math.random().toString(36).substr(2, 9);

export default function ThreeCircleBot() {
  const [people, setPeople] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [family, setFamily] = useState(false);
  const [owner, setOwner] = useState(false);
  const [mgmt, setMgmt] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => classify(people), [people]);

  const addPerson = () => {
    if (!name.trim()) return;
    setPeople((prev) => [
      ...prev,
      { id: genId(), name, family, owner, mgmt },
    ]);
    setName("");
    setFamily(false);
    setOwner(false);
    setMgmt(false);
  };

  return (
    <div
      className="min-h-screen w-full bg-gray-50 text-gray-900"
      style={{ fontFamily: "'Noto Sans CJK JP','IPAexGothic','Meiryo',sans-serif" }}
    >
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            スリーサークル図（家族／所有／経営）
          </h1>
        </header>

        {/* 入力欄 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">氏名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="例：山田 太郎"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label>
              <input
                type="checkbox"
                checked={family}
                onChange={(e) => setFamily(e.target.checked)}
              />{" "}
              家族
            </label>
            <label>
              <input
                type="checkbox"
                checked={owner}
                onChange={(e) => setOwner(e.target.checked)}
              />{" "}
              所有
            </label>
            <label>
              <input
                type="checkbox"
                checked={mgmt}
                onChange={(e) => setMgmt(e.target.checked)}
              />{" "}
              経営
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={addPerson}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              追加
            </button>
          </div>
        </div>

        {/* 図の描画 */}
        <VennSVG ref={svgRef} title="スリーサークル自動生成Bot" layout={layout} />
      </div>
    </div>
  );
}

// ---------- SVG描画 ----------

const WIDTH = 900, HEIGHT = 720;
const CX = 320, CY = 300, R = 210;
const CX2 = 500, CY2 = 300, R2 = 210;
const CX3 = 410, CY3 = 440, R3 = 210;

// 全体のずれ調整
const OFFSET_X = 30;
const OFFSET_Y = 0;

const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(
  ({ title, layout }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: "block", margin: "0 auto" }}
      >
        <text
          x={WIDTH / 2}
          y={40}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
        >
          {title}
        </text>

        {/* 全体をまとめて右にずらす */}
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          {/* 3つの円 */}
          <circle cx={CX} cy={CY} r={R} fill="rgba(59,130,246,0.18)" stroke="gray" />
          <circle cx={CX2} cy={CY2} r={R2} fill="rgba(16,185,129,0.18)" stroke="gray" />
          <circle cx={CX3} cy={CY3} r={R3} fill="rgba(234,179,8,0.18)" stroke="gray" />

          {/* 軸ラベル */}
          <text x={CX}  y={CY - R - 10}  textAnchor="middle" fontWeight="bold">家族 Family</text>
          <text x={CX2} y={CY2 - R2 - 10} textAnchor="middle" fontWeight="bold">所有 Ownership</text>
          <text x={CX3} y={CY3 + R3 + 30} textAnchor="middle" fontWeight="bold">経営 Management</text>

          {/* 各領域 */}
          // （中略）<g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}> の中

          // ── 単独領域 ────────────────────────────
          {regionBox(CX - R + 40, CY - 40, 160, 120, "家族のみ", layout.onlyF)}         // そのまま
          {regionBox(CX2 + 120, CY - 40, 160, 120, "所有のみ", layout.onlyO)}           // ← 20px 左へ
          {regionBox(CX3 + 30,  CY3 + 40, 200, 120, "経営のみ", layout.onlyM)}          // ←30px 左 & ↓20px

          // ── 2つ重なり ───────────────────────────
          {regionBox(CX + 0,   CY - 80, 160, 120, "家族×所有", layout.fAndO)}           // →20px 右 & ↑20px（元: CX-20, CY-60）
          {regionBox(CX - 100, CY + 40, 160, 120, "家族×経営", layout.fAndM)}           // ↓20px（元: CY+20）
          {regionBox(CX2 + 40, CY2 + 30, 160, 120, "所有×経営", layout.oAndM)}          // ←20px 左 & ↓10px（元: CX2+60, CY2+20）

          // ── 3つ重なり ───────────────────────────
          {regionBox(CX + 0,   CY + 0,  200, 120, "家族×所有×経営", layout.all)}        // →20px 右 & ↓20px（元: CX-20, CY-20）

        </g>
      </svg>
    );
  }
);

// ---------- 各領域の描画 ----------

const regionBox = (
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  items: Participant[]
) => (
  <g>
    <foreignObject x={x} y={y} width={w} height={h} style={{ overflow: "hidden" }}>
      <div
        style={{
          fontFamily: "'Noto Sans CJK JP','IPAexGothic','Meiryo',sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 2 }}>
          {items.length === 0 ? null : items.map((p) => <span key={p.id}>{p.name}</span>)}
        </div>
      </div>
    </foreignObject>
  </g>
);

// ---------- 分類ロジック ----------

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
    const { family, owner, mgmt } = p;
    if (family && owner && mgmt) out.all.push(p);
    else if (family && owner) out.fAndO.push(p);
    else if (family && mgmt) out.fAndM.push(p);
    else if (owner && mgmt) out.oAndM.push(p);
    else if (family) out.onlyF.push(p);
    else if (owner) out.onlyO.push(p);
    else if (mgmt) out.onlyM.push(p);
  }
  return out;
}

