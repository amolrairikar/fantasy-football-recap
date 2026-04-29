import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Spinner } from '@/components/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LeagueConnectFormValues } from '@/features/connect_league/league-connect-schema';
import { getMigrateUsers, getTeams, type MigrateUser, type Team } from '@/features/migrate_league/api-calls';

function getCookieValue(name: string): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : '';
}

export default function MigrateLeagueStep2() {
  const location = useLocation();
  const formData = location.state?.formData as LeagueConnectFormValues | undefined;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationChoices, setMigrationChoices] = useState<Record<string, string>>({});
  const [targetLeagueChoices, setTargetLeagueChoices] = useState<Record<string, string>>({});
  const [migrateUsers, setMigrateUsers] = useState<MigrateUser[]>([]);
  const [migrateUsersError, setMigrateUsersError] = useState<string | null>(null);

  useEffect(() => {
    if (!formData) return;

    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      setMigrateUsersError(null);

      try {
        const currentPlatform = getCookieValue('leaguePlatform');
        const seasonsCookie = getCookieValue('leagueSeasons');
        const seasons = seasonsCookie ? JSON.parse(seasonsCookie) : [];
        const maxSeason = seasons.length > 0 ? Math.max(...seasons.map(Number)).toString() : '';

        const leagueId = getCookieValue('leagueId');
        const platform = currentPlatform.toUpperCase() as 'ESPN' | 'SLEEPER';

        const response = await getTeams(leagueId, platform);
        const filteredTeams = response.data.filter((team) => team.season === maxSeason);
        setTeams(filteredTeams.slice(0, 10));

        // Fetch users from target league for migration
        try {
          const migrateUsersRequest: {
            leagueId: string;
            platform: string;
            season?: string;
            s2?: string;
            swid?: string;
          } = {
            leagueId: formData.leagueId,
            platform: formData.platform,
          };

          if (formData.platform === 'espn' && 'latestSeason' in formData) {
            migrateUsersRequest.season = formData.latestSeason;
            migrateUsersRequest.s2 = formData.espnS2;
            migrateUsersRequest.swid = formData.swid;
          }

          const migrateUsersResponse = await getMigrateUsers(migrateUsersRequest);
          setMigrateUsers(migrateUsersResponse.data.users);
        } catch (err) {
          setMigrateUsersError('Failed to fetch users from target league');
          console.error('Failed to fetch migrate users:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };

    void fetchTeams();
  }, [formData]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.2,
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold">
              Migrate League - Step 2
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center">
                <Spinner />
              </div>
            ) : error ? (
              <p className="text-center text-destructive">{error}</p>
            ) : migrateUsersError ? (
              <p className="text-center text-destructive">{migrateUsersError}</p>
            ) : teams.length > 0 ? (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div key={team.team_id} className="flex items-center gap-4">
                    <div className="text-sm flex-1">{team.display_name}</div>
                    <Select
                      value={migrationChoices[team.team_id] || ''}
                      onValueChange={(value) =>
                        setMigrationChoices((prev) => ({
                          ...prev,
                          [team.team_id]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="migrate">
                          Migrate to new league
                        </SelectItem>
                        <SelectItem value="do_not_migrate">
                          Do not migrate to new league
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="w-48">
                      {migrationChoices[team.team_id] === 'migrate' ? (
                        <Select
                          value={targetLeagueChoices[team.team_id] || ''}
                          onValueChange={(value) =>
                            setTargetLeagueChoices((prev) => ({
                              ...prev,
                              [team.team_id]: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {migrateUsers.length > 0 ? (
                              migrateUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.display_name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No users available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No teams found. Please start from the first step.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
