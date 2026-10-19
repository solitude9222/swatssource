import { query } from './db.js';
import { xpForUser } from './ranks.js';

export const DEFAULT_RANK_TIERS = [
  {
    id: 'rookie',
    name: 'Rookie',
    min: 0,
    minViews: 0,
    color: '#a1a1aa',
    badge: 'rank_rookie',
    blurb: 'Just getting started',
    stages: [
      { stage: 1, name: 'Rookie', minViews: 0, minXp: 0 },
    ],
  },
  {
    id: 'bronze',
    name: 'Bronze',
    min: 150,
    minViews: 50,
    color: '#cd7f32',
    badge: 'rank_bronze',
    blurb: 'A page taking shape',
    stages: [
      { stage: 1, name: 'Bronze I', minViews: 50, minXp: 150 },
      { stage: 2, name: 'Bronze II', minViews: 120, minXp: 250 },
      { stage: 3, name: 'Bronze III', minViews: 250, minXp: 380 },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    min: 500,
    minViews: 400,
    color: '#cbd5e1',
    badge: 'rank_silver',
    blurb: 'Filled in and visited',
    stages: [
      { stage: 1, name: 'Silver I', minViews: 400, minXp: 500 },
      { stage: 2, name: 'Silver II', minViews: 650, minXp: 750 },
      { stage: 3, name: 'Silver III', minViews: 950, minXp: 1050 },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    min: 1400,
    minViews: 1400,
    color: '#fbbf24',
    badge: 'rank_gold',
    blurb: 'A page people come back to',
    stages: [
      { stage: 1, name: 'Gold I', minViews: 1400, minXp: 1400 },
      { stage: 2, name: 'Gold II', minViews: 2000, minXp: 1900 },
      { stage: 3, name: 'Gold III', minViews: 2800, minXp: 2500 },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    min: 3200,
    minViews: 3800,
    color: '#22d3ee',
    badge: 'rank_platinum',
    blurb: 'A recognised profile',
    stages: [
      { stage: 1, name: 'Platinum I', minViews: 3800, minXp: 3200 },
      { stage: 2, name: 'Platinum II', minViews: 5200, minXp: 4200 },
      { stage: 3, name: 'Platinum III', minViews: 7000, minXp: 5300 },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    min: 6500,
    minViews: 9500,
    color: '#a855f7',
    badge: 'rank_diamond',
    blurb: 'One of the big pages',
    stages: [
      { stage: 1, name: 'Diamond I', minViews: 9500, minXp: 6500 },
      { stage: 2, name: 'Diamond II', minViews: 14000, minXp: 8000 },
      { stage: 3, name: 'Diamond III', minViews: 20000, minXp: 9800 },
    ],
  },
  {
    id: 'master',
    name: 'Master',
    min: 12000,
    minViews: 30000,
    color: '#ec4899',
    badge: 'rank_master',
    blurb: 'Elite creator status',
    stages: [
      { stage: 1, name: 'Master I', minViews: 30000, minXp: 12000 },
      { stage: 2, name: 'Master II', minViews: 45000, minXp: 16000 },
    ],
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    min: 22000,
    minViews: 65000,
    color: '#f43f5e',
    badge: 'rank_grandmaster',
    blurb: 'Apex platform tier',
    stages: [
      { stage: 1, name: 'Grandmaster', minViews: 65000, minXp: 22000 },
    ],
  },
  {
    id: 'legend',
    name: 'Legend',
    min: 35000,
    minViews: 100000,
    color: '#A48DF4',
    badge: 'rank_legend',
    blurb: 'The top of the site',
    stages: [
      { stage: 1, name: 'Legend', minViews: 100000, minXp: 35000 },
    ],
  },
];

export const ALL_RANK_BADGE_IDS = [
  'rank_rookie',
  'rank_bronze',
  'rank_silver',
  'rank_gold',
  'rank_platinum',
  'rank_diamond',
  'rank_master',
  'rank_grandmaster',
  'rank_legend',
];

export const DEFAULT_RANKED_CONFIG = {
  enabled: true,
  auto_grant_badges: true,
  count_metric: 'views', // 'views' or 'hybrid'
  tiers: DEFAULT_RANK_TIERS,
};

export async function loadRankedSettings() {
  try {
    const { rows } = await query("SELECT value FROM site_settings WHERE key = 'ranked_settings'");
    if (!rows.length || !rows[0]?.value) {
      return DEFAULT_RANKED_CONFIG;
    }
    const val = rows[0].value;
    return {
      enabled: val.enabled !== false,
      auto_grant_badges: val.auto_grant_badges !== false,
      count_metric: val.count_metric || 'views',
      tiers: Array.isArray(val.tiers) && val.tiers.length ? val.tiers : DEFAULT_RANK_TIERS,
    };
  } catch (err) {
    return DEFAULT_RANKED_CONFIG;
  }
}

export async function saveRankedSettings(config) {
  const sanitized = {
    enabled: config.enabled !== false,
    auto_grant_badges: config.auto_grant_badges !== false,
    count_metric: config.count_metric === 'hybrid' ? 'hybrid' : 'views',
    tiers: Array.isArray(config.tiers) && config.tiers.length ? config.tiers : DEFAULT_RANK_TIERS,
    updated_at: new Date().toISOString(),
  };

  await query(
    `INSERT INTO site_settings (key, value) VALUES ('ranked_settings', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [sanitized],
  );

  return sanitized;
}

/**
 * Flattens tiers into an ordered sequence of stages
 */
export function flattenStages(tiers = DEFAULT_RANK_TIERS) {
  const list = [];
  for (const t of tiers) {
    const stages = Array.isArray(t.stages) && t.stages.length
      ? t.stages
      : [{ stage: 1, name: t.name, minViews: t.minViews || t.min || 0, minXp: t.min || 0 }];
    for (const s of stages) {
      list.push({
        tierId: t.id,
        tierName: t.name,
        color: t.color,
        badge: t.badge,
        blurb: t.blurb,
        stageNumber: s.stage,
        stageName: s.name,
        minViews: Number(s.minViews ?? s.min ?? 0),
        minXp: Number(s.minXp ?? s.min ?? 0),
      });
    }
  }
  return list.sort((a, b) => a.minViews - b.minViews);
}

/**
 * Computes full stage, tier, views progress, and rank badge for a user
 */
export function computeRankDetails(user, config = DEFAULT_RANKED_CONFIG, now = new Date()) {
  const tiers = Array.isArray(config?.tiers) && config.tiers.length ? config.tiers : DEFAULT_RANK_TIERS;
  const stages = flattenStages(tiers);
  const views = Math.max(0, parseInt(user?.views, 10) || 0);
  const xp = xpForUser(user, now);

  // Match active stage by views
  let activeStageIndex = 0;
  for (let i = 0; i < stages.length; i += 1) {
    if (views >= stages[i].minViews) {
      activeStageIndex = i;
    }
  }

  // Also check if user holds a manually assigned rank badge
  const userBadges = Array.isArray(user?.badges) ? user.badges : [];
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    if (stages[i].badge && userBadges.includes(stages[i].badge)) {
      if (i > activeStageIndex) {
        activeStageIndex = i;
      }
      break;
    }
  }

  const currentStage = stages[activeStageIndex];
  const nextStage = stages[activeStageIndex + 1] || null;

  // Find active Tier
  const currentTier = tiers.find((t) => t.id === currentStage.tierId) || tiers[0];
  const currentTierIndex = tiers.findIndex((t) => t.id === currentTier.id);
  const nextTier = tiers[currentTierIndex + 1] || null;

  // Calculate views progress inside stage
  let stageSpan = 0;
  let viewsIntoStage = views - currentStage.minViews;
  let viewsToNextStage = 0;
  let stageProgress = 1;

  if (nextStage) {
    stageSpan = Math.max(1, nextStage.minViews - currentStage.minViews);
    viewsIntoStage = Math.max(0, views - currentStage.minViews);
    viewsToNextStage = Math.max(0, nextStage.minViews - views);
    stageProgress = Math.min(1, Math.max(0, viewsIntoStage / stageSpan));
  }

  // Calculate tier XP progress (for backward compatibility)
  let xpSpan = 0;
  let intoRank = xp - (currentTier.min || 0);
  let toNext = 0;
  let progress = 1;

  if (nextTier) {
    xpSpan = Math.max(1, (nextTier.min || 0) - (currentTier.min || 0));
    intoRank = Math.max(0, xp - (currentTier.min || 0));
    toNext = Math.max(0, (nextTier.min || 0) - xp);
    progress = Math.min(1, Math.max(0, intoRank / xpSpan));
  }

  return {
    rank: currentTier,
    stage: currentStage,
    next: nextTier,
    nextStage,
    views,
    viewsIntoStage,
    viewsToNextStage,
    stageProgress,
    stagePercent: Math.round(stageProgress * 100),
    xp,
    intoRank,
    span: xpSpan,
    toNext,
    progress,
    percent: Math.round(progress * 100),
    badge: currentTier.badge || null,
    allStages: stages,
  };
}
