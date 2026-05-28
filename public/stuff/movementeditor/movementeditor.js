import { showMessage } from "../bridge.js";

const movementData = {};
const pageSettings = {
    loaded: false,
    selectedPage: 1,
    sharedBoards: false,
    info: null
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
    if (dir == 'this') pageChanged = true; 
    if (pageChanged) {
        const pgs = document.getElementsByClassName('mvPaper');
        for (let pg of pgs) {
            pg.style.display = 'none';
            if (pg.getAttribute('data-index') == pageSettings.selectedPage) pg.style.display = 'flex';
        }
        const indicator = document.getElementById('selectedPageIndicator');
        if (indicator) {
            indicator.innerHTML = `<span>${pageSettings.selectedPage}</span>`;
        }
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
        <div class="toolSection">
            <h3>Lisätiedot</h3>
            <input type="text" id="movInfoInput">
            <button id="updateInfoButton">Syötä</button>
        </div>
        <div class="toolSection">
            <button id="updateScaleButton">Päivitä skaalaus</button>
        </div>
    `;
    movementTools.innerHTML = toolHtml;
    document.getElementById('movPrevButton').addEventListener('click', () => {changePage('prev')});
    document.getElementById('movNextButton').addEventListener('click', () => {changePage('next')});
    document.getElementById('updateInfoButton').addEventListener('click', () => {
        pageSettings.info = document.getElementById('movInfoInput').value;
        renderMovement();
    });
    document.getElementById('updateScaleButton').addEventListener('click', () => {scaleTable()});
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
    const lastDeal = movementData.dealsPerRound * dealSet[2];
    const firstDeal = lastDeal - movementData.dealsPerRound + 1;
    if (movementData.dealsPerRound == 1) {
        return firstDeal;
    } else {
        return `${firstDeal}-${lastDeal}${dealSet[3] ? '*' : ''}`;
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
    
    //define default movement & exceptions
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
    }

    //define shared deals
    for (let tbl = 1; tbl <= movementData.numberOfTables; tbl++) {
        for (let rnd = 1; rnd <= movementData.numberOfRounds; rnd++) {
            for (let ot = 1; ot <= movementData.numberOfTables; ot++) { 
                if (tbl == ot) continue;
                if (movementData.tables[ot][rnd][2] == movementData.tables[tbl][rnd][2]) {
                    if (!movementData.tables[tbl][rnd][3]) movementData.tables[tbl][rnd][3] = [];
                    movementData.tables[tbl][rnd][3].push(ot);
                    pageSettings.info = '* samat jaot toisen pöydän kanssa';
                }
            }
        }
    }

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

    //poikkeukset
    for (let t = 1; t <= movementData.numberOfTables; t++) {
        const nsex = [];
        const ewex = [];
        for (let r = 1; r < movementData.numberOfRounds; r++) {
            const nstt = Number(movementData.transfers[t][r][0]);
            const nsdt = Number(movementData.transfers[t].NSdefaultArr[1]);
            const nstd = movementData.transfers[t][r][1];
            const nsdd = movementData.transfers[t].NSdefaultArr[2];
            const ewtt = Number(movementData.transfers[t][r][2]);
            const ewdt = Number(movementData.transfers[t].EWdefaultArr[1]);
            const ewtd = movementData.transfers[t][r][3];
            const ewdd = movementData.transfers[t].EWdefaultArr[2];
            if (nstt == nsdt && nstd == nsdd) {} else {
                nsex.push([r, nstt, nstd, `<span class="movExSpan">→${nstt} ${nstd}</span>`]);
            }
            if (ewtt == ewdt && ewtd == ewdd) {} else {
                ewex.push([r, ewtt, ewtd, `<span class="movExSpan">→${ewtt} ${ewtd}</span>`]);
            }
        }
        movementData.transfers[t].NSexceptions = nsex;
        movementData.transfers[t].EWexceptions = ewex;
    }
    console.log('cp', movementData);

    renderMovement();
    updateTools();
    scaleTable();
};

const printScaleTable = () => {
    /*
    const targetHeight = 350;
    const numberOfTableRows = movementData.numberOfRounds + 1;
    const tableHeight = document.getElementsByClassName('mtMain')[0].scrollHeight;
    if (!tableHeight) return;
    if (tableHeight > targetHeight) {
        const scale = targetHeight / tableHeight;
        document.documentElement.style.setProperty('--print-scale', scale);
        console.log('scaled', scale);
    } else {
        document.documentElement.style.setProperty('--print-scale', 1);
    }
        */
};
window.addEventListener('beforeprint', printScaleTable)

const scaleTable = () => {
    const mtMain = document.getElementsByClassName('mtMain')[0];
    const maxHeight = 700;
    let iterationCounter = 0;
    let fontSize = 7.1;
    document.documentElement.style.setProperty('--dynamic-size', `${fontSize}mm`);
    document.documentElement.style.setProperty('--dynamic-ex', `${fontSize < 4.1 ? fontSize : fontSize - 2}mm`);
    let overflow = true;
    while (overflow && iterationCounter < 100) {
        console.log('mtm scrollH, counter, fontsize', mtMain.scrollHeight, iterationCounter, fontSize);
        if (mtMain.scrollHeight <= maxHeight) overflow = false;
        fontSize -= 0.1;
        document.documentElement.style.setProperty('--dynamic-size', `${fontSize}mm`);
        document.documentElement.style.setProperty('--dynamic-ex', `${fontSize < 4.1 ? fontSize : fontSize - 2}mm`);
        iterationCounter++;
    }
};

const determineMovement = (t, r, dir) => {
    const standard = movementData.tables[t][r][dir];
    if (dir == 0) {
        if (movementData.transfers[t].NSexceptions.length == 0) return standard;
        for (let i = 0; i < movementData.transfers[t].NSexceptions.length; i++) {
            if (movementData.transfers[t].NSexceptions[i][0] == r) {
                let ret = '<span class="yellowize">';
                ret += movementData.tables[t][r][dir];
                ret += movementData.transfers[t].NSexceptions[i][3];
                ret += '</span>'
                return ret;
            }
        }
    } else if (dir == 1) {
        if (movementData.transfers[t].EWexceptions.length == 0) return standard;
        for (let i = 0; i < movementData.transfers[t].EWexceptions.length; i++) {
            if (movementData.transfers[t].EWexceptions[i][0] == r) {
                let ret = '<span class="yellowize">';
                ret += movementData.tables[t][r][dir];
                ret += movementData.transfers[t].EWexceptions[i][3];
                ret += '</span>'
                return ret;
            }
        }
    }
    return standard;
};

const renderMovement = () => {
    const mvView = document.getElementById('mvView');
    let isOdd = true;
    let mov = '';

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
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableNS">` + determineMovement(p, r, 0) + '</div>';
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableEW">` + determineMovement(p, r, 1) + '</div>';
            movementTable += `<div class="mtCell ${isOdd ? 'mtOdd' : 'mtEven'} movTableDeals">` + defineDeals(movementData.tables[p][r]) + '</div>';
            isOdd ? isOdd = false : isOdd = true;
        }
        movementTable += '<div class="mtInfo"></div>';
        movementTable += '</div>';

        //draw paper
        mov += `
            <div class="mvPaper" data-index="${p}">
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
            </div>
        `;
        isOdd = true;
    }

    mvView.innerHTML = mov;
    let yellows = document.getElementsByClassName('yellowize');
    for (let y of yellows) {
        y.parentNode.style.backgroundColor = '#fffb00';
    }
    const infoCell = document.getElementsByClassName('mtInfo');
    for (let iCell of infoCell) {
        iCell.textContent = pageSettings.info;
    }
    console.log(pageSettings);
    if (!pageSettings.info) {
        document.documentElement.style.setProperty('--info-padding', '0px');
    }
    else {
        document.documentElement.style.setProperty('--info-padding', '5px');
    }
    changePage('this');
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
                    pageSettings.info = null;
                    pageSettings.selectedPage = 1;
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