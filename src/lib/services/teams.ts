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

export async function getTeams(ownerId: string): Promise<TeamRecord[]> {
  const res = await query<
    Omit<TeamRecord, 'playerCount'> & { playerCount: string }
  >(
    `SELECT teams.id, teams.name, count(players.id)::text AS "playerCount"
     FROM teams
     LEFT JOIN players ON players."teamId" = teams.id AND players."ownerId" = teams."ownerId"
     WHERE teams."ownerId" = $1
     GROUP BY teams.id, teams.name
     ORDER BY lower(teams.name) COLLATE "C", teams.id`,
    [ownerId],
  );
  return res.rows.map((team) => ({
    ...team,
    playerCount: Number(team.playerCount),
  }));
}

export async function createTeam(
  ownerId: string,
  name: string,
): Promise<Pick<TeamRecord, 'id' | 'name'>> {
  try {
    const res = await query<Pick<TeamRecord, 'id' | 'name'>>(
      'INSERT INTO teams ("ownerId", name) VALUES ($1, $2) RETURNING id, name',
      [ownerId, name.trim()],
    );
    return res.rows[0]!;
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ServiceError(409, 'You already have a team with this name.');
    throw error;
  }
}
