import { dynamicInputTable } from "../corteztools.js";
import { api } from "../bridge.js";

let systems = [];
let table;
const fontSizes = {
    h2: '24px'
};

const getI = (id) => {
    return document.getElementById(id).value;
};

const fitText = (els, isH = true, percent = 1) => {
    const container = document.getElementById('a5left');

    const max = isH
        ? container.clientHeight * percent - 30
        : container.clientWidth * percent - 30;

    const elements = els instanceof NodeList ? [...els] : [els];

    let baseSizes = elements.map (el =>
        parseFloat(getComputedStyle(el).fontSize)
    );

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
                ? el.scrollHeight > max
                : el.scrollWidth > max;

            if (overflow) fits = false;
        }

        if (!fits) scale *= step;
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

export async function loadSystems(user, token) {
    if (!user || !token) return;
    const res = await api('loadsystem', { token });
    systems = res;
    const sheetManageTitle = document.getElementById('sheetManageTitle');
    if (sheetManageTitle) sheetManageTitle.innerText = 'Omat systeemit';

    const sheetManageSystems = document.getElementById('sheetManageSystems');
    if (!sheetManageSystems) return;

    console.log(res);

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

const resetSystems = (user, token) => {
    unLoadSystems();
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

export function systemSheet(user, token) {
    const inputs = document.getElementById('systemSheetInputs');
    table = dynamicInputTable(3, 'bidsResponsesInputTable', ['Tarjous', 'Merkitys', 'Vastaukset']);
    const system = {
        grid: {},
        fields: {}
    };
    const systemMessage = document.getElementById('systemMessage');
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

        if (!user) {
            systemMessage.innerText = 'Kirjaudu sisään tallentaaksesi systeemin.'
            return;
        }

        if (!systemName) {
            systemMessage.innerText = 'Anna systeemin nimi.';
            return;
        }

        systemMessage.innerText = '';
        const res = await api('savesystem', { username: user, name: systemName, token, data: system });
        resetSystems(user, token);
    }

    document.getElementById('systemsheet').addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            updateSheet();
        }
    });

    document.getElementById('saveSystemButton').addEventListener('click', () => {
        saveSystem();
    });

    if (user && token) loadSystems(user, token);
} 