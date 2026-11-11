import { useState } from "react";
import { EXAMPLE_GOALS } from "../data/capabilities";

interface Props {
  onCompose: (goal: string) => void;
}

export function GoalInput({ onCompose }: Props) {
  const [goal, setGoal] = useState("");

  return (
    <section className="cd-dotted flex min-h-[calc(100vh-112px)] items-center px-8 py-16">
      <div className="cd-fade-up mx-auto w-full max-w-2xl">
        <p className="cd-eyebrow mb-4">Try it yourself</p>
        <h1 className="cd-h1 mb-4">What do you want to get done in your clinic?</h1>
        <p className="cd-lede mb-8 max-w-[52ch]">
          Describe the outcome in your own words. A Corti agent picks the capability and shows the
          primitives it’s built from.
        </p>

        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (goal.trim()) onCompose(goal.trim());
          }}
        >
          <input
            className="cd-input min-w-0 flex-1"
            type="text"
            placeholder="e.g. Stop typing notes during my consultations…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            autoFocus
          />
          <button className="cd-btn-primary !h-12 !px-5" type="submit" disabled={!goal.trim()}>
            Compose →
          </button>
        </form>

        <p className="cd-tag mb-3 mt-8">Or try one of these</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_GOALS.map(({ goal: g }) => (
            <button key={g} type="button" className="cd-chip" onClick={() => onCompose(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
