const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());



// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

// shortURL keys, long and user values
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
// database of users
const usersDatabase = { 
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


// ******** FUNCTIONS ***********
// function generates random 6 string
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

// helper function find user by email
const findUserEmail = email => {
  for (let userID in usersDatabase) {
    if (usersDatabase[userID].email === email) {
      return usersDatabase[userID];
    }
  }
  return false;
};

// helper function authenticate user by comparing email and poa
const authenticateUser = (email, password) => {
  const user = findUserEmail(email);
  if (user && user.password === password) {
    return user;
  } else {
    return false;
  }
};

// helper function adds new user
const addNewUser = (email, password) => {
  const userID = generateRandomString();
  const newUsersObj = {
    id: userID,
    email,
    password
    };

  usersDatabase[userID] = newUsersObj;
  return userID;
};

function urlsForUser(id) {
  //prepare data
  let filteredList = {};

  for (let shortUrl in urlDatabase) {

    if (urlDatabase[shortUrl].userID === id)

      filteredList[shortUrl] = urlDatabase[shortUrl];
  }
  return filteredList
};


// BEGINNING OF PROJECT
// app.get("/", (req, res) => {
//   res.send("Hello");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n")
// });


// GET asking for the urls
app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = usersDatabase[userId];
  
  const templateVars = {
    urls: urlsForUser(userId),
    currentUser: currentUser
  };

  if (!currentUser) {
    res.send('You must be logged in to view this page');
  } else {
    res.render("urls_index", templateVars);
  };


});

// GET user register page, current user is null..there is no user
app.get("/register", (req, res) => {
  let templateVars = { currentUser: null}
  res.render("user_register", templateVars);
});

// GET create new url. if the current user is not logged, redirect to login page
app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = usersDatabase[userId];
  let templateVars = {
    currentUser: currentUser
  };

  if (!currentUser) {
    res.redirect('/login');
   
  } else {
    res.render("urls_new", templateVars);
  } 
  
});

// GET show tiny url created
// this one should be displaying "Tiny URL for: long " but not working??? 
app.get("/urls/:shortURL", (req, res) => {

 // console.log(req.body.longURL) undefined

  const userId = req.cookies['user_id'];
  const currentUser = usersDatabase[userId];
  

  const templateVars = { 
    urls: urlsForUser(userId),
    shortURL: req.params.shortURL,
    longURL: req.body.longURL, // this doesn't show i don't know what to put here???
    currentUser: currentUser
  };
  
  if (!currentUser) {
    res.send('You must be logged in to view this page');
  } else {
    res.render("urls_show", templateVars);
  };
  
});

// GET redirects short url to the long url
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
    res.end();
  }
});

// GET login page, current user is null bc they are not logged in yet
app.get('/login', (req, res) => {
  const templateVars = { currentUser: null };
  res.render('user_login', templateVars);
});

// POST connects userID to the tiny url created
app.post('/urls', (req, res) => {

  const tinyURL = generateRandomString();
  const userID = req.cookies['user_id'];
  
  const tempURL = {
    longURL: req.body.longURL,
    userID: userID
  };
  
  urlDatabase[tinyURL] = tempURL;

  res.redirect(`/urls/ ${tinyURL}`);
});


// POST update url - edit the longURL associated with the shortURL
app.post("/urls/:shortURL", (req, res) => {
  const updateUrl = req.params.shortURL;
  let newURL = req.body.longURL;
  urlDatabase[updateUrl] = newURL;

  const userId = req.cookies['user_id'];
  const currentUser = usersDatabase[userId];

  // user must be logged in to edit a url
  if (!currentUser) {
    res.send('You must be logged in to edit a URL');
  } else {
    res.redirect('/urls');
  };

});

// POST delete url
app.post('/urls/:shortURL/delete', (req, res) => {
  
  const userId = req.cookies['user_id'];
  const currentUser = usersDatabase[userId];

  // user should be logged on to delete the url. If they are not logged on they cannot delete
  if (!currentUser) {
    res.send('You must be logged in to delete a URL');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls', templateVars);
  };

});

// POST log in. user can log in.
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password);

//this still isn't working quite right

// if user exists let them log in, if they don't then their passwords don't match
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

// POST user logs out and cookies are cleared
app.post('/logout', (req, res) => {
  res.clearCookie('user_id', null);
  res.redirect('/urls');
});

// POST user registers for account with email and password
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = addNewUser(email, password);
  const user = findUserEmail(email);

// if no email or password they forgot to put info in
  if (!email || !password) {
    res.status(400).send('Fields are empty, you must enter an email and password')
  };

  // if user doesn't exist, they can register. if they exist they should not be allowed
  if (!user) {
    res.cookie('user_id', userID);
    res.redirect('/urls');
  } else {
    res.status(400).send('User already registered')
  };
  
});


// LISTEN at port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
