const express = require('express');
const app = express()
const path = require("path")
port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))


const items = [
      {
        // id: 0,
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

app.delete('/:title', (req, res) =>{
  const itemTitle = req.params.title

  const itemIndex = items.findIndex(item => item.title === itemTitle)

    if (itemIndex !== -1) {
    // Remove the user from the array
    items.splice(itemIndex, 1);
    res.status(200).send(`User with ID ${itemTitle} deleted successfully.`);
  } else {
    // If user not found, send 404 Not Found
    res.status(404).send('User not found.');
  }
})



app.listen(port, ()=> console.log(`app is running on http://localhost:${port}`))

