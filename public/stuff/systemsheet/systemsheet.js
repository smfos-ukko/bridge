import { dynamicInputTable } from "../corteztools.js";
import { api } from "../bridge.js";

let systems = [];
let table;

const plantSystem = (s) => {
    const inputs = document.getElementById('systemSheetInputs');

    const sys = systems[s].data;

    document.getElementById('systemName').value = systems[s].name;

    const brit = document.getElementById('bidsResponsesInputTable');
    console.log("LEN ", sys.grid);
    while (brit.querySelector('tbody').rows.length < Object.keys(sys.grid).length + 1) table.addRow();
    const inputFields = inputs.querySelectorAll('input, textarea');

    for (let i of inputFields) {
        const inputId = i.getAttribute('id');
        console.log(inputId);
    
        if (inputId) {
            console.log(sys);
            i.value = sys.fields?.[inputId] ?? '';
            continue;
        }

        if (i.classList.contains('dynamic-input')) {
            const row = Number(i.dataset.rowIndex);
            const col = Number(i.dataset.colIndex);
console.log("ROWS ", brit.querySelector('tbody').rows.length);

            i.value = sys.grid?.[row]?.[col] ?? '';
        }
        console.log(systems[s]);
    }
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
            console.log(system, i, i.dataset.rowIndex);
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
        console.log(res);
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