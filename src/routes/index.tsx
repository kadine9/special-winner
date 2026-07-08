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
  Database,
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
    navigator.clipboard
      .writeText(content)
      .then(() => showStatus("Full buffer copied!", "success"));
  }

  function copyClean() {
    navigator.clipboard
      .writeText(fragments.join("\n"))
      .then(() => showStatus("Clean copy done!", "success"));
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
    
    const { error } = await supabase
      .from("segments")
      .delete()
      .not("id", "is", null);
      
    if (error) {
      showStatus(`Cloud delete failed: ${error.message}`, "error");
    } else {
      showStatus("Cleared everything from the cloud!", "success");
    }
  }

  function copyFragment(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => showStatus("Segment copied!", "success"));
  }

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-[#f8fafc] p-4 md:p-10 pb-24 font-sans text-slate-900 selection:bg-indigo-100"
      style={{
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Floating scroll nav */}
      <div className="fixed bottom-6 right-4 md:right-8 flex flex-col gap-2 z-40 opacity-40 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => scrollToId("top")}
          className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 flex items-center justify-center"
          title="Jump to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToId("bottom")}
          className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 flex items-center justify-center"
          title="Jump to Bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Cloud Configuration Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-slate-200 transform ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 p-6 flex flex-col gap-4`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Cloud Sync</h3>
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm flex-grow">
          <p className="text-slate-500 leading-relaxed">
            Segments sync directly to your cloud database.
          </p>
          <div className="mt-2 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-600 group-hover:text-slate-900 select-none">
                Enable Auto-Sync
              </span>
            </label>
            <p className="text-[11px] text-slate-400 ml-7 mt-0.5">
              Saves segments automatically when typing pauses.
            </p>
          </div>
          <button
            onClick={() => syncToCloud()}
            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <CloudUpload className="w-4 h-4" />
            Sync Now
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-slate-950">
              ClipMaster <span className="text-indigo-600">Pro</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Smart cloud-only segmenting for your workflow.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-semibold shadow-sm"
            >
              <Database className="w-4 h-4 text-slate-400" />
              Cloud Options
            </button>
            <button
              onClick={copyClean}
              className="flex items-center gap-2.5 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-2xl font-semibold"
            >
              <Zap className="w-4 h-4" />
              Copy Clean
            </button>
            <button
              onClick={copyCleanSpaced}
              className="flex items-center gap-2.5 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-2xl font-semibold"
            >
              <AlignJustify className="w-4 h-4" />
              Copy Clean (1 space)
            </button>
            <button
              onClick={copyCleanNoNewlines}
              className="flex items-center gap-2.5 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-2xl font-semibold"
            >
              <Minus className="w-4 h-4" />
              Copy Clean (no newlines)
            </button>
            <button
              onClick={copyAll}
              className="flex items-center gap-2.5 px-6 py-3 bg-slate-950 text-white rounded-2xl font-semibold"
            >
              <Copy className="w-4 h-4" />
              Copy All Content
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto">
          <section className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Master Input
                </label>
                <button
                  onClick={() => editorRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
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
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {content.length} characters
              </span>
            </div>
            
            {isLoading ? (
              <div className="w-full h-[55vh] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">Fetching from cloud database...</p>
              </div>
            ) : (
              <textarea
                ref={editorRef}
                value={content}
                onChange={onEditorChange}
                className="w-full h-[55vh] p-8 bg-white border border-slate-200 rounded-3xl outline-none transition-all duration-300 font-mono text-sm text-slate-700 placeholder:text-slate-300 resize-none shadow-sm focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
                placeholder="Paste items here to auto-index them..."
              />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Segmented Library
            </label>
            <div className="flex flex-col gap-4 h-[55vh] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="m-auto text-center p-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Parsing layout...</p>
                </div>
              ) : fragments.length === 0 ? (
                <div className="m-auto text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                  <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No segments detected yet.</p>
                </div>
              ) : (
                fragments.map((f, i) => (
                  <div
                    key={i}
                    id={`seg-${i}`}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-3 w-full border-b border-slate-100 mb-3 pr-2">
                      {fragments.map((_, j) => (
                        <button
                          key={j}
                          onClick={() => scrollToId(`seg-${j}`)}
                          className={`px-3 py-1 bg-white border rounded-lg text-xs font-bold shrink-0 transition-colors ${
                            j === i
                              ? "border-indigo-300 text-indigo-600"
                              : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          {j + 1}
                        </button>
                      ))}
                    </div>
                    <div id={`copy-head-${i}`} className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Segment {i + 1}
                      </span>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => scrollToId(`seg-foot-${i}`)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyFragment(f)}
                          className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-lg"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {i > 0 && (
                          <button
                            onClick={() => scrollToId(`seg-${i - 1}`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {i < fragments.length - 1 && (
                          <button
                            onClick={() => scrollToId(`seg-${i + 1}`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <pre className="text-xs text-slate-600 font-mono break-words whitespace-pre-wrap flex-grow">
                      {f}
                    </pre>
                    <div id={`seg-foot-${i}`} className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[9px] text-slate-300 uppercase tracking-widest">
                        End of Seg {i + 1}
                      </span>
                      <button
                        onClick={() => scrollToId(`copy-head-${i}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
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

        <footer id="bottom" className="flex justify-between items-center border-t border-slate-200 pt-6">
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-500 border ${
              status ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 border-transparent"
            } ${
              status?.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : status?.type === "error"
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{status?.msg ?? "Status"}</span>
          </div>

          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear Everything
          </button>
        </footer>
      </main>
    </div>
  );
}
