//IMPORTS MODULES
const express = require("express"); 
const path=require('path')
const sqlite3 = require("sqlite3").verbose();
const PORT=3000;
const app = express();
const bodyParser=require('body-parser')
//Session used for keeping users logged in
const session = require("express-session")({
  secret: "keyboard kitty",
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true },
});

const { MemoryStore } = require("express-session");
var store
//Becrypt used for hashing passwords
const bcrypt = require("bcrypt");
const util =require('util')
const sharedsession = require("express-socket.io-session");

//sanizter for code 
const validator = require('validator');

//intialises the HTTPS server
const fs = require("fs");
const https =require("https");

const key = fs.readFileSync("./key.pem");
const cert = fs.readFileSync("./cert.pem");
const server = https.createServer({ key: key, cert: cert }, app);

server.listen(PORT, () => console.log(`Server lytter på port ${PORT}`));

const io = require("socket.io")(server, {
  secure: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.urlencoded({ extended: false }));

//attaches session to the express
app.use(session);
//Makes the session shared between sockets and express
io.use(sharedsession(session))



//CHAT with sockets
var usersInChat ={};
var numUsers=0;

let db = new sqlite3.Database("./database/DB.sqlite", (err) => {
    if (err) {
      console.log(err)
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
          console.log("Users table already created");
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
    db.run(
      `CREATE TABLE Messages (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Message text,
            Userid INTEGER REFERENCES Users (Id),
            DateCreated DATE )`,
      (err) => {
        if (err) {
          console.log('messages tabel already exits');
        } else {
          console.log('messages table created')
        }
      }
    );
  }
});

app.use(express.static(path.join(__dirname, "/public")));

//SOCKETS
io.on("connection", (socket) => {
  //server recieves the new message from the client
  socket.on("new message", (data) => {
    console.log("server recevied a new message: ", data);
    let sql = "SELECT * FROM Users WHERE Username = '" + socket.handshake.session.username+"'"
    db.get(sql, (err, result) => {
      if (err) {
        console.log("error from the first query: ",err);
        return;
      } else if (result) {
        console.log("First query: ", result);
        var userId = result.Id;
      } else {
        return
      }

      //makes query with the msg and the usersID to insert into the messages table. 
      let insertedMsg =
        "INSERT INTO Messages (Message, UserID, DateCreated) VALUES('"+data+"'," + userId + ","+ Date.now() +")";
      db.run(insertedMsg, (err)=>{
        if (err) {
          console.log("error from the second query: ", err);
          return;
        } else {
          sendchat()
          return
        }
      });
      
      function sendchat(){
        let wholeChat =
          "SELECT a.Message, b.Username, a.DateCreated FROM Messages AS a JOIN [Users] AS b on a.Userid=b.Id ORDER BY a.DateCreated DESC";
        db.all(wholeChat, (err, chat) => {
          if (err) {
            console.log(err);
          }
          console.log("this is the current chat: ", chat);
          socket.emit("load chat", chat);
        });
      }
    })
    //listens for if the server should send the chat
    socket.on("chatroom", () => {
      console.log("sending the chat");
      sendchat();
    });
  });
});

//ENDPOINTS
app.get("/api/loggedstatus", async (req, res) => {
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
        req.session.email = req.body.Email;
        req.session.username = user[0].Username;
        console.log(req.session.username);
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
  console.log('user trying to signup')

  try {
    const { Username, Email, Password } = req.body;
    console.log(req.body)
    if (!Username||!Email ||!Password) {
      errors.log("data is missing");
      res.status(400).send("All input is required");
    }
    
    var sql = "SELECT * FROM Users WHERE Email = ?";
    await db.all(sql, Email, (err, result) => {
      if (err) {
        res.status(402).json({ error: err.message });
        return;
      } else if (result.length === 0) {
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

        db.run(sql, params, function (err) {
          if (err) {
              console.log(err);
            res.status(400).json({ error: err.message });
            return;
          } else {
            console.log('signup succes')
            res
              .sendFile(path.join(__dirname, "/public/login-signup.html"))
          }
        });
      } else {
        console.log('user already existed')
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
app.post("/api/getmessage", async (req,res) =>{
  try{
    db.serialize(() => {
      db.all(
        "select Users.username, Messages.messages from Users INNER JOIN Messages ON Users.Id= Messages.userid",
        (err, result) => {
          console.log(result)
          res.json(result)
        });
    });
  } catch (err) {
    console.log(err)
  }
  
  console.log('messages are: ')

  let msg = req.body.msg
  msgTabel.push(msg)
  res.sendFile(path.join(__dirname, "/public/home.html"));
})
app.get("/api/currentchat", async (req, res) => {
  console.log('should sent msgtabel:',msgTabel)
  res.send(msgTabel)
});
app.post("/api/clearchat", async (req, res) => {
  try {
    db.serialize(() => {
      db.all(
        "DELETE FROM Messages",
        (err, result) => {
          console.log(result);
        }
      );
    });
  } catch (err) {
    console.log(err);
  }
});
