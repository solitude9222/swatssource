import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { useEditGate } from "@/hooks/useEditGate";
import { SKILLS, SKILL_CATEGORIES, findSkill } from "@/constants/skills";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, Save, GripVertical, X, Loader2, Upload, ExternalLink,
  FolderGit2, Pause, Play, Search, Check, ArrowLeft, Image as ImageIcon,
} from "lucide-react";

const MAX_PROJECTS = 25;
const MAX_TAGS = 3;
const MAX_TAG_LEN = 32;
const MAX_DESC = 280;

function SkillPicker({ selected, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = query.toLowerCase().trim();

  const filtered = q
    ? SKILLS.filter((s) =>
        !selected.includes(s.id) &&
        (s.name.toLowerCase().includes(q) || s.id.includes(q))
      ).slice(0, 12)
    : [];

  const addCustom = () => {
    const tag = query.trim().slice(0, MAX_TAG_LEN);
    if (tag && selected.length < MAX_TAGS && !selected.includes(tag)) {
      onAdd(tag);
      setQuery("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((id) => {
          const skill = findSkill(id);
          return (
            <span key={id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-white">
              {skill && <span className="text-[10px]" style={{ color: skill.color }}>{skill.icon}</span>}
              <span>{skill?.name || id}</span>
              <button type="button" onClick={() => onRemove(id)} className="text-zinc-500 hover:text-red-400 transition cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
      </div>

      {selected.length < MAX_TAGS && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Add a skill..."
            className="w-full h-8 rounded-lg border border-white/10 bg-black/50 pl-8 pr-3 text-[11px] text-white placeholder-zinc-500 outline-none focus:border-[#b4bffa]/40"
          />

          {open && q && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0c] shadow-xl">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onAdd(s.id); setQuery(""); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-white/[0.05] transition cursor-pointer"
                >
                  <span className="text-xs w-5 text-center shrink-0" style={{ color: s.color }}>{s.icon}</span>
                  <span className="text-[11px] font-medium text-zinc-200">{s.name}</span>
                  <span className="text-[9px] text-zinc-600 ml-auto">{s.category}</span>
                </button>
              ))}
            </div>
          )}

          {open && q && filtered.length === 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-white/10 bg-[#0a0a0c] p-2 shadow-xl">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addCustom}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-white/[0.05] transition cursor-pointer text-left"
              >
                <Plus className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] text-zinc-300">Add custom tag "<strong className="text-white">{query.trim().slice(0, MAX_TAG_LEN)}</strong>"</span>
              </button>
            </div>
          )}
        </div>
      )}
      <p className="text-[9px] text-zinc-600">Up to {MAX_TAGS} tags, {MAX_TAG_LEN} characters each.</p>
    </div>
  );
}

