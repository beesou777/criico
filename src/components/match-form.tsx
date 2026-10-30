'use client';

import { memo, useCallback, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  LoaderCircle,
  Search,
  X,
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

type PlayerStat = { runs: number | string; wickets: number | string };

const INITIAL_PLAYER_RESULTS = 20;
const MAX_PLAYERS_PER_TEAM = 11;

const PerformanceRow = memo(function PerformanceRow({
  player,
  side,
  stat,
  onUpdate,
  onRemove,
}: {
  player: PlayerOption;
  side: 'A' | 'B';
  stat: PlayerStat;
  onUpdate: (id: string, field: 'runs' | 'wickets', value: string) => void;
  onRemove: (id: string) => void;
}) {
  const hasNegativeRuns = typeof stat.runs === 'number' && stat.runs < 0;
  const hasNegativeWickets =
    typeof stat.wickets === 'number' && stat.wickets < 0;
  const hasTooManyWickets =
    typeof stat.wickets === 'number' && stat.wickets > 10;

  return (
    <tr
      className="performance-player-row"
      data-testid={`participant-${player.id}`}
    >
      <td className="performance-player-cell" data-label="Player">
        <span className="performance-player-name">{player.name}</span>
        <span className="role-tag">{player.role}</span>
      </td>
      <td className="performance-stat-cell" data-label="Runs">
        <label className="sr-only" htmlFor={`runs-${player.id}`}>
          Runs scored by {player.name}
        </label>
        <input
          id={`runs-${player.id}`}
          type="number"
          name={`runs-${player.id}`}
          min="0"
          step="1"
          required
          value={stat.runs}
          onFocus={(event) => {
            if (String(stat.runs) === '0') event.currentTarget.select();
          }}
          onChange={(event) => onUpdate(player.id, 'runs', event.target.value)}
          className={`stat-input ${hasNegativeRuns ? 'input-error' : ''}`}
          aria-label={`Runs scored by ${player.name}`}
          aria-invalid={hasNegativeRuns}
        />
      </td>
      <td className="performance-stat-cell" data-label="Wickets">
        <label className="sr-only" htmlFor={`wickets-${player.id}`}>
          Wickets taken by {player.name}
        </label>
        <input
          id={`wickets-${player.id}`}
          type="number"
          name={`wickets-${player.id}`}
          min="0"
          max="10"
          step="1"
          required
          value={stat.wickets}
          onFocus={(event) => {
            if (String(stat.wickets) === '0') event.currentTarget.select();
          }}
          onChange={(event) =>
            onUpdate(player.id, 'wickets', event.target.value)
          }
          className={`stat-input ${hasNegativeWickets || hasTooManyWickets ? 'input-error' : ''}`}
          aria-label={`Wickets taken by ${player.name}`}
          aria-invalid={hasNegativeWickets}
        />
      </td>
      <td className="performance-remove-cell" data-label="Remove">
        <button
          type="button"
          onClick={() => onRemove(player.id)}
          className="remove-participant-btn"
          aria-label={`Remove ${player.name} from match`}
          title="Remove player"
        >
          <X size={15} />
        </button>
        <span className="sr-only">Assigned to Team {side}</span>
      </td>
    </tr>
  );
});

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
  const [stats, setStats] = useState<Record<string, PlayerStat>>({});

  // Search queries for each team's squad selector
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [pickerOpenA, setPickerOpenA] = useState(false);
  const [pickerOpenB, setPickerOpenB] = useState(false);

  const [pending, setPending] = useState(false);
  const [, setError] = useState<string | null>(null);
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

  // Search results stay small so the picker remains quick for larger squads.
  const matchingA = useMemo(() => {
    if (!searchA.trim()) return [];
    const q = searchA.toLowerCase().trim();
    return teamAPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q),
      )
      .slice(0, INITIAL_PLAYER_RESULTS);
  }, [teamAPlayers, searchA]);

  const matchingB = useMemo(() => {
    if (!searchB.trim()) return [];
    const q = searchB.toLowerCase().trim();
    return teamBPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q),
      )
      .slice(0, INITIAL_PLAYER_RESULTS);
  }, [teamBPlayers, searchB]);

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
    setPickerOpenA(false);
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
    setPickerOpenB(false);
    if (!pending) setSubmissionKey(null);
  };

  // Add participant to match
  const addParticipant = useCallback(
    (id: string) => {
      const player = players.find((item) => item.id === id);
      if (!player) return;
      const teamPlayerCount = selected.reduce(
        (count, selectedId) =>
          count +
          (players.find((item) => item.id === selectedId)?.teamName ===
          player.teamName
            ? 1
            : 0),
        0,
      );
      if (teamPlayerCount >= MAX_PLAYERS_PER_TEAM) {
        toast.error(
          `${player.teamName} already has ${MAX_PLAYERS_PER_TEAM} players selected.`,
        );
        return;
      }
      setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setStats((prev) => ({
        ...prev,
        [id]: prev[id] ?? { runs: 0, wickets: 0 },
      }));
      setError(null);
      if (!pending) setSubmissionKey(null);
    },
    [pending, players, selected],
  );

  // Remove participant from match
  const removeParticipant = useCallback(
    (id: string) => {
      setSelected((prev) => prev.filter((item) => item !== id));
      setError(null);
      if (!pending) setSubmissionKey(null);
    },
    [pending],
  );

  // Update stat values
  const updateStat = useCallback(
    (id: string, field: 'runs' | 'wickets', value: string) => {
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
    },
    [pending],
  );

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

    const excessiveWicket = performances.find((p) => p.wickets > 10);
    if (excessiveWicket) {
      const msg = 'A player cannot take more than 10 wickets in one match.';
      toast.error(msg);
      setError(msg);
      return;
    }

    const wicketsByTeam = performances.reduce(
      (totals, performance) => {
        totals[performance.teamSide] += performance.wickets;
        return totals;
      },
      { A: 0, B: 0 },
    );
    if (wicketsByTeam.A > 10 || wicketsByTeam.B > 10) {
      const teamSide = wicketsByTeam.A > 10 ? 'A' : 'B';
      const teamName = teamSide === 'A' ? teamA : teamB;
      const msg = `${teamName} cannot record more than 10 wickets in this innings.`;
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
        p.wickets > 10,
    );
    if (invalid) {
      const msg =
        'Runs must be a whole number up to 10,000,000; wickets must be a whole number from 0 to 10.';
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

  const renderTeamPicker = (side: 'A' | 'B', teamName: string) => {
    const isTeamA = side === 'A';
    const sideLabel = isTeamA ? 'Team A' : 'Team B';
    const sideClass = isTeamA ? 'team-a' : 'team-b';
    const teamSquad = isTeamA ? teamAPlayers : teamBPlayers;
    const selectedList = isTeamA ? selectedA : selectedB;
    const teamLimitReached = selectedList.length >= MAX_PLAYERS_PER_TEAM;
    const searchVal = isTeamA ? searchA : searchB;
    const setSearchVal = isTeamA ? setSearchA : setSearchB;
    const matches = isTeamA ? matchingA : matchingB;
    const visiblePlayers = searchVal.trim()
      ? matches
      : teamSquad.slice(0, INITIAL_PLAYER_RESULTS);
    const pickerOpen = isTeamA ? pickerOpenA : pickerOpenB;
    const setPickerOpen = isTeamA ? setPickerOpenA : setPickerOpenB;

    return (
      <section
        className={`team-performance-col ${sideClass}`}
        data-testid={`team-${side}-section`}
        aria-labelledby={`team-${side}-heading`}
      >
        <div className="team-col-header">
          <div className="team-col-title">
            <span className={`side-badge ${sideClass}`}>{sideLabel}</span>
            <h3 className="team-col-name" id={`team-${side}-heading`}>
              {teamName}
            </h3>
          </div>
          <span
            className="px-2 py-0.5 rounded-xl text-xs font-semibold bg-card text-secondary border border-border shrink-0"
            aria-label={`${selectedList.length} players selected for ${sideLabel}`}
          >
            {selectedList.length} selected
          </span>
        </div>

        <div
          className="team-picker-section"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setPickerOpen(false);
          }}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setPickerOpen(false);
            }
          }}
        >
          <div className="team-picker-search-bar">
            <Search size={15} className="picker-search-icon" />
            <input
              type="search"
              value={searchVal}
              onChange={(event) => {
                setSearchVal(event.target.value);
                setPickerOpen(true);
              }}
              onFocus={() => setPickerOpen(true)}
              placeholder={`Search ${teamName} players`}
              aria-label={`Search ${teamName} squad`}
              className="w-full min-h-9 pt-1.5 pr-7.5 pb-1.5 pl-8 border border-border rounded-md text-xs bg-card text-foreground focus:border-primary focus:outline-none"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="picker-clear-search"
                aria-label={`Clear ${teamName} player search`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {pickerOpen && (
            <div
              className="available-squad-container"
              id={`team-${side}-search-results`}
            >
              {teamSquad.length === 0 ? (
                <p className="picker-empty-note">
                  No players registered for {teamName}.{' '}
                  <Link
                    href="/dashboard/players/new"
                    className="picker-link-inline"
                  >
                    Add players
                  </Link>
                </p>
              ) : visiblePlayers.length > 0 ? (
                <>
                  <ul
                    className="available-player-list"
                    aria-label={
                      searchVal.trim()
                        ? `Search results for ${teamName}`
                        : `Players in ${teamName}`
                    }
                  >
                    {visiblePlayers.map((player) => {
                      const isSelected = selected.includes(player.id);
                      return (
                        <li key={player.id} className="available-player-item">
                          <div className="available-player-info">
                            <span className="available-player-name">
                              {player.name}
                            </span>
                            <span className="role-tag">{player.role}</span>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => addParticipant(player.id)}
                            className={`add-participant-btn${isSelected ? ' is-added' : ''}`}
                            aria-label={
                              isSelected
                                ? `${player.name} already added to match`
                                : `Add ${player.name} to match`
                            }
                            aria-pressed={isSelected}
                            disabled={isSelected || teamLimitReached}
                          >
                            {isSelected ? (
                              'Added'
                            ) : teamLimitReached ? (
                              'Team full'
                            ) : (
                              <>
                                <Plus size={14} /> Add
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {teamLimitReached && (
                    <p className="picker-result-note">
                      This team already has 11 players selected for the match.
                    </p>
                  )}
                  {searchVal.trim() &&
                    teamSquad.filter(
                      (player) =>
                        player.name
                          .toLowerCase()
                          .includes(searchVal.toLowerCase()) ||
                        player.role
                          .toLowerCase()
                          .includes(searchVal.toLowerCase()),
                    ).length > matches.length && (
                      <p className="picker-result-note">
                        Refine your search to see more matches.
                      </p>
                    )}
                  {!searchVal.trim() &&
                    teamSquad.length > visiblePlayers.length && (
                      <p className="picker-result-note">
                        Showing the first {INITIAL_PLAYER_RESULTS} players.
                        Search by name or role to find someone else.
                      </p>
                    )}
                </>
              ) : (
                <p className="picker-empty-note">
                  No players match “{searchVal}”.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderPerformanceGroup = (
    side: 'A' | 'B',
    teamName: string,
    teamPlayersSelected: PlayerOption[],
  ) => (
    <tbody key={side}>
      <tr
        className={`performance-team-heading ${side === 'A' ? 'team-a' : 'team-b'}`}
      >
        <th colSpan={4} scope="rowgroup">
          <span className={`side-badge ${side === 'A' ? 'team-a' : 'team-b'}`}>
            Team {side}
          </span>
          <span>{teamName}</span>
          <span className="performance-group-count">
            {teamPlayersSelected.length} player
            {teamPlayersSelected.length === 1 ? '' : 's'}
          </span>
        </th>
      </tr>
      {teamPlayersSelected.length ? (
        teamPlayersSelected.map((player) => (
          <PerformanceRow
            key={player.id}
            player={player}
            side={side}
            stat={stats[player.id] ?? { runs: 0, wickets: 0 }}
            onUpdate={updateStat}
            onRemove={removeParticipant}
          />
        ))
      ) : (
        <tr className="performance-empty-row">
          <td colSpan={4}>No participants selected for this team yet.</td>
        </tr>
      )}
    </tbody>
  );
  return (
    <form autoComplete="off" className="match-editor-form" onSubmit={submit}>
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
          <div
            className="fixture-banner flex flex-wrap items-center justify-between gap-3 p-[12px_18px] mb-5 bg-background border border-border rounded-[6px]"
            role="status"
          >
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

      {/* SECTION 2: Participant selection */}
      <fieldset className="match-participants-fieldset" disabled={pending}>
        <legend className="fieldset-legend">Choose participants</legend>
        <p className="performances-instructions">
          Search each selected squad, then add the players who took part.
        </p>
        {!teamA || !teamB ? (
          <div className="unselected-teams-prompt flex flex-col items-center justify-center text-center p-[48px_24px] border border-dashed border-border rounded-lg bg-[#faf8f5] text-secondary gap-2">
            <AlertCircle
              size={24}
              className="prompt-icon text-secondary opacity-70"
            />
            <p className="prompt-title text-sm font-bold text-foreground m-0">
              Select both match teams above
            </p>
            <p className="prompt-desc text-xs max-w-105 m-0 leading-[1.5]">
              Choose Team A and Team B in the match details card to view and
              select squad participants.
            </p>
          </div>
        ) : (
          <div className="squad-performance-grid">
            {renderTeamPicker('A', teamA)}
            {renderTeamPicker('B', teamB)}
          </div>
        )}
      </fieldset>

      {/* SECTION 3: Compact performance entry */}
      <fieldset className="match-performances-fieldset" disabled={pending}>
        <legend className="fieldset-legend">Record player performances</legend>
        {teamA && teamB ? (
          <div className="performance-table-wrap">
            <table
              className="performance-entry-table"
              aria-label="Player performance figures"
            >
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col">Runs</th>
                  <th scope="col">Wickets</th>
                  <th scope="col">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              {renderPerformanceGroup('A', teamA, selectedA)}
              {renderPerformanceGroup('B', teamB, selectedB)}
            </table>
          </div>
        ) : (
          <p className="performance-entry-prompt">
            Choose Team A and Team B above to record player figures.
          </p>
        )}
      </fieldset>

      {/* SECTION 4: Summary & Primary Action Submission Bar */}
      <div className="match-submission-bar">
        <div className="submission-summary" role="status" aria-live="polite">
          <span className="summary-headline">
            <strong>{selected.length}</strong> player
            {selected.length === 1 ? '' : 's'} participating
          </span>
          <span className="summary-breakdown">
            {teamA ? `${selectedA.length} ${teamA}` : '0 Team A'} ·{' '}
            {teamB ? `${selectedB.length} ${teamB}` : '0 Team B'}
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
