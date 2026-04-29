import { zodResolver } from '@hookform/resolvers/zod';
import {
  type FieldErrors,
  Controller,
  useForm,
  useWatch,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type EspnFormValues,
  type LeagueConnectFormValues,
  leagueConnectSchema,
} from '@/features/connect_league/league-connect-schema';

function getCookieValue(name: string): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : '';
}

export default function MigrateLeague() {
  const navigate = useNavigate();
  const currentPlatform = getCookieValue('leaguePlatform').toLowerCase();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeagueConnectFormValues>({
    resolver: zodResolver(leagueConnectSchema),
    defaultValues: {
      platform: currentPlatform === 'espn' ? 'sleeper' : 'espn',
      swid: getCookieValue('SWID'),
      espnS2: getCookieValue('espn_s2'),
    },
  });

  const platform = useWatch({ control, name: 'platform' });

  const onSubmit = async (data: LeagueConnectFormValues) => {
    // Navigate to second part of migration form with form data
    void navigate('/migrate_league_step2', { state: { formData: data } });
  };

  const availablePlatforms = ['espn', 'sleeper'].filter(
    (p) => p !== currentPlatform,
  );

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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold">
              Migrate League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Controller
                  name="platform"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="platform" className="w-full">
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlatforms.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p === 'espn' ? 'ESPN' : 'Sleeper'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.platform && (
                  <p className="text-sm text-destructive">
                    {errors.platform.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="league-id">League ID</Label>
                <Input
                  id="league-id"
                  type="text"
                  placeholder="Enter your league ID"
                  {...register('leagueId')}
                />
                {errors.leagueId && (
                  <p className="text-sm text-destructive">
                    {errors.leagueId.message}
                  </p>
                )}
              </div>
              {platform === 'espn' && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="latest-season">Latest Season</Label>
                    <Input
                      id="latest-season"
                      type="text"
                      placeholder="Enter the latest season"
                      {...register('latestSeason')}
                    />
                    {(errors as FieldErrors<EspnFormValues>).latestSeason && (
                      <p className="text-sm text-destructive">
                        {
                          (errors as FieldErrors<EspnFormValues>).latestSeason
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="swid">SWID</Label>
                    <Input
                      id="swid"
                      type="text"
                      placeholder="Enter your SWID"
                      {...register('swid')}
                    />
                    {(errors as FieldErrors<EspnFormValues>).swid && (
                      <p className="text-sm text-destructive">
                        {(errors as FieldErrors<EspnFormValues>).swid?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="espn-s2">ESPN S2</Label>
                    <Input
                      id="espn-s2"
                      type="text"
                      placeholder="Enter your ESPN S2 token"
                      {...register('espnS2')}
                    />
                    {(errors as FieldErrors<EspnFormValues>).espnS2 && (
                      <p className="text-sm text-destructive">
                        {
                          (errors as FieldErrors<EspnFormValues>).espnS2
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                </>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Loading...' : 'Next'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
