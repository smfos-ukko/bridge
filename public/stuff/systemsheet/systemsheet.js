import { dynamicInputTable } from "../corteztools.js";

export function initSystemSheet() {
    const inputs = document.getElementById('sheetBidInputs');
    const table = dynamicInputTable(3, 'bidsResponsesInputTable', ['Tarjous', 'Merkitys', 'Vastaukset']);
    inputs.appendChild(table.init());

    const updateSheet = () => {
        console.log('s');
    };

    document.getElementById('systemsheet').addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            updateSheet();
        }
    });
} 