import { apiClient } from '@/lib/api-client';

export interface Team {
  display_name: string;
  team_id: string;
  team_name: string;
  team_logo: string | null;
  season: string;
  primary_owner_id: string;
  secondary_owner_id: string | null;
}

export interface TeamsResponse {
  data: Team[];
}

export function getTeams(
  leagueId: string,
  platform: 'ESPN' | 'SLEEPER',
): Promise<TeamsResponse> {
  const params = new URLSearchParams({ platform, queryType: 'TEAMS' });
  return apiClient.get<TeamsResponse>(`/leagues/${leagueId}/query?${params}`);
}

export interface MigrateUser {
  id: string;
  display_name: string;
}

export interface MigrateUsersResponse {
  detail: string;
  data: {
    users: MigrateUser[];
  };
}

export interface MigrateUsersRequest {
  leagueId: string;
  platform: string;
  season?: string;
  s2?: string;
  swid?: string;
}

export function getMigrateUsers(
  request: MigrateUsersRequest,
): Promise<MigrateUsersResponse> {
  return apiClient.post<MigrateUsersResponse>('/leagues/migrate/new_users', request);
}
