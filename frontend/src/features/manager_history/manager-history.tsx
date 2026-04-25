import { useState } from 'react';

// Mock data from the HTML example
const mockManagers = [
  {
    owner_id: '0',
    owner_username: 'Alex M.',
    init: 'TB',
    color: '#4338ca',
    currentTeam: 'Thunderbolts',
    yearsActive: '2021-present',
    leagueRank: 1,
    allTime: {
      wins: 34,
      losses: 22,
      championships: 2,
      playoffs: 4,
      highScore: 201,
      avgPts: 134.8,
    },
    seasons: [
      {
        year: '2021-22',
        team: 'Bolt City',
        record: '8-5-0',
        rank: 3,
        pts: 1698,
        avg: 130.6,
        high: 178,
        result: 'playoff' as const,
        finish: 3,
      },
      {
        year: '2022-23',
        team: 'Thunderbolts',
        record: '10-3-0',
        rank: 1,
        pts: 1821,
        avg: 140.1,
        high: 196,
        result: 'champion' as const,
        finish: 1,
      },
      {
        year: '2023-24',
        team: 'Thunderbolts',
        record: '7-6-0',
        rank: 4,
        pts: 1711,
        avg: 131.6,
        high: 188,
        result: 'playoff' as const,
        finish: 4,
      },
      {
        year: '2024-25',
        team: 'Thunderbolts',
        record: '9-4-0',
        rank: 1,
        pts: 1842,
        avg: 138.2,
        high: 189,
        result: 'champion' as const,
        finish: 1,
      },
    ],
    rivalries: [
      {
        oppId: '1',
        oppName: 'Jordan K.',
        oppTeam: 'Rim Wreckers',
        oppColor: '#0f6e56',
        oppInit: 'RW',
        w: 6,
        l: 4,
        avgFor: 141.2,
        avgAgainst: 133.8,
        lastResult: 'W' as const,
      },
      {
        oppId: '4',
        oppName: 'Casey W.',
        oppTeam: 'Net Gains',
        oppColor: '#993556',
        oppInit: 'NG',
        w: 8,
        l: 2,
        avgFor: 148.0,
        avgAgainst: 121.4,
        lastResult: 'W' as const,
      },
      {
        oppId: '5',
        oppName: 'Drew L.',
        oppTeam: 'Fast Breaks',
        oppColor: '#854F0B',
        oppInit: 'FB',
        w: 3,
        l: 7,
        avgFor: 128.6,
        avgAgainst: 144.2,
        lastResult: 'L' as const,
      },
      {
        oppId: '2',
        oppName: 'Sam T.',
        oppTeam: 'Dunk Dynasty',
        oppColor: '#993c1d',
        oppInit: 'DD',
        w: 5,
        l: 5,
        avgFor: 135.1,
        avgAgainst: 134.9,
        lastResult: 'W' as const,
      },
      {
        oppId: '3',
        oppName: 'Riley B.',
        oppTeam: 'Hoops Mafia',
        oppColor: '#185FA5',
        oppInit: 'HM',
        w: 7,
        l: 3,
        avgFor: 142.0,
        avgAgainst: 127.3,
        lastResult: 'W' as const,
      },
      {
        oppId: '6',
        oppName: 'Taylor P.',
        oppTeam: 'Zone Defense',
        oppColor: '#5F5E5A',
        oppInit: 'ZD',
        w: 2,
        l: 8,
        avgFor: 122.3,
        avgAgainst: 145.0,
        lastResult: 'L' as const,
      },
    ],
  },
  {
    owner_id: '1',
    owner_username: 'Jordan K.',
    init: 'RW',
    color: '#0f6e56',
    currentTeam: 'Rim Wreckers',
    yearsActive: '2021-present',
    leagueRank: 2,
    allTime: {
      wins: 29,
      losses: 27,
      championships: 0,
      playoffs: 3,
      highScore: 201,
      avgPts: 128.4,
    },
    seasons: [
      {
        year: '2021-22',
        team: 'Jump Shot FC',
        record: '6-7-0',
        rank: 6,
        pts: 1601,
        avg: 123.2,
        high: 172,
        result: 'elim' as const,
        finish: 6,
      },
      {
        year: '2022-23',
        team: 'Net Gains',
        record: '8-5-0',
        rank: 3,
        pts: 1744,
        avg: 134.2,
        high: 201,
        result: 'playoff' as const,
        finish: 3,
      },
      {
        year: '2023-24',
        team: 'Rim Wreckers',
        record: '7-6-0',
        rank: 3,
        pts: 1712,
        avg: 131.7,
        high: 188,
        result: 'runner' as const,
        finish: 2,
      },
      {
        year: '2024-25',
        team: 'Rim Wreckers',
        record: '8-5-0',
        rank: 2,
        pts: 1761,
        avg: 131.5,
        high: 201,
        result: 'playoff' as const,
        finish: 2,
      },
    ],
    rivalries: [
      {
        oppId: '0',
        oppName: 'Alex M.',
        oppTeam: 'Thunderbolts',
        oppColor: '#4338ca',
        oppInit: 'TB',
        w: 4,
        l: 6,
        avgFor: 133.8,
        avgAgainst: 141.2,
        lastResult: 'L' as const,
      },
      {
        oppId: '3',
        oppName: 'Riley B.',
        oppTeam: 'Hoops Mafia',
        oppColor: '#185FA5',
        oppInit: 'HM',
        w: 7,
        l: 3,
        avgFor: 139.5,
        avgAgainst: 124.1,
        lastResult: 'W' as const,
      },
      {
        oppId: '5',
        oppName: 'Drew L.',
        oppTeam: 'Fast Breaks',
        oppColor: '#854F0B',
        oppInit: 'FB',
        w: 6,
        l: 4,
        avgFor: 136.2,
        avgAgainst: 129.8,
        lastResult: 'W' as const,
      },
      {
        oppId: '2',
        oppName: 'Sam T.',
        oppTeam: 'Dunk Dynasty',
        oppColor: '#993c1d',
        oppInit: 'DD',
        w: 3,
        l: 7,
        avgFor: 122.0,
        avgAgainst: 138.4,
        lastResult: 'L' as const,
      },
      {
        oppId: '4',
        oppName: 'Casey W.',
        oppTeam: 'Net Gains',
        oppColor: '#993556',
        oppInit: 'NG',
        w: 5,
        l: 5,
        avgFor: 131.1,
        avgAgainst: 130.9,
        lastResult: 'L' as const,
      },
      {
        oppId: '6',
        oppName: 'Taylor P.',
        oppTeam: 'Zone Defense',
        oppColor: '#5F5E5A',
        oppInit: 'ZD',
        w: 4,
        l: 6,
        avgFor: 127.3,
        avgAgainst: 135.7,
        lastResult: 'L' as const,
      },
    ],
  },
  {
    owner_id: '2',
    owner_username: 'Sam T.',
    init: 'DD',
    color: '#993c1d',
    currentTeam: 'Dunk Dynasty',
    yearsActive: '2022-present',
    leagueRank: 4,
    allTime: {
      wins: 20,
      losses: 22,
      championships: 0,
      playoffs: 1,
      highScore: 177,
      avgPts: 122.1,
    },
    seasons: [
      {
        year: '2022-23',
        team: 'Swish Kings',
        record: '5-8-0',
        rank: 7,
        pts: 1522,
        avg: 117.1,
        high: 164,
        result: 'elim' as const,
        finish: 7,
      },
      {
        year: '2023-24',
        team: 'Dunk Dynasty',
        record: '8-5-0',
        rank: 2,
        pts: 1739,
        avg: 133.8,
        high: 177,
        result: 'playoff' as const,
        finish: 3,
      },
      {
        year: '2024-25',
        team: 'Dunk Dynasty',
        record: '7-6-0',
        rank: 4,
        pts: 1698,
        avg: 126.8,
        high: 177,
        result: 'elim' as const,
        finish: 4,
      },
    ],
    rivalries: [
      {
        oppId: '3',
        oppName: 'Riley B.',
        oppTeam: 'Hoops Mafia',
        oppColor: '#185FA5',
        oppInit: 'HM',
        w: 6,
        l: 2,
        avgFor: 138.0,
        avgAgainst: 119.5,
        lastResult: 'W' as const,
      },
      {
        oppId: '5',
        oppName: 'Drew L.',
        oppTeam: 'Fast Breaks',
        oppColor: '#854F0B',
        oppInit: 'FB',
        w: 5,
        l: 3,
        avgFor: 133.2,
        avgAgainst: 124.7,
        lastResult: 'W' as const,
      },
      {
        oppId: '0',
        oppName: 'Alex M.',
        oppTeam: 'Thunderbolts',
        oppColor: '#4338ca',
        oppInit: 'TB',
        w: 5,
        l: 5,
        avgFor: 134.9,
        avgAgainst: 135.1,
        lastResult: 'L' as const,
      },
      {
        oppId: '1',
        oppName: 'Jordan K.',
        oppTeam: 'Rim Wreckers',
        oppColor: '#0f6e56',
        oppInit: 'RW',
        w: 7,
        l: 3,
        avgFor: 138.4,
        avgAgainst: 122.0,
        lastResult: 'W' as const,
      },
      {
        oppId: '4',
        oppName: 'Casey W.',
        oppTeam: 'Net Gains',
        oppColor: '#993556',
        oppInit: 'NG',
        w: 2,
        l: 6,
        avgFor: 118.3,
        avgAgainst: 137.6,
        lastResult: 'L' as const,
      },
      {
        oppId: '6',
        oppName: 'Taylor P.',
        oppTeam: 'Zone Defense',
        oppColor: '#5F5E5A',
        oppInit: 'ZD',
        w: 1,
        l: 7,
        avgFor: 113.4,
        avgAgainst: 142.1,
        lastResult: 'L' as const,
      },
    ],
  },
  {
    owner_id: '3',
    owner_username: 'Riley B.',
    init: 'HM',
    color: '#185FA5',
    currentTeam: 'Hoops Mafia',
    yearsActive: '2021-present',
    leagueRank: 6,
    allTime: {
      wins: 24,
      losses: 32,
      championships: 0,
      playoffs: 1,
      highScore: 165,
      avgPts: 118.6,
    },
    seasons: [
      {
        year: '2021-22',
        team: 'Perimeter Pals',
        record: '4-9-0',
        rank: 8,
        pts: 1488,
        avg: 114.5,
        high: 152,
        result: 'elim' as const,
        finish: 8,
      },
      {
        year: '2022-23',
        team: 'Perimeter Pals',
        record: '6-7-0',
        rank: 5,
        pts: 1604,
        avg: 123.4,
        high: 158,
        result: 'elim' as const,
        finish: 5,
      },
      {
        year: '2023-24',
        team: 'Hoops Mafia',
        record: '8-5-0',
        rank: 3,
        pts: 1721,
        avg: 132.4,
        high: 165,
        result: 'playoff' as const,
        finish: 4,
      },
      {
        year: '2024-25',
        team: 'Hoops Mafia',
        record: '6-7-0',
        rank: 6,
        pts: 1623,
        avg: 121.0,
        high: 165,
        result: 'elim' as const,
        finish: 6,
      },
    ],
    rivalries: [
      {
        oppId: '5',
        oppName: 'Drew L.',
        oppTeam: 'Fast Breaks',
        oppColor: '#854F0B',
        oppInit: 'FB',
        w: 7,
        l: 3,
        avgFor: 136.1,
        avgAgainst: 121.0,
        lastResult: 'W' as const,
      },
      {
        oppId: '6',
        oppName: 'Taylor P.',
        oppTeam: 'Zone Defense',
        oppColor: '#5F5E5A',
        oppInit: 'ZD',
        w: 6,
        l: 4,
        avgFor: 128.4,
        avgAgainst: 119.7,
        lastResult: 'W' as const,
      },
      {
        oppId: '4',
        oppName: 'Casey W.',
        oppTeam: 'Net Gains',
        oppColor: '#993556',
        oppInit: 'NG',
        w: 5,
        l: 5,
        avgFor: 124.0,
        avgAgainst: 124.2,
        lastResult: 'L' as const,
      },
      {
        oppId: '0',
        oppName: 'Alex M.',
        oppTeam: 'Thunderbolts',
        oppColor: '#4338ca',
        oppInit: 'TB',
        w: 3,
        l: 7,
        avgFor: 127.3,
        avgAgainst: 142.0,
        lastResult: 'L' as const,
      },
      {
        oppId: '1',
        oppName: 'Jordan K.',
        oppTeam: 'Rim Wreckers',
        oppColor: '#0f6e56',
        oppInit: 'RW',
        w: 3,
        l: 7,
        avgFor: 124.1,
        avgAgainst: 139.5,
        lastResult: 'L' as const,
      },
      {
        oppId: '2',
        oppName: 'Sam T.',
        oppTeam: 'Dunk Dynasty',
        oppColor: '#993c1d',
        oppInit: 'DD',
        w: 2,
        l: 6,
        avgFor: 119.5,
        avgAgainst: 138.0,
        lastResult: 'L' as const,
      },
    ],
  },
];

