
const crypto = require("crypto");
const { personPublicKey, personPrivateKey } = crypto.generateKeyPairSync("rsa", {
  // The standard secure default length for RSA keys is 2048 bits
  modulusLength: 2048,
});
fetch("http://localhost:3030/api/getserverkey")
  .then(console.log("fetch happend"))
  .then((res) => res.json())
  .then(function (serverPublicKey) {
    console.log(serverPublicKey);
    console.log("fetch happend2");
  });

/*
let messageBtn = 
login.addEventListener("click", () => {
   .then((res) => res.json())
   .then(function (result) {
        sendEncryptedMsg(public,);
      })
});
*/



