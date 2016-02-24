var db = require(__dirname + '/../../db/db.js');
var models = require('./models.js');
var Promise = require('bluebird');

var findOrCreate = function (Model, attributes) {

  return new Promise (function (resolve, reject) {
    Model.forge(attributes).fetch()
    .then(function (model) {
      if (!model) {
        model = new Model(attributes);
      }
      model.save()
      .then(function () {
        resolve(model);
      })
      .catch(function (error) {
        reject(error);
      });
    })
    .catch(function (error) {
      reject(error);
    });

  });

};

var addBook = function (author, book, reaction, user, success, fail) {
  // TODO handle users reactions

  findOrCreate(models.Author, author)
    .then(function (author) {
      book.author_id = author.get('id');
      findOrCreate(models.Book, book)
      .then(function (book) {
        models.User.forge(user)
          .fetch()
          .then( function (user) {
            findOrCreate(models.Read, {
              user_id: user.get('id'),
              book_id: book.get('id')
            })
            .then( function (read) {
              read.set('reaction', reaction);
              read.save()
                .then(function () {
                  var resData = (JSON.stringify({
                    book: {
                      title: book.get('title'),
                      id: book.get('id')
                    },
                    author: {
                      id: book.get('id'),
                      name: author.get('name')
                    },
                    reaction: read.get('reaction')
                  }));
                  success(resData);
                });
            });
          });

      })
      .catch(function (error) {
        fail(error);
      });
    })
    .catch(function (error) {
      fail(error);
    });
};

var getBooks = function (list, limit, success, fail) {
  var books = models.Book.fetchAll({withRelated: ['author']})
  .then(function (results) {
    results = results.toJSON();
    limit = limit || results.length;
    if(list === 'popular') {
      results.sort(function (a, b) {
        // returns 1 when a.popularity > b.popularity,
        //        -1 when a.pouplarity < b.popularity,
        //         0 when equal
        return Math.sign(a.popularity() - b.popularity());
      });
    }
    success(results.slice(0,limit));
  })
  .catch(function (error) {
    fail(error);
  });
};

var saveProfile = function (profile, success, fail) {
  console.log(profile);
  //new models.User({'amz_auth_id': profile})
    //.fetch()
  findOrCreate(models.User, {amz_auth_id: profile})
    .then(function (user) {
      console.log(JSON.stringify(arguments));
      success(user);
      /*var userProfile = new models.User({
        'amz_auth_id': profile.user_id,
        'email': profile.email,
        'name': profile.name
      })

      // sets the id if a user profile was found
      if(user) {
        userProfile.id = user.get('id');
      }

      // inserts when new and updates if existing
      userProfile.save();*/

    })
    .catch( function (error) {
      fail(error);
    });
};

var getProfile = function (profile, success, fail) {
  new models.User({'amz_auth_id': profile.user_id})
    .fetch()
    .then(function (user) {
      if (user) {
        success(user.books().toJSON());
      } else {
        throw 'no user found';
      }
    });
};

module.exports = {

  findOrCreate: findOrCreate,
  addBook: addBook,
  getBooks: getBooks,
  saveProfile: saveProfile,
  getProfile: getProfile

};
