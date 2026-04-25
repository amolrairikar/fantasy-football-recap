import { useEffect, useState } from 'react';

import { Trophy } from 'lucide-react';

import SeasonSelect from '@/features/season_select/season-select';
import { getPlayoffBracket, type BracketMatch } from './api-calls';

interface Team {
  team_id: string;
  display_name: string;
  team_name: string;
  team_logo: string | null;
}


// Helper function to get cookie value
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// Generate consistent color from team ID
function getTeamColor(teamId: string): string {
  const colors = [
    '#4338ca', '#0f6e56', '#993c1d', '#185FA5', '#993556', '#854F0B',
    '#7c3aed', '#0891b2', '#c2410c', '#1d4ed8', '#be185d', '#b45309',
  ];
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) {
    hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function TeamRow({
  team,
  score,
  isWinner,
  played,
  isBye,
}: {
  team: Team | null;
  score: number | null;
  isWinner: boolean;
  played: boolean;
  isBye: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30 last:border-b-0 opacity-55">
        <span className="text-[10px] font-medium text-muted-foreground w-3 text-center">—</span>
        <div className="w-5.5 h-5.5 rounded-full bg-border/50 flex items-center justify-center shrink-0" />
        <span className="text-[12px] font-medium text-muted-foreground italic flex-1 truncate">
          TBD
        </span>
      </div>
    );
  }

  const color = getTeamColor(team.team_id);
  const init = team.display_name.slice(0, 2).toUpperCase();
  const rowClass = played ? (isWinner ? 'bg-muted' : 'opacity-40') : isBye ? 'opacity-55' : '';

  const scoreHtml = isBye ? (
    <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-[#3C3489] bg-[#EEEDFE] px-1 py-0.5 rounded">
      BYE
    </span>
  ) : played && score !== null ? (
    <span className={`text-[12px] font-medium tabular-nums ${isWinner ? 'text-foreground' : 'text-muted-foreground'}`}>
      {score.toFixed(1)}
    </span>
  ) : (
    <span className="text-[10px] font-medium text-muted-foreground italic">TBD</span>
  );

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30 last:border-b-0 ${rowClass}`}>
      <div
        className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[8px] font-medium text-white shrink-0"
        style={{ background: color }}
      >
        {init}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-foreground truncate">{team.display_name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{team.team_name}</div>
      </div>
      {scoreHtml}
    </div>
  );
}

function MatchupCard({
  match,
  extraClass,
  played,
}: {
  match: BracketMatch | null;
  extraClass?: string;
  played: boolean;
}) {
  if (!match) {
    return (
      <div className="bg-transparent border border-dashed border-border/30 rounded-md flex items-center justify-center p-3">
        <span className="text-[10px] text-muted-foreground italic">bye week</span>
      </div>
    );
  }

  const team1: Team = {
    team_id: match.team_1_id,
    display_name: match.team_1_display_name,
    team_name: match.team_1_team_name,
    team_logo: match.team_1_team_logo,
  };
  const team2: Team = {
    team_id: match.team_2_id,
    display_name: match.team_2_display_name,
    team_name: match.team_2_team_name,
    team_logo: match.team_2_team_logo,
  };

  const aWins = match.winner === match.team_1_id;
  const score1 = match.team_1_score ?? null;
  const score2 = match.team_2_score ?? null;

  return (
    <div className={`bg-card border border-border/30 rounded-md overflow-hidden ${extraClass || ''}`}>
      <TeamRow team={team1} score={score1} isWinner={played && aWins} played={played} isBye={false} />
      <TeamRow team={team2} score={score2} isWinner={played && !aWins} played={played} isBye={false} />
    </div>
  );
}

function ByeCard({ team }: { team: Team }) {
  const color = getTeamColor(team.team_id);
  const init = team.display_name.slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border/30 rounded-md overflow-hidden opacity-70">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div
          className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[8px] font-medium text-white shrink-0"
          style={{ background: color }}
        >
          {init}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-foreground truncate">{team.display_name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{team.team_name}</div>
        </div>
        <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-[#3C3489] bg-[#EEEDFE] px-1 py-0.5 rounded">
          BYE
        </span>
      </div>
    </div>
  );
}

function ChampionCard({ team, score }: { team: Team; score: string }) {
  const color = getTeamColor(team.team_id);
  const init = team.display_name.slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border-2 border-[#EF9F27] rounded-lg p-4 flex flex-col items-center gap-2 w-full">
      <Trophy className="w-6 h-6" />
      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#BA7517]">Champion</div>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium text-white"
        style={{ background: color }}
      >
        {init}
      </div>
      <div className="text-[14px] font-medium text-foreground text-center">{team.display_name}</div>
      <div className="text-[11px] text-muted-foreground text-center">{team.team_name}</div>
      <div className="text-[11px] font-medium text-[#BA7517] mt-0.5 text-center">{score} pts</div>
    </div>
  );
}

export default function PlayoffBracket() {
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leagueId = getCookie('leagueId');
  const platform = (getCookie('leaguePlatform') || 'ESPN') as 'ESPN' | 'SLEEPER';

  useEffect(() => {
    if (!leagueId) {
      setError('No league selected. Please connect a league first.');
      setLoading(false);
      return;
    }

    async function fetchBracketData() {
      setLoading(true);
      setError(null);
      try {
        const response = await getPlayoffBracket(leagueId!, platform, selectedSeason);
        setMatches(response.data);
      } catch (err) {
        console.error('Failed to fetch playoff bracket:', err);
        setError('Failed to load playoff bracket data.');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBracketData();
  }, [leagueId, platform, selectedSeason]);

  // Parse matches from DynamoDB format
  const championship = matches.find((m) => m.position === 1);
  const semifinals = matches.filter((m) => m.round === 2 && m.position === null);
  const wildcard = matches.filter((m) => m.round === 1 && m.position === null);
  const thirdPlace = matches.find((m) => m.position === 3);
  const fifthPlace = matches.find((m) => m.position === 5);

  // Pair bye teams with their corresponding wildcard matchups
  const wildcardRoundItems = semifinals.map((semi) => {
    // Determine which team had a bye and which comes from a wildcard match
    let byeTeamId: string | null = null;
    let wildcardMatchId: number | null = null;

    if (semi.team_1_from === null) {
      byeTeamId = semi.team_1_id;
      // team_2_from should be like {"w": 1} or {"l": 1}
      if (semi.team_2_from) {
        const from = JSON.parse(semi.team_2_from);
        wildcardMatchId = from.w || from.l;
      }
    } else if (semi.team_2_from === null) {
      byeTeamId = semi.team_2_id;
      // team_1_from should be like {"w": 1} or {"l": 1}
      if (semi.team_1_from) {
        const from = JSON.parse(semi.team_1_from);
        wildcardMatchId = from.w || from.l;
      }
    }

    const wildcardMatch = wildcardMatchId ? wildcard.find((m) => m.match_id === wildcardMatchId) : null;
    const byeTeam = byeTeamId ? {
      team_id: byeTeamId,
      display_name: semi.team_1_id === byeTeamId ? semi.team_1_display_name : semi.team_2_display_name,
      team_name: semi.team_1_id === byeTeamId ? semi.team_1_team_name : semi.team_2_team_name,
      team_logo: semi.team_1_id === byeTeamId ? semi.team_1_team_logo : semi.team_2_team_logo,
    } : null;

    return { byeTeam, wildcardMatch };
  });

  const champTeam = championship
    ? {
        team_id: championship.winner || '',
        display_name:
          championship.winner === championship.team_1_id
            ? championship.team_1_display_name
            : championship.team_2_display_name,
        team_name:
          championship.winner === championship.team_1_id
            ? championship.team_1_team_name
            : championship.team_2_team_name,
        team_logo:
          championship.winner === championship.team_1_id
            ? championship.team_1_team_logo
            : championship.team_2_team_logo,
      }
    : null;

  const champScore = championship
    ? (championship.winner === championship.team_1_id
        ? championship.team_1_score
        : championship.team_2_score
      )?.toFixed(1) || '0'
    : '0';

  const seasonOptions = [selectedSeason];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-6 overflow-auto">
        <div className="max-w-262.5 mx-auto w-full">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-center mb-5">
            LeagueQL — Playoff bracket
          </p>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading playoff bracket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-6 overflow-auto">
        <div className="max-w-262.5 mx-auto w-full">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-center mb-5">
            LeagueQL — Playoff bracket
          </p>
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 overflow-auto">
      <div className="max-w-262.5 mx-auto w-full">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-center mb-5">
          LeagueQL — Playoff bracket
        </p>

        <div className="flex items-center gap-2.5 mb-7 flex-wrap">
          <span className="text-[12px] text-muted-foreground font-medium">Season</span>
          <SeasonSelect
            seasons={seasonOptions}
            value={selectedSeason}
            onValueChange={setSelectedSeason}
          />
        </div>

        {/* Main bracket */}
        <div className="grid grid-cols-[1fr_8px_1fr_8px_1fr_8px_160px] gap-0 items-start mb-6">
          {/* Wild Card Round */}
          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground text-center pb-2.5 border-b border-border/20 mb-0">
              Wild card · Wk 14
            </div>
            <div className="flex flex-col gap-1.5">
              {wildcardRoundItems.map((item, idx) => (
                <div key={idx}>
                  {item.byeTeam && <ByeCard team={item.byeTeam} />}
                  <div className="h-2.5" />
                  {item.wildcardMatch && <MatchupCard match={item.wildcardMatch} played={true} />}
                  <div className="h-4.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Connector 1 */}
          <div className="flex flex-col justify-around pt-11 gap-0">
            <svg width="20" height="58" viewBox="0 0 20 58" overflow="visible" className="block">
              <path d="M0,15 H10 V43 H0" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              <line x1="10" y1="29" x2="20" y2="29" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>
            <div className="h-9" />
            <svg width="20" height="58" viewBox="0 0 20 58" overflow="visible" className="block">
              <path d="M0,15 H10 V43 H0" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              <line x1="10" y1="29" x2="20" y2="29" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>
          </div>

          {/* Semifinals */}
          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground text-center pb-2.5 border-b border-border/20 mb-0">
              Semifinals · Wk 15
            </div>
            <div className="flex flex-col gap-1.5">
              {semifinals.map((match) => (
                <>
                  <MatchupCard match={match} played={true} />
                  <div className="h-16" />
                </>
              ))}
            </div>
          </div>

          {/* Connector 2 */}
          <div className="flex flex-col justify-around pt-11">
            <svg width="20" height="130" viewBox="0 0 20 130" overflow="visible" className="block">
              <path d="M0,25 H10 V105 H0" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              <line x1="10" y1="65" x2="20" y2="65" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>
          </div>

          {/* Championship */}
          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground text-center pb-2.5 border-b border-border/20 mb-0">
              Championship · Wk 16
            </div>
            <div className="mt-14.5">
              {championship && (
                <MatchupCard match={championship} extraClass="border-2 border-[#EF9F27]" played={true} />
              )}
            </div>
          </div>

          {/* Connector 3 */}
          <div className="flex flex-col justify-center pt-11">
            <svg width="20" height="64" viewBox="0 0 20 64" overflow="visible" className="block">
              <line x1="0" y1="32" x2="20" y2="32" stroke="hsl(var(--border))" strokeWidth="1" />
            </svg>
          </div>

          {/* Champion Card */}
          <div className="flex flex-col items-center justify-center pt-11 pl-1">
            {champTeam && <ChampionCard team={champTeam} score={champScore} />}
          </div>
        </div>

        {/* Consolation bracket */}
        <div className="mt-6 pt-4.5 border-t border-border/30">
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground text-center mb-3">
            Other playoff results
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 text-center">
                3rd place
              </div>
              {thirdPlace && <MatchupCard match={thirdPlace} played={true} />}
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 text-center">
                5th place
              </div>
              {fifthPlace && <MatchupCard match={fifthPlace} played={true} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
