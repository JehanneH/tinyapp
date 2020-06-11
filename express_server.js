const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const addNewUser = (email, password) => {
  const userID = generateRandomString();
  const newUsersObj = {
    id: userID,
    email,
    password
    };

  users[userID] = newUsersObj;
  return userID;
};

const findUserEmail = email => {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return false;
};

const authenticateUser = (email, password) => {
  const user = findUserEmail(email);
  if (user && user.password === password) {
    return user;
  } else {
    return false;
  }
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
  const userId = req.cookies['user_id'];
  const currentUser = users[userId];
  //console.log(userId, currentUser)
  const templateVars = {
    urls: urlDatabase,
    currentUser: currentUser
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { currentUser: null}
  res.render("user_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = users[userId];
  
  let templateVars = {
    currentUser: currentUser
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = users[userId];

  const templateVars = { 
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],
    currentUser: currentUser
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
    res.end();
  }
});

app.get('/login', (req, res) => {
  const templateVars = { currentUser: null };
  res.render('user_login', templateVars);
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
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password);

//this still isn't working quite right
  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send('Try again! Email and password do not match');
  };
  //this one won't if it's below and vice versa
  if (!user) {
    res.status(403).send('Email cannot be found')
  };
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', null);
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  const user = findUserEmail(email);


  if (!email || !password) {
    res.status(400).send('Fields are empty, you must enter an email and password')
  };

  if (!user) {
    const userID = addNewUser(email, password);
    res.cookie('user_id', userID);
    res.redirect('/urls');
  } else {
    res.status(400).send('User already registered')
  };
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
