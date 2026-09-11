import { useState } from "react";

export function FeedbackPrompt({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-sm text-text-dim py-6 border-t border-stone">Thanks — noted.</p>;
  }

  return (
    <div className="py-6 border-t border-stone">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-text-dim underline underline-offset-4 hover:text-text"
        >
          Can&apos;t find what you&apos;re looking for?
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSubmit(text.trim());
            setSent(true);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What are you looking for?"
            className="flex-1 bg-transparent border-b border-stone py-1 text-sm focus:outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="text-sm px-3 py-1.5 border border-ink self-start hover:bg-ink hover:text-text-inverted transition-colors"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
