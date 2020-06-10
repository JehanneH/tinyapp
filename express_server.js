function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
    res.end();
  }
});
app.post('/urls', (req, res) => {
  const tiny = generateRandomString();
  urlDatabase[tiny] = req.body.longURL;
  res.redirect(`/urls/ ${tiny}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const updateUrl = req.params.shortURL;
  let newURL = req.body.longURL;
  urlDatabase[updateUrl] = newURL;
  res.redirect('/urls')
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls')
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
