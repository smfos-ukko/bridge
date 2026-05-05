import { loadSystems, unLoadSystems, systemSheet } from "./systemsheet/systemsheet.js";
import { bidWriter } from "./bidwriter/bidwriter.js";

const mainPage = document.getElementById('mainpage');
const loginPanel = document.getElementById('loginslide');
const backButton = document.getElementById('backbutton');
const authButton = document.getElementById('authbutton');
const loginButton = document.getElementById('loginbutton');
const signupButton = document.getElementById('signupbutton');
const loginMessage = document.getElementById('loginmessage');
const welcomeText = document.getElementById('welcometext');
const loadedPages = [];
let user = null;
let token = null;

export async function api(action, data = null) {
    const API = window.location.origin + "/bridge/public/stuff/api.php";
    console.log(API);

    const res = await fetch(`${API}?action=${action}`, {
        method: data ? "POST" : "GET",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: data ? JSON.stringify(data) : null
    });

    const text = await res.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Invalid JSON: " + text);
    }
}

async function checkSession() {
    const res = await api('checksession');

    if (res.user) {
        user = res.user;
        token = res.token;
        welcomeText.innerText = 'Hei ' + user + '!';
        authButton.innerText = 'Kirjaudu ulos';
        loadSystems(user, token);
    } else {
        welcomeText.innerText = '';
        authButton.innerText = 'Kirjaudu';
    }
}
if (!user) {
    checkSession();
}

const loadPage = async (page) => {
    if (loadedPages.includes(page)) return;
    const pth = `./public/stuff/${page}/${page}.html`;
    const res = await fetch(pth);
    const html = await res.text();
    const container = document.getElementById('toolContainer');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
    if (page == 'bidwriter') bidWriter();
    if (page == 'systemsheet') systemSheet(user, token);
    loadedPages.push(page);
    console.log(loadedPages);
}

const openPage = (page) => {
    mainPage.classList.remove('activated');
    let pe = document.getElementById(page);
    setTimeout(() => {
        mainPage.style.display = 'none';
        pe.style.display = 'block';
        backButton.style.display = 'block';
    }, 100);
    setTimeout(() => {
        pe.classList.add('activated');
    }, 200);
};

const openPageButtons = document.getElementsByClassName('openPageButton');
for (let opb of openPageButtons) {
    opb.addEventListener('click', async () => {
        const page = opb.getAttribute('name');
        await loadPage(page);
        openPage(page);
    });
}

const toggleSlide = () => {
    if (user) {
        logout();
    } else {
        if (loginPanel.classList.contains('open')) {
            loginPanel.classList.remove('open');
        } else {
            loginPanel.classList.add('open');
        }
    }
};

authButton.addEventListener('click', () => toggleSlide());

async function logout() {
    const res = await api('logout');
    if (!res.error) {
        user = null;
        token = null;
        welcomeText.innerText = '';
        authButton.innerText = 'Kirjaudu';
        unLoadSystems();
    }
}

async function signup() {
    const username = document.getElementById('usernameinput').value;
    const password = document.getElementById('passwordinput').value;
    const res = await api('signup', { username, password });
    if (!res.error) {
        document.getElementById('loginslide').classList.remove('open');
        login();
    } else {
        if (res.error == 'missing fields') {
            loginMessage.innerText = 'Täytä molemmat kentät.';
        }
        if (res.error == 'username taken') {
            loginMessage.innerText = 'Käyttäjänimi on jo olemassa.';
        }
    }
}

async function login() {
    if (!user) {
        const username = document.getElementById('usernameinput').value;
        const password = document.getElementById('passwordinput').value;
        const res = await api('login', { username, password });
        if (!res.error) {
            user = username;
            token = res.token;
            welcomeText.innerText = 'Hei ' + user + '!';
            authButton.innerText = 'Kirjaudu ulos';
            document.getElementById('loginslide').classList.remove('open');
            loadSystems(user, token);
        } else {
            loginMessage.innerText = 'Väärä käyttäjänimi tai salasana.';
        }
    } 
    welcomeText.innerText = 'Hei ' + user + '!';
    authButton.innerText = 'Kirjaudu ulos';
}

loginButton.addEventListener('click', () => login());
signupButton.addEventListener('click', () => signup());

backButton.onclick = () => {
    const toolPages = document.getElementsByClassName('toolpage');
    for (let toolPage of toolPages) {
        toolPage.classList.remove('activated');
        setTimeout(() => {
            mainPage.style.display = 'block';
            toolPage.style.display = 'none';
            backButton.style.display = 'none';
        }, 100);
        setTimeout(() => {
            mainPage.classList.add('activated');
        }, 200);
    }
};

//login();