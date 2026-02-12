document.addEventListener("DOMContentLoaded", () => {
    // Buttons on index.html
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const getStartedBtn = document.getElementById("getStartedBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener("click", () => {
            window.location.href = "register.html";
        });
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }
});