
document.addEventListener("DOMContentLoaded", (event) => {
  event.preventDefault();

  var socket = io();

  //request for the chat first thing when DOM is loaded
  giveMeChat()
  function giveMeChat(){
    console.log('hello there?')
    socket.emit('chatroom', () => {
      console.log("requested the chat");
    });
  }
  
  //listens for updates for the chat
  socket.on("load chat", (data) => {
    console.log('got this: ', data)
    buildChats(data);
  });
  
  //function that builds the chat in HTML from object
  function buildChats(data){
  console.log('g')
  var rowcount = document.getElementById("table").rows.length;
  console.log(rowcount)
  for (let i = rowcount - 1; i > 0; i--) {
    table.deleteRow(i);
    console.log('j')
  }
  console.log('m')
  for(let i=0;i<data.length; i++){
    console.log('t')
    table=document.getElementById("table");
    var row = table.insertRow(i);

    var cell1= row.insertCell(0)
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    console.log(data[i].Message)
    cell1.innerHTML = data[i].Message;
    cell2.innerHTML = data[i].Username;
    cell3.innerHTML = data[i].DateCreated;
  }
}
  
    //Checks if the users is logged in
    fetch("https://localhost:3000/api/loggedstatus")
      .then((response) => response.json())
      .then((data) => {
        if(!data){
          location.href = "/login-signup.html";
        }
      })  

  //gets the send button
  const sendBtn = document.getElementById('sendBtn')

  //send a message when the button is clicked
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log('send button clicked')
    sendMessage()
  });

  //function for if a user send a message
  function sendMessage() {
    var message = document.getElementById('msg').value;
    //no prevention of SQL injection or check for empty string
    console.log("here: ", message);
    socket.emit("new message", message);
  }
})


