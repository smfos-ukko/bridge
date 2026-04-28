export function initBidWriter() {
    const bwDealerButtons = document.getElementsByClassName('bwdealer');
    const bwVulButtons = document.getElementsByClassName('bwvul');
    let bwDealer = 'N';
    let bwVul = 'Ei kukaan';

    for (let bwdb of bwDealerButtons) {
        bwdb.onclick = () => {
            for (let b2 of bwDealerButtons) {
                b2.classList.remove('lit');
            }
            bwdb.classList.add('lit');
            bwDealer = bwdb.innerHTML;
            bwWriting();
        };
    }

    for (let bwvb of bwVulButtons) {
        bwvb.onclick = () => {
            for (let b2 of bwVulButtons) {
                b2.classList.remove('lit');
            }
            bwvb.classList.add('lit');
            bwVul = bwvb.innerHTML;
            const bwPanel = document.getElementsByClassName('bwPanel');
            for (let bwp of bwPanel) {
                bwp.classList.remove('nonvul');
                bwp.classList.remove('vul');
            }
            switch (bwVul) {
                case 'Ei kukaan':
                    bwPanel[0].classList.add('nonvul');
                    bwPanel[1].classList.add('nonvul');
                    bwPanel[2].classList.add('nonvul');
                    bwPanel[3].classList.add('nonvul');
                    break;
                case 'Kaikki':
                    bwPanel[0].classList.add('vul');
                    bwPanel[1].classList.add('vul');
                    bwPanel[2].classList.add('vul');
                    bwPanel[3].classList.add('vul');
                    break;
                case 'NS':
                    bwPanel[0].classList.add('vul');
                    bwPanel[1].classList.add('nonvul');
                    bwPanel[2].classList.add('vul');
                    bwPanel[3].classList.add('nonvul');
                    break;
                case 'EW':
                    bwPanel[0].classList.add('nonvul');
                    bwPanel[1].classList.add('vul');
                    bwPanel[2].classList.add('nonvul');
                    bwPanel[3].classList.add('vul');
                    break;
            }
        };
    }

    let bwNumberOfRows = 0;
    const bwTable = document.getElementById('bwtable');
    const bwBoard = document.getElementById('bwboard');
    let bwInputs;

    const bwAddRow = () => {
        const bwNewRow = document.createElement('tr');
        bwNewRow.innerHTML += `
            <td><input type="text" data-row-index="${bwNumberOfRows}" data-col-index="0"></td>
            <td><input type="text" data-row-index="${bwNumberOfRows}" data-col-index="1"></td>
            <td><input type="text" data-row-index="${bwNumberOfRows}" data-col-index="2"></td>
            <td><input type="text" data-row-index="${bwNumberOfRows}" data-col-index="3"></td>
        `;
        bwTable.appendChild(bwNewRow);
        bwNumberOfRows++;
    };
    bwAddRow();
    bwAddRow();


    const bwRemoveRow = () => {
        bwTable.querySelector('tr:last-child').remove();
    };

    const bwWriting = () => {
        applyDirection();
        //add / remove rows
        const bwLastRow = bwTable.querySelector('tr:last-child');
        const bwPrevRow = bwTable.querySelector('tr:nth-last-child(2)');
        let bwLastRowInputs = bwLastRow.querySelectorAll('input');
        let prevRowHasContent = false;
        if (bwPrevRow) {
            let bwPrevRowInputs = bwPrevRow.querySelectorAll('input');
            prevRowHasContent = Array.from(bwPrevRowInputs).some(
                (input) => input.value.trim() !== ''
            );
        }
        const lastRowHasContent = Array.from(bwLastRowInputs).some(
            (input) => input.value.trim() !== ''
        );
        bwNumberOfRows = bwTable.querySelectorAll('tr').length - 1;
        if (lastRowHasContent) {
            bwAddRow();
        }
        if (
            bwNumberOfRows > 2 &&
            lastRowHasContent == false &&
            prevRowHasContent == false
        ) {
            bwRemoveRow();
            bwWriting();
        }
        const bwAllInputCells = document.querySelectorAll('#bwtable input');

        //update board
        let bwInjections = '';
        let bwPassCounter = 0;
        const bwCheckEnd = (bwCounter) => {
            if (bwCounter % 4 == 3) bwInjections += '</tr>';
        };
        for (let [bwCounter, bwBoardCell] of bwAllInputCells.entries()) {
            //begin row
            if (bwCounter % 4 == 0) {
                bwInjections += '<tr>';
            }
            //handle dealer
            if (bwBoardCell.hasAttribute('disabled')) {
                bwInjections += '<td></td>';
                continue;
            }
            //handle cell
            if (bwPassCounter > 2) {
                bwInjections += '<td></td>';
                bwCheckEnd(bwCounter);
                continue;
            }
            if (bwBoardCell.value == '') {
                bwInjections += '<td><span class="pass">pass</span></td>';
                bwPassCounter++;
            } else {
                bwInjections += '<td>' + formatBid(bwBoardCell.value) + '</td>';
                bwPassCounter = 0;
            }
            bwCheckEnd(bwCounter);
        }
        bwBoard.innerHTML = bwInjections;
    };

    const applyDirection = () => {
        const bwDirCells = bwTable
            .querySelector('tr:nth-child(2)')
            .querySelectorAll('td');
        for (let bwa of bwDirCells) {
            bwa.firstChild.removeAttribute('disabled');
        }
        if (bwDealer == 'N') return;
        bwDirCells[0].firstChild.value = '';
        bwDirCells[0].firstChild.setAttribute('disabled', 'disabled');
        if (bwDealer == 'E') return;
        bwDirCells[1].firstChild.value = '';
        bwDirCells[1].firstChild.setAttribute('disabled', 'disabled');
        if (bwDealer == 'S') return;
        bwDirCells[2].firstChild.value = '';
        bwDirCells[2].firstChild.setAttribute('disabled', 'disabled');
    };

    bwTable.addEventListener('input', () => {
        bwWriting();
    });

    bwTable.addEventListener('keydown', (e) => {
        const key = e.key;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key))
            return;
        const current = e.target;
        if (!current.matches('input')) return;
        const currentRow = parseInt(current.getAttribute('data-row-index'));
        const currentCol = parseInt(current.getAttribute('data-col-index'));
        let target;
        if (key == 'ArrowRight') {
            target = bwTable.querySelector(
                '[data-row-index="' +
                    currentRow +
                    '"][data-col-index="' +
                    (currentCol + 1) +
                    '"]'
            );
        }
        if (key == 'ArrowLeft') {
            target = bwTable.querySelector(
                '[data-row-index="' +
                    currentRow +
                    '"][data-col-index="' +
                    (currentCol - 1) +
                    '"]'
            );
        }
        if (key == 'ArrowUp') {
            target = bwTable.querySelector(
                '[data-row-index="' +
                    (currentRow - 1) +
                    '"][data-col-index="' +
                    currentCol +
                    '"]'
            );
        }
        if (key == 'ArrowDown') {
            target = bwTable.querySelector(
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

    bwTable.addEventListener(
        'focus',
        (e) => {
            if (e.target.matches('input')) {
                e.target.select();
            }
        },
        true
    );

    bwWriting();

    document.getElementById('bwSnap').addEventListener('click', () => {
        const bwClipTable = document.getElementById('bwtableback');

        html2canvas(bwClipTable).then((canvas) => {
            const link = document.createElement('a');
            link.download = 'table.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    });

    document.getElementById('bwReset').addEventListener('click', () => {
        const bwAllResetInputs = bwTable.querySelectorAll('input');
        for (let bwr of bwAllResetInputs) {
            bwr.value = '';
            bwWriting();
        }
    });

}