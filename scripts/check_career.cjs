const { Pool } = require('pg');
require('dotenv').config({ path: 'D:/Ingage project/nextjs-lms/.env' });

const cleanUrl = process.env.DATABASE_URL.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query("SELECT id, title, slug FROM careers WHERE slug = $1", ['data-analyst']);
  console.log('Career:', res.rows[0]);
  if (res.rows[0]) {
    const id = res.rows[0].id;
    const s = await pool.query("SELECT count(*) FROM career_skills WHERE career_id = $1", [id]);
    const r = await pool.query("SELECT count(*) FROM career_responsibilities WHERE career_id = $1", [id]);
    const rm = await pool.query("SELECT count(*) FROM career_roadmaps WHERE career_id = $1", [id]);
    const p = await pool.query("SELECT count(*) FROM career_projects WHERE career_id = $1", [id]);
    const o = await pool.query("SELECT count(*) FROM career_opportunities WHERE career_id = $1", [id]);
    const c = await pool.query("SELECT count(*) FROM career_courses WHERE career_id = $1", [id]);
    console.log({
      skills: s.rows[0].count,
      resp: r.rows[0].count,
      roadmaps: rm.rows[0].count,
      projects: p.rows[0].count,
      opps: o.rows[0].count,
      courses: c.rows[0].count
    });

    const skillsData = await pool.query("SELECT * FROM career_skills WHERE career_id = $1 ORDER BY display_order ASC", [id]);
    console.log('Skills Sample:', skillsData.rows.slice(0, 3));
    
    const roadmapsData = await pool.query("SELECT * FROM career_roadmaps WHERE career_id = $1 ORDER BY display_order ASC", [id]);
    console.log('Roadmap Sample:', roadmapsData.rows.slice(0, 2));

    const coursesData = await pool.query(`
      SELECT cc.*, c.title as course_title, c.slug as course_slug, c.level as course_level, c.price as course_price
      FROM career_courses cc
      JOIN courses c ON cc.course_id = c.id
      WHERE cc.career_id = $1
      ORDER BY cc.display_order ASC
    `, [id]);
    console.log('Courses count joined:', coursesData.rows.length);
  }
  await pool.end();
}

main().catch(console.error);
