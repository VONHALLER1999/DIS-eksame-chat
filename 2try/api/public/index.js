document.addEventListener("DOMContentLoaded", (event) => {
  event.preventDefault();

    //when the DOM is loaded fetch the current messages from the backend
    loadchat()

    function loadchat(){
      fetch("https://localhost:3000/api/currentchat")
        .then((response) => response.json())
        .then((data) => {
          console.log(data.length);
          createTable(data);
        });
    }
      //refreshes the chat
      document.getElementById('refresh').addEventListener('click', (e)=>{
         event.preventDefault();
        console.log('refreshing the chat')
        loadchat()
      })

      //When a message is sent also update the chat
      document.getElementById("sendMsg").addEventListener("click", (e) => {
        event.preventDefault()
        console.log("sent a msg and refreshing the chat");
        loadchat();
      });

      //function for putting the messages in the chatroom
      el = document.getElementById('myPar')
      function createTable(data) {
        let pElements = document.querySelectorAll("p");
        for (let i = 1; i < pElements.length; i++) {
          pElements[i].parentNode.removeChild(pElements[i]);
        }
        for (let i = 0; i < data.length; i++) {

          let para = document.createElement("p")
          let node = document.createTextNode(data[i])
          para.appendChild(node)
          el.appendChild(para)

          /*
          var table = document.getElementById("table");
          var row = table.insertRow(i);

          var cell1 = row.insertCell(i);

          cell1.innerHTML = data;
          */
        }
      }
    
  })


