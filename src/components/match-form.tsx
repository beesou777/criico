'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  LoaderCircle,
  Search,
  X,
  UsersRound,
  Trophy,
  Calendar,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  matchSubmissionSchema,
  type PlayerOption,
  type Team,
} from '@/lib/contracts';
import { submitJSON } from '@/lib/client-api';

export function MatchForm({
  players,
  teams = [],
}: {
  players: PlayerOption[];
  teams?: Team[];
}) {
  const router = useRouter();

  // Pick initial default teams if available
  const defaultTeamA = teams[0]?.name ?? '';
  const defaultTeamB =
    teams.find((t) => t.name !== defaultTeamA)?.name ?? teams[1]?.name ?? '';

  const [teamA, setTeamA] = useState(defaultTeamA);
  const [teamB, setTeamB] = useState(defaultTeamB);
  const [result, setResult] = useState<'A' | 'B' | 'TIE' | 'NO_RESULT'>('A');

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const [playedAt, setPlayedAt] = useState(today);

  // Selected player IDs
  const [selected, setSelected] = useState<string[]>([]);

  // Per-player performance figures: { runs: number, wickets: number }
  const [stats, setStats] = useState<
    Record<string, { runs: number | string; wickets: number | string }>
  >({});

  // Search queries for each team's squad selector
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);

  // Available teams for Team A (excluding Team B) and Team B (excluding Team A)
  const availableTeamsForA = useMemo(
    () => teams.filter((t) => t.name !== teamB),
    [teams, teamB],
  );
  const availableTeamsForB = useMemo(
    () => teams.filter((t) => t.name !== teamA),
    [teams, teamA],
  );

  // Players registered in database for Team A and Team B
  const teamAPlayers = useMemo(
    () => (teamA ? players.filter((p) => p.teamName === teamA) : []),
    [players, teamA],
  );

  const teamBPlayers = useMemo(
    () => (teamB ? players.filter((p) => p.teamName === teamB) : []),
    [players, teamB],
  );

  // Selected participants for Team A and Team B
  const selectedA = useMemo(
    () => teamAPlayers.filter((p) => selected.includes(p.id)),
    [teamAPlayers, selected],
  );

  const selectedB = useMemo(
    () => teamBPlayers.filter((p) => selected.includes(p.id)),
    [teamBPlayers, selected],
  );

  // Available unselected players for Team A matching search
  const unselectedA = useMemo(() => {
    const pool = teamAPlayers.filter((p) => !selected.includes(p.id));
    if (!searchA.trim()) return pool;
    const q = searchA.toLowerCase().trim();
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q),
    );
  }, [teamAPlayers, selected, searchA]);

  // Available unselected players for Team B matching search
  const unselectedB = useMemo(() => {
    const pool = teamBPlayers.filter((p) => !selected.includes(p.id));
    if (!searchB.trim()) return pool;
    const q = searchB.toLowerCase().trim();
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q),
    );
  }, [teamBPlayers, selected, searchB]);

  // Handle Team A change with graceful revalidation
  const handleTeamAChange = (newTeamA: string) => {
    setTeamA(newTeamA);
    // If any selected player belonged to the previous Team A and is not on Team B, remove them
    const invalidated = selected.filter((id) => {
      const p = players.find((item) => item.id === id);
      return p && p.teamName !== newTeamA && p.teamName !== teamB;
    });
    if (invalidated.length > 0) {
      setSelected((prev) => prev.filter((id) => !invalidated.includes(id)));
      toast.info(
        'Player selections updated to match the newly selected teams.',
      );
    }
    setSearchA('');
    if (!pending) setSubmissionKey(null);
  };

  // Handle Team B change with graceful revalidation
  const handleTeamBChange = (newTeamB: string) => {
    setTeamB(newTeamB);
    // If any selected player belonged to the previous Team B and is not on Team A, remove them
    const invalidated = selected.filter((id) => {
      const p = players.find((item) => item.id === id);
      return p && p.teamName !== teamA && p.teamName !== newTeamB;
    });
    if (invalidated.length > 0) {
      setSelected((prev) => prev.filter((id) => !invalidated.includes(id)));
      toast.info(
        'Player selections updated to match the newly selected teams.',
      );
    }
    setSearchB('');
    if (!pending) setSubmissionKey(null);
  };

  // Add participant to match
  const addParticipant = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setStats((prev) => ({
      ...prev,
      [id]: prev[id] ?? { runs: 0, wickets: 0 },
    }));
    setError(null);
    if (!pending) setSubmissionKey(null);
  };

  // Remove participant from match
  const removeParticipant = (id: string) => {
    setSelected((prev) => prev.filter((item) => item !== id));
    setError(null);
    if (!pending) setSubmissionKey(null);
  };

  // Update stat values
  const updateStat = (id: string, field: 'runs' | 'wickets', value: string) => {
    const parsed = value === '' ? '' : Number(value);
    setStats((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { runs: 0, wickets: 0 }),
        [field]: parsed,
      },
    }));
    setError(null);
    if (!pending) setSubmissionKey(null);
  };

  // Submission handler with comprehensive validation
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!teamA || !teamB) {
      const msg = 'Select both Team A and Team B.';
      toast.error(msg);
      setError(msg);
      return;
    }

    if (teamA.toLowerCase() === teamB.toLowerCase()) {
      const msg = 'Choose two different teams.';
      toast.error(msg);
      setError(msg);
      return;
    }

    if (selected.length === 0) {
      const msg = 'Select at least one participating player.';
      toast.error(msg);
      setError(msg);
      return;
    }

    const performances = selected.map((id) => {
      const player = players.find((item) => item.id === id)!;
      const playerStat = stats[id] ?? { runs: 0, wickets: 0 };
      const runs =
        typeof playerStat.runs === 'number'
          ? playerStat.runs
          : Number(playerStat.runs || 0);
      const wickets =
        typeof playerStat.wickets === 'number'
          ? playerStat.wickets
          : Number(playerStat.wickets || 0);

      return {
        playerId: id,
        teamSide: (player.teamName === teamA ? 'A' : 'B') as 'A' | 'B',
        runs,
        wickets,
      };
    });

    // Explicit check for negative runs -> toast notification
    const negativeRun = performances.find((p) => p.runs < 0);
    if (negativeRun) {
      const msg = 'Total runs must be zero or greater.';
      toast.error(msg);
      setError(msg);
      return;
    }

    // Explicit check for negative wickets -> toast notification
    const negativeWicket = performances.find((p) => p.wickets < 0);
    if (negativeWicket) {
      const msg = 'Total wickets must be zero or greater.';
      toast.error(msg);
      setError(msg);
      return;
    }

    // Whole number and upper bounds verification
    const invalid = performances.find(
      (p) =>
        !Number.isInteger(p.runs) ||
        !Number.isInteger(p.wickets) ||
        p.runs > 10_000_000 ||
        p.wickets > 10_000_000,
    );
    if (invalid) {
      const msg =
        'Runs and wickets must be whole numbers from 0 to 10,000,000.';
      toast.error(msg);
      setError(msg);
      return;
    }

    const key = submissionKey ?? crypto.randomUUID();
    setSubmissionKey(key);
    setPending(true);

    try {
      const response = await submitJSON('/api/matches', 'POST', {
        teamA,
        teamB,
        result,
        playedAt,
        submissionKey: key,
        performances,
      });
      const saved = matchSubmissionSchema.parse(response);

      toast.success(
        'Match recorded. Career statistics and leaderboard updated.',
      );
      router.push(`/dashboard/matches/${saved.match.id}`);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not record match.';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  // Render a team's participant selection and performance figures
  const renderTeamSection = (side: 'A' | 'B', teamName: string) => {
    const isTeamA = side === 'A';
    const sideLabel = isTeamA ? 'Team A' : 'Team B';
    const sideStyles = isTeamA
      ? 'bg-[#e5ede7] text-[#123d2b] border-[#c2d6c6]'
      : 'bg-[#fae8eb] text-[#dc143c] border-[#f1c3cb]';
    const sideChipStyles = isTeamA
      ? 'bg-[#e5ede7] text-[#123d2b]'
      : 'bg-[#fae8eb] text-[#dc143c]';
    const teamSquad = isTeamA ? teamAPlayers : teamBPlayers;
    const selectedList = isTeamA ? selectedA : selectedB;
    const unselectedList = isTeamA ? unselectedA : unselectedB;
    const searchVal = isTeamA ? searchA : searchB;
    const setSearchVal = isTeamA ? setSearchA : setSearchB;

    return (
      <div
        className={`team-performance-col border border-border rounded-lg bg-card overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${isTeamA ? 'team-a border-t-[3px] border-t-primary' : 'team-b border-t-[3px] border-t-accent'}`}
        data-testid={`team-${side}-section`}
      >
        {/* Team Section Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-background border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 border rounded text-xs font-bold uppercase tracking-wide ${sideStyles}`}
            >
              {sideLabel}
            </span>
            <h3 className="text-sm font-bold text-foreground m-0 whitespace-nowrap overflow-hidden text-ellipsis">
              {teamName}
            </h3>
          </div>
          <span
            className="px-2 py-0.5 rounded-xl text-xs font-semibold bg-card text-secondary border border-border shrink-0"
            aria-label={`${selectedList.length} players selected for ${sideLabel}`}
          >
            {selectedList.length} participant
            {selectedList.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Searchable Player Picker */}
        <div className="px-4 py-3.5 border-b border-border bg-stone-50">
          <div className="relative flex items-center mb-2.5">
            <Search
              size={15}
              className="absolute left-2.5 text-secondary pointer-events-none"
            />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={`Search & add ${teamName} player…`}
              aria-label={`Search ${teamName} squad`}
              className="w-full min-h-9 pt-1.5 pr-7.5 pb-1.5 pl-8 border border-border rounded-md text-xs bg-card text-foreground focus:border-primary focus:outline-none"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="absolute right-2 border-0 bg-transparent text-secondary cursor-pointer grid place-items-center w-5 h-5 rounded-full"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Available Squad List (Filtered unselected players) */}
          <div className="max-h-40 overflow-y-auto">
            {unselectedList.length > 0 ? (
              <ul
                className="list-none m-0 p-0 flex flex-col gap-1"
                aria-label={`Available players for ${teamName}`}
              >
                {unselectedList.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded bg-card border border-border text-xs transition-colors duration-150 hover:bg-rose-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {player.name}
                      </span>
                      <span className="inline-block bg-rose-100 text-rose-800 rounded-sm text-xs font-semibold px-2 py-1 whitespace-nowrap">
                        {player.role}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addParticipant(player.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-card border border-border text-primary cursor-pointer transition-colors duration-150 hover:bg-primary hover:text-card hover:border-primary"
                      aria-label={`Add ${player.name} to match`}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : teamSquad.length === 0 ? (
              <p className="text-xs text-secondary italic mt-1 leading-snug">
                No players registered for {teamName} yet.{' '}
                <Link
                  href="/dashboard/players/new"
                  className="text-accent underline font-semibold"
                >
                  Add players
                </Link>
              </p>
            ) : selectedList.length === teamSquad.length ? (
              <p className="text-xs text-secondary italic mt-1 leading-snug">
                All {teamSquad.length} squad members have been added to this
                match.
              </p>
            ) : (
              <p className="text-xs text-secondary italic mt-1 leading-snug">
                No players match &ldquo;{searchVal}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* Selected Participants / Match Figures */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary m-0">Match Figures</h4>
            <span className="text-xs text-secondary">
              {selectedList.length === 0
                ? 'No figures entered'
                : `${selectedList.length} player${selectedList.length === 1 ? '' : 's'} in match`}
            </span>
          </div>

          {selectedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-border rounded-md bg-stone-50 gap-1.5">
              <UsersRound size={28} className="text-secondary opacity-50" />
              <p className="text-xs font-bold text-foreground m-0">
                No participants added yet
              </p>
              <p className="text-xs text-secondary m-0 leading-snug">
                Use the search box above to add players who took part in this
                fixture.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {selectedList.map((player) => {
                const currentStat = stats[player.id] ?? {
                  runs: 0,
                  wickets: 0,
                };
                const runsVal = currentStat.runs;
                const wicketsVal = currentStat.wickets;
                const hasNegativeRuns =
                  typeof runsVal === 'number' && runsVal < 0;
                const hasNegativeWickets =
                  typeof wicketsVal === 'number' && wicketsVal < 0;

                return (
                  <div
                    key={player.id}
                    className="py-3 px-3.5 border border-border rounded-md bg-stone-50 flex flex-col gap-2.5 transition-colors duration-150 hover:border-stone-300"
                    data-testid={`participant-${player.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-foreground">
                          {player.name}
                        </strong>
                        <span className="inline-block bg-rose-100 text-rose-800 rounded-sm text-xs font-semibold px-2 py-1 whitespace-nowrap">
                          {player.role}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase py-0.25 px-1.25 rounded-sm tracking-wide ${sideChipStyles}`}
                          title={`Playing for ${sideLabel}`}
                        >
                          {sideLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipant(player.id)}
                        className="grid place-items-center w-6 h-6 border-0 bg-transparent text-secondary rounded cursor-pointer transition-colors duration-150 hover:bg-rose-100 hover:text-accent"
                        aria-label={`Remove ${player.name} from match`}
                        title="Remove player"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`runs-${player.id}`}
                          className="text-xs font-semibold text-secondary"
                        >
                          Runs
                        </label>
                        <input
                          id={`runs-${player.id}`}
                          type="number"
                          name={`runs-${player.id}`}
                          min="0"
                          step="1"
                          required
                          value={runsVal}
                          onChange={(e) =>
                            updateStat(player.id, 'runs', e.target.value)
                          }
                          className={`min-h-9 px-2.5 py-1.5 text-sm font-semibold border border-border rounded bg-card text-foreground transition-colors duration-150 focus:border-primary focus:outline-none${hasNegativeRuns ? ' border-accent bg-rose-50' : ''}`}
                          aria-label={`Runs scored by ${player.name}`}
                        />
                        {hasNegativeRuns && (
                          <span
                            className="text-xs text-accent font-semibold"
                            role="alert"
                          >
                            Must be ≥ 0
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`wickets-${player.id}`}
                          className="text-xs font-semibold text-secondary"
                        >
                          Wickets
                        </label>
                        <input
                          id={`wickets-${player.id}`}
                          type="number"
                          name={`wickets-${player.id}`}
                          min="0"
                          step="1"
                          required
                          value={wicketsVal}
                          onChange={(e) =>
                            updateStat(player.id, 'wickets', e.target.value)
                          }
                          className={`min-h-9 px-2.5 py-1.5 text-sm font-semibold border border-border rounded bg-card text-foreground transition-colors duration-150 focus:border-primary focus:outline-none${hasNegativeWickets ? ' border-accent bg-rose-50' : ''}`}
                          aria-label={`Wickets taken by ${player.name}`}
                        />
                        {hasNegativeWickets && (
                          <span
                            className="text-xs text-accent font-semibold"
                            role="alert"
                          >
                            Must be ≥ 0
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form className="match-editor-form" onSubmit={submit}>
      {/* SECTION 1: Match Details & Fixture Setup */}
      <fieldset
        className="bg-card border border-border rounded-lg p-6 shadow-xs"
        disabled={pending}
      >
        <legend className="text-base font-extrabold text-foreground px-2 tracking-tight">
          Match details
        </legend>

        <div className="matchup-grid grid grid-cols-[1fr_auto_1fr] items-end gap-5 mb-5 max-sm:grid-cols-1 max-sm:gap-3">
          {/* Team A Selection */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="match-team-a"
              className="flex items-center justify-between text-xs font-semibold text-secondary"
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-[#e5ede7] text-[#123d2b] border border-[#c2d6c6]">
                Team A
              </span>
              <span>Home / First Batting Side</span>
            </label>
            <select
              id="match-team-a"
              name="teamA"
              aria-label="Select Team A"
              required
              value={teamA}
              onChange={(e) => handleTeamAChange(e.target.value)}
              className="w-full min-h-11 px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm font-semibold transition-colors duration-150 focus:border-primary focus:outline-none"
            >
              <option value="">Select Team A</option>
              {availableTeamsForA.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* VS Divider Indicator */}
          <div
            className="flex flex-col items-center justify-center pb-1"
            aria-hidden="true"
          >
            <span className="vs-badge w-[38px] h-[38px] rounded-full bg-soft border border-border grid place-items-center text-[11px] font-extrabold text-secondary tracking-[0.08em]">
              VS
            </span>
          </div>

          {/* Team B Selection */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="match-team-b"
              className="flex items-center justify-between text-xs font-semibold text-secondary"
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-[#fae8eb] text-[#dc143c] border border-[#f1c3cb]">
                Team B
              </span>
              <span>Away / Second Batting Side</span>
            </label>
            <select
              id="match-team-b"
              name="teamB"
              aria-label="Select Team B"
              required
              value={teamB}
              onChange={(e) => handleTeamBChange(e.target.value)}
              className="w-full min-h-11 px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm font-semibold transition-colors duration-150 focus:border-primary focus:outline-none"
            >
              <option value="">Select Team B</option>
              {availableTeamsForB.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fixture Matchup Banner (Displayed when both teams chosen) */}
        {teamA && teamB && (
          <div className="fixture-banner flex flex-wrap items-center justify-between gap-3 p-[12px_18px] mb-5 bg-background border border-border rounded-[6px]" role="status">
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <span className="text-primary">{teamA}</span>
              <span className="text-secondary text-xs italic font-medium">
                versus
              </span>
              <span className="text-accent">{teamB}</span>
            </div>
            <div className="text-xs text-secondary">
              <span>
                Outcome:{' '}
                <strong>
                  {result === 'A'
                    ? `${teamA} won`
                    : result === 'B'
                      ? `${teamB} won`
                      : result === 'TIE'
                        ? 'Match tied'
                        : 'No result'}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Date and Result Settings */}
        <div className="match-meta-grid grid grid-cols-2 gap-5 max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="match-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
            >
              <Calendar size={14} className="text-secondary" />
              <span>Match date</span>
            </label>
            <input
              id="match-date"
              type="date"
              name="playedAt"
              required
              value={playedAt}
              max={today}
              onChange={(e) => {
                setPlayedAt(e.target.value);
                if (!pending) setSubmissionKey(null);
              }}
              className="w-full min-h-10.5 px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm transition-colors duration-150"
            />
            <span className="text-xs text-secondary leading-snug">
              Completed match date in Asia/Kathmandu time (cannot be future).
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="match-result"
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
            >
              <Trophy size={14} className="text-secondary" />
              <span>Official result</span>
            </label>
            <select
              id="match-result"
              name="result"
              value={result}
              onChange={(e) => {
                setResult(e.target.value as typeof result);
                if (!pending) setSubmissionKey(null);
              }}
              className="w-full min-h-10.5 px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm transition-colors duration-150"
            >
              <option value="A">{teamA ? `${teamA} won` : 'Team A won'}</option>
              <option value="B">{teamB ? `${teamB} won` : 'Team B won'}</option>
              <option value="TIE">Match tied</option>
              <option value="NO_RESULT">No result</option>
            </select>
            <span className="text-xs text-secondary leading-snug">
              Sets official victory or draw for this fixture.
            </span>
          </div>
        </div>
      </fieldset>

      {/* SECTION 2: Player Performance Selection & Entry */}
      <fieldset
        className="bg-card border border-border rounded-lg p-6 shadow-xs"
        disabled={pending}
      >
        <legend className="text-base font-extrabold text-foreground px-2 tracking-tight">
          Player performances
        </legend>

        <p className="performances-instructions">
          Select squad participants from each team, then enter their match
          figures. Team side is assigned automatically from club affiliation.
        </p>

        {!teamA || !teamB ? (
          <div className="unselected-teams-prompt flex flex-col items-center justify-center text-center p-[48px_24px] border border-dashed border-border rounded-lg bg-[#faf8f5] text-secondary gap-2">
            <AlertCircle size={24} className="prompt-icon text-secondary opacity-70" />
            <p className="prompt-title text-sm font-bold text-foreground m-0">
              Select both match teams above
            </p>
            <p className="prompt-desc text-xs max-w-[420px] m-0 leading-[1.5]">
              Choose Team A and Team B in the match details card to view and
              select squad participants.
            </p>
          </div>
        ) : (
          <div className="squad-performance-grid grid grid-cols-2 gap-6 items-start max-md:grid-cols-1 max-md:gap-5">
            {renderTeamSection('A', teamA)}
            {renderTeamSection('B', teamB)}
          </div>
        )}
      </fieldset>

      {/* Global Error Banner if any */}
      {error && (
        <div className="match-form-error-banner flex items-center gap-2.5 p-[12px_16px] rounded-[6px] bg-[#fff1f3] border border-[#fecdd3] text-accent text-[13px] font-semibold" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 3: Summary & Primary Action Submission Bar */}
      <div className="match-submission-bar flex flex-wrap items-center justify-between gap-4 p-[20px_24px] bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="submission-summary flex flex-col gap-0.5">
          <span className="summary-headline text-sm font-bold text-foreground">
            <strong className="text-accent text-base">{selected.length}</strong> player
            {selected.length === 1 ? '' : 's'} participating
          </span>
          <span className="summary-breakdown text-[11px] text-secondary">
            {teamA ? `${selectedA.length} from ${teamA}` : '0 from Team A'} ·{' '}
            {teamB ? `${selectedB.length} from ${teamB}` : '0 from Team B'}
          </span>
        </div>

        <div className="submission-actions flex items-center gap-3">
          <Link
            href="/dashboard/matches"
            className="button button-outline inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] bg-transparent hover:bg-soft transition-colors text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || !teamA || !teamB}
            className="button button-primary record-match-btn inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] bg-accent text-white hover:bg-accent-hover transition-colors text-xs font-bold cursor-pointer"
          >
            {pending ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            <span>{pending ? 'Recording match…' : 'Record match'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
