import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ── Static Data ─────────────────────────────────────────────────────────────

const managers = [
  { name: 'Alex M.', init: 'TB', color: '#4338ca', team: 'Thunderbolts' },
  { name: 'Jordan K.', init: 'RW', color: '#0f6e56', team: 'Rim Wreckers' },
  { name: 'Sam T.', init: 'DD', color: '#993c1d', team: 'Dunk Dynasty' },
  { name: 'Riley B.', init: 'HM', color: '#185FA5', team: 'Hoops Mafia' },
];

const posMeta = {
  QB: { bg: '#EEEDFE', tc: '#3C3489' },
  RB: { bg: '#E1F5EE', tc: '#085041' },
  WR: { bg: '#FAECE7', tc: '#712B13' },
  TE: { bg: '#FAEEDA', tc: '#633806' },
  K: { bg: '#F1EFE8', tc: '#444441' },
  DEF: { bg: '#E6F1FB', tc: '#0C447C' },
};

const altPool = [
  { name: 'J. Jefferson', pos: 'WR', pts: 312, round: 1 },
  { name: 'C. Lamb', pos: 'WR', pts: 298, round: 1 },
  { name: 'D. Henry', pos: 'RB', pts: 288, round: 2 },
  { name: 'S. Barkley', pos: 'RB', pts: 276, round: 2 },
  { name: 'T. Kelce', pos: 'TE', pts: 265, round: 2 },
  { name: 'M. Andrews', pos: 'TE', pts: 214, round: 3 },
  { name: 'L. Jackson', pos: 'QB', pts: 342, round: 2 },
  { name: 'J. Burrow', pos: 'QB', pts: 318, round: 3 },
  { name: 'A. Cooper', pos: 'WR', pts: 198, round: 4 },
  { name: 'T. McLaurin', pos: 'WR', pts: 188, round: 4 },
  { name: 'T. Pollard', pos: 'RB', pts: 176, round: 5 },
  { name: 'J. Mixon', pos: 'RB', pts: 168, round: 5 },
  { name: 'G. Kittle', pos: 'TE', pts: 201, round: 4 },
  { name: 'D. Waller', pos: 'TE', pts: 188, round: 5 },
  { name: 'J. Allen', pos: 'QB', pts: 356, round: 1 },
  { name: 'P. Mahomes', pos: 'QB', pts: 338, round: 2 },
  { name: 'N. Chubb', pos: 'RB', pts: 154, round: 6 },
  { name: 'A. Jones', pos: 'RB', pts: 148, round: 6 },
  { name: 'K. Golladay', pos: 'WR', pts: 142, round: 7 },
  { name: 'E. Engram', pos: 'TE', pts: 162, round: 6 },
];

