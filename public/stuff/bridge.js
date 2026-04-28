const mainPage = document.getElementById('mainpage');
const backButton = document.getElementById('backbutton');

//MUUTA TAMA KUN OLET VALMIS
const API = "http://127.0.0.1:8000/stuff/api.php";

async function api(action, data = null) {
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

const toggleSlide = () => {
    const panel = document.getElementById('loginslide');
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
    } else {
        panel.classList.add('open');
    }
};

async function signup() {
    const username = document.getElementById('usernameinput').value;
    const password = document.getElementById('passwordinput').value;
    const res = await api('signup', { username, password });
    console.log(res.error);
    if (!res.error) {
        document.getElementById('loginslide').classList.remove('open');
        login();
    } else {
        
    }
}

async function login() {
    username = document.getElementById('usernameinput').value;
    password = document.getElementById('passwordinput').value;
    const res = await api('login', { username, password });
    console.log(res);
}

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

openPage = (page) => {
    mainPage.classList.remove('activated');
    const pe = document.getElementById(page);
    setTimeout(() => {
        mainPage.style.display = 'none';
        pe.style.display = 'block';
        backButton.style.display = 'block';
    }, 100);
    setTimeout(() => {
        pe.classList.add('activated');
    }, 200);
};

const loadTool = async (path) => {
    const res = await fetch(path);
    const html = await res.text();
    const container = document.getElementById('toolContainer');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
};

const formatBid = (str) => {
    let formattedStr = str.toUpperCase();
    formattedStr = formattedStr.replace(/XX|X|C|D|H|S/g, (match) => {
        switch (match) {
            case 'XX':
                return '<span class="rdbl">XX</span>';
            case 'X':
                return '<span class="dbl">X</span>';
            case 'C':
                return '<span class="club"> ♣</span>';
            case 'D':
                return '<span class="diamond"> ♦</span>';
            case 'H':
                return '<span class="heart"> ♥</span>';
            case 'S':
                return '<span class="spade"> ♠</span>';
        }
    });
    return formattedStr;
};