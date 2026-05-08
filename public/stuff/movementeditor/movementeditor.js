import { showMessage } from "../bridge.js";

const movementData = {};
const pageHtml = {};
const pageSettings = {
    selectedPage: 1
};

const decodeDeal = (letter) => {
    const code = letter.charCodeAt(0);

    if (code >= 65 && code <= 90) {
        return code - 64;
    }

    if (code >= 97 && code <= 122) {
        return code - 70;
    }

    return null;
};

const findSeat = (player, round) => {
    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
        console.log('table: ', tbl, ' player: ', player, ' round: ', round);
        if (movementData.tables[tbl][round][0] == player) return { table: tbl, direction: 'NS' };
        if (movementData.tables[tbl][round][1] == player) return { table: tbl, direction: 'EW' };
    }
};

const updateMovement = () => {
    //calculate transfer tables
    movementData.transfers = {};
    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
        movementData.transfers[tbl] = {};
        for (let rnd = 1; rnd < movementData.numberOfRounds; rnd++) {
            movementData.transfers[tbl][rnd] = [];
            const ns = findSeat(movementData.tables[tbl][rnd][0], rnd+1);
            const ew = findSeat(movementData.tables[tbl][rnd][1], rnd+1);
            movementData.transfers[tbl][rnd][0] = ns.table;
            movementData.transfers[tbl][rnd][1] = ns.direction;
            movementData.transfers[tbl][rnd][2] = ew.table;
            movementData.transfers[tbl][rnd][3] = ew.direction;
        }
    }
    
    //define default movement
    const transitionCounts = {};
    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
        transitionCounts[tbl] = {
            NS: {},
            EW: {}
        };
        for (let rnd = 1; rnd < movementData.numberOfRounds; rnd++) {
            const transfer = movementData.transfers[tbl][rnd];
            const NSkey = `${transfer[0]}-${transfer[1]}`;
            const EWkey = `${transfer[2]}-${transfer[3]}`;
            transitionCounts[tbl].NS[NSkey] = (transitionCounts[tbl].NS[NSkey] || 0) + 1;
            transitionCounts[tbl].EW[EWkey] = (transitionCounts[tbl].EW[EWkey] || 0) + 1;
        }
    }
    let maxKey = null;
    let maxCount = 0;
    for (const key in transitionCounts) {
        if (transitionCounts[key] > maxCount) {
            maxCount = transitionCounts[key];
            maxKey = key;
        }
    }
    console.log(transitionCounts, maxKey, maxCount);

    renderMovement();
};

const renderMovement = () => {
    const mvPaper = document.getElementById('mvPaper');

    for (let p = 1; p <= movementData.numberOfTables; p++) {
        let mov = `
            <div class="movTop">
                <div class="movTableNumber movNorth"><h1>${p}</h1></div>
                <div class="movNS movTransfer movNorth"><h2>N</h2><span></span></div>
            </div>
            <div class="movMid"></div>
            <div class="movBot"></div>
        `;
        pageHtml[p] = mov;
    }

    mvPaper.innerHTML = pageHtml[pageSettings.selectedPage];
};

export function movementEditor() {
    
    const openMovementFile = () => {
        const fileInput = document.createElement('input');

        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) return;

            if (file.type == '' || file.type == 'text/plain') {
                const reader = new FileReader();
                movementData.name = file.name;

                reader.onload = () => {
                    const lines = reader.result.split('\n').map(line => line.trim()).filter(Boolean);

                    movementData.movementType = lines[1].split(',')[0];
                    movementData.dealsPerRound = parseInt(lines[1].split(',')[1]);
                    const firstDataLine = lines[2].split(' ');
                    movementData.numberOfTables = firstDataLine.length - 1;

                    const regex = /^\d{2}(?:\s+\d{2}[A-Z]\d{2})+$/;
                    let lastIndex = -1;
                    lines.forEach((line, index) => {
                        if (regex.test(line.trim())) {
                            lastIndex = index;
                        }
                    });
                    movementData.numberOfRounds = parseInt(lines[lastIndex].split(' ')[0]);

                    movementData.tables = {};
                    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
                        movementData.tables[tbl] = {};
                        for (let rnd = 1; rnd <= movementData.numberOfRounds; rnd++) {
                            movementData.tables[tbl][rnd] = [];
                        }
                    }
                    console.log(movementData);

                    for (let i = 2; i < lines.length; i++) {
                        console.log('line: ',lines[i]);
                        if (!regex.test(lines[i].trim())) continue;
                        const blocks = lines[i].split(' ');
                        if (parseInt(blocks[0]) !== i - 1) {
                            showMessage('Jotakin meni vikaan, kierrokset eivät noudata oletettua kaavaa.', 'red');
                        }
                        for (let y = 1; y < blocks.length; y++) {
                            const match = blocks[y].match(/^(\d{2})([A-Za-z])(\d{2})$/);
                            movementData.tables[y][i-1][0] = parseInt(match[1]);
                            movementData.tables[y][i-1][1] = parseInt(match[3]);
                            movementData.tables[y][i-1][2] = decodeDeal(match[2]);
                        }
                    }

                    console.log(file, movementData, lines);
                    updateMovement();
                }

                reader.readAsText(file);
            } else {
                showMessage('Vääräntyyppinen tiedosto');
                return;
            }
        };

        fileInput.click();
    };

    document.getElementById('mvOpenFileButton').addEventListener('click', () => {
        openMovementFile();
    });

}