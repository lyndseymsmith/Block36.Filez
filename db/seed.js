import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query(`DELETE FROM files`);
  await db.query(`DELETE FROM folders`);

  const folderNames = ['Documents', 'Pictures', 'Music'];
  const folderIds = [];

  for (const name of folderNames) {
    const result = await db.query(
      `INSERT INTO folders (name) VALUES ($1) RETURNING id`,
      [name]
    );
    folderIds.push(result.rows[0].id);
  }

  for (const folderId of folderIds) {
    for (let i = 1; i <= 5; i++) {
      await db.query(
        `INSERT INTO files (name, folder_id, size) VALUES ($1, $2, $3)`,
        [`file${i}_in_folder${folderId}.txt`, folderId, 1000]
      );
    }
  }
}
