import React, { useState, useMemo, useRef } from "react";

// ---- 型定義 ----
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
  FO: Participant[];
  FM: Participant[];
  OM: Participant[];
  FOM: Participant[];
};

// ---- ユーティリティ ----
function genId() {
  return Math.random().toString(36).substr(2, 9);
}

function classify(people: Participant[]): Layout {
  const out: Layout = {
    onlyF: [],
    onlyO: [],
    onlyM: [],
    FO: [],
    FM: [],
    OM: [],
    FOM: [],
  };
  for (const p of people) {
    const { family, owner, mgmt } = p;
    const sum = [family, owner, mgmt].filter(Boolean).length;
    if (sum === 1) {
      if (family) out.onlyF.push(p);
      if (owner) out.onlyO.push(p);
      if (mgmt) out.onlyM.push(p);
    } else if (sum === 2) {
      if (family && owner) out.FO.push(p);
      if (family && mgmt) out.FM.push(p);
      if (owner && mgmt) out.OM.push(p);
    } else if (sum === 3) {
      out.FOM.push(p);
    }
  }
  return out;
}

// ---- レイアウト用定数 ----
const WIDTH = 900, HEIGHT = 720;
const CX = 320, CY = 300, R = 210;
const CX2 = 500, CY2 = 300, R2 = 210;
const CX3 = 410, CY3 = 440, R3 = 210;

// ---- SVG 部品 ----
const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(
  ({ title, layout }, ref) => {
    const labelStyle = { fontSize: 14, fontWeight: 600 } as const;
    const itemStyle = { fontSize: 13 } as const;

    // 領域ボックス
    const regionBox = (
      x: number,
      y: number,
      w: number,
      h: number,
      title: string,
      items: Participant[]
    ) => (
      <foreignObject
        x={x}
        y={y}
        width={w}
        height={h}
        style={{ overflow: "hidden" }}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            fontFamily:
              "'Noto Sans JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={labelStyle}>{title}</div>
          {items.length > 0 &&
            items.map((p) => (
              <div key={p.id} style={itemStyle}>
                {p.name}
              </div>
            ))}
        </div>
      </foreignObject>
    );

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
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
        <text x={CX} y={CY - R - 10} textAnchor="middle" fontWeight={600}>
          家族 Family
        </text>
        <text x={CX2} y={CY2 - R2 - 10} textAnchor="middle" fontWeight={600}>
          所有 Ownership
        </text>
        <text x={CX3} y={CY3 + R3 + 25} textAnchor="middle" fontWeight={600}>
          経営 Management
        </text>

         {/* 領域（最終チューニング） */}
        {regionBox(CX - R + 40, CY - 40, 150, 120, "家族のみ", layout.onlyF)}         // ほんの少し右へ
        {regionBox(CX2 + 90,   CY - 40, 150, 120, "所有のみ", layout.onlyO)}         // そのまま（ちょうど良い）
        {regionBox(CX3 - 90,   CY3 + 60, 180, 120, "経営のみ", layout.onlyM)}        // 真下（下円の中央直下）

        {regionBox(CX - 90,    CY + 50, 150, 120, "家族×経営", layout.FM)}          // 左下へ
        {regionBox(CX2 + 10,   CY + 60, 150, 120, "所有×経営", layout.OM)}          // 真下へ
        {regionBox(CX + 40,    CY - 60, 150, 120, "家族×所有", layout.FO)}          // 右45度上へ

        {regionBox(CX + 40,    CY + 30, 160, 120, "家族×所有×経営", layout.FOM)}   // 少し右上へ
      </svg>
    );
  }
);

// ---- 初期データ ----
const initialPeople: Participant[] = [];

// ---- メイン ----
export default function ThreeCircleBot() {
  const [people, setPeople] = useState<Participant[]>(initialPeople);
  const [name, setName] = useState("");
  const [family, setFamily] = useState(false);
  const [owner, setOwner] = useState(false);
  const [mgmt, setMgmt] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const layout = useMemo(() => classify(people), [people]);

  const addPerson = () => {
    if (!name.trim()) return;
    setPeople([
      ...people,
      { id: genId(), name, family, owner, mgmt }
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
        fontFamily: "'Noto Sans JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif",
      }}
    >
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            スリーサークル図（家族／所有／経営）
          </h1>
        </header>

        <div style={{ marginBottom: "1em" }}>
          <label>
            氏名（例：山田 太郎）{" "}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ border: "1px solid #999", marginRight: 8 }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={family}
              onChange={(e) => setFamily(e.target.checked)}
            />
            家族
          </label>
          <label>
            <input
              type="checkbox"
              checked={owner}
              onChange={(e) => setOwner(e.target.checked)}
            />
            所有
          </label>
          <label>
            <input
              type="checkbox"
              checked={mgmt}
              onChange={(e) => setMgmt(e.target.checked)}
            />
            経営
          </label>
          <button onClick={addPerson} style={{ marginLeft: 8 }}>
            追加
          </button>
        </div>

        <VennSVG ref={svgRef} title="スリーサークル自動生成Bot" layout={layout} />
      </div>
    </div>
  );
}

