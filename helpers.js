// helper function find user by email

const findUserByEmail = function (email, database) {
  for (let userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return false
};

module.exports = { findUserByEmail };