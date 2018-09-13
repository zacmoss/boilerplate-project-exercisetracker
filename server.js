// limit works

// just need to work out the from & to
// and turn date variable into date and maybe timestamp to pass around

// needs form validation for date

// Lessons Learned: 

// In findOneAndUpdate, if using updated data at end
// Must add {new: true} as third argument to findOneAndUpdate

// done() is tricky, try to do without?

// when saving an object variable to pass to push or update
// remember to put key in parenthesis

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
Promise = require('bluebird');
mongoose.Promise = Promise;
//const MongoClient = require('mongodb').MongoClient
//MongoClient.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' );
mongoose.connect(process.env.MLAB_URI, { useMongoClient: true })// || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





/**/

var Schema = mongoose.Schema;
var schema = new Schema({
  name : String,
  //exercises : [{ test: String }]
  exercises : [{
    description : String,
    duration : Number,
    date : Number
  }]
  //description : String,
  //duration : Number,
  //date: { type: Date, default: Date.now }
  //date: Number
});
var User = mongoose.model('User', schema);


app.post('/api/exercise/new-user', function(req, res) {
  let id;
  let name = req.body.username;
  let createAndSaveUser = function(done) {
    const user = new User({name: name});
    //const user = new User({name: name, exercises: [{description: "test1", duration: 20, date: 20}]});
    user.save(function(err, data) {
      if (err) {
        done(err);
      } else {
        id = data._id;
        res.json({"username": name, "id": data._id});
      }
    });
  }
  
  createAndSaveUser();
  
});

// need to validate that date entered is in correct format and turn into timestamp
app.post('/api/exercise/add', function(req, res) {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date;
  
  // if date entered then date = req.body.date, else date = now
  if (req.body.date) {
    date = req.body.date;
  } else {
    date = new Date();
  }
  
  
  let dateTs = (Date.parse(date))/1000;
  if (dateTs === NaN) {
    res.json({error: "Please enter date correctly"});
  } else {
    let exercise = {"description": description, "duration": duration, "date": dateTs};
    let addExercise = function(done) {
      User.findOneAndUpdate({_id: userId}, {$push: {exercises: exercise}}, {new: true}, function(err, data) {
        if (err) {
          done(err);
        } else {
          res.json({userId: userId, description: description, duration: duration, date: dateTs});
          //done(null, data);
        }
      });
    }
    addExercise();
  }
  

});

// can maybe delete let variable and just call the User.find below
// no need for done()
app.get('/api/exercise/users', function(req, res) {
  let findUsers = function(done) {
    User.find({}, function(err, data) {
      if (err) console.log(err);
      console.log(data);
      res.json({data});
    });
  }
  findUsers();
});

// <website>/api/exercise/log?user=<id>&limit=<number>&to=<number>
app.get('/api/exercise/log', function(req, res){
  let user = req.query.userId;
  if (req.query.limit && req.query.from && req.query.to) {
    res.json({error: "Can only do limit or from & to"});
  } else if (req.query.limit) {
    //if (req.query.limit) {
      // limit
      //res.json({limit: req.query.limit});
      let limit = req.query.limit;
      User.findById(user, function(err, data) {
        if (err) console.log(err);
        //console.log(data);
        let limitedData = data.exercises.splice(0, limit); 
        res.json({limitedData});
      });
  } else if (req.query.to && req.query.from) {
    //if (req.query.to && req.query.from) {
      // from & to
      //res.json({to: req.query.to, from: req.query.from});
      let from = req.query.from;
      let to = req.query.to;
      // if from and to can be timestampped
      // turn into timestamps
      let fromTs = (Date.parse(from))/1000;
      let toTs = (Date.parse(to))/1000;
      if (fromTs && toTs) {
      
        // grab the userId array and return exercises within to and from dates
        User.findById(user, function(err, data) {
          if (err) console.log(err);
          let array = data.exercises;
          let limitedArray = array.filter(x => x.date > fromTs && x.date < toTs);
          //let finalArray = Object.assign({new: 2}, limitedArray);
          res.json({user: data.name, exercises: limitedArray});
        });
        
      } else {
        res.json({error: "'From' and 'To' parameters incorrect"});
      }
  } else if (req.query.to) {
      res.json({error: "Please add 'from' parameter"});
  } else if (req.query.from) {
      res.json({error: "Please add 'to' parameter"});
    
  } else if (user) {
      User.findById(user, function(err, data) {
        if (err) console.log(err);
        res.json({data});
      });
  }
  
    
}); 


/**/










// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
