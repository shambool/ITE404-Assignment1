const express = require('express');
const app = express()
const path = require("path")
port = 8081;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))


const items = [
      {
        id: 0,
        title: "A",
        dueDate: "6/9/6969",
        completed: true
      }
    ]
app.get("/", (req,res)=>{
  res.render("index", {items})
})

app.post("/submit", (req,res)=>{
  const formData = req.body;
  const newItem = {
    title: formData.title || "Untitled",
    dueDate: formData.dueDate || "No due date",
    completed: false
  };
  items.push(newItem)
  res.redirect("/")
})

app.post("/delete", (req, res) => {
  const index = parseInt(req.body.index);
  if (!isNaN(index) && index >= 0 && index < items.length) {
    items.splice(index, 1);
  }
  res.redirect("/");
});


app.listen(port, ()=> console.log(`app is running on http://localhost:${port}`))

