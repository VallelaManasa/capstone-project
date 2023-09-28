const express = require('express')
const app = express()
var passwordHash = require("password-hash");
const bodyParser = require('body-parser')
app.use(bodyParser.json());
const request = require('request');


app.use(bodyParser.urlencoded({extended: false}));


app.use(express.static("public"));
const port = 3001

const { initializeApp,cert } = require('firebase-admin/app');
const { getFirestore,Filter } = require('firebase-admin/firestore');

var admin = require("firebase-admin");

var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db=getFirestore();

app.set("view engine","ejs");

app.get('/', (req, res) => {
  res.render('starting');
})

app.get("/signin",(req,res) =>{
  res.render('signin');
})




    app.post("/signupsubmit",function(req,res){
      console.log(req.body);
      db.collection("userDemo")
      .where(
          Filter.or(
            Filter.where("email","==",req.body.email),
            Filter.where("full_name","==",req.body.full_name)
          )
      )
      .get()
      .then((docs) =>{
        if(docs.size>0){
          res.send("Hey this mail already exists please login");
        } else{
          db.collection("userDemo")
          .add({
            full_name:req.body.full_name,
            email:req.body.email,
            password:passwordHash.generate(req.body.password),
          })
          .then(() =>{
            res.redirect("/signin");
          })
          .catch(() =>{
            res.send("something went wrong")
          });
        }
      });
    });


    app.post("/signinsubmit",(req,res)=>{
      const email=req.body.email;
      const password = req.body.password;
      console.log(email)
      console.log(password)

      db.collection("userDemo")
        .where("email", "==", email)
        .get()
        .then((docs) => {
          if (docs.empty) {
            res.send("User not found");
          } else {
            let verified = false;
            docs.forEach((doc) => {
              verified = passwordHash.verify(password, doc.data().password);
            });
            if (verified) {
              res.redirect('/home');
            } else {
              res.send("Authentication failed");
            }
          }
        })
        .catch((error) => {
          console.error("Error querying Firestore:", error);
          res.send("Something went wrong.");
        });
    });




app.get("/signup",(req,res) =>{
  res.render('signup');
})

app.get("/movienamesearch", (req, res) => {
  const moviename = req.query.moviename;
  var movieData = []

  var url;
  if(moviename){
      url = "https://api.themoviedb.org/3/search/movie?api_key=9325d02aa9a72472fb922c4f28e38d5a&query="+moviename;
  }
  else{
    url="https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=9325d02aa9a72472fb922c4f28e38d5a";
  }
  
  request(url , function(error,response,body){
      var data = JSON.parse(body).results;
      if(data){
          showMovies(data);
          
          function showMovies(data) { 
              data.forEach(movie => {
                  movieData.push(movie);
              })
          }
          console.log(movieData);
          res.render('dashboard', {userData: movieData},);

      }
      else{
          console.log("not thier");
      }
  })
})

const userData = [];

// Render the EJS template and pass userData to it
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { userData }); // Pass userData to the template
});

app.get("/home",(req,res) =>{
  res.render('home');
})

app.get("/starting",(req,res) =>{
  res.render('starting');
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})






