import clsx from "clsx";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={clsx(
              "block w-1.5 h-1.5 bg-c5",
              "animate-[typing-dot_1.4s_ease-in-out_infinite]"
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-c5 font-mono">Veil is thinking...</span>
    </div>
  );
}
