import React, { useState, useMemo, useRef } from "react";

// ---------------- 型定義 ----------------
type Participant = {
  id: string;
  name: string;
  family: boolean;
  owner: boolean;
  mgmt: boolean;
};

// ---------------- ID生成 ----------------
const genId = () => Math.random().toString(36).substr(2, 9);

// ---------------- レイアウト分類 ----------------
type Layout = {
  onlyF: Participant[];
  onlyO: Participant[];
  onlyM: Participant[];
  fAndO: Participant[];
  fAndM: Participant[];
  oAndM: Participant[];
  all: Participant[];
};

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
    if (p.family && !p.owner && !p.mgmt) out.onlyF.push(p);
    else if (!p.family && p.owner && !p.mgmt) out.onlyO.push(p);
    else if (!p.family && !p.owner && p.mgmt) out.onlyM.push(p);
    else if (p.family && p.owner && !p.mgmt) out.fAndO.push(p);
    else if (p.family && !p.owner && p.mgmt) out.fAndM.push(p);
    else if (!p.family && p.owner && p.mgmt) out.oAndM.push(p);
    else if (p.family && p.owner && p.mgmt) out.all.push(p);
  }
  return out;
}

// ---------------- regionBox ----------------
const labelStyle = { fontSize: 14, fontWeight: 600 } as const;
const itemStyle = { fontSize: 13 } as const;

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
          fontFamily:
            "'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI','Roboto','Noto Sans',sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={labelStyle as any}>{title}</div>
        <div
          style={{
            ...(itemStyle as any),
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {(items ?? [])
            .filter((it) => it && typeof it.name === "string" && it.name.trim() !== "")
            .map((p, i) => (
              <span key={i}>• {p.name}</span>
            ))}
        </div>
      </div>
    </foreignObject>
  </g>
);

// ---------------- SVG定義 ----------------
const WIDTH = 900,
  HEIGHT = 720;
const CX = 320,
  CY = 300,
  R = 210;
const CX2 = 500,
  CY2 = 300,
  R2 = 210;
const CX3 = 410,
  CY3 = 440,
  R3 = 210;

const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(
  ({ title, layout }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ display: "block", margin: "0 auto" }} // 中央寄せ
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

      <circle cx={CX} cy={CY} r={R} fill="rgba(59,130,246,0.18)" stroke="gray" />
      <circle cx={CX2} cy={CY2} r={R2} fill="rgba(16,185,129,0.18)" stroke="gray" />
      <circle cx={CX3} cy={CY3} r={R3} fill="rgba(234,179,8,0.18)" stroke="gray" />

      {/* ラベル */}
      <text x={CX} y={CY - R - 10} textAnchor="middle" fontWeight="bold">
        家族 Family
      </text>
      <text x={CX2} y={CY2 - R2 - 10} textAnchor="middle" fontWeight="bold">
        所有 Ownership
      </text>
      <text x={CX3} y={CY3 + R3 + 30} textAnchor="middle" fontWeight="bold">
        経営 Management
      </text>

      {/* 領域配置（座標調整済み） */}
      {regionBox(CX - R + 20, CY - 40, 160, 120, "家族のみ", layout.onlyF)}
      {regionBox(CX2 + 120, CY - 40, 160, 120, "所有のみ", layout.onlyO)}
      {regionBox(CX3 + 40, CY3 + 20, 200, 120, "経営のみ", layout.onlyM)}

      {regionBox(CX - 40, CY - 60, 160, 120, "家族×所有", layout.fAndO)}
      {regionBox(CX - 120, CY + 20, 160, 120, "家族×経営", layout.fAndM)}
      {regionBox(CX2 + 40, CY2 + 20, 160, 120, "所有×経営", layout.oAndM)}
      {regionBox(CX - 40, CY - 20, 200, 120, "家族×所有×経営", layout.all)}
    </svg>
  )
);

// ---------------- メインコンポーネント ----------------
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
      style={{
        fontFamily:
          "'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI','Roboto','Noto Sans',sans-serif",
      }}
    >
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
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

        {/* SVG描画 */}
        <VennSVG title="スリーサークル自動生成Bot" layout={layout} ref={svgRef} />
      </div>
    </div>
  );
}
