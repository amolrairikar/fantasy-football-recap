import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
  type FieldErrors,
  Controller,
  useForm,
  useWatch,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Spinner } from '@/components/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  type OnboardRequest,
  getLeague,
  getRefreshStatus,
  onboardLeague,
} from '@/features/connect_league/api-calls';
import {
  type EspnFormValues,
  type LeagueConnectFormValues,
  leagueConnectSchema,
} from '@/features/connect_league/league-connect-schema';
import { ApiError, clearApiError } from '@/lib/api-client';

function getCookieValue(name: string): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : '';
}

export default function LeagueConnect() {
  const navigate = useNavigate();
  const [pollStatus, setPollStatus] = useState<'idle' | 'success' | 'failed'>(
    'idle',
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeagueConnectFormValues>({
    resolver: zodResolver(leagueConnectSchema),
    defaultValues: {
      platform: 'espn',
      swid: getCookieValue('SWID'),
      espnS2: getCookieValue('espn_s2'),
    },
  });

  const platform = useWatch({ control, name: 'platform' });

  const onSubmit = async (data: LeagueConnectFormValues) => {
    setPollStatus('idle');
    const apiPlatform = data.platform.toUpperCase() as 'ESPN' | 'SLEEPER';

    console.log('[LeagueConnect] Submit started', {
      leagueId: data.leagueId,
      platform: apiPlatform,
    });

    let requestType: 'ONBOARD' | 'REFRESH';

    try {
      await getLeague(data.leagueId, apiPlatform);
      requestType = 'REFRESH';
      console.log('[LeagueConnect] League exists — using REFRESH flow');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        clearApiError();
        requestType = 'ONBOARD';
        console.log('[LeagueConnect] League not found — using ONBOARD flow');
      } else {
        console.error('[LeagueConnect] getLeague check failed', {
          status: err instanceof ApiError ? err.status : 'unknown',
        });
        return;
      }
    }

    const body: OnboardRequest = {
      leagueId: data.leagueId,
      platform: apiPlatform,
      season: data.platform === 'espn' ? data.latestSeason : undefined,
      s2: data.platform === 'espn' ? data.espnS2 : undefined,
      swid: data.platform === 'espn' ? data.swid : undefined,
    };

    console.log('[LeagueConnect] Sending onboard request', {
      requestType,
      leagueId: body.leagueId,
      platform: body.platform,
      season: body.season,
    });

    const MAX_ONBOARD_ATTEMPTS = 3;
    let onboardErr: unknown;
    let onboardSucceeded = false;
    for (let attempt = 1; attempt <= MAX_ONBOARD_ATTEMPTS; attempt++) {
      try {
        await onboardLeague(requestType, body);
        console.log(`[LeagueConnect] Onboard request triggered (attempt ${attempt})`);
        onboardSucceeded = true;
        break;
      } catch (err) {
        onboardErr = err;
        const status = err instanceof ApiError ? err.status : 0;
        console.error(`[LeagueConnect] Onboard request failed (attempt ${attempt})`, { status });
        const isRetryable = status === 0 || status >= 500;
        if (!isRetryable || attempt === MAX_ONBOARD_ATTEMPTS) break;
        console.log(`[LeagueConnect] Retrying in 2s...`);
        await new Promise<void>((r) => setTimeout(r, 2000));
      }
    }
    if (!onboardSucceeded) {
      console.error('[LeagueConnect] All onboard attempts exhausted', {
        status: onboardErr instanceof ApiError ? onboardErr.status : 'unknown',
      });
      return;
    }

    console.log('[LeagueConnect] Waiting 5s before polling...');
    await new Promise<void>((r) => setTimeout(r, 5000));

    console.log('[LeagueConnect] Starting status polling');
    await new Promise<void>((resolve) => {
      let done = false;
      let pollCount = 0;
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 3;

      const cleanup = (status: 'success' | 'failed') => {
        if (done) return;
        done = true;
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        console.log(`[LeagueConnect] Polling finished — status: ${status}`, {
          pollCount,
        });
        setPollStatus(status);
        if (status === 'success') {
          void (async () => {
            const leagueData = await getLeague(data.leagueId, apiPlatform);
            document.cookie = `leagueId=${encodeURIComponent(data.leagueId)}; path=/`;
            document.cookie = `leaguePlatform=${encodeURIComponent(apiPlatform)}; path=/`;
            document.cookie = `leagueSeasons=${encodeURIComponent(JSON.stringify(leagueData.data.seasons))}; path=/`;
            void navigate('/home');
          })();
        } else {
          setTimeout(() => setPollStatus('idle'), 10000);
        }
        resolve();
      };

      const intervalId = setInterval(() => {
        void (async () => {
          pollCount += 1;
          try {
            const statusData = await getRefreshStatus(
              data.leagueId,
              apiPlatform,
              requestType,
            );
            const { refresh_status } = statusData.data;
            console.log(`[LeagueConnect] Poll #${pollCount} — refresh_status: ${refresh_status}`);
            consecutiveErrors = 0;
            if (refresh_status === 'COMPLETED') {
              cleanup('success');
            } else if (refresh_status === 'FAILED') {
              cleanup('failed');
            }
          } catch (err) {
            consecutiveErrors += 1;
            console.error(`[LeagueConnect] Poll #${pollCount} error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS} consecutive)`, {
              status: err instanceof ApiError ? err.status : 'unknown',
            });
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              cleanup('failed');
            }
          }
        })();
      }, 1000);

      const timeoutId = setTimeout(() => {
        console.warn('[LeagueConnect] Polling timed out after 30s');
        cleanup('failed');
      }, 30000);
    });
  };

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
              Connect League
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
                        <SelectItem value="espn">ESPN</SelectItem>
                        <SelectItem value="sleeper">Sleeper</SelectItem>
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
                {isSubmitting ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  'Connect'
                )}
              </Button>
            </form>
            {pollStatus === 'success' && (
              <Alert className="mt-4 border-primary bg-primary/10 text-primary">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  League onboarding completed successfully.
                </AlertDescription>
              </Alert>
            )}
            {pollStatus === 'failed' && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Failed</AlertTitle>
                <AlertDescription>
                  League onboarding failed or timed out. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
