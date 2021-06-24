const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(express.urlencoded({ extended: true }));

app.listen(8000, function () {
  console.log("Server Started");
});

// const dbUrl = "mongodb+srv://esskay:9NVp77m7M9VhquF@cluster0.vgywg.mongodb.net/myFirstDatabase"

const dbUrl = "mongodb://localhost:27017/phoneNumbersDB";
//TODO

mongoose.connect(dbUrl, { useNewUrlParser: true });

const schema = mongoose.Schema({
  number: String,
  otp: Number,
});

const PhoneNumber = mongoose.model("Number", schema);

app.get("/", function (req, res) {
  res.send("sfdasfaf");
});

app.post("/verify/number/:number", function (req, res) {
  let otpGenerated = getRndInteger(100000, 999999);

  PhoneNumber.updateOne(
    { number: req.params.number },
    { otp: otpGenerated },
    { upsert: true },
    function (err, updatedNumber) {
      console.log(updatedNumber);
    }
  );
});

app.post("/verify/number/otp/", function (req, res) {

    console.log("number " + req.params.number + " otp" + req.params.otp)
  PhoneNumber.findOne({number: req.params.number},
    function (err, foundNumber) {
      if (err) {
        console.log(err);
        res.send(
          JSON.parse({
            result: "error",
          })
        );
      } else {
        if (foundNumber.otp == req.params.otp) {
          res.send(
            JSON.parse({
              result: "verified",
            })
          );
        } else {
            res.send(
                JSON.parse({
                    result: "not verified" 
                })
            );
        }
      }
    }
  );
});

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
