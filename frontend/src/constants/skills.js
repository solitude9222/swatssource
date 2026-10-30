// ---------------------------------------------------------------------------
// Skill / Technology Tags
//
// Used in the Projects page skill picker. Each entry has an id, display name,
// category, and a short icon glyph. The picker shows `icon  name` per row.
// Users can also add custom tags not in this list.
// ---------------------------------------------------------------------------

export const SKILL_CATEGORIES = [
  { id: "languages", label: "Languages" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "database", label: "Databases" },
  { id: "devops", label: "DevOps & Cloud" },
  { id: "mobile", label: "Mobile" },
  { id: "design", label: "Design" },
  { id: "other", label: "Other" },
];

export const SKILLS = [
  // ── Languages ──────────────────────────────────────────────────────────────
  { id: "javascript", name: "JavaScript", icon: "JS", color: "#F7DF1E", category: "languages" },
  { id: "typescript", name: "TypeScript", icon: "TS", color: "#3178C6", category: "languages" },
  { id: "python", name: "Python", icon: "🐍", color: "#3776AB", category: "languages" },
  { id: "rust", name: "Rust", icon: "🦀", color: "#CE422B", category: "languages" },
  { id: "go", name: "Go", icon: "Go", color: "#00ADD8", category: "languages" },
  { id: "java", name: "Java", icon: "☕", color: "#ED8B00", category: "languages" },
  { id: "csharp", name: "C#", icon: "C#", color: "#512BD4", category: "languages" },
  { id: "cpp", name: "C++", icon: "C+", color: "#00599C", category: "languages" },
  { id: "c", name: "C", icon: "C", color: "#A8B9CC", category: "languages" },
  { id: "kotlin", name: "Kotlin", icon: "Kt", color: "#7F52FF", category: "languages" },
  { id: "swift", name: "Swift", icon: "🍎", color: "#FA7343", category: "languages" },
  { id: "php", name: "PHP", icon: "🐘", color: "#777BB4", category: "languages" },
  { id: "ruby", name: "Ruby", icon: "💎", color: "#CC342D", category: "languages" },
  { id: "lua", name: "Lua", icon: "🌙", color: "#000080", category: "languages" },
  { id: "zig", name: "Zig", icon: "⚡", color: "#F7A41D", category: "languages" },
  { id: "elixir", name: "Elixir", icon: "💧", color: "#6E4A7E", category: "languages" },
  { id: "dart", name: "Dart", icon: "🎯", color: "#0175C2", category: "languages" },
  { id: "solidity", name: "Solidity", icon: "◆", color: "#363636", category: "languages" },
  { id: "html", name: "HTML", icon: "<>", color: "#E34F26", category: "languages" },
  { id: "css", name: "CSS", icon: "🎨", color: "#1572B6", category: "languages" },

  // ── Frontend ───────────────────────────────────────────────────────────────
  { id: "react", name: "React", icon: "⚛", color: "#61DAFB", category: "frontend" },
  { id: "nextjs", name: "Next.js", icon: "▲", color: "#000000", category: "frontend" },
  { id: "vue", name: "Vue", icon: "💚", color: "#4FC08D", category: "frontend" },
  { id: "svelte", name: "Svelte", icon: "🔥", color: "#FF3E00", category: "frontend" },
  { id: "angular", name: "Angular", icon: "🅰", color: "#DD0031", category: "frontend" },
  { id: "tailwind", name: "Tailwind CSS", icon: "🌊", color: "#06B6D4", category: "frontend" },
  { id: "vite", name: "Vite", icon: "⚡", color: "#646CFF", category: "frontend" },
  { id: "astro", name: "Astro", icon: "🚀", color: "#FF5D01", category: "frontend" },
  { id: "threejs", name: "Three.js", icon: "🎲", color: "#000000", category: "frontend" },

  // ── Backend ────────────────────────────────────────────────────────────────
  { id: "nodejs", name: "Node.js", icon: "⬢", color: "#339933", category: "backend" },
  { id: "express", name: "Express", icon: "Ex", color: "#000000", category: "backend" },
  { id: "django", name: "Django", icon: "Dj", color: "#092E20", category: "backend" },
  { id: "flask", name: "Flask", icon: "🧪", color: "#000000", category: "backend" },
  { id: "fastapi", name: "FastAPI", icon: "⚡", color: "#009688", category: "backend" },
  { id: "rails", name: "Ruby on Rails", icon: "🛤", color: "#CC0000", category: "backend" },
  { id: "spring", name: "Spring Boot", icon: "🌱", color: "#6DB33F", category: "backend" },
  { id: "graphql", name: "GraphQL", icon: "◈", color: "#E10098", category: "backend" },

  // ── Databases ──────────────────────────────────────────────────────────────
  { id: "postgres", name: "PostgreSQL", icon: "🐘", color: "#4169E1", category: "database" },
  { id: "mongodb", name: "MongoDB", icon: "🍃", color: "#47A248", category: "database" },
  { id: "mysql", name: "MySQL", icon: "🐬", color: "#4479A1", category: "database" },
  { id: "redis", name: "Redis", icon: "🔴", color: "#DC382D", category: "database" },
  { id: "sqlite", name: "SQLite", icon: "📦", color: "#003B57", category: "database" },
  { id: "supabase", name: "Supabase", icon: "⚡", color: "#3ECF8E", category: "database" },
  { id: "firebase", name: "Firebase", icon: "🔥", color: "#FFCA28", category: "database" },
  { id: "prisma", name: "Prisma", icon: "🔺", color: "#2D3748", category: "database" },

  // ── DevOps & Cloud ─────────────────────────────────────────────────────────
  { id: "docker", name: "Docker", icon: "🐳", color: "#2496ED", category: "devops" },
  { id: "kubernetes", name: "Kubernetes", icon: "☸", color: "#326CE5", category: "devops" },
  { id: "aws", name: "AWS", icon: "☁", color: "#FF9900", category: "devops" },
  { id: "gcp", name: "Google Cloud", icon: "☁", color: "#4285F4", category: "devops" },
  { id: "vercel", name: "Vercel", icon: "▲", color: "#000000", category: "devops" },
  { id: "netlify", name: "Netlify", icon: "◆", color: "#00C7B7", category: "devops" },
  { id: "linux", name: "Linux", icon: "🐧", color: "#FCC624", category: "devops" },
  { id: "nginx", name: "Nginx", icon: "Nx", color: "#009639", category: "devops" },
  { id: "git", name: "Git", icon: "📝", color: "#F05032", category: "devops" },
  { id: "github_actions", name: "GitHub Actions", icon: "🐙", color: "#2088FF", category: "devops" },

  // ── Mobile ─────────────────────────────────────────────────────────────────
  { id: "react_native", name: "React Native", icon: "📱", color: "#61DAFB", category: "mobile" },
  { id: "flutter", name: "Flutter", icon: "💙", color: "#02569B", category: "mobile" },
  { id: "expo", name: "Expo", icon: "Ex", color: "#000020", category: "mobile" },

  // ── Design ─────────────────────────────────────────────────────────────────
  { id: "figma", name: "Figma", icon: "🎨", color: "#F24E1E", category: "design" },
  { id: "blender", name: "Blender", icon: "🔶", color: "#F5792A", category: "design" },
  { id: "photoshop", name: "Photoshop", icon: "Ps", color: "#31A8FF", category: "design" },
  { id: "unity", name: "Unity", icon: "🎮", color: "#000000", category: "design" },
  { id: "unreal", name: "Unreal Engine", icon: "🎮", color: "#0E1128", category: "design" },
];

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// Quick lookup by name (case-insensitive) for matching user-typed tags
export const findSkill = (input) => {
  const q = String(input || "").toLowerCase().trim();
  return SKILLS.find((s) =>
    s.id === q ||
    s.name.toLowerCase() === q ||
    s.name.toLowerCase().replace(/[^a-z0-9]/g, "") === q.replace(/[^a-z0-9]/g, "")
  ) || null;
};
