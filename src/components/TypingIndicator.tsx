const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-2">
    <div className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "0ms" }} />
    <div className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "200ms" }} />
    <div className="w-2 h-2 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: "400ms" }} />
  </div>
);

export default TypingIndicator;
