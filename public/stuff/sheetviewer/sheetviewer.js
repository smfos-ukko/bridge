import { showMessage } from "../bridge.js";

const svData = {
    pairs: {},
    deals: {}
};
const svSettings = {
    selectedDeal: 1,
    selectedPair: null
};

const trimLine = (trln) => {
    if (!trln) return null;
    return trln.split(' ').filter(Boolean);
};

const switchDeal = (ind) => {
    if (ind == 'prev') {
        if (svSettings.selectedDeal < 2) return;
        ind = svSettings.selectedDeal - 1;
    }
    if (ind == 'next') {
        if (svSettings.selectedDeal > Object.keys(svData.deals).length - 1) return;
        ind = svSettings.selectedDeal + 1;
    }
    svSettings.selectedDeal = ind;
    const dls = document.querySelectorAll('.svDealCard');
    for (let crd of dls) {
        if (crd.getAttribute('data-index') != ind) {
            crd.style.display = 'none';
        } else {
            crd.style.display = 'flex';
        }
    }
};

const renderDeal = (dealIn) => {
    return `
        <div class="svDealOuter">
            <span class="spade">♠ </span><span>${dealIn[0]}</span><br/>
            <span class="heart">♥ </span><span>${dealIn[1]}</span><br/>
            <span class="diamond">♦ </span><span>${dealIn[2]}</span><br/>
            <span class="club">♣ </span><span>${dealIn[3]}</span>
        </div>
    `;
};

const renderPoints = (dealIn) => {
    const countPoints = (hc) => {
        const values = { A: 4, K: 3, Q: 2, J: 1 };
        let points = 0;
        for (let suit = 0; suit < hc.length; suit++) {
            for (let card = 0; card < hc[suit].length; card++) {
                const rank = String(hc[suit][card]).toUpperCase();
                if (values[rank]) {
                    points += values[rank];
                }
            }
        }
        return points;
    }
    
    const nPoints = countPoints(svData.deals[dealIn].hands.n);
    const ePoints = countPoints(svData.deals[dealIn].hands.e);
    const sPoints = countPoints(svData.deals[dealIn].hands.s);
    const wPoints = countPoints(svData.deals[dealIn].hands.w);

    return `
        <div class="svDealPointsOuter svCardOuter">
            <div class="svDealPointsInner svGrid svCardInner">
                <div></div><div class="svDealPointsDisplay">${nPoints}</div><div></div>
                <div class="svDealPointsDisplay">${wPoints}</div><div></div><div class="svDealPointsDisplay">${ePoints}</div>
                <div></div><div class="svDealPointsDisplay">${sPoints}</div><div></div>
            </div>
        </div>
    `;
}

const renderTricks = (dealIn) => {
    let divs = '';
    for (let dirs = 0; dirs < svData.deals[dealIn].tricks.length; dirs++) {
        for (let r = 0; r < svData.deals[dealIn].tricks[dirs].length; r++) {
            divs += `<div>${svData.deals[dealIn].tricks[dirs][r]}</div>`;
        }
    }
    return `
        <div class="svDealTricksOuter svCardOuter">
            <div class="svDealTricksInner svTrickGrid svCardInner">
                <div></div>
                <div class="svTrickSymbol"><span class="club">♣</span></div>
                <div class="svTrickSymbol"><span class="diamond">♦</span></div>
                <div class="svTrickSymbol"><span class="heart">♥</span></div>
                <div class="svTrickSymbol"><span class="spade">♠</span></div>
                <div class="svTrickSymbol"><span>NT</span></div>
                ${divs}
            </div>
        </div>
    `;
};

