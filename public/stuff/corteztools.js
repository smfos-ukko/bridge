export const dynamicInputTable = (rows, id, headers = null) => {

    let numberOfRows = 0;
    
    const table = document.createElement('table');
    table.id = id;

    const updateTableRows = (e) => {
        console.log("ran");
        if (e.target.dataset.rowIndex == numberOfRows - 1) {
            addRow();
            return;
        }
        const lastRowInputs = table.querySelectorAll('tr:last-child input');
        const previousToLastRowInputs = table.querySelectorAll('tr:nth-last-child(2) input');
        if (!previousToLastRowInputs) return;
        for (let i of lastRowInputs) {
            if (i.value != '') return;
        }
        for (let i of previousToLastRowInputs) {
            if (i.value != '') return;
        }
        table.querySelector('tr:last-child').remove();
        numberOfRows--;
        updateTableRows(e);
    };

    table.addEventListener('input', (e) => {
        updateTableRows(e);
    });

    table.addEventListener('keydown', (e) => {
        const key = e.key;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

        const current = e.target;
        if (!current.matches('input')) return;

        const currentRow = parseInt(current.getAttribute('data-row-index'));
        const currentCol = parseInt(current.getAttribute('data-col-index'));
        let target;

        if (key == 'ArrowRight') {
            target = table.querySelector(
                '[data-row-index="' +
                    currentRow +
                    '"][data-col-index="' +
                    (currentCol + 1) +
                    '"]'
            );
        }
        if (key == 'ArrowLeft') {
            target = table.querySelector(
                '[data-row-index="' +
                    currentRow +
                    '"][data-col-index="' +
                    (currentCol - 1) +
                    '"]'
            );
        }
        if (key == 'ArrowUp') {
            target = table.querySelector(
                '[data-row-index="' +
                    (currentRow - 1) +
                    '"][data-col-index="' +
                    currentCol +
                    '"]'
            );
        }
        if (key == 'ArrowDown') {
            target = table.querySelector(
                '[data-row-index="' +
                    (currentRow + 1) +
                    '"][data-col-index="' +
                    currentCol +
                    '"]'
            );
        }
        if (target && !target.disabled) {
            target.focus();
            e.preventDefault();
        }
    });

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    if (headers) {
        const tr = document.createElement('tr');

        for (let i = 0; i < rows; i++) {
            const th = document.createElement('th');
            th.innerHTML = headers[i];
            tr.appendChild(th);
        }

        table.querySelector('tbody').appendChild(tr);
        numberOfRows++;
    }    

    const addRow = () => {
        const tr = document.createElement('tr');

        for (let i = 0; i < rows; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');

            input.type = 'text';
            input.dataset.rowIndex = numberOfRows;
            input.dataset.colIndex = i;
            input.classList.add('dynamic-input');

            td.appendChild(input);
            tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
        numberOfRows++;
    };

    const init = () => {
        addRow();
        return table;
    }
    
    return { init, addRow, table };

}