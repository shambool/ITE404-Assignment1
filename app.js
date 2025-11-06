const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const crypto = require('crypto');
const { encryptCookieNodeMiddleware } = require('encrypt-cookie');


const port = 8081;
const SIGNATURE_SECRET = "temporary_signature_secret_123";
const ENCRYPTION_SECRET = "temporary_encryption_secret_456";

// Setup view engine and middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(cookieParser(SIGNATURE_SECRET))
app.use(encryptCookieNodeMiddleware(ENCRYPTION_SECRET));



// --- Mock Users ---
const users = [
  { id: 1, username: "Sham", password: "123" },
  { id: 2, username: "Yad", password: "123" },
  { id: 3, username: "Raghib", password: "123" },
  { id: 4, username: "Elissa", password: "123" },
  { id: 5, username: "Shirin", password: "123" },
  { id: 6, username: "Sadam", password: "123" },
];

// --- Mock Tasks ---
const tasks = [
  {
    id: 0,
    userId: 1,
    title: "A",
    dueDate: "6/9/6969",
    completed: true,
  },
];

// --- Login Page ---
app.get("/", (req, res) => {
  res.render("index"); // login page
});

// --- Login POST ---
app.post("/login", (req, res) => {
  console.log("Login attempt:", req.body);
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.cookie("userId", user.id, 
      {
        httpOnly: true,
        maxAge: 1000 * 60 * 5, // wabzanm 5 minutes? check dwaii
        signed: true,
        secure: false,
        sameSite: 'strict'
      }
        );
    res.redirect("/tasks");
  } else {
    res.send(
      "Invalid username or password <br> hint:<br> username: Sham <br> password: 123"
    );
  }
});

// --- Tasks Page ---
app.get("/tasks", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const userTasks = tasks.filter((t) => t.userId === userId);
  const editIndex = req.query.edit ? parseInt(req.query.edit) : null;
  

  res.render("tasks", { tasks: userTasks, editIndex });
});

// --- Add Task ---
app.post("/submit", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const { title, dueDate } = req.body;
  const newTask = {
    id: tasks.length,
    userId: userId,
    title: title || "Untitled",
    dueDate: dueDate || "No due date",
    completed: false,
  };

  console.log(newTask.id);

  tasks.push(newTask);
  res.redirect("/tasks");
});

// --- Delete Task ---
app.post("/delete", (req, res) => {
  const index = parseInt(req.body.index);
  if (!isNaN(index) && index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
  }
  res.redirect("/tasks");
});

try {
  app.listen(port, () =>
    console.log(`✅ app is running on http://localhost:${port}`)
  );
} catch (err) {
  console.error("Error starting server:", err);
}

// -- update task
app.post("/update", (req, res) => {
  const { index, completed, title, dueDate } = req.body;
  const userId = parseInt(req.signedCookies.userId);

  if (!userId) return res.status(401).send("Unauthorized");
  const userTasks = [];
  for (let i = 0; i < tasks.length; i++) {
    if (userId === tasks[i].userId) {
      userTasks.push(tasks[i]);
    }
  }

  const i = parseInt(index);
  const task = userTasks.find((t, idx) => idx === i && t.userId === userId);
  if (!task) return res.status(404).send("Task not found");

  // Only update completed if it exists in this request
  if (completed !== undefined) {
    task.completed = completed === "true";
  } else {
    task.completed = false;
  }

  // Only update title/dueDate if they exist in this request
  if (title !== undefined && dueDate !== undefined) {
    task.title = title.trim();
    task.dueDate = dueDate;
  }

  res.redirect("/tasks");
});
