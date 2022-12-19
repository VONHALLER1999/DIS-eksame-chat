document.addEventListener("DOMContentLoaded", (event) => {
  event.preventDefault();
    fetch("https://localhost:3000/api/loggedstatus")
      .then((response) => response.json())
      .then((data) => {
        console.log(data.length);
        if (data) {
          location.href = "/home.html";
        }
      });
      
})