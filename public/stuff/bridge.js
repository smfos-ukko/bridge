import { loadSystems, unLoadSystems, systemSheet } from "./systemsheet/systemsheet.js";
import { bidWriter } from "./bidwriter/bidwriter.js";
import { movementEditor } from "./movementeditor/movementeditor.js";
import { sheetViewer } from "./sheetviewer/sheetviewer.js";

const mainPage = document.getElementById('mainpage');
const loginPanel = document.getElementById('loginslide');
const backButton = document.getElementById('backbutton');
const authButton = document.getElementById('authbutton');
const loginButton = document.getElementById('loginbutton');
const signupButton = document.getElementById('signupbutton');
const loginMessage = document.getElementById('loginmessage');
const welcomeText = document.getElementById('welcometext');
const loadedPages = [];

export async function api(action, data = null) {
    const API = window.location.origin + "/bridge/public/stuff/api.php";

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
        sessionStorage.setItem('user', res.user);
        sessionStorage.setItem('token', res.token);
        welcomeText.innerText = 'Hei ' + res.user + '!';
        authButton.innerText = 'Kirjaudu ulos';
        loadSystems(res.user, res.token);
    } else {
        welcomeText.innerText = '';
        authButton.innerText = 'Kirjaudu';
    }
}

if (sessionStorage.getItem('user')) {
    checkSession();
}

const loadPage = async (page) => {
    if (loadedPages.includes(page)) return;
    let pth = `./public/stuff/${page}/${page}.html`;
    if (window.location.hostname == '127.0.0.1') pth = `./public/stuff/${page}/${page}.html`;
    const res = await fetch(pth);
    const html = await res.text();
    const container = document.getElementById('toolContainer');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
    if (page == 'bidwriter') bidWriter();
    if (page == 'systemsheet') systemSheet();
    if (page == 'movementeditor') movementEditor();
    if (page == 'sheetviewer') sheetViewer();
    loadedPages.push(page);
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
    if (sessionStorage.getItem('user')) {
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
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
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
    if (!sessionStorage.getItem('user')) {
        const username = document.getElementById('usernameinput').value;
        const password = document.getElementById('passwordinput').value;
        const res = await api('login', { username, password });
        if (!res.error) {
            sessionStorage.setItem('user', res.username);
            sessionStorage.setItem('token', res.token);
            welcomeText.innerText = 'Hei ' + res.username + '!';
            authButton.innerText = 'Kirjaudu ulos';
            document.getElementById('loginslide').classList.remove('open');
            loadSystems();
            welcomeText.innerText = 'Hei ' + res.username + '!';
            authButton.innerText = 'Kirjaudu ulos';
        } else {
            loginMessage.innerText = 'Väärä käyttäjänimi tai salasana.';
        }
    } 
}

loginButton.addEventListener('click', () => login());
signupButton.addEventListener('click', () => signup());
document.getElementById('passwordinput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') login();
});

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

export const showMessage = (message, color = '#d8fd22', duration = 2000) => {
    const mDiv = document.getElementById('generalMessage');
    mDiv.textContent = message;
    mDiv.style.backgroundColor = color;

    mDiv.classList.add('show');

    setTimeout(() => {
        mDiv.classList.remove('show');
        mDiv.textContent = '';
    }, duration);
};