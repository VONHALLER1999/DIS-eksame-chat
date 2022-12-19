
//imports of modules
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

//creates the https server with the private key and the selfsigned certifcate
const key = fs.readFileSync("./key.pem");
const cert = fs.readFileSync("./cert.pem");
const server = https.createServer({ key: key, cert: cert }, app);

server.listen(PORT, () => console.log(`Server lytter på port ${PORT}`));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "/public")));
;
//the app uses secure session 
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: {secure: true}
  })
);

//Makes the database
let db = new sqlite3.Database("./database/DB.sqlite", (err) => {
    if (err) {
    //If the app cannot open database
    throw err;
  } else {
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
        }
      }
    );
  }
});

//endpoint with that send data on if the user is logged in or not
app.get("/loggedstatus", async (req, res) => {
  console.log(req.session)
  if (req.session.loggedIn) {
    res.send(true);
  } else {
    res.send(false);
  }
});
//send the CSS
app.get("/style", (req, res) => {
  res.sendFile(__dirname + "public/style.css");
})
//send the client either to home or to the signup page depended on whether the client is logged in
app.get("/", async (req,res)=>{
    if(req.session.loggedIn){
        console.log("logged in");
        res.sendFile(path.join(__dirname, "/public/home.html"));
    } else {
        console.log('sent to login')
        res.sendFile(path.join(__dirname, "/public/login-signup.html"));
    }
})
app.get("/home", async (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, "/public/home.html"));
  } else {
    console.log("sent to login");
    res.sendFile(path.join(__dirname, "/public/login-signup.html"));
  }
});

//LOGIN
app.post("/api/login", async (req, res) => {
  try {
    //Gets the login data from the client
    console.log("trying to log in");
    const Email = req.body.Email;
    const Password = req.body.Password;
  
    //Makes sure the client both send an Email and Password in the request
    if (!(Email && Password)) {
      res.status(400).send("All input is required");
      return;
    }
    //checks if the clients data against the database
    let user = [];
    var sql = "SELECT * FROM Users WHERE Email = ?";
    db.all(sql, Email, function (err, rows) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
        //If the user can't be found
      } else if (rows === []) {
        console.log("user does not exits");
        res.status(400).send("No Match");
        return;
        //User found, pushes user to array to check password
      } else {
        console.log(rows);
        rows.forEach(function (row) {
          user.push(row);
        })
      }
      //Checks if the password matches with the hashed password with salt
      var PHash = bcrypt.hashSync(Password, user[0].Salt);
      if (PHash === user[0].Password) {
        //User is found, sets session to true and sends the client to the chatroom
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

//SIGNUP
app.post("/api/signup", async (req, res) => {
  console.log('somebody is trying to log in')
  try {
    const { Username, Email, Password } = req.body;
    if (!Username || !Email|| ! Password) {
      console.log("Some input is missing");
      res.status(400);
    }
    //Does the email already exist?
    var sql = "SELECT * FROM Users WHERE Email = ?";
    await db.all(sql, Email, (err, result) => {
      if (err) {
        res.status(402).json({ error: err.message });
        return;
      } 
      //If the Email isn't occupied save the user in the database
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
        //saves the user in the database
        db.run(sql, params, function (err) {
          //error handling
          if (err) {
              console.log(err);
            res.status(400).json({ error: err.message });
            return;
            //when done saving in the database send the login html file
          } else {
            res.sendFile(path.join(__dirname, "/public/login-signup.html"));
          }
        });
        //if the email is occupied send the sign-up file to the client
      } else {
        res.status(404).sendFile(path.join(__dirname, "/public/login-signup.html"));
          }
    });
    //error handling
    } catch (err) {
    console.log(err);
    }
});

//LOGOUT 
//sets the session to false and send the client to the login/signup page
app.post("/api/logout", async (req, res) => {
  req.session.loggedIn = false;
  res.sendFile(path.join(__dirname, "/public/login-signup.html"));
});

//all messages is saved here
var msgTabel = []

//Gets the messages from the clients and pushes it to the msgTabel
app.post("/api/getmessage", async (req,res) =>{
  console.log('the body is: ', req.body)
  let msg = req.body.msg
  msgTabel.push(msg)
  res.sendFile(path.join(__dirname, "/public/home.html"));
})

//send the current msgtabel
app.get("/api/currentchat", async (req, res) => {
  console.log('should sent msgtabel:',msgTabel)
  res.send(msgTabel)
});

