document.addEventListener("DOMContentLoaded", (event) => {
  event.preventDefault();


    fetch("https://localhost:3000/api/currentchat")
      .then((response) => response.json())
      .then((data) => {
        console.log(data.length);
        createTable(data)
      })
       
      function createTable(data) {
        for (let i = 0; i < data.length; i++) {
          var table = document.getElementById("table");
          var row = table.insertRow(i);

          var cell1 = row.insertCell(i);

          cell1.innerHTML = data;
        }
      }
    
  })


