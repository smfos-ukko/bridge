import { showMessage } from "../bridge.js";

const movementData = {};
const pageHtml = {};
const pageSettings = {
    loaded: false,
    selectedPage: 1,
    sharedBoards: false
};
let movementTools;

const changePage = (dir) => {
    let pageChanged = false;
    if (dir == 'prev') {
        if (pageSettings.selectedPage > 1) pageSettings.selectedPage--;
        pageChanged = true;
    }    
    if (dir == 'next') {
        if (pageSettings.selectedPage < movementData.numberOfTables) pageSettings.selectedPage++;
        pageChanged = true;
    }  
    if (pageChanged) {
        document.getElementById('mvPaper').innerHTML = pageHtml[pageSettings.selectedPage];
        document.getElementById('selectedPageIndicator').innerHTML = '<span>' + pageSettings.selectedPage + '</span>';
        scaleTable();
    }
};

const updateTools = () => {
    movementTools = document.getElementById('mvTools');
    let toolHtml = `
        <h3>Sivu</h3>
        <div id="movPageSelector">
            <button id="movPrevButton">⯇</button> 
            <div id="selectedPageIndicator"><span>1</span></div>
            <button id="movNextButton">⯈</button> 
        </div>
    `;
    movementTools.innerHTML = toolHtml;
    document.getElementById('movPrevButton').addEventListener('click', () => {changePage('prev')});
    document.getElementById('movNextButton').addEventListener('click', () => {changePage('next')});
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
        if (movementData.tables[tbl][round][0] == player) return { table: tbl, direction: 'NS' };
        if (movementData.tables[tbl][round][1] == player) return { table: tbl, direction: 'EW' };
    }
};

const defineDeals = (dealSet) => {
    const lastDeal = movementData.dealsPerRound * dealSet;
    const firstDeal = lastDeal - movementData.dealsPerRound + 1;
    return `${firstDeal}-${lastDeal}`;
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
    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
        const transitionCounts = {
            NS: {},
            EW: {}
        };
        for (let rnd = 1; rnd < movementData.numberOfRounds; rnd++) {
            const transfer = movementData.transfers[tbl][rnd];
            const NSkey = `→ ${transfer[0]} ${transfer[1]}`;
            const EWkey = `→ ${transfer[2]} ${transfer[3]}`;
            transitionCounts.NS[NSkey] = (transitionCounts.NS[NSkey] || 0) + 1;
            transitionCounts.EW[EWkey] = (transitionCounts.EW[EWkey] || 0) + 1;
        }

        let maxKey = null;
        let maxCount = 0;
        for (const key in transitionCounts.NS) {
            if (transitionCounts.NS[key] > maxCount) {
                maxCount = transitionCounts.NS[key];
                maxKey = key;
            }
        }
        movementData.transfers[tbl].NSdefault = maxKey;
        movementData.transfers[tbl].NSdefaultArr = maxKey.split(' ');
        maxKey = null;
        maxCount = 0;
        for (const key in transitionCounts.EW) {
            if (transitionCounts.EW[key] > maxCount) {
                maxCount = transitionCounts.EW[key];
                maxKey = key;
            }
        }
        movementData.transfers[tbl].EWdefault = maxKey;
        movementData.transfers[tbl].EWdefaultArr = maxKey.split(' ');
        //console.log(transitionCounts, maxKey, maxCount, movementData);

        //paikallaan olevat
        let stayNS, stayEW;
        for (let t = 1; t <= movementData.numberOfTables; t++) {
            stayNS = [];
            stayEW = [];
            for (let r = 1; r <= movementData.numberOfRounds; r++) {
                const movN = movementData.tables[t][r][0];
                const movE = movementData.tables[t][r][1];
                if (!stayNS.includes(movN)) stayNS.push(movN);
                if (!stayEW.includes(movE)) stayEW.push(movE);
            }
            if (stayNS.length == 1) movementData.transfers[t].NSdefault = '';
            if (stayEW.length == 1) movementData.transfers[t].EWdefault = '';
        }
    }

    renderMovement();
    updateTools();
};

const scaleTable = () => {
    const mtMain = document.getElementsByClassName('mtMain')[0];
    const maxHeight = 390;
    const actualHeight = mtMain.scrollHeight;
    if (actualHeight > maxHeight) {
        const scale = maxHeight / actualHeight;
        mtMain.style.transform = `scale(${scale})`;
    }
};

const renderMovement = () => {
    const mvPaper = document.getElementById('mvPaper');
    let isOdd = true;

    for (let p = 1; p <= movementData.numberOfTables; p++) {
        //draw table
        let movementTable = '<div class="mtMain">';
        movementTable += `
            <div class="mtCell mth">Kierros</div>
            <div class="mtCell mth">N/S</div>
            <div class="mtCell mth">E/W</div>
            <div class="mtCell mth">Jaot</div>
        `;
        for (let r = 1; r <= movementData.numberOfRounds; r++) {
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableRound">` + r + '</div>';
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableNS">` + movementData.tables[p][r][0] + '</div>';
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableEW">` + movementData.tables[p][r][1] + '</div>';
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableDeals">` + defineDeals(movementData.tables[p][r][2]) + '</div>';
            isOdd ? isOdd = false : isOdd = true;
        }
        movementTable += '</div>';

        //draw paper
        let mov = `
            <div class="movTop movSegment">
                <div class="movTableNumber movNumWest"><h1>${p}</h1></div>
                <div class="movNS movDefaultTransfer movNorth"><h2>N</h2><span>${movementData.transfers[p].NSdefault}</span></div>
                <div class="movTableNumber movNumNorth"><h1>${p}</h1></div>
            </div>
            <div class="movMid movSegment">
                <div class="movEW movDefaultTransfer movWest"><h2>W</h2><span>${movementData.transfers[p].EWdefault}</span></div>
                <div class="movTransferTable">${movementTable}</div>
                <div class="movEW movDefaultTransfer movEast"><h2>E</h2><span>${movementData.transfers[p].EWdefault}</span></div>
            </div>
            <div class="movBot movSegment">
                <div class="movTableNumber movNumSouth"><h1>${p}</h1></div>
                <div class="movNS movDefaultTransfer movSouth"><h2>S</h2><span>${movementData.transfers[p].NSdefault}</span></div>
                <div class="movTableNumber movNumEast"><h1>${p}</h1></div>
            </div>
        `;
        pageHtml[p] = mov;
    }

    mvPaper.innerHTML = pageHtml[pageSettings.selectedPage];
    scaleTable();
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
                    //console.log(movementData);

                    for (let i = 2; i < lines.length; i++) {
                        //console.log('line: ',lines[i]);
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
                    pageSettings.loaded = true;
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