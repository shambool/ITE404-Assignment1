const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

const port = 8081;

// Setup view engine and middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Mock Users ---
const users = [
  { id: 1, username: 'Sham', password: '123' },
  { id: 2, username: 'Yad', password: '123' }
];

// --- Mock Tasks ---
const tasks = [
  {
    id: 0,
    userId: 1,
    title: 'A',
    dueDate: '6/9/6969',
    completed: true
  }
];

// --- Login Page ---
app.get('/', (req, res) => {
  res.render('index'); // login page
});

// --- Login POST ---
app.post('/login', (req, res) => {
    console.log("Login attempt:", req.body);
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.cookie('userId', user.id, { httpOnly: true });
    res.redirect('/tasks');
  } else {
    res.send(
      'Invalid username or password <br> hint:<br> username: Sham <br> password: 123'
    );
  }
});

// --- Tasks Page ---
app.get('/tasks', (req, res) => {
  const userId = parseInt(req.cookies.userId);
  if (!userId) return res.redirect('/');

  const userTasks = tasks.filter((t) => t.userId === userId);
  res.render('tasks', { tasks: userTasks });
});

// --- Add Task ---
app.post('/submit', (req, res) => {
  const userId = parseInt(req.cookies.userId);
  if (!userId) return res.redirect('/');

  const { title, dueDate } = req.body;
  const newTask = {
    id: tasks.length,
    userId,
    title: title || 'Untitled',
    dueDate: dueDate || 'No due date',
    completed: false
  };

  tasks.push(newTask);
  res.redirect('/tasks');
});

// --- Delete Task ---
app.post('/delete', (req, res) => {
  const index = parseInt(req.body.index);
  if (!isNaN(index) && index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
  }
  res.redirect('/tasks');
});

try {
  app.listen(port, () => console.log(`✅ app is running on http://localhost:${port}`));
} catch (err) {
  console.error("Error starting server:", err);
}