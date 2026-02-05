import React, { useMemo, useState } from "react";

const R_OPTIONS = ["R0", "R1", "R2", "R3"] as const;
const LV_OPTIONS = ["Lv1", "Lv2", "Lv3", "Lv4", "Lv5"] as const;

type ReflectionChoice = {
  id: string;
  label: string;
  tone: "plus" | "zero" | "minus";
};

const REFLECTION_CHOICES: ReflectionChoice[] = [
  { id: "plus-strong", label: "プラス（手応え大）", tone: "plus" },
  { id: "plus-soft", label: "プラス（小さな前進）", tone: "plus" },
  { id: "zero-calm", label: "ゼロ（落ち着いている）", tone: "zero" },
  { id: "zero-hold", label: "ゼロ（様子見）", tone: "zero" },
  { id: "minus-soft", label: "マイナス（少し重い）", tone: "minus" },
  { id: "minus-strong", label: "マイナス（停滞感）", tone: "minus" },
];

const FIXED_QUESTIONS = [
  "今この場で、安心して話せることはどこまでですか？",
  "話題の扱われ方を少し変えるなら、どこから試せますか？",
];

const REFLECTION_MESSAGE: Record<ReflectionChoice["tone"], string> = {
  plus: "小さな変化を言葉にできています。次の一歩は軽く選べます。",
  zero: "今は整えるタイミングです。確認の一言だけ置いてみましょう。",
  minus: "重さがあるのは自然です。支えを増やす選択肢も検討できます。",
};

const PLACEHOLDER_CONTEXT = "会話が止まった言葉";

function buildGeneratedQuestion(context: string, rStage: string, level: string) {
  const safeContext = context.trim() || PLACEHOLDER_CONTEXT;
  return `「${safeContext}」を扱うとき、${rStage}の今は何を保留できますか？(${level})`;
}

export default function ThreeCircleBot() {
  const [stuckWords, setStuckWords] = useState("");
  const [rStage, setRStage] = useState<(typeof R_OPTIONS)[number]>("R0");
  const [energyLevel, setEnergyLevel] = useState<(typeof LV_OPTIONS)[number]>("Lv3");
  const [reflection, setReflection] = useState<ReflectionChoice | null>(null);

  const generatedQuestion = useMemo(
    () => buildGeneratedQuestion(stuckWords, rStage, energyLevel),
    [stuckWords, rStage, energyLevel]
  );

  const reflectionMessage = reflection ? REFLECTION_MESSAGE[reflection.tone] : "";

  return (
    <div className="page">
      <div className="page__inner">
        <header className="page__header">
          <p className="page__eyebrow">家族経営・対話支援プロトタイプ</p>
          <h1>1画面完結・対話支援ボード</h1>
          <p className="page__lead">
            説得せず、合意を急がず、話題の扱われ方を少しだけ変えるための設計です。
          </p>
        </header>

        <div className="grid">
          <section className="card">
            <h2>入力</h2>
            <div className="field">
              <label htmlFor="stuckWords">会話が止まった言葉</label>
              <textarea
                id="stuckWords"
                value={stuckWords}
                onChange={(event) => setStuckWords(event.target.value)}
                rows={3}
                placeholder="例：相続の話題は今は避けたい"
              />
            </div>

            <div className="field">
              <span className="field__label">家族の段階 R</span>
              <div className="radio-group">
                {R_OPTIONS.map((option) => (
                  <label key={option} className="radio">
                    <input
                      type="radio"
                      name="rStage"
                      value={option}
                      checked={rStage === option}
                      onChange={() => setRStage(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="field__label">自分の余力 Lv</span>
              <div className="radio-group">
                {LV_OPTIONS.map((option) => (
                  <label key={option} className="radio">
                    <input
                      type="radio"
                      name="energyLevel"
                      value={option}
                      checked={energyLevel === option}
                      onChange={() => setEnergyLevel(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h2>問い（1行・口に出せる長さ）</h2>
            <ol className="question-list">
              {FIXED_QUESTIONS.map((question) => (
                <li key={question}>{question}</li>
              ))}
              <li>{generatedQuestion}</li>
            </ol>
            <p className="hint">
              専門家が抱え込まないために、問いを一つずつ使います。
            </p>
          </section>

          <section className="card">
            <h2>振り返り（リボーログ）</h2>
            <div className="field">
              <span className="field__label">チェック</span>
              <div className="radio-group radio-group--stack">
                {REFLECTION_CHOICES.map((choice) => (
                  <label key={choice.id} className="radio">
                    <input
                      type="radio"
                      name="reflection"
                      value={choice.id}
                      checked={reflection?.id === choice.id}
                      onChange={() => setReflection(choice)}
                    />
                    {choice.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="message">
              {reflectionMessage || "チェックを選ぶと短いメッセージが表示されます。"}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
