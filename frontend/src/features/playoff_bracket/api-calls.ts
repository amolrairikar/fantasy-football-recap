import { apiClient } from '@/lib/api-client';

export interface BracketMatch {
  match_id: number;
  round: number;
  team_1_id: string;
  team_1_display_name: string;
  team_1_team_name: string;
  team_1_team_logo: string | null;
  team_2_id: string;
  team_2_display_name: string;
  team_2_team_name: string;
  team_2_team_logo: string | null;
  winner: string | null;
  loser: string | null;
  position: number | null;
  team_1_from: string | null;
  team_2_from: string | null;
  season: string;
  team_1_score?: number;
  team_2_score?: number;
}

export interface GetPlayoffBracketResponse {
  data: BracketMatch[];
}

export function getPlayoffBracket(
  leagueId: string,
  platform: 'ESPN' | 'SLEEPER',
  season: string,
): Promise<GetPlayoffBracketResponse> {
  const params = new URLSearchParams({
    platform,
    queryType: `PLAYOFF_BRACKET#${season}`,
  });
  return apiClient.get<GetPlayoffBracketResponse>(
    `/leagues/${leagueId}/query?${params}`,
  );
}
