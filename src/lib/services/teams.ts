import { query } from '../db';
import {
  isUniqueViolation,
  ServiceError,
  type PlayerRecord,
  type TeamRecord,
} from './shared';

export async function getPlayerOptions(ownerId: string) {
  const res = await query<{
    id: string;
    name: string;
    role: PlayerRecord['role'];
    teamId: string;
    teamName: string;
  }>(
    'SELECT players.id, players.name, players.role, players."teamId", teams.name AS "teamName" FROM players LEFT JOIN teams ON teams.id = players."teamId" WHERE players."ownerId" = $1 ORDER BY lower(players.name) COLLATE "C", players.id',
    [ownerId],
  );
  return res.rows;
}

export async function getTeams(
  ownerId: string,
  options: { includeDisbanded?: boolean } = {},
): Promise<TeamRecord[]> {
  const res = await query<
    Omit<TeamRecord, 'playerCount'> & { playerCount: string }
  >(
    `SELECT teams.id, teams.name, teams."disbandedAt", count(players.id)::text AS "playerCount"
     FROM teams
     LEFT JOIN players ON players."teamId" = teams.id AND players."ownerId" = teams."ownerId"
     WHERE teams."ownerId" = $1
       ${options.includeDisbanded ? '' : 'AND teams."disbandedAt" IS NULL'}
     GROUP BY teams.id, teams.name
     ORDER BY lower(teams.name) COLLATE "C", teams.id`,
    [ownerId],
  );
  return res.rows.map((team) => {
    const result: TeamRecord = {
      id: team.id,
      name: team.name,
      playerCount: Number(team.playerCount),
    };
    if (options.includeDisbanded) {
      result.disbandedAt = team.disbandedAt
        ? new Date(team.disbandedAt).toISOString()
        : null;
    }
    return result;
  });
}

export async function createTeam(
  ownerId: string,
  name: string,
): Promise<Pick<TeamRecord, 'id' | 'name'>> {
  try {
    const res = await query<Pick<TeamRecord, 'id' | 'name'>>(
      'INSERT INTO teams ("ownerId", name) VALUES ($1, $2) RETURNING id, name, "disbandedAt"',
      [ownerId, name.trim()],
    );
    return res.rows[0]!;
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ServiceError(409, 'You already have a team with this name.');
    throw error;
  }
}

export async function setTeamDisbanded(
  ownerId: string,
  teamId: string,
  disbanded: boolean,
): Promise<void> {
  const result = await query(
    `UPDATE teams
     SET "disbandedAt" = ${disbanded ? 'now()' : 'NULL'}
     WHERE id = $1 AND "ownerId" = $2
       AND "disbandedAt" IS ${disbanded ? 'NULL' : 'NOT NULL'}`,
    [teamId, ownerId],
  );
  if (!result.rowCount) {
    throw new ServiceError(
      404,
      disbanded
        ? 'Team not found or already disbanded.'
        : 'Disbanded team not found.',
    );
  }
}

export async function updateTeamName(
  ownerId: string,
  teamId: string,
  name: string,
): Promise<void> {
  try {
    const result = await query(
      'UPDATE teams SET name = $1 WHERE id = $2 AND "ownerId" = $3',
      [name.trim(), teamId, ownerId],
    );
    if (!result.rowCount) throw new ServiceError(404, 'Team not found.');
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ServiceError(409, 'You already have a team with this name.');
    }
    throw error;
  }
}
