// names: Sham Diyar Mohammed Sidiq, Yad Hawar Hiwa
// emails: sd21180@auis.edu.krd, yh21145@auis.edu.krd

/*
References:

  HTML Hidden Input:
   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/hidden
   - Used to store data (task index) that is submitted with the form but not visible to the user.

  HTML Checkbox Input:
   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
   - Used to represent completion status of a task.

  HTML Form onChange Event:
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
   - onchange="this.form.submit()" automatically submits the form when the checkbox state changes.

   Express.js Documentation
   https://expressjs.com/
   - for request handling.

  HTTP Cookies and Security
   https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
   - for cookie attributes (httpOnly, sameSite, maxAge, etc..).

   JavaScript Array Methods
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
   - for Array methods used (filter, push, splice, find, forEach).

   Express.js Cookie Parser:
   https://www.npmjs.com/package/cookie-parser
   - req.signedCookies provides access to cookies that are signed with a secret key.

   Dynamic Property Access in JavaScript:
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors
   - Using square brackets `[]` to access object properties.

*/
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { encryptCookieNodeMiddleware } = require("encrypt-cookie");

const app = express();
const port = 8081;

const SIGNATURE_SECRET =
  "6d287f9abb1b7a9d710f4997677a2a0630ee4d50b78fa4878a88f0531e914785";
const ENCRYPTION_SECRET =
  "6b01aa99b04e107398d1260c04606b361e0a69d7bd96d96008b9af8eb1fd18c3";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SIGNATURE_SECRET));
app.use(encryptCookieNodeMiddleware(ENCRYPTION_SECRET));

const users = [
  { id: 1, username: "Sham", password: "123" },
  { id: 2, username: "Yad", password: "123" },
  { id: 3, username: "Bob", password: "123" },
  { id: 4, username: "Alice", password: "123" },
  { id: 5, username: "Danny", password: "123" },
];

function saveUserTasks(res, userId, tasks) {
  res.cookie(`tasks_user_${userId}`, tasks, {
    httpOnly: true,
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false,
    sameSite: "strict",
  });
}

// Login Page
app.get("/", (req, res) => {
  res.render("index", { users, error: null });
});

// Login POST
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.cookie("userId", user.id, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      signed: true,
      secure: false,
      sameSite: "strict",
    });
    res.redirect("/tasks");
  } else {
    res.render("index", { users, error: "Incorrect username or password." });
  }
});

// Tasks Page
app.get("/tasks", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const userTasks = req.signedCookies[`tasks_user_${req.signedCookies.userId}`];
  const editIndex = req.query.edit ? parseInt(req.query.edit) : null;
  const user = users.find((u) => u.id === userId);
  const userName = user ? user.username : "Unknown";

  res.render("tasks", { tasks: userTasks, editIndex, userName });
});

// Add Task
app.post("/submit", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const { title, dueDate } = req.body;
  const tasks = req.signedCookies[`tasks_user_${req.signedCookies.userId}`];
  tasks.push({
    id: tasks.length,
    title: title,
    dueDate: dueDate,
    completed: false,
  });

  saveUserTasks(res, userId, tasks);
  res.redirect("/tasks");
});

// Delete Task
app.post("/delete", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const index = parseInt(req.body.index);
  const tasks = req.signedCookies[`tasks_user_${req.signedCookies.userId}`];

  if (!isNaN(index) && index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
    tasks.forEach((t, i) => (t.id = i)); // Reassign the task IDs to keep them sequential
  }

  saveUserTasks(res, userId, tasks);
  res.redirect("/tasks");
});

// Update Task
app.post("/update", (req, res) => {
  const userId = parseInt(req.signedCookies.userId);
  if (!userId) return res.redirect("/");

  const { index, completed, title, dueDate } = req.body;
  const tasks = req.signedCookies[`tasks_user_${req.signedCookies.userId}`];
  const i = parseInt(index);

  if (isNaN(i) || i < 0 || i >= tasks.length)
    return res.status(404).send("Task not found");

  if (completed !== undefined) tasks[i].completed = completed === "true";
  else tasks[i].completed = false;

  if (title !== undefined && dueDate !== undefined) {
    tasks[i].title = title.trim(); // remove white space after the last character
    tasks[i].dueDate = dueDate;
  }

  saveUserTasks(res, userId, tasks);
  res.redirect("/tasks");
});

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
