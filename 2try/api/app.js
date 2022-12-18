const express = require("express"); 
const path=require('path')
const sqlite3 = require("sqlite3").verbose();
const PORT=3000;
const app = express();
const bodyParser=require('body-parser')
const session = require("express-session");
var bcrypt = require("bcrypt");

const fs = require("fs");
const https =require("https")

const key = fs.readFileSync("./key.pem");
const cert = fs.readFileSync("./cert.pem");

const server = https.createServer({ key: key, cert: cert }, app);

server.listen(PORT, () => console.log(`Server lytter på port ${PORT}`));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "/public")));
;

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

let db = new sqlite3.Database("./userDB.sqlite", (err) => {
    if (err) {
    // Cannot open database
    throw err;
  } else {
    var salt = bcrypt.genSaltSync(10);
    db.run(
      `CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text, 
            Email text, 
            Password text,             
            Salt text,
            DateCreated DATE    
            )`,
      (err) => {
        if (err) {
          console.log("table already created");
          return;
          // Table already created
        } else {
          // Table just created, creating some rows
          console.log("table being created");
          var insert =
            "INSERT INTO Users (Username, Email, Password, Salt) VALUES (?,?,?,?)";
          db.run(insert, [
            "user1",
            "user1@example.com",
            bcrypt.hashSync("user1", salt),
            salt,
            Date("now"),
          ]);
          console.log("hey");
          db.run(insert, [
            "user2",
            "user2@example.com",
            bcrypt.hashSync("user2", salt),
            salt,
            Date("now"),
          ]);
          db.run(insert, [
            "user3",
            "user3@example.com",
            bcrypt.hashSync("user3", salt),
            salt,
            Date("now"),
          ]);
          db.run(insert, [
            "user4",
            "user4@example.com",
            bcrypt.hashSync("user4", salt),
            salt,
            Date("now"),
          ]);
          return;
        }
      }
    );
  }
});

app.get("/loggedstatus", async (req, res) => {
  console.log(req.session)
  if (req.session.loggedIn) {
    res.send(true);
  } else {
    res.send(false);
  }
});

app.get("/", async (req,res)=>{
    if(req.session.loggedIn){
        console.log("logged in");
        res.sendFile(path.join(__dirname, "/public/home.html"));
    } else {
        console.log('sent to login')
        res.sendFile(path.join(__dirname, "/public/login-signup.html"));
    }
})
app.get("/style", (req, res) => {
  res.sendFile(__dirname + "public/style.css");
});

app.get("/home", async (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "/public/home.html"));
  } else {
    console.log("sent to login");
    res.sendFile(path.join(__dirname, "/public/login-signup.html"));
  }
});

app.post("/api/login", async (req, res) => {
  console.log(req.body)
  try {
    console.log("trying to log in");
    const Email = req.body.Email;
    const Password = req.body.Password;
  
    // Make sure there is an Email and Password in the request
    if (!(Email && Password)) {
      res.status(400).send("All input is required");
      return;
    }

    let user = [];
    var sql = "SELECT * FROM Users WHERE Email = ?";

    //if something goes with the SQL database else push the user to the array
    //let result= 
    db.all(sql, Email, function (err, rows) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      } else {
        rows.forEach(function (row) {
          user.push(row);
        });
      }

      //check if the password matches with the hashed password with salt
      var PHash = bcrypt.hashSync(Password, user[0].Salt);

      if (PHash === user[0].Password) {
        req.session.loggedIn = true;
        console.log('succesfully logged in');
        res.sendFile(path.join(__dirname, "/public/home.html"));
      } else {
        return res.status(400).send("No Match");
      }
    })
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/signup", async (req, res) => {
  var errors = [];
  try {
    const { Username, Email, Password } = req.body;
    if (!Username) {
      errors.push("Username is missing");
    }
    if (!Email) {
      errors.push("Email is missing");
    }
    if (errors.length) {
      res.status(400).json({ error: errors.join(",") });
      return;
    }
    let userExists = false;
    var sql = "SELECT * FROM Users WHERE Email = ?";
    await db.all(sql, Email, (err, result) => {
      if (err) {
        res.status(402).json({ error: err.message });
        return;
      } 
      if (result.length === 0) {
        var salt = bcrypt.genSaltSync(10);
        var data = {
          Username: Username,
          Email: Email,
          Password: bcrypt.hashSync(Password, salt),
          Salt: salt,
          DateCreated: Date("now"),
        };

        var sql =
          "INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)";
        var params = [
          data.Username,
          data.Email,
          data.Password,
          data.Salt,
          Date("now"),
        ];

        var user = db.run(sql, params, function (err, innerResult) {
          if (err) {
              console.log(err);
            res.status(400).json({ error: err.message });
            return;
          }
        });
      } else {
        userExists = true;
        res.status(404).sendFile(path.join(__dirname, "/public/login-signup.html"));
          }
    });
    } catch (err) {
    console.log(err);
    }
});

app.post("/api/logout", async (req, res) => {
  req.session.loggedIn = false;
  res.sendFile(path.join(__dirname, "/public/login-signup.html"));
});

var msgTabel = []

app.post("/api/getmessage", async (req,res) =>{
  console.log('the body is: ', req.body)
  let msg = req.body.msg
  msgTabel.push(msg)
  res.sendFile(path.join(__dirname, "/public/home.html"));
})

app.get("/api/currentchat", async (req, res) => {
  console.log('should sent msgtabel:',msgTabel)
  res.send(msgTabel)
});