const renderCenter = (dealIn) => {
    return `
        <div class="svDealCenterOuter svCardOuter">
            <div class="svDealCenterInner svGrid svCardInner">
                <div></div>
                <div class="
                        ${['Kaikki', 'N-S', 'All', 'P-E'].includes(svData.deals[dealIn].vul) ? 'svVul' : 'svNonVul'}
                    ">${['Pohjoinen', 'North'].includes(svData.deals[dealIn].dealer) ? 'D' : ''}</div>
                <div></div>
                <div class="
                        ${['Kaikki', 'E-W', 'All', 'I-L'].includes(svData.deals[dealIn].vul) ? 'svVul' : 'svNonVul'}
                    ">${['Länsi', 'West'].includes(svData.deals[dealIn].dealer) ? 'D' : ''}</div>
                <div class="svDealCenterDealNumber">${dealIn}</div>
                <div class="
                        ${['Kaikki', 'E-W', 'All', 'I-L'].includes(svData.deals[dealIn].vul) ? 'svVul' : 'svNonVul'}
                    ">${['Itä', 'East'].includes(svData.deals[dealIn].dealer) ? 'D' : ''}</div>
                <div></div>
                <div class="
                        ${['Kaikki', 'N-S', 'All', 'P-E'].includes(svData.deals[dealIn].vul) ? 'svVul' : 'svNonVul'}
                    ">${['Etelä', 'South'].includes(svData.deals[dealIn].dealer) ? 'D' : ''}</div>
                <div></div>
            </div>
        </div>
    `;
};

const renderResults = (dealIn) => {
    let brd = '';

    if (svSettings.selectedPair) {
        let r = null;
        for (let f = 0; f < svData.deals[dealIn].results.length; f++) {
            if (svData.deals[dealIn].results[f][0] == svSettings.selectedPair) r = f;
            if (svData.deals[dealIn].results[f][1] == svSettings.selectedPair) r = f;
        }
        if (r !== null) {
            for (let s = 0; s < svData.deals[dealIn].results[r].length; s++) {
                if (s < 2) {
                    const plNum = svData.deals[dealIn].results[r][s];
                    brd += `<div data-index="${svData.deals[dealIn].results[r][s]}" class="svPlayerPair svHighLight ${svData.deals[dealIn].results[r][s] == svSettings.selectedPair ? 'svSelectedPair' : ''} svDealResultsBoardCell${r % 2 == 0 ? ' svEven' : ' svOdd'}">${svData.pairs[plNum]}</div>`;
                    continue;
                }
                brd += `<div class="svHighLight svDealResultsBoardCell${r % 2 == 0 ? ' svEven' : ' svOdd'}">${svData.deals[dealIn].results[r][s]}</div>`;
            }
        }
    }

    for (let r = 0; r < svData.deals[dealIn].results.length; r++) {
        for (let s = 0; s < svData.deals[dealIn].results[r].length; s++) {
            if (s < 2) {
                const plNum = svData.deals[dealIn].results[r][s];
                brd += `<div data-index="${svData.deals[dealIn].results[r][s]}" class="svPlayerPair ${svData.deals[dealIn].results[r][s] == svSettings.selectedPair ? 'svSelectedPair' : ''} svDealResultsBoardCell${r % 2 == 0 ? ' svEven' : ' svOdd'}">${svData.pairs[plNum]}</div>`;
                continue;
            }
            brd += `<div class="svDealResultsBoardCell${r % 2 == 0 ? ' svEven' : ' svOdd'}">${svData.deals[dealIn].results[r][s]}</div>`;
        }
    }

    return `
        <div class="svDealResultsBoard">
            <div class="svDealResultsBoardTitle"><span>NS</span></div>
            <div class="svDealResultsBoardTitle"><span>EW</span></div>
            <div class="svDealResultsBoardTitle"><span>Sitoumus</span></div>
            <div class="svDealResultsBoardTitle"></div>
            <div class="svDealResultsBoardTitle"></div>
            <div class="svDealResultsBoardTitle"><span>Lähtö</span></div>
            <div class="svDealResultsBoardTitle"><span>Tulos</span></div>
            <div class="svDealResultsBoardTitle"><span>Pisteet</span></div>
            <div class="svDealResultsBoardTitle svInjectAfter"></div>
            ${brd}
        </div>
    `;
};