function AddProjectModal({ onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState([]);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "project");
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImage(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const submit = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    onAdd({
      id: `proj_${Date.now()}`,
      title: title.trim(),
      url: url.trim(),
      description: desc.trim(),
      tags,
      image,
      enabled: true,
      created_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0c] p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white">Add project</h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-zinc-500">Showcase a project with a title, description, tags, URL, and optional image.</p>

        {/* Image upload */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1.5 block">Image (optional)</label>
          {image ? (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
              <img src={fileUrl(image)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setImage("")} className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-zinc-300 hover:text-white transition cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              {uploading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : <Upload className="w-4 h-4 text-zinc-500" />}
              <span className="text-[10px] text-zinc-500">Drop a file here or click to browse</span>
              <span className="text-[9px] text-zinc-600">JPG, PNG, GIF, or WebP. Max 10 MB.</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My side project" className="w-full h-9 rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]/40" />
        </div>

        {/* URL */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full h-9 rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]/40" />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Description <span className="text-zinc-600">{desc.length}/{MAX_DESC}</span></label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value.slice(0, MAX_DESC))}
            placeholder="What does it do?"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]/40 resize-none"
          />
        </div>

        {/* Tags / Skills */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Tags</label>
          <SkillPicker selected={tags} onAdd={(t) => setTags([...tags, t])} onRemove={(t) => setTags(tags.filter((x) => x !== t))} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button>
          <button onClick={submit} className="px-5 py-2 rounded-xl bg-[#b4bffa] text-xs font-bold text-black hover:brightness-110 transition cursor-pointer">Add project</button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user, setUser } = useAuth();
  const gate = useEditGate();
  const [projects, setProjects] = useState(user.profile?.projects || []);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const dirty = JSON.stringify(projects) !== JSON.stringify(user.profile?.projects || []);

  const addProject = (proj) => {
    if (projects.length >= MAX_PROJECTS) { toast.error(`Maximum ${MAX_PROJECTS} projects`); return; }
    setProjects([...projects, proj]);
  };

  const removeProject = (idx) => {
    if (!window.confirm("Remove this project?")) return;
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const toggleProject = (idx) => {
    setProjects(projects.map((p, i) => i === idx ? { ...p, enabled: !p.enabled } : p));
  };

  const moveProject = (from, to) => {
    if (from === to || to < 0 || to >= projects.length) return;
    const next = [...projects];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setProjects(next);
  };

  const saveAll = async () => {
    if (gate.guard("saving projects")) return;
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", { projects });
      setUser(data);
      toast.success("Projects saved!");
    } catch {
      toast.error("Failed to save projects");
    }
    setSaving(false);
  };

  return (
    <div className="w-full space-y-5 pb-24" data-testid="projects-page">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Profile Projects</h1>
        <p className="text-xs text-zinc-500 mt-1">Create and organize the projects available to Section Builder.</p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-[#b4bffa]/20 bg-[#b4bffa]/[0.04] p-3.5 flex items-start gap-3">
        <FolderGit2 className="w-4 h-4 text-[#b4bffa] shrink-0 mt-0.5" />
        <div className="text-[11px] text-zinc-300 leading-relaxed">
          <strong className="text-white">Projects live in Section Builder</strong> — Projects appear publicly only after you add them to an active Projects section.{" "}
          <Link to="/!/dashboard/sections" className="text-[#b4bffa] hover:underline">Open Section Builder.</Link>
        </div>
      </div>

      {/* Projects list */}
      <div className="rounded-xl border border-white/[0.07] bg-[#111113] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Your projects ({projects.length}/{MAX_PROJECTS})
          </h2>
          <span className="text-[9px] text-zinc-600">Drag to reorder. Paused projects stay saved for later.</span>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={() => projects.length < MAX_PROJECTS && setShowAdd(true)}
          disabled={projects.length >= MAX_PROJECTS}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/20 transition cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add project
        </button>

        {projects.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/[0.06] rounded-xl">
            <FolderGit2 className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No projects yet</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Add your first project to start building your portfolio.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projects.map((proj, i) => {
              const paused = proj.enabled === false;
              return (
                <div
                  key={proj.id || i}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { moveProject(dragIdx, i); setDragIdx(null); }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    dragIdx === i ? "border-[#b4bffa]/40 opacity-50" : paused ? "border-white/[0.04] bg-[#0a0a0c] opacity-60" : "border-white/[0.06] bg-[#0c0c0e]"
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab shrink-0" />

                  {proj.image ? (
                    <img src={fileUrl(proj.image)} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/[0.06] flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{proj.title}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{proj.url || proj.description || "No URL"}</div>
                    {proj.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {proj.tags.map((t) => {
                          const skill = findSkill(t);
                          return (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/[0.05] border border-white/[0.06] text-zinc-300">
                              {skill ? `${skill.icon} ${skill.name}` : t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button onClick={() => toggleProject(i)} className="p-1.5 text-zinc-500 hover:text-white transition cursor-pointer" title={paused ? "Resume" : "Pause"}>
                    {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noreferrer" className="p-1.5 text-zinc-500 hover:text-white transition">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => removeProject(i)} className="p-1.5 text-zinc-500 hover:text-red-400 transition cursor-pointer">
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
              Save projects
            </button>
          </div>
        </div>
      )}

      {showAdd && <AddProjectModal onAdd={addProject} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
