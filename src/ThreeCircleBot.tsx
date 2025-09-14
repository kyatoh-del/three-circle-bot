import React, { useMemo, useRef, useState } from "react";

/** =========================================================
 *  スリーサークル自動生成Bot（センタリング＆微オフセット済）
 *  - 2手の修正を反映済み：
 *    ① <svg> を中央寄せ（preserveAspectRatio='xMidYMid meet'）
 *    ② 全要素を <g transform="translate(X,Y)"> で軽く右下へ平行移動
 *       → オフセットは TRANSLATE_X / TRANSLATE_Y を調整
 * ========================================================= */

/* ----------------- Types ----------------- */
type Participant = {
  id: string;
  name: string;
  family: boolean; // Family
  owner: boolean;  // Ownership
  mgmt: boolean;   // Management
};

type Layout = {
  onlyF: Participant[];
  onlyO: Participant[];
  onlyM: Participant[];
  FO: Participant[];   // Family ∩ Ownership（非経営）
  FM: Participant[];   // Family ∩ Management（非所有）
  OM: Participant[];   // Ownership ∩ Management（非家族）
  FOM: Participant[];  // 3つすべて
};

/* ----------------- Util ----------------- */
const genId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? (crypto as any).randomUUID()
    : `id_${Math.random().toString(36).slice(2, 10)}`;

/* ----------------- Classify / Comments ----------------- */
function classify(people: Participant[]): Layout {
  const L: Layout = { onlyF: [], onlyO: [], onlyM: [], FO: [], FM: [], OM: [], FOM: [] };
  for (const p of people) {
    const f = p.family, o = p.owner, m = p.mgmt;
    const sum = (f ? 1 : 0) + (o ? 1 : 0) + (m ? 1 : 0);
    if (sum === 3) L.FOM.push(p);
    else if (sum === 2) {
      if (f && o) L.FO.push(p);
      if (f && m) L.FM.push(p);
      if (o && m) L.OM.push(p);
    } else if (sum === 1) {
      if (f) L.onlyF.push(p);
      if (o) L.onlyO.push(p);
      if (m) L.onlyM.push(p);
    }
  }
  return L;
}

function generateComments(L: Layout): string[] {
  const out: string[] = [];
  if (L.FOM.length > 0) {
    out.push(`【家族×所有×経営】重なり（${L.FOM.length}名）。意思決定の透明性と“役割の切替”のルールを言語化。`);
  }
  if (L.OM.length > 0) {
    out.push(`【所有×経営（非家族）】（${L.OM.length}名）。評価基準と説明責任を明確に。`);
  }
  if (L.FM.length > 0) {
    out.push(`【家族×経営（非所有）】（${L.FM.length}名）。目標設定とフィードバックの設計が鍵。`);
  }
  if (L.FO.length > 0) {
    out.push(`【家族×所有（非経営）】（${L.FO.length}名）。情報共有の頻度と範囲を合意。`);
  }
  if (L.onlyM.length > 0) out.push(`【経営のみ】（${L.onlyM.length}名）。権限と裁量を明確に。`);
  if (L.onlyO.length > 0) out.push(`【所有のみ】（${L.onlyO.length}名）。配当方針と議決権運用を明文化。`);
  if (L.onlyF.length > 0) out.push(`【家族のみ】（${L.onlyF.length}名）。家族会議の目的と非公開ラインを設定。`);
  if (out.length > 0) out.push("※ 本出力は“診断”でなく、対話の出発点です。");
  return out;
}

/* ----------------- SVG Consts ----------------- */
const WIDTH = 900;
const HEIGHT = 720;

// 3円の中心・半径
const CX = 320, CY = 320, R = 210;     // Family (左上)
const CX2 = 500, CY2 = 320, R2 = 210;  // Ownership (右上)
const CX3 = 410, CY3 = 440, R3 = 210;  // Management (下)

// タイトルや凡例など含む全体を少しだけ右下へ寄せる量（必要なら微調整）
const TRANSLATE_X = 48;
const TRANSLATE_Y = 16;

const vennFillA = "rgba(59,130,246,0.18)";   // 青:F
const vennFillB = "rgba(16,185,129,0.18)";   // 緑:O
const vennFillC = "rgba(234,179,8,0.18)";    // 黄:M
const vennStroke = "rgba(0,0,0,0.25)";