const renderBoards = () => {
    const svMain = document.getElementById('svMain');

    //menyy
    let buttonsHtml = '';
    for (let i = 1; i <= Object.keys(svData.deals).length; i++) {
        buttonsHtml += `<button class="svDealButton" data-index="${i}">${i}</button>`
    }

    //deal
    let dealHtml = '';
    for (let i = 1; i <= Object.keys(svData.deals).length; i++) {
        dealHtml += `
            <div class="svDealCard" data-index="${i}">
                <div class="svGrid svDealBoardTop">
                    <div class="svDealInfoCard svCard">
                        <span>Jakaja:</span><br/>
                        <span class="indent">${svData.deals[i].dealer}</span><br/>
                        <span>Vaarassa:</span><br/>
                        <span class="indent">${svData.deals[i].vul == 'Ei' ? 'Ei kukaan' : svData.deals[i].vul}</span>
                    </div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.n)}</div>
                    <div class="svDealOptimumCard svCard">${svData.deals[i].optimum}</div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.w)}</div>
                    <div class="svDealCenter">${renderCenter(i)}</div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.e)}</div>
                    <div class="svDealPoints">${renderPoints(i)}</div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.s)}</div>
                    <div class="svDealTricks">${renderTricks(i)}</div>
                </div>
                <div class="svDealResultsContainer">${renderResults(i)}</div>
            </div>
        `;
    }

    //final
    let html = `
        <div id="svDealsMenu">
            ${buttonsHtml}
        </div>
        <div id="svDealView">
            ${dealHtml}
        </div>
    `;
    svMain.innerHTML = html;

    for (let btn of svMain.querySelectorAll('.svDealButton')) {
        btn.addEventListener('click', () => { switchDeal(btn.getAttribute('data-index')) });
    }

    for (let pair of svMain.querySelectorAll('.svPlayerPair')) {
        pair.addEventListener('click', () => {
            if (pair.classList.contains('svSelectedPair')) {
                svSettings.selectedPair = null;
            } else {
                svSettings.selectedPair = pair.getAttribute('data-index');
            }
            setTimeout(() => {
                renderBoards();   
            }, 50);
        });
    }

    svMain.querySelector('.svDealCard').style.display = 'flex';
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') switchDeal('next');
        if (e.key === 'ArrowLeft') switchDeal('prev');
    });
    const shareButton = document.getElementById('svShareButton');
    shareButton.style.display = 'block';
    shareButton.addEventListener('click', () => {
        const currentPage = window.location.href;
        const currentLink = document.getElementById('svInput').value;
        let writeLink = window.location.href;
        writeLink = writeLink.split('?')[0];
        writeLink += '?page=';
        writeLink += currentLink;
        if (svSettings.selectedPair) {
            writeLink += '&pair=';
            writeLink += svSettings.selectedPair;
        }
        try {
            navigator.clipboard.writeText(writeLink);
            showMessage('Linkki kopioitu');
        } catch(ex) {
            console.log(ex);
        }
    });
    console.log(svData);
};

const svReset = () => {
    document.getElementById('svMain').innerHTML = '';
    svData.pairs = {};
    svData.deals = {};
    svSettings.selectedDeal = 1;
}

const handleBuffer = (dl, bf) => {
    const type = bf[0];
    const header = bf[1];
    let headerData = [''];
    let trueData = true;
    let counter = 0;
    for (let c = 0; c < header.length; c++) {
        if (header[c] == '\\') {
            trueData = false;
            continue;
        }
        if (header[c] == ';') {
            trueData = true;
            counter++;
            continue;
        }
        if (trueData) {
            if (!headerData[counter]) headerData[counter] = '';
            headerData[counter] += header[c];
        }
    }
    console.log('header: ', headerData, ' bf: ', bf);

    const tokenize = (row) => {
        return row.match(/"[^"]*"|\S+/g).map(x => x.replace(/^"|"$/g, ''));
    };
    
    const dat = [];
    for (let i = 2; i < bf.length; i++) {
        dat.push(tokenize(bf[i]));
    }
    console.log('token: ', dat);
    
    switch (type) {
        case 'TotalScoreTable':
            let i1 = headerData.indexOf('PairId');
            let i2 = headerData.indexOf('Names');
            for (let i = 0; i < dat.length; i++) {
                svData.pairs[dat[i][i1]] = dat[i][i2];
            }
            break;
        case 'ScoreTable':
            // 0table 1round 2pairid_ns 3pairid_ew 4contract 5declarer 6result 7lead 8score_ns 9score_ew
            // 10MP_NS 11MP_EW 11percentagens 12 percentageew
            svData.deals[dl].results = [];
            for (let r = 0; r < dat.length; r++) {
                svData.deals[dl].results[r] = [];
                svData.deals[dl].results[r].push(dat[r][2]);
                svData.deals[dl].results[r].push(dat[r][3]);
                svData.deals[dl].results[r].push(dat[r][4]);
                svData.deals[dl].results[r].push(dat[r][5]);
                svData.deals[dl].results[r].push(dat[r][6]);
                svData.deals[dl].results[r].push(dat[r][7]);

                if (dat[r][8] != '-') svData.deals[dl].results[r].push(dat[r][8]); 
                else svData.deals[dl].results[r].push('-' + dat[r][9]);

                svData.deals[dl].results[r].push(dat[r][11]);
                svData.deals[dl].results[r].push(dat[r][12]);
            }
            break;
        default:
            break;
    }
    
    console.log('checkpoint: ', svData);
    
    bf.splice(0, bf.length);
};

