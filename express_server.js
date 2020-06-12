// ------------- REQUIRE/USE -------------

const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');

const bcrypt = require('bcrypt');
const saltRound = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(cookieSession({
  name: 'session',
  keys: ['f080ac7b-b838-4c5f-a1f4-b0a9fee10130', 'c3fb18be-448b-4f6e-a377-49373e9b7e1a']
}));


// -------------- USER INFORMATION --------------

const urlDatabase = {
  b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
  i3BoGr: { longURL: 'https://www.google.ca', userID: 'aJ48lW' }
};

const usersDatabase = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('a', saltRound),
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dish', saltRound)
  }
};


// ---------- HELPER FUNCTIONS ----------

// function finds user by email
const { findUserByEmail } = require('./helpers');

// function generates random 6 string
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

// function authenticates user by comparing email and password
const authenticateUser = (email, password) => {
  const user = findUserByEmail(email, usersDatabase);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return false;
  }
};

// function adds new user and with hashed password
const addNewUser = (email, password) => {
  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, saltRound);
  const newUsersObj = { id: userID, email, password: hashedPassword };
  usersDatabase[userID] = newUsersObj;
  return userID;
};

// function filters through users and finds urls for specific user
const urlsForUser = (id) => {
  let filteredList = {};

  for (let shortUrl in urlDatabase) {

    if (urlDatabase[shortUrl].userID === id)

      filteredList[shortUrl] = urlDatabase[shortUrl];
  }
  return filteredList;
};

// function finds the longURL associated with the shortURL
const getLongURLFromShort = (shortURL) => {
  let longUrl = '';
  for (let key in urlDatabase) {
    if (shortURL === key) {
      longUrl = urlDatabase[key].longURL;
    }
  }
  return longUrl;
};


// -------------- GET URLS --------------

// GET asking for the urls
app.get('/urls', (req, res) => {
  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];
  
  const templateVars = {
    urls: urlsForUser(userId),
    currentUser: currentUser
  };

  if (!currentUser) {
    res.send('🔒 You must login to view this page 🔒');
  } else {
    res.render('urls_index', templateVars);
  }
});

// GET create new url. if the current user is not logged, redirect to login page
app.get('/urls/new', (req, res) => {
  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];
  let templateVars = {
    currentUser: currentUser
  };

  if (!currentUser) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

// GET tiny url created associated from long url, user must login to see this
app.get('/urls/:shortURL', (req, res) => {

  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];

  const templateVars = {
    urls: urlsForUser(userId),
    shortURL: req.params.shortURL,
    longURL: getLongURLFromShort(req.params.shortURL),
    currentUser: currentUser
  };
  
  if (!currentUser) {
    res.send('🔒 You must login to view this page 🔒');
  } else {
    res.render('urls_show', templateVars);
  }
});

// GET redirects short url to the long url website, if shortURL is wrong there is an error message
app.get('/u/:shortURL', (req, res) => {
  const longURL = getLongURLFromShort(req.params.shortURL);
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('⚠️ Cannot redirect, shortURL does not exist ⚠️');
    res.end();
  }
});


// ---------- GET USER REGISTER/LOGIN ----------

// GET user register page, user is null...there is no user yet
app.get('/register', (req, res) => {
  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];

  if (currentUser) {
    res.redirect('/urls');
  }

  let templateVars = { currentUser: null};
  res.render('user_register', templateVars);
});

// GET login page, current user is null bc they are not logged in yet
app.get('/login', (req, res) => {
  const templateVars = { currentUser: null };
  res.render('user_login', templateVars);
});


// ------------- POST URLS -------------

// POST connects userID to the short url created, redirects to the shortURL created
app.post('/urls', (req, res) => {

  const tinyURL = generateRandomString();
  const userID = req.session['user_id'];
  
  const tempURL = {
    longURL: req.body.longURL,
    userID: userID
  };
  
  urlDatabase[tinyURL] = tempURL;

  res.redirect(`/urls/${tinyURL}`);
});

// POST update url, user can edit the longURL associated with the shortURL, must be logged in to do this
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;
  
  urlDatabase[shortURL].longURL = newURL;

  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];

  if (!currentUser) {
    res.send('🔒 You must login to edit a URL 🔒');
  } else {
    res.redirect('/urls');
  }

});

// POST delete url, user should be logged to do this, If they are not logged on they cannot delete
app.post('/urls/:shortURL/delete', (req, res) => {
  
  const userId = req.session['user_id'];
  const currentUser = usersDatabase[userId];

  if (!currentUser) {
    res.send('🔒 You must login to delete a URL 🔒');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }

});


// ------------ POST USER LOGIN/LOGOUT/REGISTER ------------

// POST user can login. Error messages for if email or password are wrong and if email doesn't exist
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = authenticateUser(email, password);

  if (user) {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  } else {
    const emailExists = findUserByEmail(email, usersDatabase);
    if (emailExists) {
      res.status(403).send('🔐 Try again! Email and password do not match 🔐');
    } else {
      res.status(403).send('🔎 Email cannot be found, must register for an account 🔎');
    }
  }
});

// POST user logs out and cookies are cleared
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

// POST user registers for account with email and password. Error messages if no email or password and if user already exists
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
 
  const user = findUserByEmail(email, usersDatabase);

  if (!email || !password) {
    res.status(400).send('📝 Fields are empty, you must enter an email and a password 📝');
  }

  if (!user) {
    const userID = addNewUser(email, password);
    req.session['user_id'] = userID;
    res.redirect('/urls');
  } else {
    res.status(400).send('❗User already registered, use the login page ❗️');
  }
  
});

// ------------ PORT ------------
// LISTEN at port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
