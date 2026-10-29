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
    const sideClass = isTeamA ? 'team-a' : 'team-b';
    const teamSquad = isTeamA ? teamAPlayers : teamBPlayers;
    const selectedList = isTeamA ? selectedA : selectedB;
    const unselectedList = isTeamA ? unselectedA : unselectedB;
    const searchVal = isTeamA ? searchA : searchB;
    const setSearchVal = isTeamA ? setSearchA : setSearchB;

    return (
      <div
        className={`team-performance-col ${sideClass}`}
        data-testid={`team-${side}-section`}
      >
        {/* Team Section Header */}
        <div className="team-col-header">
          <div className="team-col-title">
            <span className={`side-badge ${sideClass}`}>{sideLabel}</span>
            <h3 className="team-col-name">{teamName}</h3>
          </div>
          <span
            className="participant-count-pill"
            aria-label={`${selectedList.length} players selected for ${sideLabel}`}
          >
            {selectedList.length} participant
            {selectedList.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Searchable Player Picker */}
        <div className="team-picker-section">
          <div className="team-picker-search-bar">
            <Search size={15} className="picker-search-icon" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={`Search & add ${teamName} player…`}
              aria-label={`Search ${teamName} squad`}
              className="team-search-input"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="picker-clear-search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Available Squad List (Filtered unselected players) */}
          <div className="available-squad-container">
            {unselectedList.length > 0 ? (
              <ul
                className="available-player-list"
                aria-label={`Available players for ${teamName}`}
              >
                {unselectedList.map((player) => (
                  <li key={player.id} className="available-player-item">
                    <div className="available-player-info">
                      <span className="available-player-name">
                        {player.name}
                      </span>
                      <span className="role-tag">{player.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addParticipant(player.id)}
                      className="add-participant-btn"
                      aria-label={`Add ${player.name} to match`}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : teamSquad.length === 0 ? (
              <p className="picker-empty-note">
                No players registered for {teamName} yet.{' '}
                <Link
                  href="/dashboard/players/new"
                  className="picker-link-inline"
                >
                  Add players
                </Link>
              </p>
            ) : selectedList.length === teamSquad.length ? (
              <p className="picker-empty-note">
                All {teamSquad.length} squad members have been added to this
                match.
              </p>
            ) : (
              <p className="picker-empty-note">
                No players match &ldquo;{searchVal}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* Selected Participants / Match Figures */}
        <div className="team-figures-section">
          <div className="figures-header">
            <h4>Match Figures</h4>
            <span className="figures-subtitle">
              {selectedList.length === 0
                ? 'No figures entered'
                : `${selectedList.length} player${selectedList.length === 1 ? '' : 's'} in match`}
            </span>
          </div>

          {selectedList.length === 0 ? (
            <div className="figures-empty-state">
              <UsersRound size={28} className="empty-icon" />
              <p className="empty-title">No participants added yet</p>
              <p className="empty-description">
                Use the search box above to add players who took part in this
                fixture.
              </p>
            </div>
          ) : (
            <div className="participant-cards-list">
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
                    className="participant-card"
                    data-testid={`participant-${player.id}`}
                  >
                    <div className="participant-card-top">
                      <div className="participant-info">
                        <strong className="participant-name">
                          {player.name}
                        </strong>
                        <span className="role-tag">{player.role}</span>
                        <span
                          className={`side-chip-tiny ${sideClass}`}
                          title={`Playing for ${sideLabel}`}
                        >
                          {sideLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipant(player.id)}
                        className="remove-participant-btn"
                        aria-label={`Remove ${player.name} from match`}
                        title="Remove player"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="participant-inputs-row">
                      <div className="stat-input-group">
                        <label
                          htmlFor={`runs-${player.id}`}
                          className="stat-label"
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
                          className={`stat-input ${hasNegativeRuns ? 'input-error' : ''}`}
                          aria-label={`Runs scored by ${player.name}`}
                        />
                        {hasNegativeRuns && (
                          <span className="inline-stat-error" role="alert">
                            Must be ≥ 0
                          </span>
                        )}
                      </div>

                      <div className="stat-input-group">
                        <label
                          htmlFor={`wickets-${player.id}`}
                          className="stat-label"
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
                          className={`stat-input ${hasNegativeWickets ? 'input-error' : ''}`}
                          aria-label={`Wickets taken by ${player.name}`}
                        />
                        {hasNegativeWickets && (
                          <span className="inline-stat-error" role="alert">
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
      <fieldset className="match-details-fieldset" disabled={pending}>
        <legend className="fieldset-legend">Match details</legend>

        <div className="matchup-grid">
          {/* Team A Selection */}
          <div className="team-select-box team-a-box">
            <label htmlFor="match-team-a" className="select-box-label">
              <span className="side-badge team-a">Team A</span>
              <span>Home / First Batting Side</span>
            </label>
            <select
              id="match-team-a"
              name="teamA"
              aria-label="Select Team A"
              required
              value={teamA}
              onChange={(e) => handleTeamAChange(e.target.value)}
              className="match-team-select"
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
          <div className="vs-divider-container" aria-hidden="true">
            <div className="vs-line" />
            <span className="vs-badge">VS</span>
            <div className="vs-line" />
          </div>

          {/* Team B Selection */}
          <div className="team-select-box team-b-box">
            <label htmlFor="match-team-b" className="select-box-label">
              <span className="side-badge team-b">Team B</span>
              <span>Away / Second Batting Side</span>
            </label>
            <select
              id="match-team-b"
              name="teamB"
              aria-label="Select Team B"
              required
              value={teamB}
              onChange={(e) => handleTeamBChange(e.target.value)}
              className="match-team-select"
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
          <div className="fixture-banner" role="status">
            <div className="fixture-teams">
              <span className="fixture-team team-a">{teamA}</span>
              <span className="fixture-vs">versus</span>
              <span className="fixture-team team-b">{teamB}</span>
            </div>
            <div className="fixture-meta">
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
        <div className="match-meta-grid">
          <div className="form-field-group">
            <label htmlFor="match-date" className="field-label">
              <Calendar size={14} className="field-icon" />
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
              className="date-input"
            />
            <span className="field-hint">
              Completed match date in Asia/Kathmandu time (cannot be future).
            </span>
          </div>

          <div className="form-field-group">
            <label htmlFor="match-result" className="field-label">
              <Trophy size={14} className="field-icon" />
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
              className="result-select"
            >
              <option value="A">{teamA ? `${teamA} won` : 'Team A won'}</option>
              <option value="B">{teamB ? `${teamB} won` : 'Team B won'}</option>
              <option value="TIE">Match tied</option>
              <option value="NO_RESULT">No result</option>
            </select>
            <span className="field-hint">
              Sets official victory or draw for this fixture.
            </span>
          </div>
        </div>
      </fieldset>

      {/* SECTION 2: Player Performance Selection & Entry */}
      <fieldset className="match-performances-fieldset" disabled={pending}>
        <legend className="fieldset-legend">Player performances</legend>

        <p className="performances-instructions">
          Select squad participants from each team, then enter their match
          figures. Team side is assigned automatically from club affiliation.
        </p>

        {!teamA || !teamB ? (
          <div className="unselected-teams-prompt">
            <AlertCircle size={24} className="prompt-icon" />
            <p className="prompt-title">Select both match teams above</p>
            <p className="prompt-desc">
              Choose Team A and Team B in the match details card to view and
              select squad participants.
            </p>
          </div>
        ) : (
          <div className="squad-performance-grid">
            {renderTeamSection('A', teamA)}
            {renderTeamSection('B', teamB)}
          </div>
        )}
      </fieldset>

      {/* Global Error Banner if any */}
      {error && (
        <div className="match-form-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 3: Summary & Primary Action Submission Bar */}
      <div className="match-submission-bar">
        <div className="submission-summary">
          <span className="summary-headline">
            <strong>{selected.length}</strong> player
            {selected.length === 1 ? '' : 's'} participating
          </span>
          <span className="summary-breakdown">
            {teamA ? `${selectedA.length} from ${teamA}` : '0 from Team A'} ·{' '}
            {teamB ? `${selectedB.length} from ${teamB}` : '0 from Team B'}
          </span>
        </div>

        <div className="submission-actions">
          <Link href="/dashboard/matches" className="button button-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || !teamA || !teamB}
            className="button button-primary record-match-btn"
          >
            {pending ? (
              <LoaderCircle size={18} className="spin" />
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
