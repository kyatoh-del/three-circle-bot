import React, { useMemo, useRef, useState } from "react";

/* =========================================================
   ThreeCircleBot  —  スリーサークル（家族／所有／経営）自動可視化
   - 氏名＋チェックを入力 → 「追加」で図と表に反映
   - JSON入出力・SVG/PNG保存（簡易）
   - 日本語フォント指定（Noto Sans CJK JP / IPAexGothic / Meiryo）
   ========================================================= */

export type Participant = {
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

/* --------- 安全なID生成（crypto.randomUUIDを使わない） --------- */
function genId(): string {
  // 時刻＋乱数を16進で
  return (
    "id_" +
    Date.now().toString(16) +
    "_" +
    Math.floor(Math.random() * 0xffff_ffff).toString(16).padStart(8, "0")
  );
}

/* ---------------- 初期サンプル ---------------- */
const initialPeople: Participant[] = [
  { id: genId(), name: "創業者（父）", family: true, owner: true, mgmt: true },
  { id: genId(), name: "後継候補（長男）", family: true, owner: false, mgmt: true },
  { id: genId(), name: "配偶者", family: true, owner: true, mgmt: false },
  { id: genId(), name: "社外取締役A", family: false, owner: false, mgmt: true },
  { id: genId(), name: "休眠株主（叔父）", family: true, owner: true, mgmt: false },
  { id: genId(), name: "CFO", family: false, owner: false, mgmt: true },
];

/* ---------------- 分類 ---------------- */
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

/* ---------------- コメント例 ---------------- */
function generateComments(L: Layout): string[] {
  const out: string[] = [];
  if (L.FOM.length) out.push(`【家族×所有×経営】重なり（${L.FOM.length}名）。役割の切替ルールを言語化。`);
  if (L.OM.length)  out.push(`【所有×経営（非家族）】（${L.OM.length}名）。評価基準と説明責任を明確化。`);
  if (L.FM.length)  out.push(`【家族×経営（非所有）】（${L.FM.length}名）。職務評価と家族感情の分離が鍵。`);
  if (L.FO.length)  out.push(`【家族×所有（非経営）】（${L.FO.length}名）。情報共有の頻度と範囲を合意。`);
  if (L.onlyM.length) out.push(`【経営のみ】（${L.onlyM.length}名）。権限と裁量の明確化。`);
  if (L.onlyO.length) out.push(`【所有のみ】（${L.onlyO.length}名）。配当方針と議決権運用。`);
  if (L.onlyF.length) out.push(`【家族のみ】（${L.onlyF.length}名）。家族会議の目的と非公開ラインの先出し。`);
  if (out.length) out.push("※ 本出力は“診断”ではなく、対話のきっかけ資料です。");
  return out;
}

/* ---------------- SVG 定数 ---------------- */
const WIDTH = 900;
const HEIGHT = 720; // ← 下が切れない高さ
const CX = 320, CY = 320, R = 210;      // Family
const CX2 = 500, CY2 = 320, R2 = 210;    // Ownership
const CX3 = 410, CY3 = 440, R3 = 210;    // Management（下）

/* ========================================================= */
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

  /* -------- 追加（堅牢版） -------- */
  const addPerson = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const nm = name.trim();
    if (!nm) {
      alert("氏名を入力してください");
      return;
    }
    if (!isFamily && !isOwner && !isMgmt) {
      alert("家族／所有／経営のいずれかにチェックしてください");
      return;
    }
    setPeople((prev) => [...prev, { id: genId(), name: nm, family: isFamily, owner: isOwner, mgmt: isMgmt }]);
    setName("");
    setIsFamily(false);
    setIsOwner(false);
    setIsMgmt(false);
  };

  /* -------- JSON入出力 -------- */
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `three-circle-data-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const uploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(String(rd.result));
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
      } catch { /* no-op */ }
    };
    rd.readAsText(f);
  };

  /* -------- SVG/PNG保存 -------- */
  const svgToBlob = (svg: SVGSVGElement) => {
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    return new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  };
  const downloadSVG = () => {
    const svg = svgRef.current; if (!svg) return;
    const url = URL.createObjectURL(svgToBlob(svg));
    const a = document.createElement("a");
    a.href = url; a.download = `three-circle-${new Date().toISOString().slice(0,10)}.svg`; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadPNG = () => {
    const svg = svgRef.current; if (!svg) return;
    const url = URL.createObjectURL(svgToBlob(svg));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH * 2; canvas.height = HEIGHT * 2;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(png); a.download = `three-circle-${new Date().toISOString().slice(0,10)}.png`; a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="min-h-screen w-full bg-gray-50 text-gray-900"
      style={{ fontFamily: `'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,sans-serif` }}
    >
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">スリーサークル自動生成Bot</h1>
          <p className="text-sm text-gray-600 mt-1">家族／所有／経営の重なりを可視化するミニツール</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：入力 */}
          <section className="lg:col-span-1">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">参加者の追加</h2>
                <div className="text-xs text-gray-500">氏名と所属をざっくり</div>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  aria-label="氏名"
                  placeholder="氏名（例：山田 太郎）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addPerson(); }}
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
                    type="button"
                    className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
                    onClick={addPerson}
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
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100" onClick={downloadJSON}>
                  JSONを書き出し
                </button>
                <label className="rounded-xl border px-3 py-2 hover:bg-gray-100 cursor-pointer">
                  JSONを読み込み
                  <input type="file" accept="application/json" className="hidden" onChange={uploadJSON} />
                </label>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">書き出し</h2>
              <div className="mt-3 space-y-2 text-sm">
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100 w-full" onClick={downloadSVG}>
                  SVG保存
                </button>
                <button className="rounded-xl border px-3 py-2 hover:bg-gray-100 w-full" onClick={downloadPNG}>
                  PNG保存
                </button>
              </div>
            </Card>
          </section>

          {/* 中央：図とコメント */}
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
                  <li>重なりが少ない構成です。役割と言葉の定義から始めましょう。</li>
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
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => setPeople((prev) => prev.filter((x) => x.id !== p.id))}
                        >
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

