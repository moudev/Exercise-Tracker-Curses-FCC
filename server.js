const express = require('express')
const app = express()
const bodyParser = require('body-parser')


const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' ,{ useMongoClient: true })

/*  schema variable  */
const Schema = mongoose.Schema;

/*  Schema User create  */
let UserSchema = new Schema({
  username : { type: String, required: true }
});
/*  Model User Create  */
let User = mongoose.model('User', UserSchema);

/*  Schema User Curses  */
let CursesSchema = new Schema({
  userId:{ type : String, required: true},
  description : { type: String, required: true },
  duration: { type : Number, required: true},
  date: Date
});
/*  Model User Curses  */
let Curses = mongoose.model('Curses', CursesSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/*  START --- RESPONSE NEW USER  */

app.post('/api/exercise/new-user', (req, res, next)=>{
  let userName = req.body.username;
  let jsonResponse = {}
  let Usuario = new User({
    'username':userName
  });
  
  User.findOne({username: userName})
  .then((data)=>{
    if(data != null){
       res.json({message : "User is taken"});
    }else{
      /*  START -- SAVE DATA USUARIO  */
      Usuario.save()
          .then((data)=>{
            console.log(data)
            jsonResponse = {
              "_id":data._id,
              "username":data.username
            }
            res.json(jsonResponse);
          })
          .catch((err)=>{
            console.log(err)
            jsonResponse = {"error":err}
            res.json(jsonResponse);
          })
      /*  END -- SAVE DATA USUARIO  */
    }
  })
  .catch((error)=>res.json({error: error}))  
})
/*  END  --- RESPONSE NEW USER  */

/*  START -- NEW CURSES ADD TO USER*/
  
  app.post('/api/exercise/add', (req, res, next)=>{
    let userId = req.body.userId;
    let description = req.body.description;
    let duration = parseInt(req.body.duration);
    let date = new Date(req.body.date).toISOString().slice(0,10);
    
    let jsonResponse = {};
    
    User.findById( mongoose.Types.ObjectId(userId) )
    .then((data)=>{
      if(data != null){
        let Curse = new Curses({
        userId:userId,
        description : description,
        duration: duration,
        date: date
        })
        return Curse.save();
      }else{
        jsonResponse = {"error":'User no exist in DB'}
        res.json(jsonResponse);
      }
    })
    .then((data)=>{
      console.log(data)
      jsonResponse = {
        "message":'All its ok. Data Insert'
      }
      res.json(jsonResponse);
     })
    .catch((err)=>{
      jsonResponse = {"error":err}
      res.json(jsonResponse);
    })
       
  })
  
/*  END -- NEW CURSES ADD TO USER*/


/*  START -- GET USUARIO WITH CURSES*/
app.get('/api/exercise/log',(req, res, next)=>{
  console.log("from: " + req.query.from);
  console.log("to: "+ req.query.to);
  
  
  let userId = req.query.userId;
  let arrayFind = {
    userId : userId
  }
  let from = req.query.from ;
  if(from != ''){
    if(arrayFind.date === undefined){
      arrayFind.date = {}
    }
     arrayFind.date.$gte = from;
  }
  let to = req.query.to; //!= '')? req.query.to : new Date().toISOString().slice(0,10);
  if(to != ''){
    if(arrayFind.date === undefined){
      arrayFind.date = {}
    }
     arrayFind.date.$lte = to;
  }
  let limit = req.query.limit;
  
  let jsonResponse = {};
  // userid S1gqnKvL7
  console.log("array find")
  console.log(arrayFind)
  
 //    
  /*
https://electric-closet.glitch.me/api/exercise/log?userId=5b6dc446c4ef3010603dcd53&from=2018-01-01&to=2018-01-01&limit=  
  */
  console.log("Mostrando la fecha de la busqeudad");
  console.log(new Date().toISOString().slice(0,10));
  User.findById( mongoose.Types.ObjectId(userId) )
    .then((data)=>{
      if(data != null){
        console.log("Es resultado no es null");
        console.log(typeof data);
        console.log(from);
        return Curses.find(arrayFind).limit(parseInt(limit)).exec()
      }else{
        return new Promise.reject(new Error("No exist User"));
      }
    })
  .then((data)=>{
    console.log("data luego de la consulta")
    console.log(data);
    res.json(data)
  })
    .catch((err)=>{
      console.log("llegando al ultimo catch");
      console.log('Error: '+err)
      jsonResponse = {"error--":err}
      res.json(jsonResponse);
    })
})
/*  END -- GET USUARIO WITH CURSES*/



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
