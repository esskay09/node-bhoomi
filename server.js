//jshint esversion:6

require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const axios = require("axios");
const nodemailer = require("nodemailer");

const Razorpay = require("razorpay");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("started");
});

const dbUrl =
  "mongodb+srv://esskay:9NVp77m7M9VhquF@cluster0.vgywg.mongodb.net/pickcab";

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

  try {
    sendOtp(req.body.number, otpGenerated, function (response) {
      console.log(response);
    });
  } catch (err) {
    console.log(err);
  }

  PhoneNumber.updateOne(
    { number: req.body.number },
    { otp: otpGenerated },
    { upsert: true },
    function (err) {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.status(200).send(JSON.parse('{"result": "Verification Started"}'));
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
      res.status(200).send(JSON.parse('{"result" : "error" }'));
    } else {
      if (foundNumber.otp == req.body.otp) {
        res.status(200).send(JSON.parse('{"result": "verified"}'));
        console.log("Number Verified");
      } else {
        res.status(200).send(JSON.parse('{"result": "not verified"}'));
        console.log("Number Verification Failed");
      }
    }
  });
});

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

app.post("/SendConfirmation", function (req, res) {
  sendMail(req.body, function (result) {
    console.log(result);

    if (result.result == "Mail Sent") {
      res.sendStatus(200);
    }
  });

  sendSMS(req.body, function (result) {
    console.log(result);
  });
});

function sendSMS(details, result) {
  let messageForUser = getFormattedConfirmationMessage(
    false,
    process.env.ADMINNUM,
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

  axios
    .get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS}&route=v3&sender_id=TXTIND&message=${messageForUser}&language=english&flash=0&numbers=${details.number}`
    )
    .then(function (response) {
      // handle success
      result(response);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });

  axios
    .get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS}&route=v3&sender_id=TXTIND&message=${messageForAdmin}&language=english&flash=0&numbers=${process.env.ADMIN_NUM}`
    )
    .then(function (response) {
      // handle success
      result(response);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
}

function sendOtp(number, otp, result) {
  let message = `Your One time password for pickcab is ${otp} \n\n PCYX%2BT1RS21`;

  axios
    .get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS}&route=v3&sender_id=TXTIND&message=${message}&language=english&flash=0&numbers=${number}`
    )
    .then(function (response) {
      result(response);
    })
    .catch(function (error) {
      // handle error
      result(response);
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
    to: `esskay099@gmail.com, ${process.env.ADMIN_EMAIL}`,
    subject: "Booking Confirmation",
    text: messageForAdmin,
  };
  transport.sendMail(message, function (err, info) {
    if (err) {
      result({
        result: "Mail Sent Error",
        msg: err,
      });
    } else {
      result({
        result: "Mail Sent",
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

app.get("/generateOrder/:amount", function (req, res) {

  const amount = req.params.amount * 100

  var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  var options = {
    amount: amount, // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function (err, order) {
    if (err) {
      console.log(`Razorpay error: ${err}`);
      res.status(200).send(JSON.parse('{"result" : "error" }'));
    } else {
      console.log(order);
      res
        .status(200)
        .send(JSON.parse(`{"result": "Order Created", "order": "${order}"}`));
    }
  });
});

