import { dynamicInputTable } from "../corteztools.js";

export function initSystemSheet() {
    const inputs = document.getElementById('systemSheetInputs');
    const table = dynamicInputTable(3, 'bidsResponsesInputTable', ['Tarjous', 'Merkitys', 'Vastaukset']);
    const system = {};
    const systemMessage = document.getElementById('systemMessage');

    document.getElementById('sheetBidInputs').appendChild(table.init());

    const updateSheet = () => {
        const inputFields = inputs.querySelectorAll('input, textarea');
        for (let i of inputFields) {
            const inputId = i.getAttribute('id');
            if (inputId) {
                system[inputId] = i.value;
                continue;
            }
            if (i.classList.contains('dynamic-input')) {
                const row = i.dataset.rowIndex;
                const col = i.dataset.colIndex;
                if (!system[row]) {
                    system[row] = {};
                }
                system[row][col] = i.value;
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

    const test = () => {
        console.log('work');
    }

    return { test };
} 