function resultBadge(result: string) {
  if (result === 'champion')
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: '#EEEDFE', color: '#3C3489' }}
      >
        Champion
      </span>
    );
  if (result === 'runner')
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: '#FAEEDA', color: '#633806' }}
      >
        Runner-up
      </span>
    );
  if (result === 'playoff')
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: '#E1F5EE', color: '#085041' }}
      >
        Playoffs
      </span>
    );
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: '#F1EFE8', color: '#444441' }}
    >
      Eliminated
    </span>
  );
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function pct(a: number, b: number) {
  const t = a + b;
  return t === 0 ? 50 : Math.round((a / t) * 100);
}

export default function ManagerHistory() {
  const [selectedManagerIndex, setSelectedManagerIndex] = useState(0);
  const m = mockManagers[selectedManagerIndex];

  const at = m.allTime;
  const winPct = Math.round((at.wins / (at.wins + at.losses)) * 100);

  const sorted = [...m.rivalries].sort((a, b) => {
    const aRate = a.w / (a.w + a.l);
    const bRate = b.w / (b.w + b.l);
    return bRate - aRate;
  });
  const best = sorted.slice(0, 2);
  const worst = sorted.slice(-2).reverse();
  const closest = [...m.rivalries].sort((a, b) => {
    const aDiff = Math.abs(a.avgFor - a.avgAgainst);
    const bDiff = Math.abs(b.avgFor - b.avgAgainst);
    return aDiff - bDiff;
  }).slice(0, 2);

  return (
    <div className="flex flex-1 flex-col p-6 overflow-auto">
      <div className="max-w-225 mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-medium text-white shrink-0"
            style={{ background: m.color }}
          >
            {m.init}
          </div>
          <div className="flex-1">
            <div className="text-[18px] font-medium text-foreground mb-0.5">
              {m.owner_username}
            </div>
            <div className="text-[13px] text-muted-foreground">
              {m.currentTeam}
            </div>
          </div>
          {mockManagers.length > 1 && (
            <select
              className="px-3 py-2 text-[13px] font-medium bg-card border border-border rounded-md text-foreground cursor-pointer"
              value={selectedManagerIndex}
              onChange={(e) => setSelectedManagerIndex(Number(e.target.value))}
            >
              {mockManagers.map((mgr, i) => (
                <option key={mgr.owner_id} value={i}>
                  {mgr.owner_username}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2.5 mb-6">
          <div className="bg-card border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
              All-time record
            </div>
            <div className="text-[22px] font-medium text-foreground">
              {at.wins}-{at.losses}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {winPct}% win rate
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
              Championships
            </div>
            <div className="text-[22px] font-medium text-foreground">
              {at.championships}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              of {m.seasons.length} seasons
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
              Playoff apps
            </div>
            <div className="text-[22px] font-medium text-foreground">
              {at.playoffs}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              of {m.seasons.length} seasons
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
              Avg pts / wk
            </div>
            <div className="text-[22px] font-medium text-foreground">
              {at.avgPts.toFixed(1)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              all-time
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
              High score
            </div>
            <div className="text-[22px] font-medium text-foreground">
              {at.highScore}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              single week
            </div>
          </div>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
          Manager recap
        </p>
        <div className="bg-card border border-border/50 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-foreground">
              Career summary
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#EEEDFE', color: '#3C3489' }}
            >
              LeagueQL AI
            </span>
          </div>
          <p className="text-[13px] leading-[1.75] text-muted-foreground border-t border-border/50 pt-3">
            Recap not yet available for this manager.
          </p>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
          Season-by-season results
        </p>
        <div className="flex flex-col gap-2.5 mb-6">
          {[...m.seasons].reverse().map((s) => (
            <div
              key={s.year}
              className={`bg-card border border-border/50 rounded-lg p-3.5 grid grid-cols-[80px_1fr_auto] gap-3 items-center ${
                s.result === 'champion' ? 'border-2' : ''
              }`}
              style={s.result === 'champion' ? { borderColor: '#534AB7' } : {}}
            >
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  {s.year}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {s.team}
                </div>
                <div className="mt-2">{resultBadge(s.result)}</div>
              </div>
              <div className="flex gap-5 flex-wrap">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Record
                  </div>
                  <div className="text-[14px] font-medium text-foreground">
                    {s.record}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Total pts
                  </div>
                  <div className="text-[14px] font-medium text-foreground">
                    {s.pts.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Avg / wk
                  </div>
                  <div className="text-[14px] font-medium text-foreground">
                    {s.avg.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    High score
                  </div>
                  <div className="text-[14px] font-medium text-foreground">
                    {s.high}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="text-[20px] font-medium text-foreground">
                  {ordinal(s.finish)}
                </div>
                <div className="text-[11px] text-muted-foreground">place</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
          Rivalries
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...best, ...worst, closest[0]].map((r, i) => {
            const type = i < 2 ? 'best' : i < 4 ? 'worst' : 'closest';
            const total = r.w + r.l;
            const winRate = Math.round((r.w / total) * 100);
            const fillPct = pct(r.w, r.l);
            let typeBadge, typeColor;
            if (type === 'best') {
              typeBadge = (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: '#E1F5EE', color: '#085041' }}
                >
                  Domination
                </span>
              );
              typeColor = '#0F6E56';
            } else if (type === 'worst') {
              typeBadge = (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: '#FCEBEB', color: '#791F1F' }}
                >
                  Nemesis
                </span>
              );
              typeColor = '#E24B4A';
            } else {
              typeBadge = (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: '#FAEEDA', color: '#633806' }}
                >
                  Rival
                </span>
              );
              typeColor = '#BA7517';
            }
            const margin = (r.avgFor - r.avgAgainst).toFixed(1);
            const marginSign = parseFloat(margin) > 0 ? '+' : '';
            return (
              <div
                key={r.oppId}
                className="bg-card border border-border/50 rounded-lg p-3.5 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium text-white shrink-0"
                    style={{ background: r.oppColor }}
                  >
                    {r.oppInit}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">
                      {r.oppName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.oppTeam}
                    </div>
                  </div>
                  <div className="shrink-0">{typeBadge}</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span
                      className="text-[18px] font-medium"
                      style={{ color: typeColor }}
                    >
                      {r.w}-{r.l}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {winRate}% win rate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden flex-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${fillPct}%`, background: typeColor }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {total} games
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Avg for
                    </div>
                    <div className="text-[13px] font-medium text-foreground">
                      {r.avgFor.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Avg against
                    </div>
                    <div className="text-[13px] font-medium text-foreground">
                      {r.avgAgainst.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Avg margin
                    </div>
                    <div
                      className="text-[13px] font-medium"
                      style={{
                        color: parseFloat(margin) >= 0 ? '#27500A' : '#791F1F',
                      }}
                    >
                      {marginSign}
                      {margin}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Last game
                    </div>
                    <div
                      className="text-[13px] font-medium"
                      style={{
                        color: r.lastResult === 'W' ? '#27500A' : '#791F1F',
                      }}
                    >
                      {r.lastResult}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
