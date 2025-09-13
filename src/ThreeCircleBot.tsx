import React, { useMemo, useRef, useState } from "react";

// ---------------- ID Generator ----------------
// crypto.randomUUID が Vercel環境で型エラーになるため、自前関数で代替
const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------------- Types ----------------
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

// ---------------- Main Component ----------------
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
    <div className="min-h-screen w-full bg-gray-50 text-gray-900"
         style={{ fontFamily: `'Noto Sans CJK JP','IPAexGothic','Meiryo',system-ui,sans-serif` }}>
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            スリーサークル自動生成Bot
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：入力フォーム */}
          <section className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-medium">参加者の追加</h2>
              <div className="mt-4 space-y-3">
                <input
                  placeholder="氏名（例：山田 太郎）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border p-2"
                />
                <div className="flex gap-4 text-sm">
                  <label><input type="checkbox" checked={isFamily}
                                 onChange={(e) => setIsFamily(e.target.checked)} />家族</label>
                  <label><input type="checkbox" checked={isOwner}
                                 onChange={(e) => setIsOwner(e.target.checked)} />所有</label>
                  <label><input type="checkbox" checked={isMgmt}
                                 onChange={(e) => setIsMgmt(e.target.checked)} />経営</label>
                </div>
                <div className="flex gap-3">
                  <button
                    className="rounded-xl bg-gray-900 text-white px-3 py-2"
                    onClick={() => {
                      if (!name.trim()) return;
                      setPeople((prev) => [
                        ...prev,
                        { id: genId(), name: name.trim(), family: isFamily, owner: isOwner, mgmt: isMgmt }
                      ]);
                      setName("");
                      setIsFamily(false);
                      setIsOwner(false);
                      setIsMgmt(false);
                    }}>
                    追加
                  </button>
                  <button
                    className="rounded-xl border px-3 py-2"
                    onClick={() => setPeople(initialPeople)}>
                    サンプル読込
                  </button>
                </div>
              </div>
            </Card>
          </section>

          {/* 中央：図とコメント */}
          <section className="lg:col-span-2">
            <Card>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border p-2 text-lg font-medium"
              />
              <div className="mt-4 overflow-auto">
                <VennSVG ref={svgRef} title={title} layout={layout} />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium">コメント例</h2>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {comments.length === 0
                  ? <li>重なりが少ないようです。</li>
                  : comments.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------------- Helper Components ----------------
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white shadow-sm border p-4">{children}</div>;
}

// ---------------- Logic ----------------
function classify(people: Participant[]): Layout {
  const L: Layout = { onlyF: [], onlyO: [], onlyM: [], FO: [], FM: [], OM: [], FOM: [] };
  for (const p of people) {
    const f = p.family, o = p.owner, m = p.mgmt;
    const sum = (f?1:0) + (o?1:0) + (m?1:0);
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
  if (L.FOM.length > 0) out.push("家族×所有×経営の重なりがあります。");
  if (L.OM.length > 0) out.push("所有×経営の重なりがあります。");
  if (L.FM.length > 0) out.push("家族×経営の重なりがあります。");
  if (L.FO.length > 0) out.push("家族×所有の重なりがあります。");
  return out;
}

// ---------------- SVG ----------------
const WIDTH = 900, HEIGHT = 720;
const CX = 320, CY = 300, R = 210;
const CX2 = 500, CY2 = 300, R2 = 210;
const CX3 = 410, CY3 = 440, R3 = 210;

const VennSVG = React.forwardRef<SVGSVGElement, { title: string; layout: Layout }>(
  function VennSVG({ title, layout }, ref) {
    return (
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg"
           width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <text x={WIDTH/2} y={40} textAnchor="middle"
              fontSize={20} fontWeight={700}>{title}</text>
        <circle cx={CX} cy={CY} r={R} fill="rgba(59,130,246,0.18)" stroke="gray" />
        <circle cx={CX2} cy={CY2} r={R2} fill="rgba(16,185,129,0.18)" stroke="gray" />
        <circle cx={CX3} cy={CY3} r={R3} fill="rgba(234,179,8,0.18)" stroke="gray" />
      </svg>
    );
  }
);

// ---------------- Sample Data ----------------
const initialPeople: Participant[] = [
  { id: genId(), name: "創業者（父）", family: true, owner: true, mgmt: true },
  { id: genId(), name: "後継候補（長男）", family: true, owner: false, mgmt: true },
  { id: genId(), name: "配偶者", family: true, owner: true, mgmt: false },
  { id: genId(), name: "社外取締役A", family: false, owner: false, mgmt: true },
  { id: genId(), name: "休眠株主（叔父）", family: true, owner: true, mgmt: false },
  { id: genId(), name: "CFO", family: false, owner: false, mgmt: true },
];
