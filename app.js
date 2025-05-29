import express from "express";
import db from "#db/client";

const app = express();
app.use(express.json());

// GET /files 
app.get("/files", async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT files.*, folders.name AS folder_name
      FROM files
      JOIN folders ON files.folder_id = folders.id
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /folders 
app.get("/folders", async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM folders`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /folders/:id 
app.get("/folders/:id", async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const folderResult = await db.query(`SELECT * FROM folders WHERE id = $1`, [folderId]);
    if (folderResult.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }
    const filesResult = await db.query(
      `SELECT * FROM files WHERE folder_id = $1`,
      [folderId]
    );
    const folder = folderResult.rows[0];
    folder.files = filesResult.rows;
    res.json(folder);
  } catch (err) {
    next(err);
  }
});

// POST /folders/:id/files 
app.post("/folders/:id/files", async (req, res, next) => {
  try {
    const folderId = req.params.id;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body required" });
    }
    const { name, size } = req.body;
    const folderResult = await db.query(`SELECT * FROM folders WHERE id = $1`, [folderId]);
    if (folderResult.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }
    if (!name || !size) {
      return res.status(400).json({ error: "Missing required fields: name and size" });
    }
    const fileResult = await db.query(
      `INSERT INTO files (name, folder_id, size) VALUES ($1, $2, $3) RETURNING *`,
      [name, folderId, size]
    );
    res.status(201).json(fileResult.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "File name must be unique within the folder" });
    }
    next(err);
  }
});


app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

export default app;
