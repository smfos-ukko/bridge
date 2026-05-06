import { dynamicInputTable } from "../corteztools.js";
import { api } from "../bridge.js";
import { showMessage } from "../bridge.js";

let systems = [];
let table;
const fontSizes = {
    h2: '24px'
};

const getI = (id) => {
    return document.getElementById(id).value;
};

const fitText = (els, isH = true, percent = 1, doc = false) => {
    const container = document.getElementById('a5left');
    const hContainer = container.querySelector('.pdHeightContainer');
    const tContainerHeight = container.querySelector('.pdHeader').clientHeight;

    const max = isH
        ? container.clientHeight * percent - 50 - tContainerHeight
        : container.clientWidth * percent - 30;

    const elements = els instanceof NodeList ? [...els] : [els];

    let baseSizes = elements.map (el =>
        parseFloat(getComputedStyle(el).fontSize)
    );

    if (doc) console.log('max: ', max, ' els: ', els, ' basesizes: ', baseSizes);

    let scale = 1;
    let step = 0.98;
    let fits = false;

    while (!fits && scale > 0.2) {
        fits = true;

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];

            const newSize = baseSizes[i] * scale;
            el.style.fontSize = newSize + 'px';

            const overflow = isH 
                ? hContainer.clientHeight > max
                : el.scrollWidth > max;

            if (overflow) fits = false;
        }

        if (!fits) scale *= step;
        if (doc) console.log('scale: ', scale, ' step: ', step, ' fits: ', fits);
        if (doc) console.log('height client: ', hContainer.clientHeight, ' h scroll: ', hContainer.scrollHeight);
    }
};

const drawPrint = () => {
    const a5left = document.getElementById('a5left');
    const a5right = document.getElementById('a5right');
    
    document.querySelectorAll('.pdPlayer h2').forEach((f) => { f.fontSize = fontSizes.h2 });

    let pdTableRows = '';

    const pdTab = document.getElementById('bidsResponsesInputTable');
    const pdEls = pdTab.querySelectorAll('input');
    for (let el of pdEls) {
        if (parseInt(el.dataset.colIndex) == 0) pdTableRows += '<tr>';
        pdTableRows += '<td>' + el.value.trim() + '</td>';
        if (parseInt(el.dataset.colIndex) == 2) pdTableRows += '</tr>';
    }

    let pd = `
        <div class="pdHeader">
            <div class="pdPlayer pdLeft">
                <h2 class="pdHeaderText">${getI('sheetp1')}</h2>
                <h2 class="pdHeaderText">${getI('sheetMateNumberp1')}</h2>
            </div>
            <div>
                <h1 class="pdHeaderText">${getI('sheetBaseSystem')}</h1>
            </div>
            <div class="pdPlayer pdRight">
                <h2 class="pdHeaderText">${getI('sheetp2')}</h2>
                <h2 class="pdHeaderText">${getI('sheetMateNumberp2')}</h2>
            </div>
        </div>
        <div class="pdHeightContainer">
            <div class="pdTableContainer">
                <table class="pdTable">
                    <tbody>
                        <tr>
                            <th><h3>Avaustarjous</h3></th>
                            <th><h3>Merkitys</h3></th>
                            <th><h3>Vastaukset</h3></th>
                        </tr>
                        ${pdTableRows}
                    </tbody>
                </table>
            </div>
            <div class="pdTextareasContainer">
                <h3>Lähdöt</h3>
                <p class="pdLeads">${document.getElementById('sheetLeadInput').value}</p>
                <h3>Merkinannot</h3>
                <p class="pdSingals">${document.getElementById('sheetSignalInput').value}</p>
                <h3>Konventiot</h3>
                <p class="pdConvention">${document.getElementById('sheetConventionInput').value}</p>
            </div>
        </div>
    `;

    a5left.innerHTML = pd;
    a5right.innerHTML = pd;

    const emptyingRows = document.querySelectorAll('.pdTable tr');

    emptyingRows.forEach(eRow => {
        const tds = eRow.querySelectorAll('td');
        if (tds.length == 0) return;

        const allEmpty = [...tds].every(td => td.textContent.trim() === '');

        if (allEmpty) eRow.remove();
    });

    fitText(document.querySelectorAll('.pdHeaderText'), false, 0.33);
    fitText(document.querySelectorAll(`
        .pdTextareasContainer p, 
        .pdTextareasContainer h3, 
        .pdTableContainer td
    `), true, 1);
};