/* ---------------- UI ---------------- */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-4 md:p-5">{children}</div>;
}

/* ---------------- SVG ---------------- */
const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(function VennSVG(
  { title, layout },
  ref
) {
  const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, fill: "#1f2937" };
  const itemStyle: React.CSSProperties = { fontSize: 13 };
  const vennFillA = "rgba(59,130,246,0.18)";  // 青 Family
  const vennFillB = "rgba(16,185,129,0.18)";  // 緑 Ownership
  const vennFillC = "rgba(234,179,8,0.18)";   // 黄 Management
  const vennStroke = "rgba(0,0,0,0.25)";

  const Region = (x: number, y: number, w: number, h: number, title: string, items: Participant[]) => (
    <g>
      <foreignObject x={x} y={y} width={w} height={h} style={{ overflow: "hidden" }}>
        <div
          style={{
            fontFamily: `'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          } as any}
        >
          <div style={labelStyle as any}>{title}</div>
          <div style={{ ...itemStyle, display: "flex", flexDirection: "column", gap: 2 } as any}>
            {items.length === 0 ? <span style={{ color: "#6b7280" }}>—</span> : items.map((p) => <span key={p.id}>• {p.name}</span>)}
          </div>
        </div>
      </foreignObject>
    </g>
  );

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb" }}
    >
      <style>{`
        text, tspan, foreignObject, div, span {
          font-family: 'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans',sans-serif;
        }
      `}</style>

      <text x={WIDTH / 2} y={40} textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">
        {title}
      </text>

      {/* Circles */}
      <g>
        <circle cx={CX} cy={CY} r={R} fill={vennFillA} stroke={vennStroke} />
        <circle cx={CX2} cy={CY2} r={R2} fill={vennFillB} stroke={vennStroke} />
        <circle cx={CX3} cy={CY3} r={R3} fill={vennFillC} stroke={vennStroke} />
      </g>

      {/* Labels */}
      <text x={CX - 140} y={CY - R - 10} style={labelStyle}>家族 Family</text>
      <text x={CX2 + 80} y={CY2 - R2 - 10} style={labelStyle}>所有 Ownership</text>
      <text x={CX3 - 35} y={CY3 + R3 + 24} style={labelStyle}>経営 Management</text>

      {/* Regions */}
      {Region(CX - R + 10, CY - 40, 160, 120, "家族のみ", layout.onlyF)}
      {Region(CX2 + 40, CY - 40, 160, 120, "所有のみ", layout.onlyO)}
      {Region(CX3 - 80, CY3 + 10, 200, 120, "経営のみ", layout.onlyM)}
      {Region((CX + CX2) / 2 - 90, CY - 120, 180, 100, "家族×所有", layout.FO)}
      {Region(CX - 160, (CY + CY3) / 2 - 30, 180, 100, "家族×経営", layout.FM)}
      {Region(CX2 - 20, (CY2 + CY3) / 2 - 30, 180, 100, "所有×経営", layout.OM)}
      {Region((CX + CX2 + CX3) / 3 - 90, (CY + CY2 + CY3) / 3 - 20, 200, 120, "家族×所有×経営", layout.FOM)}

      {/* Legend */}
      <g>
        <rect x={30} y={60} width={12} height={12} fill={vennFillA} stroke={vennStroke} />
        <text x={48} y={70} fontSize={12} fill="#374151">家族</text>
        <rect x={100} y={60} width={12} height={12} fill={vennFillB} stroke={vennStroke} />
        <text x={118} y={70} fontSize={12} fill="#374151">所有</text>
        <rect x={170} y={60} width={12} height={12} fill={vennFillC} stroke={vennStroke} />
        <text x={188} y={70} fontSize={12} fill="#374151">経営</text>
      </g>
    </svg>
  );
});