/* ----------------- Small UI helpers ----------------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-4 md:p-5">
      {children}
    </div>
  );
}

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
            "'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        } as any}
      >
        <div style={labelStyle as any}>{title}</div>
        <div style={{ ...(itemStyle as any), display: "flex", flexDirection: "column", gap: 2 }}>
          {items.length === 0 ? (
            <span style={{ color: "#6b7280" }}>—</span>
          ) : (
            items.map((p) => <span key={p.id}>• {p.name}</span>)
          )}
        </div>
      </div>
    </foreignObject>
  </g>
);

/* ----------------- SVG Component ----------------- */
const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(
  function VennSVG({ title, layout }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          maxWidth: WIDTH,
          height: "auto",
          display: "block",
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
          text, tspan, foreignObject, div, span {
            font-family: 'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans',sans-serif;
          }
        `}</style>

        {/* ② 全体を少し右下へ移動 */}
        <g transform={`translate(${TRANSLATE_X}, ${TRANSLATE_Y})`}>
          {/* タイトル */}
          <text x={WIDTH / 2 - TRANSLATE_X} y={40} textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">
            {title}
          </text>

          {/* 3円 */}
          <g>
            <circle cx={CX} cy={CY} r={R} fill={vennFillA} stroke={vennStroke} />
            <circle cx={CX2} cy={CY2} r={R2} fill={vennFillB} stroke={vennStroke} />
            <circle cx={CX3} cy={CY3} r={R3} fill={vennFillC} stroke={vennStroke} />
          </g>

          {/* ラベル */}
          <text x={CX - 140} y={CY - R - 10} fontSize={14} fontWeight={700} fill="#1f2937">家族 Family</text>
          <text x={CX2 + 80} y={CY2 - R2 - 10} fontSize={14} fontWeight={700} fill="#1f2937">所有 Ownership</text>
          <text x={CX3 - 35} y={CY3 + R3 + 24} fontSize={14} fontWeight={700} fill="#1f2937">経営 Management</text>

          {/* 領域ボックス（必要に応じて x を微調整してください） */}
          {regionBox(CX - R + 10, CY - 40, 160, 120, "家族のみ", layout.onlyF)}
          {regionBox(CX2 + 60, CY - 40, 160, 120, "所有のみ", layout.onlyO)}   {/* 既定より+20寄せ */}
          {regionBox(CX3 - 60, CY3 + 10, 200, 120, "経営のみ", layout.onlyM)}   {/* 既定より+20寄せ */}

          {regionBox((CX + CX2) / 2 - 90, CY - 120, 180, 100, "家族×所有", layout.FO)}
          {regionBox(CX - 160, (CY + CY3) / 2 - 30, 180, 100, "家族×経営", layout.FM)}
          {regionBox(CX2 - 20, (CY2 + CY3) / 2 - 30, 180, 100, "所有×経営", layout.OM)}

          {regionBox((CX + CX2 + CX3) / 3 - 90, (CY + CY2 + CY3) / 3 - 20, 200, 120, "家族×所有×経営", layout.FOM)}

          {/* 凡例 */}
          <g>
            <rect x={30} y={60} width={12} height={12} fill={vennFillA} stroke={vennStroke} />
            <text x={48} y={70} fontSize={12} fill="#374151">家族</text>
            <rect x={100} y={60} width={12} height={12} fill={vennFillB} stroke={vennStroke} />
            <text x={118} y={70} fontSize={12} fill="#374151">所有</text>
            <rect x={170} y={60} width={12} height={12} fill={vennFillC} stroke={vennStroke} />
            <text x={188} y={70} fontSize={12} fill="#374151">経営</text>
          </g>
        </g>
      </svg>
    );
  }
);

/* ----------------- Download helpers ----------------- */
function downloadJSON(data: Participant[]) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `three-circle-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function uploadJSON(e: React.ChangeEvent<HTMLInputElement>, setPeople: (p: Participant[]) => void) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (Array.isArray(data)) {
        const mapped: Participant[] = data.map((d: any) => ({
          id: d.id || genId(),
          name: String(d.name || "名無し"),
          family: !!d.family,
          owner: !!d.owner,
          mgmt: !!d.mgmt,
        }));
        setPeople(mapped);
      }
    } catch {}
  };
  reader.readAsText(file);
}

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
  a.download = `three-circle-${new Date().toISOString().slice(0, 10)}.svg`;
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
    const scale = 2; // 高解像度
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pngBlob);
      a.download = `three-circle-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/* ----------------- Sample Data ----------------- */
const initialPeople: Participant[] = [
  { id: genId(), name: "創業者（父）", family: true, owner: true, mgmt: true },
  { id: genId(), name: "後継候補（長男）", family: true, owner: false, mgmt: true },
  { id: genId(), name: "配偶者", family: true, owner: true, mgmt: false },
  { id: genId(), name: "社外取締役A", family: false, owner: false, mgmt: true },
  { id: genId(), name: "休眠株主（叔父）", family: true, owner: true, mgmt: false },
  { id: genId(), name: "CFO", family: false, owner: false, mgmt: true },
];

/* ----------------- Main ----------------- */
export default function ThreeCircleBot() {
  const [people, setPeople] = useState<Participant[]>(initialPeople);
  const [name, setName] = useState("");
  const [isFamily, setIsFamily] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMgmt, setIsMgmt] = useState(false);
  const [title, setTitle] = useState("スリーサークル図（家族／所有／経営）");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => classify(people), [people]);
  const comments = useMemo(() => generateComments(layout), [layout]);

  return (
    <div
      className="min-h-screen w-full bg-gray-50 text-gray-900"
      style={{ fontFamily: `'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,sans-serif` }}
    >
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">スリーサークル自動生成Bot</h1>
          <p className="text-sm text-gray-600 mt-1">家族／所有／経営の重なりを可視化し、対話の出発点をつくる小さなツール</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：入力 */}
          <section className="lg:col-span-1">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">参加者の追加</h2>
                <div className="text-xs text-gray-500">* 氏名と所属をざっくり</div>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  aria-label="氏名"
                  placeholder="氏名（例：山田 太郎）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isFamily} onChange={(e) => setIsFamily(e.target.checked)} />
                    家族 Family
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} />
                    所有 Ownership
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isMgmt} onChange={(e) => setIsMgmt(e.target.checked)} />
                    経営 Management
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
                    onClick={() => {
                      if (!name.trim()) return;
                      setPeople((prev) => [
                        ...prev,
                        { id: genId(), name: name.trim(), family: isFamily, owner: isOwner, mgmt: isMgmt },
                      ]);
                      setName("");
                      setIsFamily(false);
                      setIsOwner(false);
                      setIsMgmt(false);
                    }}
                  >
                    追加
                  </button>
                  <button
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setPeople(initialPeople)}
                  >
                    サンプル読込
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">データ管理</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100" onClick={() => downloadJSON(people)}>
                  JSONを書き出し
                </button>
                <label className="rounded-xl border px-3 py-2 hover:bg-gray-100 cursor-pointer">
                  JSONを読み込み
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => uploadJSON(e, setPeople)} />
                </label>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">書き出し</h2>
              <div className="mt-3 space-y-2 text-sm">
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100 w-full" onClick={() => downloadSVG(svgRef)}>
                  SVG保存
                </button>
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100 w-full" onClick={() => downloadPNG(svgRef)}>
                  PNG保存
                </button>
                <div className="mt-2 text-xs text-gray-500">※ 書き出し時も日本語フォント（Noto/IPAex/Meiryo）指定</div>
              </div>
            </Card>
          </section>

          {/* 右：図＆リスト */}
          <section className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <input
                  aria-label="タイトル"
                  className="w-full rounded-xl border border-gray-300 p-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mt-4 overflow-auto">
                <VennSVG ref={svgRef} title={title} layout={layout} />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">コメント例（対話のヒント）</h2>
              <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-gray-800">
                {comments.length === 0 ? (
                  <li>重なりが少ないようです。関係図を共有し、役割と言葉の定義から始めましょう。</li>
                ) : (
                  comments.map((c, i) => <li key={i}>{c}</li>)
                )}
              </ul>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">現在の参加者</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">氏名</th>
                    <th className="py-1">家族</th>
                    <th className="py-1">所有</th>
                    <th className="py-1">経営</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-1 pr-2">{p.name}</td>
                      <td className="py-1">{p.family ? "◯" : "―"}</td>
                      <td className="py-1">{p.owner ? "◯" : "―"}</td>
                      <td className="py-1">{p.mgmt ? "◯" : "―"}</td>
                      <td className="py-1 text-right">
                        <button className="text-xs text-red-600 hover:underline" onClick={() => setPeople((prev) => prev.filter((x) => x.id !== p.id))}>
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
