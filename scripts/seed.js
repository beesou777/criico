const { Client } = require('pg');
const { databaseOptions } = require('./database-options.cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({
    ...databaseOptions(connectionString),
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database for seeding.');

    const email = process.env.SEED_EMAIL;
    const plainPassword = process.env.SEED_PASSWORD;
    const organizationName = (
      process.env.SEED_ORGANIZATION_NAME || 'Grassroots Cricket Manager'
    ).trim();
    if (
      !email ||
      !plainPassword ||
      plainPassword.length < 8 ||
      Buffer.byteLength(plainPassword, 'utf8') > 72
    )
      throw new Error(
        'Set SEED_EMAIL and a valid SEED_PASSWORD (8 characters minimum, 72 UTF-8 bytes maximum).',
      );
    if (organizationName.length < 2 || organizationName.length > 80)
      throw new Error(
        'SEED_ORGANIZATION_NAME must be between 2 and 80 characters.',
      );
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const userRes = await client.query(
      `INSERT INTO users (email, "passwordHash", "organizationName")
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash",
                     "organizationName" = EXCLUDED."organizationName"
       RETURNING id, email, "organizationName"`,
      [email, passwordHash, organizationName],
    );

    const user = userRes.rows[0];
    console.log(
      `Showcase user ready: ${user.email} (${user.id}) — ${user.organizationName}`,
    );

    await client.query('BEGIN');

    await client.query(
      `DELETE FROM performances
       WHERE "matchId" IN (
         SELECT id FROM matches WHERE "ownerId" = $1
       )`,
      [user.id],
    );

    await client.query(`DELETE FROM players WHERE "ownerId" = $1`, [user.id]);

    await client.query(`DELETE FROM teams WHERE "ownerId" = $1`, [user.id]);

    await client.query(`DELETE FROM matches WHERE "ownerId" = $1`, [user.id]);

    console.log('Cleaned previous demo data for user.');

    const originalPlayers = [
      {
        name: 'Dipendra Singh Airee',
        role: 'All-rounder',
        basePrice: 2500000,
        matchesPlayed: 24,
        totalRuns: 1480,
        totalWickets: 38,
      },
      {
        name: 'Sandeep Lamichhane',
        role: 'Bowler',
        basePrice: 2500000,
        matchesPlayed: 25,
        totalRuns: 180,
        totalWickets: 74,
      },
      {
        name: 'Kushal Bhurtel',
        role: 'Batsman',
        basePrice: 2000000,
        matchesPlayed: 21,
        totalRuns: 1320,
        totalWickets: 15,
      },
      {
        name: 'Rohit Kumar Paudel',
        role: 'Batsman',
        basePrice: 2500000,
        matchesPlayed: 22,
        totalRuns: 1250,
        totalWickets: 12,
      },
      {
        name: 'Aasif Sheikh',
        role: 'Wicketkeeper',
        basePrice: 2000000,
        matchesPlayed: 21,
        totalRuns: 1120,
        totalWickets: 0,
      },
      {
        name: 'Sompal Kami',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 22,
        totalRuns: 640,
        totalWickets: 42,
      },
      {
        name: 'Karan KC',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 23,
        totalRuns: 580,
        totalWickets: 45,
      },
      {
        name: 'Kushal Malla',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 19,
        totalRuns: 960,
        totalWickets: 22,
      },
      {
        name: 'Anil Kumar Sah',
        role: 'Wicketkeeper',
        basePrice: 1500000,
        matchesPlayed: 18,
        totalRuns: 890,
        totalWickets: 0,
      },
      {
        name: 'Lalit Rajbanshi',
        role: 'Bowler',
        basePrice: 1500000,
        matchesPlayed: 18,
        totalRuns: 45,
        totalWickets: 36,
      },
      {
        name: 'Gulshan Jha',
        role: 'All-rounder',
        basePrice: 1500000,
        matchesPlayed: 15,
        totalRuns: 620,
        totalWickets: 24,
      },
      {
        name: 'Bhim Sharki',
        role: 'Batsman',
        basePrice: 1200000,
        matchesPlayed: 14,
        totalRuns: 710,
        totalWickets: 2,
      },
      {
        name: 'Pratish GC',
        role: 'Bowler',
        basePrice: 1000000,
        matchesPlayed: 4,
        totalRuns: 65,
        totalWickets: 9,
      },
      {
        name: 'Rijan Dhakal',
        role: 'Bowler',
        basePrice: 800000,
        matchesPlayed: 3,
        totalRuns: 12,
        totalWickets: 7,
      },
      {
        name: 'Hemant Dhami',
        role: 'Bowler',
        basePrice: 750000,
        matchesPlayed: 2,
        totalRuns: 8,
        totalWickets: 5,
      },
    ];

    const additionalPlayers = [
      // Biratnagar Kings
      { name: 'Lokesh Bam', role: 'Wicketkeeper', basePrice: 1500000 },
      { name: 'Basir Ahamad', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Narayan Joshi', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Subash Bhandari', role: 'Bowler', basePrice: 1000000 },
      { name: 'Naren Saud', role: 'Bowler', basePrice: 1000000 },
      { name: 'Pratik Shrestha', role: 'Batsman', basePrice: 1000000 },
      { name: 'Rupesh Kumar Singh', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Sujan Thapaliya', role: 'Batsman', basePrice: 1000000 },
      { name: 'Andre Russell', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Angelo Mathews', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Charith Asalanka', role: 'Batsman', basePrice: 2500000 },
      { name: 'Shubham Ranjane', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Imran Sheikh', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Dilsad Ali', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Aparajit Poudel', role: 'Batsman', basePrice: 1000000 },

      // Chitwan Rhinos
      { name: 'Deepak Bohara', role: 'Batsman', basePrice: 1000000 },
      { name: 'Dev Khanal', role: 'Batsman', basePrice: 1500000 },
      { name: 'Arjun Saud', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Bipin Rawal', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Ravi Bopara', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Sikandar Raza', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Bibek Kumar Yadav', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Salahuddin Khan', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Kaleem Sana', role: 'Bowler', basePrice: 2000000 },
      { name: 'Usama Mir', role: 'Bowler', basePrice: 2000000 },
      { name: 'Ranjeet Kumar', role: 'Bowler', basePrice: 1000000 },
      { name: 'Kamal Singh Airee', role: 'Bowler', basePrice: 1000000 },
      { name: 'Mousam Dhakal', role: 'Bowler', basePrice: 1000000 },
      { name: 'Ashok Dhami', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Gautam KC', role: 'Bowler', basePrice: 1000000 },
      { name: 'Kamil Mishara', role: 'Wicketkeeper', basePrice: 2000000 },
      { name: 'Hasan Ali', role: 'Bowler', basePrice: 2500000 },
      { name: 'Mohammad Nawaz', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Dan Mousley', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Tom Taylor', role: 'All-rounder', basePrice: 2000000 },

      // Janakpur Bolts
      { name: 'Bikash Aagri', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Aaditya Mahata', role: 'Bowler', basePrice: 1000000 },
      { name: 'Bishal Patel', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Rit Gautam', role: 'Batsman', basePrice: 1000000 },
      { name: 'Santosh Karki', role: 'Batsman', basePrice: 1000000 },
      { name: 'Harmeet Singh', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Iftikhar Ahmed', role: 'All-rounder', basePrice: 2500000 },
      { name: 'James Neesham', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Moeen Ali', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Mayan Yadav', role: 'Batsman', basePrice: 1000000 },
      { name: 'Trit Raj Das', role: 'Batsman', basePrice: 1000000 },
      { name: 'Abhishek Tiwari', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Amar Singh Rautela', role: 'Bowler', basePrice: 1000000 },
      { name: 'Ashutosh Pandey', role: 'Batsman', basePrice: 1000000 },
      { name: 'Bishal Shusling', role: 'Batsman', basePrice: 1000000 },
      { name: 'Kusal Perera', role: 'Wicketkeeper', basePrice: 2500000 },
      { name: 'Hunain Shah', role: 'Bowler', basePrice: 1500000 },

      // Kathmandu Gurkhas
      { name: 'David Warner', role: 'Batsman', basePrice: 2500000 },
      { name: 'KS Bharat', role: 'Wicketkeeper', basePrice: 2000000 },
      { name: 'Sahil Patel', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Suryanshu Koirala', role: 'Batsman', basePrice: 1000000 },
      { name: 'Sahan Arachchige', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Mohammad Aadil Alam', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Santosh Yadav', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Prasiddha Jaishi', role: 'Bowler', basePrice: 1000000 },
      { name: 'Dev Shah', role: 'Batsman', basePrice: 1000000 },
      { name: 'Rashid Khan', role: 'Bowler', basePrice: 2500000 },
      { name: 'Krishna Paudel', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Shahab Alam', role: 'Bowler', basePrice: 1000000 },
      { name: 'Dayanand Mandal', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Sonu Devkota', role: 'Bowler', basePrice: 1000000 },
      { name: 'Will Bosisto', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Sam Heazlett', role: 'Batsman', basePrice: 2000000 },
      { name: 'Smit Patel', role: 'Wicketkeeper', basePrice: 1500000 },

      // Karnali Yaks
      { name: 'Deepak Dumre', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Ariful Islam', role: 'All-rounder', basePrice: 1500000 },
      { name: 'David Miller', role: 'Batsman', basePrice: 2500000 },
      { name: 'Sachin Sharma', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Mark Watt', role: 'Bowler', basePrice: 2000000 },
      { name: 'Pawan Sarraf', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Unish Bikram Singh', role: 'Bowler', basePrice: 1000000 },
      { name: 'Shubh Kansakar', role: 'Batsman', basePrice: 1000000 },
      { name: 'Bipin Sharma', role: 'Bowler', basePrice: 1000000 },
      { name: 'Nandan Yadav', role: 'Bowler', basePrice: 1000000 },
      { name: 'Yuvraj Khatri', role: 'Bowler', basePrice: 1000000 },
      { name: 'Dipendra Rawat', role: 'Bowler', basePrice: 1000000 },
      { name: 'Surya Tamang', role: 'Bowler', basePrice: 1000000 },
      { name: 'Hussain Talat', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Akbar Ali', role: 'Wicketkeeper', basePrice: 2000000 },
      { name: 'Diwan Pun', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Hikmat Shahi', role: 'Batsman', basePrice: 1000000 },

      // Lumbini Lions
      { name: 'Niroshan Dickwella', role: 'Wicketkeeper', basePrice: 2500000 },
      { name: 'Sundeep Jora', role: 'Batsman', basePrice: 1500000 },
      { name: 'Dilip Nath', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Aakash Tripathi', role: 'Batsman', basePrice: 1000000 },
      { name: "D'Arcy Short", role: 'All-rounder', basePrice: 2000000 },
      { name: 'Sher Malla', role: 'Bowler', basePrice: 1000000 },
      { name: 'Arniko Yadav', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Ruben Trumpelmann', role: 'Bowler', basePrice: 2000000 },
      { name: 'Dinesh Adhikari', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Abhishesh Gautam', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Tilak Bhandari', role: 'Bowler', basePrice: 1000000 },
      { name: 'Kishore Mahato', role: 'Bowler', basePrice: 1000000 },
      { name: 'Durgesh Gupta', role: 'Bowler', basePrice: 1000000 },
      { name: 'Ajay Chauhan', role: 'Bowler', basePrice: 1000000 },
      {
        name: 'Shadley van Schalkwyk',
        role: 'All-rounder',
        basePrice: 2000000,
      },
      {
        name: 'Shamim Hossain Patwari',
        role: 'All-rounder',
        basePrice: 2000000,
      },

      // Pokhara Avengers
      { name: 'Dinesh Kharel', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Chamika Karunaratne', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Dhananjaya Lakshan', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Shakib Al Hasan', role: 'All-rounder', basePrice: 2500000 },
      { name: 'Sunny BK', role: 'Batsman', basePrice: 1000000 },
      { name: 'Arjun Kumal', role: 'Batsman', basePrice: 1000000 },
      { name: 'Bipin Khatri', role: 'Bowler', basePrice: 1000000 },
      { name: 'Kiran Thagunna', role: 'Batsman', basePrice: 1000000 },
      { name: 'Arjun Gharti', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Bipin Acharya', role: 'Bowler', basePrice: 1000000 },
      { name: 'Sagar Dhakal', role: 'Bowler', basePrice: 1000000 },
      { name: 'Aakash Chand', role: 'Bowler', basePrice: 1000000 },
      { name: 'Sudip Aryal', role: 'Batsman', basePrice: 1000000 },
      { name: 'Bibek Rana Magar', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Pratik Pokharel', role: 'Batsman', basePrice: 1000000 },

      // Sudurpaschim Royals
      { name: 'Binod Bhandari', role: 'Wicketkeeper', basePrice: 1500000 },
      { name: 'Dipak Bohara', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Aarif Sheikh', role: 'All-rounder', basePrice: 1500000 },
      { name: 'Abinash Bohara', role: 'Bowler', basePrice: 1500000 },
      { name: 'Ishan Pandey', role: 'Batsman', basePrice: 1000000 },
      { name: 'Tek Rawat', role: 'Wicketkeeper', basePrice: 1000000 },
      { name: 'Ayub Chand', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Tek Raj Thalal', role: 'Bowler', basePrice: 1000000 },
      { name: 'Milan Bohara', role: 'Bowler', basePrice: 1000000 },
      { name: 'Sachin Bhatt', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Brandon McMullen', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Scott Kuggeleijn', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Saif Zaib', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Sherfane Rutherford', role: 'Batsman', basePrice: 2500000 },
      { name: 'Hikmat Mahara', role: 'All-rounder', basePrice: 1000000 },
      { name: 'Fabian Allen', role: 'All-rounder', basePrice: 2000000 },
      { name: 'Anil Kharel', role: 'Bowler', basePrice: 1000000 },
    ];

    const originalNames = new Set(
      originalPlayers.map((p) => p.name.toLowerCase()),
    );

    const newPlayers = additionalPlayers
      .filter((p) => !originalNames.has(p.name.toLowerCase()))
      .map((p) => ({
        ...p,
        matchesPlayed: 10,
        totalRuns:
          p.role === 'Batsman'
            ? 300
            : p.role === 'Wicketkeeper'
              ? 220
              : p.role === 'All-rounder'
                ? 180
                : 30,
        totalWickets:
          p.role === 'Bowler' ? 15 : p.role === 'All-rounder' ? 6 : 0,
      }));

    const nplPlayers = [...originalPlayers, ...newPlayers];

    const teamNames = [
      'Nepal Showcase XI',
      'Biratnagar Kings',
      'Chitwan Rhinos',
      'Janakpur Bolts',
      'Kathmandu Gurkhas',
      'Karnali Yaks',
      'Lumbini Lions',
      'Pokhara Avengers',
      'Sudurpaschim Royals',
    ];
    originalPlayers.forEach((player) => {
      player.teamName = 'Nepal Showcase XI';
    });
    const importedTeamRanges = [
      [0, 15, 'Biratnagar Kings'],
      [15, 35, 'Chitwan Rhinos'],
      [35, 52, 'Janakpur Bolts'],
      [52, 69, 'Kathmandu Gurkhas'],
      [69, 86, 'Karnali Yaks'],
      [86, 102, 'Lumbini Lions'],
      [102, 117, 'Pokhara Avengers'],
      [117, 134, 'Sudurpaschim Royals'],
    ];
    importedTeamRanges.forEach(([start, end, teamName]) => {
      additionalPlayers.slice(start, end).forEach((player) => {
        player.teamName = teamName;
      });
    });
    const importedTeamByName = new Map(
      additionalPlayers.map((player) => [player.name, player.teamName]),
    );
    nplPlayers.forEach((player) => {
      player.teamName ??=
        importedTeamByName.get(player.name) ?? 'Nepal Showcase XI';
    });

    const teamMap = new Map();
    for (const name of teamNames) {
      const teamRes = await client.query(
        `INSERT INTO teams ("ownerId", name) VALUES ($1, $2)
         ON CONFLICT ("ownerId", name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [user.id, name],
      );
      teamMap.set(name, teamRes.rows[0].id);
    }

    const playerMap = new Map();

    for (const p of nplPlayers) {
      const res = await client.query(
        `INSERT INTO players
          ("ownerId", name, role, "basePrice", "matchesPlayed",
           "totalRuns", "totalWickets", "teamId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, role`,
        [
          user.id,
          p.name,
          p.role,
          p.basePrice,
          p.matchesPlayed,
          p.totalRuns,
          p.totalWickets,
          teamMap.get(p.teamName),
        ],
      );

      const inserted = res.rows[0];
      playerMap.set(inserted.name, inserted.id);
    }

    console.log(`Inserted ${nplPlayers.length} players into squad.`);

    const matches = [
      {
        teamA: 'Janakpur Bolts',
        teamB: 'Sudurpaschim Royals',
        result: 'A',
        playedAt: '2024-12-01',
        performances: [
          { name: 'Aasif Sheikh', teamSide: 'A', runs: 68, wickets: 0 },
          { name: 'Lalit Rajbanshi', teamSide: 'A', runs: 0, wickets: 3 },
          { name: 'Dipendra Singh Airee', teamSide: 'B', runs: 45, wickets: 2 },
          { name: 'Hemant Dhami', teamSide: 'B', runs: 6, wickets: 1 },
        ],
      },
      {
        teamA: 'Kathmandu Gurkhas',
        teamB: 'Chitwan Rhinos',
        result: 'A',
        playedAt: '2024-12-03',
        performances: [
          { name: 'Bhim Sharki', teamSide: 'A', runs: 54, wickets: 0 },
          { name: 'Karan KC', teamSide: 'A', runs: 28, wickets: 3 },
          { name: 'Kushal Malla', teamSide: 'B', runs: 39, wickets: 1 },
          { name: 'Pratish GC', teamSide: 'B', runs: 12, wickets: 2 },
        ],
      },
      {
        teamA: 'Biratnagar Kings',
        teamB: 'Pokhara Avengers',
        result: 'B',
        playedAt: '2024-12-05',
        performances: [
          { name: 'Kushal Bhurtel', teamSide: 'B', runs: 76, wickets: 1 },
          { name: 'Sandeep Lamichhane', teamSide: 'A', runs: 14, wickets: 4 },
          { name: 'Rijan Dhakal', teamSide: 'A', runs: 2, wickets: 1 },
        ],
      },
      {
        teamA: 'Lumbini Lions',
        teamB: 'Karnali Yaks',
        result: 'A',
        playedAt: '2024-12-07',
        performances: [
          { name: 'Rohit Kumar Paudel', teamSide: 'A', runs: 85, wickets: 1 },
          { name: 'Sompal Kami', teamSide: 'B', runs: 34, wickets: 2 },
          { name: 'Gulshan Jha', teamSide: 'B', runs: 26, wickets: 1 },
        ],
      },
    ];

    for (const m of matches) {
      const submissionKey = crypto.randomUUID();

      const payloadHash = crypto
        .createHash('sha256')
        .update(
          JSON.stringify({
            teamA: m.teamA,
            teamB: m.teamB,
            playedAt: m.playedAt,
          }),
        )
        .digest('hex');

      const matchRes = await client.query(
        `INSERT INTO matches
          ("ownerId", "teamAId", "teamBId", "teamA", "teamB", result, "playedAt",
           "submissionKey", "payloadHash")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          user.id,
          teamMap.get(m.teamA),
          teamMap.get(m.teamB),
          m.teamA,
          m.teamB,
          m.result,
          m.playedAt,
          submissionKey,
          payloadHash,
        ],
      );

      const matchId = matchRes.rows[0].id;

      for (const perf of m.performances) {
        const playerId = playerMap.get(perf.name);

        if (playerId) {
          await client.query(
            `INSERT INTO performances
              ("matchId", "playerId", "teamSide", runs, wickets)
             VALUES ($1, $2, $3, $4, $5)`,
            [matchId, playerId, perf.teamSide, perf.runs, perf.wickets],
          );
        }
      }
    }

    await client.query('COMMIT');

    console.log(`Inserted ${matches.length} demo matches.`);
    console.log(`Total players: ${nplPlayers.length}`);
    console.log('\n--- SEED COMPLETE ---');
    console.log('Login credentials for showcase:');
    console.log(`Email:    ${email}`);
    console.log('Password: configured through SEED_PASSWORD (not printed).');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }

    console.error(
      'Seeding failed:',
      err instanceof Error ? `${err.name}: ${err.message}` : 'UnknownError',
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