const plantSystem = (s) => {
    const inputs = document.getElementById('systemSheetInputs');

    const sys = systems[s].data;

    document.getElementById('systemName').value = systems[s].name;

    const brit = document.getElementById('bidsResponsesInputTable');
    while (brit.querySelector('tbody').rows.length < Object.keys(sys.grid).length + 1) table.addRow();
    const inputFields = inputs.querySelectorAll('input, textarea');

    for (let i of inputFields) {
        const inputId = i.getAttribute('id');
    
        if (inputId) {
            i.value = sys.fields?.[inputId] ?? '';
            continue;
        }

        if (i.classList.contains('dynamic-input')) {
            const row = Number(i.dataset.rowIndex);
            const col = Number(i.dataset.colIndex);

            i.value = sys.grid?.[row]?.[col] ?? '';
        }
    }

    inputs.querySelector('.dynamic-input')?.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function loadSystems() {
    if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) return;
    const token = sessionStorage.getItem('token');
    const res = await api('loadsystem', { token });
    systems = res;
    const sheetManageTitle = document.getElementById('sheetManageTitle');
    if (sheetManageTitle) sheetManageTitle.innerText = 'Omat systeemit';

    const sheetManageSystems = document.getElementById('sheetManageSystems');
    if (!sheetManageSystems) return;

    const previousSystemListButtons = sheetManageSystems.querySelectorAll('.systemListButton');
    for(let old of previousSystemListButtons) old.remove();

    for (let i = 0; i < res.length; i++) {
        const systemListButton = document.createElement('button');
        systemListButton.innerText = res[i].name;
        systemListButton.classList.add('systemListButton');
        systemListButton.addEventListener('click', () => {
            plantSystem(i);
        });
        sheetManageSystems.appendChild(systemListButton);
    }
    drawPrint();
}

const resetSystems = () => {
    unLoadSystems();
    const user = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    loadSystems(user, token);
}

export async function unLoadSystems() {
    const sheetManageTitle = document.getElementById('sheetManageTitle');
    if (sheetManageTitle) sheetManageTitle.innerText = 'Kirjaudu sisään tallentaaksesi systeemejä.';
    const btns = document.querySelectorAll('.systemListButton');
    for (let btn of btns) {
        btn.remove();
    }
}

export function systemSheet() {
    const user = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    const inputs = document.getElementById('systemSheetInputs');
    table = dynamicInputTable(3, 'bidsResponsesInputTable', ['Tarjous', 'Merkitys', 'Vastaukset'], false);
    const system = {
        grid: {},
        fields: {}
    };
    const sheetManageTitle = document.getElementById('sheetManageTitle');

    inputs.addEventListener('input', (e) => {
        drawPrint();
    });

    if (!user) {
        sheetManageTitle.innerText = 'Kirjaudu sisään tallentaaksesi systeemejä.';
    } else {
        sheetManageTitle.innerText = 'Omat systeemit';
    }

    document.getElementById('sheetBidInputs').appendChild(table.init());

    const updateSheet = () => {
        const inputFields = inputs.querySelectorAll('input, textarea');

        for (let i of inputFields) {
            const inputId = i.getAttribute('id');

            if (inputId) {
                system.fields[inputId] = i.value;
                continue;
            }

            if (i.classList.contains('dynamic-input')) {
                const row = Number(i.dataset.rowIndex);
                const col = Number(i.dataset.colIndex);

                if (!system.grid[row]) {
                    system.grid[row] = [];
                }

                system.grid[row][col] = i.value;
            }
        }
    };

    async function saveSystem() {
        const systemName = document.getElementById('systemName').value;

        const savingUser = sessionStorage.getItem('user');
        const savingToken = sessionStorage.getItem('token');
        if (!savingUser) {
            showMessage('Kirjaudu sisään tallentaaksesi systeemin.');
            return;
        }

        if (!systemName) {
            showMessage('Anna systeemin nimi.');
            return;
        }

        const res = await api('savesystem', { username: savingUser, name: systemName, token: savingToken, data: system });
        resetSystems();
    }
        
    async function deleteSystem() {
        const systemName = document.getElementById('systemName').value;
        const deletingUser = sessionStorage.getItem('user');
        const deletingToken = sessionStorage.getItem('token');

        if (!deletingUser) return;

        const res = await api('deletesystem', { username: deletingUser, name: systemName, token: deletingToken });
        resetSystems();
    }

    const emptySystem = () => {
        const eEls = document.getElementById('systemsheet').querySelectorAll('input, textarea');
        for (let eEl of eEls) {
            eEl.value = '';
        }
    }

    document.getElementById('systemsheet').addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            updateSheet();
        }
    });

    document.getElementById('saveSystemButton').addEventListener('click', () => {
        saveSystem();
    });

    document.getElementById('emptySheetButton').addEventListener('click', () => {
        emptySystem();
    });

    document.getElementById('deleteSheetButton').addEventListener('click', () => {
        deleteSystem();
    });

    if (user && token) loadSystems(user, token);
} 