const draftData: Record<string, Record<string, DraftPick[]>> = {
  '0': {
    '2025': [
      { player: 'J. Jefferson', pos: 'WR', round: 1, pick: 3, draftRank: 3, finalRank: 1, pts: 312, isBust: false },
      { player: 'D. Henry', pos: 'RB', round: 1, pick: 8, draftRank: 8, finalRank: 3, pts: 288, isBust: false },
      { player: 'T. Kelce', pos: 'TE', round: 2, pick: 18, draftRank: 5, finalRank: 2, pts: 265, isBust: false },
      { player: 'A. Rodgers', pos: 'QB', round: 2, pick: 22, draftRank: 6, finalRank: 18, pts: 128, isBust: true },
      { player: 'T. Hill', pos: 'WR', round: 3, pick: 27, draftRank: 12, finalRank: 17, pts: 241, isBust: false },
      { player: 'S. Barkley', pos: 'RB', round: 3, pick: 31, draftRank: 14, finalRank: 10, pts: 228, isBust: false },
      { player: 'K. Murray', pos: 'QB', round: 4, pick: 40, draftRank: 9, finalRank: 22, pts: 112, isBust: true },
      { player: 'G. Kittle', pos: 'TE', round: 5, pick: 51, draftRank: 18, finalRank: 12, pts: 201, isBust: false },
      { player: 'T. McLaurin', pos: 'WR', round: 6, pick: 62, draftRank: 28, finalRank: 35, pts: 188, isBust: false },
      { player: 'J. Mixon', pos: 'RB', round: 7, pick: 75, draftRank: 36, finalRank: 28, pts: 168, isBust: false },
    ],
    '2024': [
      { player: 'C. McCaffrey', pos: 'RB', round: 1, pick: 1, draftRank: 1, finalRank: 1, pts: 344, isBust: false },
      { player: 'T. Hill', pos: 'WR', round: 1, pick: 6, draftRank: 6, finalRank: 4, pts: 271, isBust: false },
      { player: 'L. Jackson', pos: 'QB', round: 2, pick: 14, draftRank: 4, finalRank: 2, pts: 342, isBust: false },
      { player: 'D. Waller', pos: 'TE', round: 2, pick: 21, draftRank: 8, finalRank: 14, pts: 148, isBust: true },
      { player: 'A. Jones', pos: 'RB', round: 3, pick: 29, draftRank: 16, finalRank: 22, pts: 131, isBust: true },
      { player: 'S. Diggs', pos: 'WR', round: 4, pick: 38, draftRank: 20, finalRank: 26, pts: 198, isBust: false },
      { player: 'G. Kittle', pos: 'TE', round: 5, pick: 49, draftRank: 14, finalRank: 8, pts: 201, isBust: false },
      { player: 'T. Pollard', pos: 'RB', round: 6, pick: 60, draftRank: 30, finalRank: 20, pts: 176, isBust: false },
    ],
    '2023': [
      { player: 'J. Jefferson', pos: 'WR', round: 1, pick: 2, draftRank: 2, finalRank: 1, pts: 328, isBust: false },
      { player: 'D. Adams', pos: 'WR', round: 1, pick: 7, draftRank: 7, finalRank: 5, pts: 262, isBust: false },
      { player: 'P. Mahomes', pos: 'QB', round: 2, pick: 16, draftRank: 5, finalRank: 1, pts: 338, isBust: false },
      { player: 'T. Kelce', pos: 'TE', round: 2, pick: 20, draftRank: 6, finalRank: 1, pts: 265, isBust: false },
      { player: 'N. Chubb', pos: 'RB', round: 3, pick: 28, draftRank: 15, finalRank: 24, pts: 121, isBust: true },
      { player: 'A. Cooper', pos: 'WR', round: 4, pick: 40, draftRank: 22, finalRank: 29, pts: 198, isBust: false },
      { player: 'M. Andrews', pos: 'TE', round: 5, pick: 50, draftRank: 14, finalRank: 3, pts: 214, isBust: false },
      { player: 'J. Mixon', pos: 'RB', round: 6, pick: 62, draftRank: 32, finalRank: 26, pts: 164, isBust: false },
    ],
  },
  '1': {
    '2025': [
      { player: 'C. McCaffrey', pos: 'RB', round: 1, pick: 1, draftRank: 1, finalRank: 1, pts: 344, isBust: false },
      { player: 'J. Burrow', pos: 'QB', round: 1, pick: 5, draftRank: 5, finalRank: 3, pts: 318, isBust: false },
      { player: 'S. Diggs', pos: 'WR', round: 2, pick: 16, draftRank: 9, finalRank: 15, pts: 254, isBust: false },
      { player: 'E. Engram', pos: 'TE', round: 2, pick: 23, draftRank: 10, finalRank: 18, pts: 141, isBust: true },
      { player: 'D. Henry', pos: 'RB', round: 3, pick: 25, draftRank: 13, finalRank: 4, pts: 278, isBust: false },
      { player: 'K. Golladay', pos: 'WR', round: 4, pick: 42, draftRank: 21, finalRank: 34, pts: 88, isBust: true },
      { player: 'T. Pollard', pos: 'RB', round: 5, pick: 53, draftRank: 26, finalRank: 33, pts: 176, isBust: false },
      { player: 'M. Andrews', pos: 'TE', round: 6, pick: 64, draftRank: 15, finalRank: 3, pts: 214, isBust: false },
    ],
    '2024': [
      { player: 'T. Hill', pos: 'WR', round: 1, pick: 4, draftRank: 4, finalRank: 3, pts: 271, isBust: false },
      { player: 'L. Jackson', pos: 'QB', round: 1, pick: 9, draftRank: 9, finalRank: 2, pts: 342, isBust: false },
      { player: 'T. Kelce', pos: 'TE', round: 2, pick: 13, draftRank: 3, finalRank: 1, pts: 265, isBust: false },
      { player: 'S. Barkley', pos: 'RB', round: 2, pick: 19, draftRank: 7, finalRank: 5, pts: 276, isBust: false },
      { player: 'K. Murray', pos: 'QB', round: 3, pick: 30, draftRank: 11, finalRank: 28, pts: 98, isBust: true },
      { player: 'A. Cooper', pos: 'WR', round: 4, pick: 41, draftRank: 19, finalRank: 13, pts: 198, isBust: false },
      { player: 'N. Chubb', pos: 'RB', round: 5, pick: 52, draftRank: 24, finalRank: 32, pts: 112, isBust: true },
      { player: 'G. Kittle', pos: 'TE', round: 6, pick: 63, draftRank: 16, finalRank: 6, pts: 201, isBust: false },
    ],
    '2023': [
      { player: 'D. Adams', pos: 'WR', round: 1, pick: 3, draftRank: 3, finalRank: 4, pts: 262, isBust: false },
      { player: 'C. McCaffrey', pos: 'RB', round: 1, pick: 8, draftRank: 8, finalRank: 2, pts: 328, isBust: false },
      { player: 'J. Allen', pos: 'QB', round: 2, pick: 15, draftRank: 4, finalRank: 1, pts: 356, isBust: false },
      { player: 'G. Kittle', pos: 'TE', round: 2, pick: 22, draftRank: 8, finalRank: 4, pts: 201, isBust: false },
      { player: 'T. Pollard', pos: 'RB', round: 3, pick: 27, draftRank: 14, finalRank: 11, pts: 176, isBust: false },
      { player: 'A. Rodgers', pos: 'QB', round: 4, pick: 39, draftRank: 10, finalRank: 24, pts: 118, isBust: true },
      { player: 'S. Diggs', pos: 'WR', round: 5, pick: 50, draftRank: 22, finalRank: 11, pts: 218, isBust: false },
      { player: 'E. Engram', pos: 'TE', round: 6, pick: 61, draftRank: 18, finalRank: 26, pts: 128, isBust: true },
    ],
  },
  '2': {
    '2025': [
      { player: 'J. Allen', pos: 'QB', round: 1, pick: 2, draftRank: 2, finalRank: 1, pts: 356, isBust: false },
      { player: 'T. Kelce', pos: 'TE', round: 1, pick: 7, draftRank: 7, finalRank: 1, pts: 265, isBust: false },
      { player: 'C. Lamb', pos: 'WR', round: 2, pick: 12, draftRank: 4, finalRank: 3, pts: 298, isBust: false },
      { player: 'D. Cook', pos: 'RB', round: 2, pick: 24, draftRank: 11, finalRank: 28, pts: 109, isBust: true },
      { player: 'M. Andrews', pos: 'TE', round: 3, pick: 29, draftRank: 12, finalRank: 3, pts: 214, isBust: false },
      { player: 'S. Barkley', pos: 'RB', round: 4, pick: 44, draftRank: 22, finalRank: 8, pts: 276, isBust: false },
      { player: 'T. McLaurin', pos: 'WR', round: 5, pick: 55, draftRank: 27, finalRank: 18, pts: 188, isBust: false },
      { player: 'K. Murray', pos: 'QB', round: 6, pick: 68, draftRank: 14, finalRank: 30, pts: 102, isBust: true },
    ],
    '2024': [
      { player: 'P. Mahomes', pos: 'QB', round: 1, pick: 4, draftRank: 4, finalRank: 1, pts: 338, isBust: false },
      { player: 'C. McCaffrey', pos: 'RB', round: 1, pick: 6, draftRank: 6, finalRank: 1, pts: 344, isBust: false },
      { player: 'J. Jefferson', pos: 'WR', round: 2, pick: 17, draftRank: 8, finalRank: 2, pts: 312, isBust: false },
      { player: 'D. Waller', pos: 'TE', round: 2, pick: 20, draftRank: 7, finalRank: 16, pts: 144, isBust: true },
      { player: 'T. Hill', pos: 'WR', round: 3, pick: 31, draftRank: 15, finalRank: 5, pts: 271, isBust: false },
      { player: 'J. Mixon', pos: 'RB', round: 4, pick: 43, draftRank: 23, finalRank: 18, pts: 168, isBust: false },
      { player: 'E. Engram', pos: 'TE', round: 5, pick: 54, draftRank: 16, finalRank: 22, pts: 138, isBust: true },
      { player: 'A. Jones', pos: 'RB', round: 6, pick: 65, draftRank: 31, finalRank: 24, pts: 131, isBust: false },
    ],
    '2023': [
      { player: 'J. Burrow', pos: 'QB', round: 1, pick: 5, draftRank: 5, finalRank: 3, pts: 318, isBust: false },
      { player: 'J. Jefferson', pos: 'WR', round: 1, pick: 9, draftRank: 9, finalRank: 2, pts: 312, isBust: false },
      { player: 'S. Barkley', pos: 'RB', round: 2, pick: 18, draftRank: 7, finalRank: 6, pts: 276, isBust: false },
      { player: 'T. Kelce', pos: 'TE', round: 2, pick: 24, draftRank: 9, finalRank: 1, pts: 265, isBust: false },
      { player: 'K. Golladay', pos: 'WR', round: 3, pick: 30, draftRank: 14, finalRank: 36, pts: 84, isBust: true },
      { player: 'D. Henry', pos: 'RB', round: 4, pick: 44, draftRank: 22, finalRank: 14, pts: 258, isBust: false },
      { player: 'M. Andrews', pos: 'TE', round: 5, pick: 55, draftRank: 16, finalRank: 4, pts: 214, isBust: false },
      { player: 'N. Chubb', pos: 'RB', round: 6, pick: 66, draftRank: 32, finalRank: 28, pts: 142, isBust: false },
    ],
  },
  '3': {
    '2025': [
      { player: 'T. Hill', pos: 'WR', round: 1, pick: 4, draftRank: 4, finalRank: 2, pts: 291, isBust: false },
      { player: 'S. Barkley', pos: 'RB', round: 1, pick: 9, draftRank: 9, finalRank: 5, pts: 276, isBust: false },
      { player: 'P. Mahomes', pos: 'QB', round: 2, pick: 15, draftRank: 4, finalRank: 1, pts: 338, isBust: false },
      { player: 'D. Waller', pos: 'TE', round: 2, pick: 25, draftRank: 11, finalRank: 20, pts: 138, isBust: true },
      { player: 'A. Jones', pos: 'RB', round: 3, pick: 33, draftRank: 18, finalRank: 26, pts: 122, isBust: true },
      { player: 'C. Lamb', pos: 'WR', round: 4, pick: 46, draftRank: 25, finalRank: 4, pts: 298, isBust: false },
      { player: 'G. Kittle', pos: 'TE', round: 5, pick: 57, draftRank: 17, finalRank: 5, pts: 201, isBust: false },
      { player: 'T. Pollard', pos: 'RB', round: 6, pick: 70, draftRank: 34, finalRank: 22, pts: 176, isBust: false },
    ],
    '2024': [
      { player: 'L. Jackson', pos: 'QB', round: 1, pick: 3, draftRank: 3, finalRank: 2, pts: 342, isBust: false },
      { player: 'D. Adams', pos: 'WR', round: 1, pick: 11, draftRank: 11, finalRank: 8, pts: 248, isBust: false },
      { player: 'C. McCaffrey', pos: 'RB', round: 2, pick: 16, draftRank: 5, finalRank: 1, pts: 344, isBust: false },
      { player: 'K. Murray', pos: 'QB', round: 2, pick: 22, draftRank: 8, finalRank: 26, pts: 102, isBust: true },
      { player: 'T. Kelce', pos: 'TE', round: 3, pick: 28, draftRank: 10, finalRank: 1, pts: 265, isBust: false },
      { player: 'T. McLaurin', pos: 'WR', round: 4, pick: 40, draftRank: 20, finalRank: 14, pts: 198, isBust: false },
      { player: 'J. Mixon', pos: 'RB', round: 5, pick: 52, draftRank: 26, finalRank: 20, pts: 168, isBust: false },
      { player: 'E. Engram', pos: 'TE', round: 6, pick: 62, draftRank: 17, finalRank: 24, pts: 131, isBust: true },
    ],
    '2023': [
      { player: 'C. Lamb', pos: 'WR', round: 1, pick: 6, draftRank: 6, finalRank: 3, pts: 288, isBust: false },
      { player: 'D. Henry', pos: 'RB', round: 1, pick: 10, draftRank: 10, finalRank: 6, pts: 258, isBust: false },
      { player: 'J. Allen', pos: 'QB', round: 2, pick: 17, draftRank: 6, finalRank: 1, pts: 356, isBust: false },
      { player: 'M. Andrews', pos: 'TE', round: 2, pick: 21, draftRank: 7, finalRank: 3, pts: 214, isBust: false },
      { player: 'K. Golladay', pos: 'WR', round: 3, pick: 32, draftRank: 16, finalRank: 38, pts: 76, isBust: true },
      { player: 'A. Jones', pos: 'RB', round: 4, pick: 42, draftRank: 21, finalRank: 24, pts: 131, isBust: false },
      { player: 'G. Kittle', pos: 'TE', round: 5, pick: 54, draftRank: 15, finalRank: 5, pts: 201, isBust: false },
      { player: 'N. Chubb', pos: 'RB', round: 6, pick: 66, draftRank: 33, finalRank: 28, pts: 142, isBust: false },
    ],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftPick {
  player: string;
  pos: string;
  round: number;
  pick: number;
  draftRank: number;
  finalRank: number;
  pts: number;
  isBust: boolean;
}

interface AltPlayer {
  name: string;
  pos: string;
  pts: number;
  round: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function grade(delta: number): { g: string; cls: string; score: number } {
  if (delta >= 8) return { g: 'A', cls: 'grade-a', score: 95 };
  if (delta >= 3) return { g: 'B', cls: 'grade-b', score: 85 };
  if (delta >= -3) return { g: 'C', cls: 'grade-c', score: 75 };
  if (delta >= -10) return { g: 'D', cls: 'grade-d', score: 65 };
  return { g: 'F', cls: 'grade-f', score: 55 };
}

function getAlts(pick: DraftPick): AltPlayer[] {
  return altPool
    .filter(
      (a) =>
        a.pos === pick.pos &&
        a.round >= pick.round &&
        a.round <= pick.round + 2 &&
        a.name !== pick.player &&
        a.pts > pick.pts,
    )
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DraftRecap() {
  const [selectedManager, setSelectedManager] = useState('0');
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [openBusts, setOpenBusts] = useState<Record<string, boolean>>({});

  const picks = (draftData[selectedManager]?.[selectedSeason]) || [];

  const draftGrade = picks.length
    ? Math.round(picks.reduce((s, p) => s + grade(p.draftRank - p.finalRank).score, 0) / picks.length)
    : 0;
  const bestPick = picks.length
    ? picks.reduce((best, p) => {
        const currentGrade = grade(p.draftRank - p.finalRank);
        const bestGrade = grade(best.draftRank - best.finalRank);
        return currentGrade.score > bestGrade.score ? p : best;
      })
    : null;
  const busts = picks.filter((p) => p.isBust).length;
  const steals = picks.filter((p) => p.finalRank <= p.draftRank - 5).length;
  const avgDelta = picks.length
    ? Math.round(picks.reduce((s, p) => s + (p.draftRank - p.finalRank), 0) / picks.length)
    : 0;

  const toggleBust = (key: string) => {
    setOpenBusts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 max-w-250 mx-auto">

      {/* Filter Bar */}
      <div className="flex items-center gap-2.5 mb-6 flex-wrap">
        <span className="text-[12px] font-medium text-muted-foreground">Season</span>
        <select
          className="px-3 py-1.5 text-[13px] font-medium bg-card border border-border rounded-md text-foreground cursor-pointer"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
        <span className="text-[12px] font-medium text-muted-foreground ml-2">Manager</span>
        <select
          className="px-3 py-1.5 text-[13px] font-medium bg-card border border-border rounded-md text-foreground cursor-pointer"
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
        >
          {managers.map((mgr, i) => (
            <option key={mgr.name} value={i.toString()}>
              {mgr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="bg-card border border-border/50 rounded-lg p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
            Draft grade
          </div>
          <div className="text-[22px] font-medium text-foreground">
            {draftGrade}/100
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
            Best pick
          </div>
          <div className="text-[22px] font-medium text-foreground">
            {bestPick ? bestPick.player : '—'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {bestPick ? `Rd ${bestPick.round}, Pick ${bestPick.pick}` : ''}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
            Steals
          </div>
          <div className="text-[22px] font-medium" style={{ color: '#27500A' }}>
            {steals}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            exceeded draft rank 5+
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
            Busts
          </div>
          <div className="text-[22px] font-medium" style={{ color: '#791F1F' }}>
            {busts}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            missed expectations
          </div>
        </div>
      </div>

      {/* Picks Table */}
      <div className="bg-card border border-border/50 rounded-lg overflow-hidden mb-6">
        <table className="w-full border-collapse table-fixed text-[12px]">
          <thead>
            <tr>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-left bg-muted/50 border-b border-border/50" style={{ width: '28px' }}>
                #
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-left bg-muted/50 border-b border-border/50" style={{ width: '180px' }}>
                Player
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '56px' }}>
                Pos
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '80px' }}>
                Total pts
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '100px' }}>
                Pos rank - draft
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '100px' }}>
                Pos rank - actual
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '90px' }}>
                Rank delta
              </th>
              <th className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-3 py-2.5 text-center bg-muted/50 border-b border-border/50" style={{ width: '44px' }}>
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick, i) => {
              const pm = posMeta[pick.pos as keyof typeof posMeta] || { bg: '#F1EFE8', tc: '#444441' };
              const delta = pick.draftRank - pick.finalRank;
              const deltaStr = (delta >= 0 ? '+' : '') + delta;
              const dpillCls = delta >= 3 ? 'delta-pos' : delta <= -3 ? 'delta-neg' : 'delta-neu';
              const { g, cls } = grade(delta);
              const alts = pick.isBust ? getAlts(pick) : [];
              const bustKey = `${selectedManager}-${selectedSeason}-${i}`;
              const isOpen = !!openBusts[bustKey];

              return (
                <React.Fragment key={i}>
                  <tr>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 text-muted-foreground text-[11px]">{i + 1}</div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5">
                        <div className="text-[13px] font-medium text-foreground">{pick.player}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                            Rd {pick.round} · Pick {pick.pick}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 flex justify-center">
                        <span
                          className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: pm.bg, color: pm.tc }}
                        >
                          {pick.pos}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 text-center text-[13px] font-medium text-foreground">{pick.pts}</div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 text-center text-[13px] font-medium text-foreground">{pick.draftRank}</div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 text-center text-[13px] font-medium text-foreground">{pick.finalRank}</div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 flex justify-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${dpillCls}`}
                          style={{
                            background: dpillCls === 'delta-pos' ? '#EAF3DE' : dpillCls === 'delta-neg' ? '#FCEBEB' : '#F1EFE8',
                            color: dpillCls === 'delta-pos' ? '#27500A' : dpillCls === 'delta-neg' ? '#791F1F' : '#444441',
                          }}
                        >
                          {deltaStr} places
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-border/50">
                      <div className="px-3 py-2.5 flex justify-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-medium"
                          style={{
                            background:
                              cls === 'grade-a'
                                ? '#EAF3DE'
                                : cls === 'grade-b'
                                  ? '#E1F5EE'
                                  : cls === 'grade-c'
                                    ? '#EEEDFE'
                                    : cls === 'grade-d'
                                      ? '#FAEEDA'
                                      : '#FCEBEB',
                            color:
                              cls === 'grade-a'
                                ? '#27500A'
                                : cls === 'grade-b'
                                  ? '#085041'
                                  : cls === 'grade-c'
                                    ? '#3C3489'
                                    : cls === 'grade-d'
                                      ? '#633806'
                                      : '#791F1F',
                          }}
                        >
                          {g}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {(g === 'D' || g === 'F') && alts.length > 0 && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className="bg-muted/50 border-t border-border/50 p-2.5 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: '#791F1F' }}>
                              Could have picked instead
                            </div>
                            <button
                              className="bg-transparent border-none cursor-pointer text-[11px] text-muted-foreground p-0 flex items-center gap-1"
                              onClick={() => toggleBust(bustKey)}
                            >
                              {isOpen ? 'Hide' : 'Show'} alternatives
                              <ChevronDown
                                className="w-2.5 h-2.5 transition-transform"
                                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                              />
                            </button>
                          </div>
                          {isOpen && (
                            <div className="flex flex-col gap-1">
                              {alts.map((alt, j) => {
                                const altPm = posMeta[alt.pos as keyof typeof posMeta] || { bg: '#F1EFE8', tc: '#444441' };
                                const diff = alt.pts - pick.pts;
                                const spotsLater = Math.floor(Math.random() * 20) + 1;
                                return (
                                  <div
                                    key={j}
                                    className="flex items-center gap-2 px-2 py-1.5 bg-card border border-border/50 rounded-md"
                                  >
                                    <span
                                      className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                      style={{ background: altPm.bg, color: altPm.tc }}
                                    >
                                      {alt.pos}
                                    </span>
                                    <span className="text-[12px] font-medium text-foreground flex-1">{alt.name}</span>
                                    <span className="text-[11px] text-muted-foreground">Picked {spotsLater} spots later</span>
                                    <span className="text-[12px] font-medium text-foreground ml-auto">{alt.pts} pts</span>
                                    <span
                                      className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                                      style={{ background: '#EAF3DE', color: '#27500A' }}
                                    >
                                      +{diff} more points
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
