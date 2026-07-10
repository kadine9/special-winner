import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Zap,
  Trash2,
  Inbox,
  Cloud,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  CloudUpload,
  AlignJustify,
  Minus,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Floaters } from "@/components/pony/Floaters";
import { Sticker, STICKER_CYCLE } from "@/components/pony/Sticker";
import { PonyMark } from "@/components/pony/PonyMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClipMaster Pro — Smart clipboard segmenting" },
      {
        name: "description",
        content: "Paste, auto-segment, and sync clipboard snippets to the cloud. A fast scratchpad for your workflow.",
      },
    ],
  }),
  component: Index,
});

type StatusType = "success" | "error" | "info";

// A soft washi-tape colour per card position, cycling so neighbouring
// segments never clash.
const WASHI_COLORS = ["#FFD9EC", "#D9EEFF", "#FFF0C7", "#E1D6FF", "#D3F6E7"];

function Index() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: StatusType } | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lastValueRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch from cloud on mount
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("segments")
          .select("content, created_at")
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Format text with programmatic headers
          let cloudJoined = data
            .map((r, i) => `--- [Paste #${i + 1}] ---\n\n${r.content}`)
            .join("\n\n");

          // Append the final end paste marker so you can keep typing immediately
          const nextIndex = data.length + 1;
          cloudJoined += `\n\n--- [Paste #${nextIndex}] ---\n\n`;

          setContent(cloudJoined);
          lastValueRef.current = cloudJoined;
        } else {
          // Fallback template for entirely fresh databases
          const freshTemplate = "--- [Paste #1] ---\n\n";
          setContent(freshTemplate);
          lastValueRef.current = freshTemplate;
        }
      } catch (err: any) {
        showStatus(`Failed to fetch cloud data: ${err.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Compute clean segments, ignoring empty placeholders
  const fragments = useMemo(
    () =>
      content
        .split(/--- \[Paste #\d+\] ---/g)
        .map((s) => s.trim())
        .filter(Boolean),
    [content],
  );

  function showStatus(msg: string, type: StatusType) {
    setStatus({ msg, type });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(null), 2800);
  }

  async function syncToCloud(textOverride?: string) {
    const raw = (textOverride ?? content).trim();
    if (!raw) return;

    // Isolate pure segment contents, discarding formatting blocks
    const frags = raw
      .split(/--- \[Paste #\d+\] ---/g)
      .map((s) => s.trim())
      .filter(Boolean);

    // If the user hasn't typed anything new beyond raw layout flags, exit early
    if (frags.length === 0) return;

    const rows = frags.map((f) => ({ content: f }));

    // Clean overwrite payload block
    const { error: deleteError } = await supabase.from("segments").delete().not("id", "is", null);
    if (deleteError) {
      showStatus(`Sync failed (overwrite phase): ${deleteError.message}`, "error");
      return;
    }

    const { error: insertError } = await supabase.from("segments").insert(rows);
    if (insertError) {
      showStatus(`Sync failed: ${insertError.message}`, "error");
    } else {
      showStatus(`Synced ${rows.length} segment(s) to cloud!`, "success");
    }
  }

  function onEditorChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ta = e.target;
    let next = ta.value;
    const prev = lastValueRef.current;

    // Detect structural text pastes
    if (next.length > prev.length + 5) {
      const totalMarkers = (next.match(/\[Paste #\d+\]/g) || []).length;
      const marker = `\n\n--- [Paste #${totalMarkers + 1}] ---\n\n`;
      const cursor = ta.selectionStart;
      next = next.slice(0, cursor) + marker + next.slice(cursor);
      showStatus("Auto-marked segment!", "info");
    }

    lastValueRef.current = next;
    setContent(next);

    if (autoSync) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        syncToCloud(next);
      }, 1500);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(content).then(() => showStatus("Full buffer copied!", "success"));
  }

  function copyClean() {
    navigator.clipboard.writeText(fragments.join("\n")).then(() => showStatus("Clean copy done!", "success"));
  }

  function copyCleanSpaced() {
    navigator.clipboard
      .writeText(fragments.join("\n\n").trim())
      .then(() => showStatus("Clean copy (blank line) done!", "success"));
  }

  function copyCleanNoNewlines() {
    // Join every segment with a single space and collapse any internal
    // newlines/whitespace so the result is one continuous line.
    const joined = fragments
      .map((f) => f.replace(/\s+/g, " ").trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    navigator.clipboard
      .writeText(joined)
      .then(() => showStatus("Clean copy (single line, spaced) done!", "success"));
  }

  async function clearAll() {
    const freshTemplate = "--- [Paste #1] ---\n\n";
    setContent(freshTemplate);
    lastValueRef.current = freshTemplate;

    const { error } = await supabase.from("segments").delete().not("id", "is", null);

    if (error) {
      showStatus(`Cloud delete failed: ${error.message}`, "error");
    } else {
      showStatus("Cleared everything from the cloud!", "success");
    }
  }

  function copyFragment(text: string) {
    navigator.clipboard.writeText(text).then(() => showStatus("Segment copied!", "success"));
  }

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pillBase =
    "inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap";

  return (
    <div
      id="top"
      className="relative min-h-screen font-body text-foreground selection:bg-primary/20 overflow-x-clip"
      style={{
        background:
          "linear-gradient(180deg, #EAF2FF 0%, #F3EEFF 38%, #FFEAF4 78%, #FFF3DA 100%)",
      }}
    >
      {/* Ambient floating clouds, stars & sparkles */}
      <Floaters />

      <div className="relative z-10 p-4 sm:p-6 md:p-10 pb-28">
        {/* Floating scroll nav */}
        <div className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-2 z-40 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => scrollToId("top")}
            className="p-3 bg-gradient-to-br from-primary to-rose text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center active:scale-90 transition-transform"
            title="Jump to Top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollToId("bottom")}
            className="p-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center active:scale-90 transition-transform"
            title="Jump to Bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Configuration panel — bottom sheet on mobile, side panel on desktop */}
        <div
          className={`fixed z-50 bg-white shadow-2xl border-border transition-transform duration-300 ease-in-out
            inset-x-0 bottom-0 rounded-t-[2rem] border-t p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto
            sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:w-96 sm:max-h-none sm:rounded-t-none sm:rounded-l-[2rem] sm:border-t-0 sm:border-l
            ${panelOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
        >
          <div className="sm:hidden mx-auto h-1.5 w-12 rounded-full bg-border" />
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground text-lg">Cloud Sync</h3>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-3 text-sm flex-grow">
            <p className="text-muted-foreground leading-relaxed">
              Segments sync directly to your cloud database.
            </p>
            <div className="mt-2 pt-4 border-t border-border/70">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded focus:ring-primary"
                />
                <span className="font-semibold text-foreground/80 group-hover:text-foreground select-none">
                  Enable Auto-Sync
                </span>
              </label>
              <p className="text-[11px] text-muted-foreground ml-7 mt-0.5">
                Saves segments automatically when typing pauses.
              </p>
            </div>
            <button
              onClick={() => syncToCloud()}
              className="mt-4 w-full py-3 bg-gradient-to-r from-primary to-rose hover:brightness-105 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
            >
              <CloudUpload className="w-4 h-4" />
              Sync Now
            </button>
          </div>
        </div>
        {panelOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] sm:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}

        <main className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <header className="relative rounded-[2rem] border border-border/70 bg-white/70 backdrop-blur-sm p-5 sm:p-8 shadow-[0_20px_45px_-20px_rgba(184,95,204,0.35)] flex flex-col gap-5">
            <Sticker variant="star" size="md" rotate={-14} className="-top-4 -left-3 sm:-top-5 sm:-left-5" />
            <Sticker
              variant="rainbow"
              size="lg"
              rotate={8}
              className="-top-5 -right-4 hidden sm:flex"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0 grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-rose text-white shadow-md">
                  <PonyMark className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                    ClipMaster <span className="text-primary">Pro</span>
                  </h1>
                  <p className="text-muted-foreground font-medium mt-0.5 text-xs sm:text-base">
                    Smart cloud-sync scrapbook for your clipboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPanelOpen(true)}
                className={`${pillBase} bg-white border border-border text-foreground/70 shadow-sm`}
              >
                <Cloud className="w-4 h-4 text-secondary" />
                Cloud Options
              </button>
              <button onClick={copyClean} className={`${pillBase} bg-primary/10 text-primary`}>
                <Zap className="w-4 h-4" />
                Copy Clean
              </button>
              <button onClick={copyCleanSpaced} className={`${pillBase} bg-secondary/15 text-secondary-foreground`}>
                <AlignJustify className="w-4 h-4" />
                Copy Clean (1 space)
              </button>
              <button onClick={copyCleanNoNewlines} className={`${pillBase} bg-mint/15 text-mint-foreground`}>
                <Minus className="w-4 h-4" />
                Copy Clean (no newlines)
              </button>
              <button
                onClick={copyAll}
                className={`${pillBase} bg-gradient-to-r from-primary to-rose text-white shadow-md`}
              >
                <Copy className="w-4 h-4" />
                Copy All Content
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 h-auto">
            {/* Master input */}
            <section className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Master Input
                  </label>
                  <button
                    onClick={() => editorRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    className="p-1 text-muted-foreground hover:text-primary rounded"
                  >
                    <ArrowUpToLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() =>
                      editorRef.current?.scrollTo({
                        top: editorRef.current.scrollHeight,
                        behavior: "smooth",
                      })
                    }
                    className="p-1 text-muted-foreground hover:text-primary rounded"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{content.length} characters</span>
              </div>

              {isLoading ? (
                <div className="cloud-card w-full h-[50vh] sm:h-[55vh] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Fetching from cloud database...</p>
                </div>
              ) : (
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={onEditorChange}
                  className="w-full h-[50vh] sm:h-[55vh] p-5 sm:p-8 bg-white/90 border-2 border-border rounded-[1.75rem] outline-none transition-all duration-300 font-mono text-sm text-foreground/90 placeholder:text-muted-foreground/60 resize-none shadow-sm focus:shadow-[0_0_0_4px_rgba(184,95,204,0.18)] focus:border-primary/50"
                  placeholder="Paste items here to auto-index them..."
                />
              )}
            </section>

            {/* Segmented library */}
            <section className="flex flex-col gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Segmented Library
              </label>
              <div className="flex flex-col gap-5 h-[50vh] sm:h-[55vh] overflow-y-auto pr-1 pt-2">
                {isLoading ? (
                  <div className="m-auto text-center p-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary/60" />
                    <p className="text-xs">Parsing layout...</p>
                  </div>
                ) : fragments.length === 0 ? (
                  <div className="m-auto text-center p-8 border-2 border-dashed border-border rounded-[1.75rem] text-muted-foreground">
                    <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
                    <p className="text-sm">No segments detected yet.</p>
                  </div>
                ) : (
                  fragments.map((f, i) => (
                    <div
                      key={i}
                      id={`seg-${i}`}
                      className="cloud-card p-5 pt-6 hover:shadow-[0_16px_36px_-14px_rgba(184,95,204,0.35)] transition-shadow flex flex-col"
                    >
                      <div
                        className="washi-tape"
                        style={{ background: WASHI_COLORS[i % WASHI_COLORS.length] }}
                      />
                      <Sticker
                        variant={STICKER_CYCLE[i % STICKER_CYCLE.length]}
                        size="sm"
                        rotate={i % 2 === 0 ? -12 : 12}
                        className="-top-3 -right-3"
                      />

                      <div className="flex gap-2 overflow-x-auto pb-3 w-full border-b border-border/70 mb-3 pr-2">
                        {fragments.map((_, j) => (
                          <button
                            key={j}
                            onClick={() => scrollToId(`seg-${j}`)}
                            className={`px-3 py-1 bg-white border rounded-lg text-xs font-bold shrink-0 transition-colors ${
                              j === i
                                ? "border-primary/40 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            }`}
                          >
                            {j + 1}
                          </button>
                        ))}
                      </div>
                      <div id={`copy-head-${i}`} className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                          Segment {i + 1}
                        </span>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => scrollToId(`seg-foot-${i}`)}
                            className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => copyFragment(f)}
                            className="p-1.5 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-lg"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {i > 0 && (
                            <button
                              onClick={() => scrollToId(`seg-${i - 1}`)}
                              className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {i < fragments.length - 1 && (
                            <button
                              onClick={() => scrollToId(`seg-${i + 1}`)}
                              className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs text-foreground/80 font-mono break-words whitespace-pre-wrap flex-grow">
                        {f}
                      </pre>
                      <div id={`seg-foot-${i}`} className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                          End of Seg {i + 1}
                        </span>
                        <button
                          onClick={() => scrollToId(`copy-head-${i}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5" />
                          Jump to Copy
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <footer
            id="bottom"
            className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-border/70 pt-6"
          >
            <div
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-500 border ${
                status ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 border-transparent"
              } ${
                status?.type === "success"
                  ? "bg-mint/15 text-mint-foreground border-mint/30"
                  : status?.type === "error"
                    ? "bg-destructive/10 text-destructive border-destructive/25"
                    : "bg-primary/10 text-primary border-primary/25"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{status?.msg ?? "Status"}</span>
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear Everything
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
