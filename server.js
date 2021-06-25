//jshint esversion:6

require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const axios = require("axios")


app.use(express.urlencoded({ extended: true }));

var port = process.env.PORT

if(port== null || port == ""){
    port = 3000;}
    
    
app.listen(port , function(){
        console.log("started")
        sendMail()
    });



const dbUrl = "mongodb+srv://esskay:9NVp77m7M9VhquF@cluster0.vgywg.mongodb.net/pickcab"

// const dbUrl = "mongodb://localhost:27017/phoneNumbersDB";

mongoose.connect(dbUrl, { useNewUrlParser: true });

const schema = mongoose.Schema({
  number: String,
  otp: Number,
});

const PhoneNumber = mongoose.model("Number", schema);

app.get("/", function (req, res) {
  res.send("sfdasfaf");
});

app.get("/", function(req, res){
   res.send("Heya")
});

app.post("/verify/number/", function (req, res) {
  let otpGenerated = getRndInteger(100000, 999999);

  PhoneNumber.updateOne(
    { number: req.body.number },
    { otp: otpGenerated },
    { upsert: true },
    function (err) {
      if (err) {
        console.log(err);
      }
      else{
        res.send(JSON.parse('{"result": "Verification Started"}'));
      }
    }
  );
});

app.post("/verify/number/otp/", function (req, res) {
  console.log("number " + req.body.number + " otp" + req.body.otp);
  PhoneNumber.findOne({ number: req.body.number }, function (err, foundNumber) {
    console.log(foundNumber);

    if (err || !foundNumber) {
      console.log(err);
      res.send(JSON.parse('{"result" : "error" }'));
    } else {
      if (foundNumber.otp == req.body.otp) {
        res.send(JSON.parse('{"result": "verified"}'));
        console.log("Number Verified");
      } else {
        res.send(JSON.parse('{"result": "not verified"}'));
        console.log("Number Verification Failed");
      }
    }
  });
});

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

app.post("/SendConfirmation", function(req, res){
     
  
   
})

function sendMail(){


  const instance = axios.create({
    headers: {"authorization" : "ey41fLbLzUm9jyRKm77jUHl2QdMdn9h5dw8qdBxbN9odCwouwyy5bhoh3Okz"}
  });


  instance.post(//TODO
  )
  .then(response => {
    console.log(response.data);
    console.log(response.data);
  })
  .catch(error => {
    console.log(error);
  });
}




