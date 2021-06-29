//jshint esversion:6

require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const axios = require("axios");
const nodemailer = require("nodemailer");

let adminNumber = 9334805466;
let adminEmail = "esskay099@gmail.com";

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

var port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("started");
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


app.post("/verify/number/", function (req, res) {
  let otpGenerated = getRndInteger(100000, 999999);

  PhoneNumber.updateOne(
    { number: req.body.number },
    { otp: otpGenerated },
    { upsert: true },
    function (err) {
      if (err) {
        console.log(err);
      } else {
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

app.post("/SendConfirmation", function (req, res) {

  console.log(req.body);

    sendMail(req.body, function (result) {
      
      console.log(result);

      if(result.result== "Mail Sent"){
        res.sendStatus(200);
      }
    });

    // sendSMS(req.body, function(result){

    //   console.log(result)
    // });

});


function sendSMS(details, result){


  let messageForUser = getFormattedConfirmationMessage(
    false,
    adminNumber,
    details.startDate,
    details.endDate,
    details.time,
    details.oneWay,
    details.identityUrl,
    details.startDestination,
    details.endDestination,
    false
  );

  let messageForAdmin = getFormattedConfirmationMessage(
    false,
    details.number,
    details.startDate,
    details.endDate,
    details.time,
    details.oneWay,
    details.identityUrl,
    details.startDestination,
    details.endDestination,
    true
  );


  axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=tpRTgmQXliI5vBDbLjN4oGACwV3fPFydYOhr9M8WqnJu7ZkKeSrTSkb1uzULDIx37ZBYfaM56XgGv9s4&route=v3&sender_id=TXTIND&message=${messageForUser}&language=english&flash=0&numbers=${details.number}`)
  .then(function (response) {
    // handle success
    result( 
      response
    )
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  });

  axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=tpRTgmQXliI5vBDbLjN4oGACwV3fPFydYOhr9M8WqnJu7ZkKeSrTSkb1uzULDIx37ZBYfaM56XgGv9s4&route=v3&sender_id=TXTIND&message=${messageForAdmin}&language=english&flash=0&numbers=${adminNumber}`)
  .then(function (response) {
    // handle success
    result( 
      response
    )
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  });

}



function sendMail(details, result) {

  let messageForAdmin = getFormattedConfirmationMessage(
    true,
    details.number,
    details.startDate,
    details.endDate,
    details.time,
    details.oneWay,
    details.identityUrl,
    details.startDestination,
    details.endDestination,
    true
  );

  let transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const message = {
    from: "abeta8327@gmail.com",
    to: `khanshaique89@gmail.com, ${adminEmail}`, 
    subject: "Booking Confirmation", 
    text: messageForAdmin, 
  };
  transport.sendMail(message, function (err, info) {
    if (err) {
      result({
        result: "Mail Sent Error",
        msg: err
      });
    } else {
      result({
        result: "Mail Sent"
      });
    }
  });
}

function getFormattedConfirmationMessage(
  forMail,
  phoneNumber,
  startDate,
  endDate,
  time,
  oneWay,
  identityUrl,
  startDestination,
  endDestination,
  forAdmin
) {
  if (oneWay == true) {
    wayString = "One Way";
  } else {
    wayString = "Two Way";
  }
  if (oneWay == true) {
    dateString = `On ${startDate}`;
  } else {
    dateString = `From ${startDate} to ${endDate}`;
  }
  if (forMail == true) {
    identityString = `identity URL: ${identityUrl}`;
  } else {
    identityUrl = "";
  }
  if (forAdmin == false) {
    endingString = "Have a great trip!!";
  } else {
    endingString = "";
  }

  let confirmString =
    "Booking Confirmed" +
    "\n\n" +
    `From ${startDestination} to ${endDestination} \n` +
    wayString +
    "\n" +
    dateString +
    "\n" +
    `Pickup Time: ${time}\n` +
    identityUrl +
    "\n" +
    `Contact number: ${phoneNumber} + \n` +
    endingString;

  return confirmString;
}
