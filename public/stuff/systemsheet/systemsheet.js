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
    let max;
    if (!isH) max = document.getElementById('a5left').clientWidth * percent;
    if (isH) max = document.getElementById('a5left').clientHeight * percent;
    if (els instanceof NodeList) {
        let overFlow = true;
        while (overFlow) {
            overFlow = false;
            console.log(els);
            for (let el of els) {
                let fontSize = parseFloat(getComputedStyle(el).fontSize);
                                    console.log('scrollH ', el.scrollHeight, ' max ', max, ' fonts ', fontSize);

                if (isH ? el.scrollHeight : el.scrollWidth > max && fontSize > 10) {
                    overFlow = true;
                    console.log('overflow');
                }
                for (let elx of els) {
                    let fontS = parseFloat(getComputedStyle(elx).fontSize) - 1;
                    elx.style.fontSize = fontS + 'px'; 
                }
            }
        }
        return;
    }
    
    let fontSize = parseFloat(getComputedStyle(els).fontSize);
    while (isH ? els.scrollHeight : els.scrollWidth > max && fontSize > 10) {
        fontSize -= 1;
        els.style.fontSize = fontSize + 'px';
    }
};

const drawPrint = () => {
    const a5left = document.getElementById('a5left');
    const a5right = document.getElementById('a5right');
    
    document.querySelectorAll('.pdPlayer h2').forEach((f) => { f.fontSize = fontSizes.h2 });

    let pd = `
        <div class="pdHeader">
            <div class="pdPlayer">
                <h2 class="pdHeaderText">${getI('sheetp1')}</h2>
                <h2 class="pdHeaderText">${getI('sheetMateNumberp1')}</h2>
            </div>
            <div>
                <h1 class="pdHeaderText">${getI('sheetBaseSystem')}</h1>
            </div>
            <div class="pdPlayer">
                <h2 class="pdHeaderText">${getI('sheetp2')}</h2>
                <h2 class="pdHeaderText">${getI('sheetMateNumberp2')}</h2>
            </div>
        </div>
    `;

    a5left.innerHTML = pd;
    a5right.innerHTML = pd;

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
            console.log(sys);
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