export async function sheetViewer() {
    document.getElementById('svFetchButton').addEventListener('click', async () => {
        svReset();
        try {
            const url = document.getElementById('svInput').value;
            const res = await fetch('/bridge/public/stuff/proxy.php?url=' + url);
            const parser = new DOMParser();
            const buffer = await res.arrayBuffer();
            const decoder = new TextDecoder("iso-8859-1");
            const decoded = decoder.decode(buffer);
            const doc = parser.parseFromString(decoded, "text/html");
            const wholeText = doc.querySelector('pre').innerText;
            const dealsText = doc.querySelector('[name="scoretables"]').innerText;

            if (!wholeText) {
                showMessage('Sivua ei voitu ladata.');
                return;
            }

            //pelaajat
            let playersHasBegun = false;
            for (const line of wholeText.split('\n')) {
                if (line == '') continue;
                if (line.includes('----------')) break;
                if (line.includes('-ID')) {
                    playersHasBegun = true;
                    continue;
                }
                if (playersHasBegun) {
                    const ln = line.split(' ').filter(Boolean).filter(item => item !== '*');
                    svData.pairs[ln[1]] = ln[5] + ' / ' + ln[8];
                }
            }

            //Jaot
            const dtxt = dealsText.split('\n');
            const chunks = [];
            //prujun leveys
            const wtmp = dtxt[4].split(' ').filter(Boolean);
            const wdt = dtxt[4].indexOf(wtmp[2]);
            //pilkkoma
            let chunk1 = [];
            let chunk2 = [];
            for (const line of dtxt) {
                if (line == '') continue;
                if (line.includes('-----')) {
                    chunks.push(chunk1);
                    chunks.push(chunk2);
                    chunk1 = [];
                    chunk2 = [];
                }
                chunk1.push(line.slice(0, wdt));
                chunk2.push(line.slice(wdt));
            }
            chunks.push(chunk1);
            chunks.push(chunk2);
            //asiaan
            for (let ch of chunks) {
                const skippable = ch.every(cell =>
                    /^[\s-]*$/.test(cell)
                );
                if (skippable) continue;

                const dealNo = trimLine(ch[1])[0];
                if (!svData.deals[dealNo]) {
                    svData.deals[dealNo] = {
                        dealer: trimLine(ch[2])[0],
                        vul: trimLine(ch[3])[0],
                        hands: {
                            n: [
                                trimLine(ch[1]).pop(),
                                trimLine(ch[2]).pop(),
                                trimLine(ch[3]).pop(),
                                trimLine(ch[4]).pop()
                            ],
                            e: [
                                trimLine(ch[5]).pop(),
                                trimLine(ch[6]).pop(),
                                trimLine(ch[7]).pop(),
                                trimLine(ch[8]).pop()
                            ],
                            s: [
                                trimLine(ch[9]).pop(),
                                trimLine(ch[10]).pop(),
                                trimLine(ch[11]).pop(),
                                trimLine(ch[12]).pop()
                            ],
                            w: [
                                trimLine(ch[5])[0],
                                trimLine(ch[6])[0],
                                trimLine(ch[7])[0],
                                trimLine(ch[8])[0]
                            ]
                        },
                        optimum: ch[13].trim(),
                        tricks: [],
                        results: []
                    };
                }

                const allowedDirs = ['N', 'S', 'E', 'W', 'NS', 'EW', 'P', 'I', 'L', 'PE', 'IL'];
                for (let o = 15; o <= 19; o++) {
                    const opt = trimLine(ch[o]);
                    if (!opt) break;
                    if (!allowedDirs.includes(opt[0])) break;
                    svData.deals[dealNo].tricks.push(opt);
                }

                for (let l = 16; l < ch.length; l++) {
                    const chLine = trimLine(ch[l]);
                    if (!chLine) continue;
                    if (chLine.length < 9) {
                        if (chLine[2] == 'Pass') {
                            svData.deals[dealNo].results.push([chLine[0], chLine[1], 'Pass', '', '', '', '', chLine[4], chLine[5]]);
                        }
                        continue;
                    }
                    svData.deals[dealNo].results.push(chLine);
                }
            }
        } catch (err) {
            showMessage('Virhe! ' + err, 'red');
        }
        renderBoards();
    });

    const readBracket = (ln) => {
        const match = ln.match(/^\[(\w+)\s+"(.*)"\]$/);
        return match ? [match[1], match[2]] : null;
    };

    const parsePbnDeal = (dl, ln) => {
        svData.deals[dl].hands = {};
        ln = ln.split(':')[1];
        const hands = ['n', 'e', 's', 'w'];
        let suitCounter = 0;
        let handCounter = 0;
        for (let c = 0; c < ln.length; c++) {
            if (!svData.deals[dl].hands[hands[handCounter]]) svData.deals[dl].hands[hands[handCounter]] = [];
            if (!svData.deals[dl].hands[hands[handCounter]][suitCounter]) svData.deals[dl].hands[hands[handCounter]][suitCounter] = '';
            if (ln[c] == ' ') {
                handCounter++;
                suitCounter = 0;
                continue;
            }
            if (ln[c] == '.') {
                suitCounter++;
                continue;
            }
            svData.deals[dl].hands[hands[handCounter]][suitCounter] += ln[c];
        }
    };

    document.getElementById('svLoadPbnButton').addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const lines = reader.result.split('\n').map(line => line.trim()).filter(Boolean);
                if (!lines[0].includes('PBN')) {
                    showMessage('Väärä tiedostomuoto.');
                    return;
                }
                //console.log('lines', lines);
                svReset();
                let readerMode = 'bracket';
                let board = 0;
                let buffer = [];
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].split(' ')[0] == '%') continue;
                    if (readerMode == 'bracket') { 
                        const ln = readBracket(lines[i]);
                        if (!ln) {
                            console.log('Line omitted: ', lines[i]);
                        }
                        console.log(ln);
                        switch (ln[0]) {
                            case 'Event':
                                svData.event = ln[1];
                                break;
                            case 'Date':
                                svData.date = ln[1];
                                break;
                            case 'Board':
                                console.log(ln);
                                board = parseInt(ln[1]);
                                svData.deals[board] = {};
                                break;
                            case 'Dealer':
                                if (ln[1] == 'N') svData.deals[board].dealer = "North";
                                if (ln[1] == 'E') svData.deals[board].dealer = "East";
                                if (ln[1] == 'S') svData.deals[board].dealer = "South";
                                if (ln[1] == 'W') svData.deals[board].dealer = "West";
                                break;
                            case 'Vulnerable':
                                if (ln[1] == 'NS') {
                                    svData.deals[board].vul = 'N-S';
                                    break;
                                }
                                if (ln[1] == 'EW') {
                                    svData.deals[board].vul = 'E-W';
                                    break;
                                }
                                svData.deals[board].vul = ln[1];
                                break;
                            case 'Deal':
                                parsePbnDeal(board, ln[1]);
                                break;
                            case 'Scoring':
                                svData.scoring = ln[1].split(';')[0];
                                break;
                            case 'Competition':
                                svData.competition = ln[1];
                                break;
                            case 'ScoreTable':
                            case 'TotalScoreTable':
                            case 'OptimumResultTable':
                                readerMode = 'buffer';
                                buffer.push(ln[0]);
                                buffer.push(ln[1]);
                                continue;
                            default:
                                break;
                        }
                    }
                    if (readerMode == 'buffer') {
                        buffer.push(lines[i]);
                        if (lines[i+1][0] == '[') {
                            readerMode = 'bracket';
                            handleBuffer(board, buffer);
                        }
                    }
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
            console.log(svData);
        };
        fileInput.click();
    });
}

export const setPair = (pairToSet) => {
    svSettings.selectedPair = pairToSet;
    setTimeout(() => {
        renderBoards();
    }, 1500); 
};