import { apiClient } from '@/lib/api-client';

export interface DeleteLeagueResponse {
  detail: string;
}

export function deleteLeague(
  leagueId: string,
  platform: 'ESPN' | 'SLEEPER',
): Promise<DeleteLeagueResponse> {
  const params = new URLSearchParams({ platform });
  return apiClient.delete<DeleteLeagueResponse>(
    `/leagues/${leagueId}?${params}`,
  );
}
