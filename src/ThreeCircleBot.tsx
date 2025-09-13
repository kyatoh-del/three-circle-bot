import React, { useMemo, useRef, useState } from "react";

/** ========= Types ========= **/
type Participant = {
  id: string;
  name: string;
  f: boolean;
  o: boolean;
  m: boolean;
};
type Layout = {
  F: Participant[];
  O: Participant[];
  M: Participant[];
  FO: Participant[];
  FM: Participant[];
  OM: Participant[];
  FOM: Participant[];
};

/** ========= Main ========= **/
export default function ThreeCircleBot() {
  const [people, setPeople] = useState<Participant[]>(demo);
  const [name, setName] = useState<string>("");
  const [f, setF] = useState<boolean>(false);
  const [o, setO] = useState<boolean>(false);
  const [m, setM] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("スリーサークル (家族/所有/経営)");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => classify(people), [people]);

  return (
    <div
      style={{
        fontFamily: "Noto Sans JP, IPAexGothic, Meiryo, system-ui, sans-serif",
        padding: 16,
        background: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        スリーサークル自動生成（ライト版）
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* 左パネル */}
        <div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>参加者の追加</div>
            <input
              placeholder="氏名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={f}
                  onChange={(e) => setF(e.target.checked)}
                />{" "}
                家族
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={o}
                  onChange={(e) => setO(e.target.checked)}
                />{" "}
                所有
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={m}
                  onChange={(e) => setM(e.target.checked)}
                />{" "}
                経営
              </label>
            </div>
            <button
              onClick={() => {
                if (!name.trim()) return;
                setPeople((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), name: name.trim(), f, o, m },
                ]);
                setName("");
                setF(false);
                setO(false);
                setM(false);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#111827",
                color: "#fff",
                border: "none",
              }}
            >
              追加
            </button>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>書き出し</div>
            <button
              onClick={() => downloadSVG(svgRef)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
                width: "100%",
                marginBottom: 8,
              }}
            >
              SVG保存
            </button>
            <button
              onClick={() => downloadPNG(svgRef)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
                width: "100%",
              }}
            >
              PNG保存
            </button>
          </div>
        </div>

        {/* 右パネル */}
        <div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
              marginBottom: 12,
            }}
          >
            <input
              aria-label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontWeight: 600,
              }}
            />
            <div style={{ marginTop: 12, overflow: "auto" }}>
              <VennSVG ref={svgRef} title={title} layout={layout} />
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>コメント例</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              {generateComments(layout).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Logic ========= **/
function classify(people: Participant[]): Layout {
  const L: Layout = { F: [], O: [], M: [], FO: [], FM: [], OM: [], FOM: [] };
  for (const p of people) {
    const s = (p.f ? 1 : 0) + (p.o ? 1 : 0) + (p.m ? 1 : 0);
    if (s === 3) L.FOM.push(p);
    else if (s === 2) {
      if (p.f && p.o) L.FO.push(p);
      if (p.f && p.m) L.FM.push(p);
      if (p.o && p.m) L.OM.push(p);
    } else if (s === 1) {
      if (p.f) L.F.push(p);
      if (p.o) L.O.push(p);
      if (p.m) L.M.push(p);
    }
  }
  return L;
}

function generateComments(L: Layout): string[] {
  const out: string[] = [];
  if (L.FOM.length > 0)
    out.push("家族×所有×経営の重なりがあります。役割の切替ルールを明確に。");
  if (L.OM.length > 0)
    out.push("所有×経営（非家族）があります。評価基準と説明責任を整理。");
  if (L.FM.length > 0)
    out.push("家族×経営（非所有）があります。職務評価の設計を。");
  if (L.FO.length > 0)
    out.push("家族×所有（非経営）があります。情報共有の頻度と範囲を合意。");
  if (out.length === 0)
    out.push("重なりが少ない構成です。用語定義と目的合わせから始めましょう。");
  return out;
}

/** ========= SVG ========= **/
const WIDTH = 900,
  HEIGHT = 720;
const CX = 320,
  CY = 300,
  R = 210; // Family
const CX2 = 500,
  CY2 = 300,
  R2 = 210; // Ownership
const CX3 = 410,
  CY3 = 430,
  R3 = 210; // Management

const VennSVG = React.forwardRef<
  SVGSVGElement,
  { title: string; layout: Layout }
>(function VennSVG(props, ref) {
  const { title, layout } = props;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={"0 0 " + WIDTH + " " + HEIGHT}
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <text
        x={WIDTH / 2}
        y={40}
        textAnchor="middle"
        fontSize={20}
        fontWeight={700}
        fill="#111827"
      >
        {title}
      </text>

      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="rgba(59,130,246,0.18)"
        stroke="rgba(0,0,0,0.25)"
      />
      <circle
        cx={CX2}
        cy={CY2}
        r={R2}
        fill="rgba(16,185,129,0.18)"
        stroke="rgba(0,0,0,0.25)"
      />
      <circle
        cx={CX3}
        cy={CY3}
        r={R3}
        fill="rgba(234,179,8,0.18)"
        stroke="rgba(0,0,0,0.25)"
      />

      {/* ラベル */}
      <text
        x={CX - 140}
        y={CY - R - 10}
        fontSize={14}
        fontWeight={700}
        fill="#1f2937"
      >
        家族 Family
      </text>
      <text
        x={CX2 + 80}
        y={CY2 - R2 - 10}
        fontSize={14}
        fontWeight={700}
        fill="#1f2937"
      >
        所有 Ownership
      </text>
      <text
        x={CX3 - 35}
        y={CY3 + R3 + 24}
        fontSize={14}
        fontWeight={700}
        fill="#1f2937"
      >
        経営 Management
      </text>

      {/* 中央(FOM)の名前だけ最小表示 */}
      {layout.FOM.map((p, i) => (
        <text key={p.id} x={420} y={320 + i * 18} fontSize={13}>
          • {p.name}
        </text>
      ))}
    </svg>
  );
});

/** ========= Export Utils ========= **/
function svgToBlob(svg: SVGSVGElement) {
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svg);
  return new Blob([src], { type: "image/svg+xml;charset=utf-8" });
}
function downloadSVG(ref: React.RefObject<SVGSVGElement>) {
  const svg = ref.current;
  if (!svg) return;
  const blob = svgToBlob(svg);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "three-circle.svg";
  a.click();
  URL.revokeObjectURL(url);
}
function downloadPNG(ref: React.RefObject<SVGSVGElement>) {
  const svg = ref.current;
  if (!svg) return;
  const blob = svgToBlob(svg);
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * 2;
    canvas.height = HEIGHT * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((png) => {
      if (!png) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = "three-circle.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/** ========= Demo Data ========= **/
const demo: Participant[] = [
  { id: crypto.randomUUID(), name: "創業者(父)", f: true, o: true, m: true },
  {
    id: crypto.randomUUID(),
    name: "後継候補(長男)",
    f: true,
    o: false,
    m: true,
  },
  { id: crypto.randomUUID(), name: "配偶者", f: true, o: true, m: false },
  { id: crypto.randomUUID(), name: "社外取締役A", f: false, o: false, m: true },
];
