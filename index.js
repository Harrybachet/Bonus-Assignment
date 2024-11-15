const express = require('express');
const db = require('./database'); // Import the database connection
const app = express();
const port = 3000;

app.use(express.json());

// GET /todos - Retrieve all to-do items or filter by completed status
app.get('/todos', (req, res) => {
  const completed = req.query.completed;
  let query = 'SELECT * FROM todos';
  const params = [];

  if (completed !== undefined) {
    query += ' WHERE completed = ?';
    params.push(completed.toLowerCase() === 'true' ? 1 : 0);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /todos - Add a new to-do item with priority
app.post('/todos', (req, res) => {
  const { task, priority = 'medium' } = req.body;

  db.run(
    `INSERT INTO todos (task, completed, priority) VALUES (?, 0, ?)`,
    [task, priority],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get(`SELECT * FROM todos WHERE id = ?`, [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

// PUT /todos/:id - Update an existing to-do item
app.put('/todos/:id', (req, res) => {
  const id = req.params.id;
  const { task, completed, priority } = req.body;

  db.run(
    `UPDATE todos SET task = COALESCE(?, task), completed = COALESCE(?, completed), priority = COALESCE(?, priority) WHERE id = ?`,
    [task, completed !== undefined ? (completed ? 1 : 0) : undefined, priority, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "To-Do item not found" });

      db.get(`SELECT * FROM todos WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// PUT /todos/complete-all - Complete all to-do items
app.put('/todos/complete-all', (req, res) => {
  db.run(`UPDATE todos SET completed = 1`, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "All to-do items marked as completed" });
  });
});

// DELETE /todos/:id - Delete a to-do item
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM todos WHERE id = ?`, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "To-Do item not found" });
    res.status(204).send();
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
