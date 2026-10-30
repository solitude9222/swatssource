import { useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import {
  SECTION_TYPES, SECTION_TYPE_MAP, SECTION_LAYOUTS, NAVIGATOR_STYLES,
  INDICATOR_ICONS, DEFAULT_SECTION_SETTINGS, blankSection, blankSectionItem,
} from "@/constants/sections";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ColorPicker";
import {
  Plus, Trash2, Save, GripVertical, Search, ChevronDown, ChevronRight,
  Loader2, X, Star, Check, Eye, Settings as SettingsIcon, ArrowLeft,
} from "lucide-react";

function SectionItemSearch({ type, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const searchApi = SECTION_TYPE_MAP[type]?.searchApi;

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2 || !searchApi) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(searchApi, { params: { q } });
      setResults(Array.isArray(data) ? data.slice(0, 15) : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [searchApi]);

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(v), 350);
  };

  if (!searchApi) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={`Search ${SECTION_TYPE_MAP[type]?.label || type}...`}
          className="w-full h-9 rounded-xl border border-white/10 bg-black/50 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#b4bffa]/50"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-white/10 bg-[#0a0a0c] p-1.5">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onAdd({
                  ...blankSectionItem(type),
                  id: `item_${item.id}`,
                  name: item.name,
                  cover: item.cover,
                  subtitle: item.subtitle,
                  genre: item.genre || "",
                  rating: item.rating,
                  url: item.url,
                });
                setQuery("");
                setResults([]);
              }}
              className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-white/[0.06] transition text-left cursor-pointer"
            >
              {item.cover ? (
                <img src={item.cover} alt="" className="w-8 h-10 rounded-md object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="w-8 h-10 rounded-md bg-zinc-800 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">{item.subtitle || item.genre}</div>
              </div>
              {item.rating != null && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-amber-300">{item.rating}</span>
                </div>
              )}
              <Plus className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, onChange, onBack }) {
  const stype = SECTION_TYPE_MAP[section.type];
  const Icon = stype?.icon || ChevronRight;
  const settings = section.settings || DEFAULT_SECTION_SETTINGS;

  const updateSettings = (key, value) => {
    onChange({ ...section, settings: { ...settings, [key]: value } });
  };

  const addItem = (item) => {
    onChange({ ...section, items: [...section.items, item] });
  };

  const removeItem = (idx) => {
    onChange({ ...section, items: section.items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to sections
        </button>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: stype?.color }} />
          <span className="text-sm font-bold text-white">{section.title || stype?.label}</span>
        </div>
      </div>

      {/* Section title */}
      <div>
        <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Section title</label>
        <input
          type="text"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="w-full h-9 rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white outline-none focus:border-[#b4bffa]/50"
        />
      </div>

      {/* Search & add items */}
      <div>
        <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
          Add {stype?.label || "items"} ({section.items.length} added)
        </label>
        <SectionItemSearch type={section.type} onAdd={addItem} />
      </div>

      {/* Current items */}
      {section.items.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400 block">Added items</label>
          {section.items.map((item, i) => (
            <div key={item.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-[#0c0c0e] border border-white/[0.06]">
              {item.cover ? (
                <img src={item.cover} alt="" className="w-7 h-9 rounded object-cover shrink-0" />
              ) : (
                <div className="w-7 h-9 rounded bg-zinc-800 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white truncate">{item.name}</div>
                <div className="text-[9px] text-zinc-500 truncate">{item.genre || item.subtitle}</div>
              </div>
              {item.rating != null && (
                <span className="text-[9px] font-bold text-amber-300 shrink-0">{item.rating}★</span>
              )}
              <button type="button" onClick={() => removeItem(i)} className="p-1 text-zinc-600 hover:text-red-400 transition cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section settings */}
      <div className="space-y-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="w-3.5 h-3.5 text-zinc-400" />
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Section settings</label>
        </div>

        {/* Layout mode */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Layout</label>
          <div className="flex gap-1.5">
            {SECTION_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => updateSettings("layout", l.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                  settings.layout === l.id
                    ? "border-[#b4bffa]/50 bg-[#b4bffa]/15 text-white"
                    : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll animations */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-300">Scroll animations</span>
          <Switch checked={settings.scroll_animations !== false} onCheckedChange={(c) => updateSettings("scroll_animations", c)} />
        </div>

        {settings.scroll_animations && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-300">
              <span>Animation duration</span>
              <span className="font-mono text-zinc-400">{settings.animation_duration || 400}ms</span>
            </div>
            <Slider min={100} max={1000} step={50} value={[settings.animation_duration || 400]} onValueChange={([v]) => updateSettings("animation_duration", v)} />
          </div>
        )}

        {/* Title/desc colors */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-300">Title color</span>
          <ColorPicker value={settings.title_color || "#FFFFFF"} onChange={(hex) => updateSettings("title_color", hex)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-300">Description color</span>
          <ColorPicker value={settings.desc_color || "#D1D5DB"} onChange={(hex) => updateSettings("desc_color", hex)} />
        </div>

        {/* Navigator */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Navigator style</label>
          <div className="flex gap-1.5">
            {NAVIGATOR_STYLES.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => updateSettings("navigator_style", n.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                  settings.navigator_style === n.id
                    ? "border-[#b4bffa]/50 bg-[#b4bffa]/15 text-white"
                    : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-300">Scroll-for-more indicator</span>
          <Switch checked={settings.show_scroll_indicator !== false} onCheckedChange={(c) => updateSettings("show_scroll_indicator", c)} />
        </div>
      </div>
    </div>
  );
}

export default function Sections() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();
  const [sections, setSections] = useState(user.profile?.sections || []);
  const [editing, setEditing] = useState(null); // index of section being edited
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const dirty = JSON.stringify(sections) !== JSON.stringify(user.profile?.sections || []);

  const addSection = (typeId) => {
    const sec = blankSection(typeId);
    setSections([...sections, sec]);
    setEditing(sections.length);
  };

  const updateSection = (idx, updated) => {
    setSections(sections.map((s, i) => i === idx ? updated : s));
  };

  const removeSection = (idx) => {
    if (!window.confirm("Remove this section?")) return;
    setSections(sections.filter((_, i) => i !== idx));
    if (editing === idx) setEditing(null);
  };

  const moveSection = (from, to) => {
    if (from === to || to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSections(next);
  };

  const saveAll = async () => {
    if (gate.guard("saving sections")) return;
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", { sections });
      setUser(data);
      toast.success("Sections saved!");
    } catch {
      toast.error("Failed to save sections");
    }
    setSaving(false);
  };

  // If editing a section, show its editor
  if (editing != null && sections[editing]) {
    return (
      <div className="w-full space-y-6 pb-24" data-testid="sections-page">
        <SectionEditor
          section={sections[editing]}
          onChange={(updated) => updateSection(editing, updated)}
          onBack={() => setEditing(null)}
        />
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#050505]/95 backdrop-blur-xl p-3 shadow-xl">
            <span className="text-xs text-zinc-400">{sections[editing].items.length} items configured</span>
            <button onClick={saveAll} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#b4bffa] px-4 py-2 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24" data-testid="sections-page">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Sections</h1>
        <p className="text-xs text-zinc-500 mt-1">Add scroll-snap pages below your profile card — games, music, anime, projects and more.</p>
      </div>

      {/* Add section buttons */}
      <div className="rounded-xl border border-white/[0.07] bg-[#111113] p-4 space-y-3">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Add section</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SECTION_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => addSection(t.id)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] hover:border-white/15 hover:bg-[#141416] transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${t.color}18`, borderColor: `${t.color}30` }}>
                  <Icon className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-white transition">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active sections list */}
      <div className="rounded-xl border border-white/[0.07] bg-[#111113] p-4 space-y-3">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Active sections ({sections.length})</h2>
        {sections.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/[0.07] rounded-xl">
            <p className="text-xs text-zinc-500">No sections added yet. Add one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sections.map((sec, i) => {
              const stype = SECTION_TYPE_MAP[sec.type] || {};
              const Icon = stype.icon || ChevronRight;
              return (
                <div
                  key={sec.id || i}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { moveSection(dragIdx, i); setDragIdx(null); }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    dragIdx === i ? "border-[#b4bffa]/40 opacity-50" : "border-white/[0.06] bg-[#0c0c0e] hover:border-white/15"
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab shrink-0" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stype.color || "#666"}18` }}>
                    <Icon className="w-4 h-4" style={{ color: stype.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{sec.title || stype.label}</div>
                    <div className="text-[10px] text-zinc-500">{sec.items?.length || 0} items</div>
                  </div>
                  <Switch
                    checked={sec.enabled !== false}
                    onCheckedChange={(c) => updateSection(i, { ...sec, enabled: c })}
                    className="shrink-0"
                  />
                  <button onClick={() => setEditing(i)} className="p-1.5 text-zinc-500 hover:text-white transition cursor-pointer">
                    <SettingsIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeSection(i)} className="p-1.5 text-zinc-500 hover:text-red-400 transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#050505]/95 backdrop-blur-xl p-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-200 font-semibold">Unsaved changes</span>
            </div>
            <button onClick={saveAll} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#b4bffa] px-4 py-2 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save sections
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
