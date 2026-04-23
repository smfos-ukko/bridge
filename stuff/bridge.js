const mainPage = document.getElementById('mainpage');

window.onload = () => {
    const pages = document.getElementsByClassName('toolpage');
    for (let page of pages) {
        const backButton = document.createElement('button');
        backButton.innerHTML = 'Etusivulle';
        backButton.classList.add('mainbutton');
        backButton.onclick = () => {
            backButton.parentElement.classList.remove('activated');
            setTimeout(() => {
                mainPage.style.display = 'block';
                backButton.parentElement.style.display = 'none';
            }, 100);
            setTimeout(() => {
                mainPage.classList.add('activated');
            }, 200);
        }
        page.appendChild(backButton);
    }
}

openPage = (page) => {
    mainPage.classList.remove('activated');
    const pe = document.getElementById(page);
    setTimeout(() => {
        mainPage.style.display = 'none';
        pe.style.display = 'block';
    }, 100);   
    setTimeout(() => {
        pe.classList.add('activated');
    }, 200);
}

//bidwriter
const bwDealerButtons = document.getElementsByClassName('bwdealer');
const bwVulButtons = document.getElementsByClassName('bwvul');
const bwTable = document.getElementById('bwtable');
let bwDealer = 'N';
let bwVul = 'Ei kukaan';

for (let bwdb of bwDealerButtons) {
    bwdb.onclick = () => {
        for (let b2 of bwDealerButtons) {
            b2.classList.remove('lit');
        }
        bwdb.classList.add('lit');
        bwDealer = bwdb.innerHTML;
    }
}

for (let bwvb of bwVulButtons) {
    bwvb.onclick = () => {
        for (let b2 of bwVulButtons) {
            b2.classList.remove('lit');
        }
        bwvb.classList.add('lit');
        bwVul = bwvb.innerHTML;
    }
}

let bwNumberOfRows = 0;
const bwAddRow = () => {
    bwTable.innerHTML += `
        <tr>
            <th><input type="text" data-index="${bwNumberOfRows} N"></th>
            <th><input type="text" data-index="${bwNumberOfRows} E"></th>
            <th><input type="text" data-index="${bwNumberOfRows} S"></th>
            <th><input type="text" data-index="${bwNumberOfRows} W"></th>
        </tr>
    `;
}
bwAddRow();