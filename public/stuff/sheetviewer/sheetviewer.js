import { showMessage } from "../bridge.js";
import { pbnReader } from "../pbnreader.js";
import { api } from "../bridge.js";

let svData = {
    pairs: {},
    deals: {}
};
const svSettings = {
    selectedDeal: 1,
    selectedPair: null
};
let editorStorage = {};
let eventStorage = [];
let commentData = null;
let eventLoaded = false;

const trimLine = (trln) => {
    if (!trln) return null;
    return trln.split(' ').filter(Boolean).slice(0, 9);
};

const switchDeal = (ind = svSettings.selectedDeal) => {
    if (ind == 'prev') {
        if (svSettings.selectedDeal < 2) return;
        svSettings.selectedDeal -= 1;
        ind = svSettings.selectedDeal;
    }
    if (ind == 'next') {
        if (svSettings.selectedDeal > Object.keys(svData.deals).length - 1) return;
        svSettings.selectedDeal += 1;
        ind = svSettings.selectedDeal;
    }
    ind = Number(ind);
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
    if (!svData.deals[dealIn].results) return '';
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
                brd += `<div data-index="${svData.deals[dealIn].results[r][s]}" class="svPlayerPair ${svData.deals[dealIn].results[r][s] == svSettings.selectedPair ? 'svSelectedPair' : ''} svDealResultsBoardCell${r % 2 == 0 ? ' svEven' : ' svOdd'}">${svData.pairs[plNum] ? svData.pairs[plNum] : '--'}</div>`;
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

const renderFeedback = (dealIn, comments) => {
    if (!comments) return '';
    const injectBids = (bax) => {
        if (!bax.data.bids) return '';
        try {
            const ba = bax.data.bids;
            console.log('onkoniita', ba);
            let amountOfPasses = 3;
            let bids = '';
            if (ba.length) {
                for (let i = 0; i < ba.length; i++) {
                    const el = ba[i];
                    bids += `<div class="svBidBlock svBidBlockBid svBidType${el[0]}">${el[1]}</div>`;
                }
                for (let i = 0; i < amountOfPasses; i++) {
                    bids += '<div class="svBidBlock svBidBlockBid svBidTypePass">Pass</div>';
                }
            }
            let complete = '';
            complete = svData.deals[dealIn].boxBoilerplate + bids;
            const count = complete.match(/\/div/g || []).length;
            const remainder = count % 4;
            const missing = remainder === 0 ? 0 : 4 - remainder;
            for (let i = 0; i < missing; i++) {
                complete += '<div class="svBidBlock svBidBlockBid"></div>';
            }
            return complete;
        } catch (e) {
            console.log('error ', e);
        }
    };
    const addEditingTools = (comm) => {
        try {
            const u = sessionStorage.getItem('user');
            if (!u) return '';
            if (u != comm.username) return '';
            return `
                <div class="flex-row justify-end">
                    <button class="svEditCommentButton color-yellow" data-index="${comm.id}">🖉</button>
                    <button class="svDeleteCommentButton color-red" data-index="${comm.id}">X</button>
                </div>
            `;
        } catch (e) {
            console.log('error ', e);
            return '';
        }
    };
    let comms = '';
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].data.deal != dealIn) continue;
        comms += `
                <div class="svFeedbackCard flex-row" data-index="${comments[i].id}">
                    <div class="svBidViewContainer ${comments[i].data?.bids?.length ? '' : 'invisible'}">
                        ${injectBids(comments[i])}
                    </div>
                    <div class="flex-col justify-sb w-100">
                        <div class="svFeedbackTextContainer">
                            <p>${comments[i].data.text}</p>
                        </div>
                        <div class="svFeedbackAuthorContainer">
                            ${addEditingTools(comments[i])}
                            <p class="svEditorInfo">${comments[i].updated_at}</p>
                            <p class="svEditorInfo">Kirjoittaja: ${comments[i].username}</p>
                        </div>
                    </div>
                </div>        
            `;
    }
    return comms;
};

const renderBoards = (comments = null) => {
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
                <div class="svFeedbackContainer flex-col">${renderFeedback(i, comments)}</div>
                <div class="svDealResultsContainer">${renderResults(i)}</div>
            </div>
        `;
    }

    //final
    let html = `
        <div class="flex-row">
            <div id="svEvent"><h2>${svData.event ? svData.event : ''}</h2></div>
            <div id="svDate"><h2>${svData.date ? svData.date : ''}</h2></div>
        </div>
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

    for (let btn of svMain.querySelectorAll('.svDeleteCommentButton')) {
        btn.addEventListener('click', () => { deleteComment(btn.getAttribute('data-index')) });
    }

    for (let btn of svMain.querySelectorAll('.svEditCommentButton')) {
        btn.addEventListener('click', () => { editComment(btn) });
    }

    svMain.querySelector('.svDealCard').style.display = 'flex';
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

    const commentConts = document.getElementsByClassName('svFeedbackContainer');
    for (let fbc of commentConts) {
        if (fbc.children.length) fbc.style.display = 'flex';
        else fbc.style.display = 'none';
    }

    switchDeal();
    const cdb = document.getElementById('svCommentDealButton');
    if (!cdb) return;
    cdb.style.display = 'inline-block';
};

const svReset = () => {
    document.getElementById('svMain').innerHTML = '';
    svData = {
        pairs: {},
        deals: {}
    };
    svSettings.selectedDeal = 1;
    svSettings.selectedPair = null;
    eventLoaded = false;
    const cdb = document.getElementById('svCommentDealButton');
    if (!cdb) return;
    cdb.style.display = 'none';
}

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

            const title = doc.querySelector('b').innerText;
            const sp = title.match(/^(\S+)\s+(.*)$/);
            svData.event = sp[2];
            svData.date = sp[1];

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
                    if (!line.trim()) continue;
                    const pairNumber = line.match(/^\s*\d+\s+([A-Z]?\d+)\b/)?.[1];
                    if (!pairNumber) {
                        console.log('Line omitted! (match) ', line);
                        continue;
                    }
                    const dashPos = line.indexOf(' - ');
                    if (dashPos === -1) {
                        console.log('Line omitted! (dashPos) ', line);
                        continue;
                    }
                    const leftPart = line.slice(0, dashPos);
                    const start = leftPart.lastIndexOf('  ');
                    if (start === -1) {
                        console.log('Line omitted! (start) ', line);
                        continue;
                    }
                    const rightPart = line.slice(start).trim();
                    const playerNames = rightPart.split(/\s{2,}/)[0].trim();
                    svData.pairs[pairNumber] = playerNames;
                }
            }
            console.log(svData);

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
        svData.saved = false;
        addBoilerPlates();
        renderBoards();
        eventLoaded = true;
    });

    document.getElementById('svLoadPbnButton').addEventListener('click', () => {
        pbnReader().then(data => {
            if (data) {
                svReset();
                svData = data;
                addBoilerPlates();
                renderBoards();
                eventLoaded = true;
            } else {
                showMessage('Virhe!', 'red');
            }
        });
    });
}

export const setPair = (pairToSet) => {
    svSettings.selectedPair = pairToSet;
    setTimeout(() => {
        renderBoards();
    }, 1500); 
};

const addBoilerPlates = () => {
    Object.values(svData.deals).forEach((deal) => {
        let bv = '';
        const dirs = ['W', 'N', 'E', 'S'];
        const vuls = [
            ['Kaikki', 'E-W', 'All', 'I-L'],
            ['Kaikki', 'N-S', 'All', 'P-E'],
            ['Kaikki', 'E-W', 'All', 'I-L'],
            ['Kaikki', 'N-S', 'All', 'P-E']
        ];
        const vul = deal.vul;
        const dealer = deal.dealer;
        let omits = 0;
        if (['Pohjoinen', 'North'].includes(dealer)) omits = 1;
        if (['Itä', 'East'].includes(dealer)) omits = 2;
        if (['Etelä', 'South'].includes(dealer)) omits = 3;
        for (let i = 0; i < 4; i++) {
            bv += `
                <div class="svBidBlock svBidBlockHeader ${vuls[i].includes(vul) ? 'svVul' : 'svNonVul'}" data-index="${i}">
                ${dirs[i]}</div>
            `;
        }
        for (let i = 0; i < omits; i++) {
            bv += `<div class="svBidBlock svBidBlockBid"></div>`;
        }
        deal.boxBoilerplate = bv;
    });
};

const addBidBox = () => {
    let standardBids = '';
    let specialBids = '';
    const suits = ['♣', '♦', '♥', '♠', 'NT'];
    const cns = ['club', 'diamond', 'heart', 'spade', 'notrump'];
    for (let level = 1; level <= 7; level++) {
        for (let suit = 0; suit < 5; suit++) {
            standardBids += `<div class="svBidSlip" data-suit="${suit}" 
                data-level="${level}">${level} <span class="${cns[suit]}">${suits[suit]}</span></div>`;
        }
    }
    specialBids += '<div class="svBidSlip svSpecSlip svPassSlip" data-type="Pass">Pass</div>';
    specialBids += '<div class="svBidSlip svSpecSlip svDblSlip" data-type="Dbl">X</div>';
    specialBids += '<div class="svBidSlip svSpecSlip svRdblSlip" data-type="Rdbl">XX</div>';  
    specialBids += '<div class="svBidSlip svSpecSlip svCancelSlip" data-type="Cancel">↩</div>';      
    const bidBox = `
        <div class="svBidBox">
            <div class="svStandardBids">
                ${standardBids}
            </div>
            <div class="svSpecialBids flex-row">
                ${specialBids}
            </div>
        </div>
        <div class="svBidViewContainer"></div>
    `;
    return bidBox;
};

const updateBidView = (data = null) => {
    let bidData = [];
    if (editorStorage[svSettings.selectedDeal]?.bids) bidData = editorStorage[svSettings.selectedDeal].bids;
    if (data) { 
        bidData = data.data.bids;
        if (!editorStorage[svSettings.selectedDeal]) editorStorage[svSettings.selectedDeal] = {};
        if (!editorStorage[svSettings.selectedDeal].bids) editorStorage[svSettings.selectedDeal].bids = [];
        editorStorage[svSettings.selectedDeal].bids = data.data.bids;
    }
    let bids = '';
    if (bidData.length) {
        for (let i = 0; i < bidData.length; i++) {
            const el = bidData[i];
            bids += `<div class="svBidBlock svBidBlockBid svBidType${el[0]}">${el[1]}</div>`;
        }
        for (let i = 0; i < 3; i++) {
            bids += '<div class="svBidBlock svBidBlockBid svBidTypePass">Pass</div>';
        }
    }
    let box = document.querySelector(`.svCommentCard[data-index="${svSettings.selectedDeal}"] .svBidViewContainer`);
    box.innerHTML = svData.deals[svSettings.selectedDeal].boxBoilerplate + bids;
    box = document.querySelector(`.svCommentCard[data-index="${svSettings.selectedDeal}"] .svBidViewContainer`); 
    const count = box.children.length;
    const remainder = count % 4;
    const missing = remainder === 0 ? 0 : 4 - remainder;
    for (let i = 0; i < missing; i++) {
        const newDiv = document.createElement('div');
        newDiv.className = 'svBidBlock svBidBlockBid';
        box.appendChild(newDiv);
    }
};

const addBidSlipEventListeners = () => {
    const slips = document.getElementsByClassName('svBidSlip');
    for (let slip of slips) {
        slip.addEventListener('click', () => {
            const deal = slip.closest('.svCommentCard').dataset.index;
            if (!editorStorage[deal]) editorStorage[deal] = {};
            if (!editorStorage[deal].bids) editorStorage[deal].bids = [];
            if (slip.classList.contains('svSpecSlip')) {
                if (slip.classList.contains('svCancelSlip')) {
                    editorStorage[deal].bids.pop();
                }
                else editorStorage[deal].bids.push([slip.dataset.type, slip.innerText]);
            } else {
                editorStorage[deal].bids.push(['bid', slip.innerHTML]);
            }
            updateBidView();
        });
    }
};

const addComment = (id = 0, data = null) => {
    if (!eventLoaded) {
        showMessage('Turnausta ei ole ladattu.');
        return;
    }
    const sd = svSettings.selectedDeal;
    const dc = document.querySelector(`.svDealCard[data-index="${sd}"] .svFeedbackContainer`);
    if (dc.parentElement.querySelector('.svCommentCard')) {
        if (data) showMessage('Edellinen kommentti työn alla.');
        return;
    }
    if (!editorStorage[sd]) editorStorage[sd] = {};
    if (!editorStorage[sd].bids) editorStorage[sd].bids = [];
    editorStorage[sd].bids = [];
    const html = `<div class="svCommentCard flex-row" data-index="${sd}" data-id="${id}">
        <div class="svCommentEditor flex-row">
            ${addBidBox()}
        </div>
        <div class="svCommentTextContainer flex-col">
            <h3>Kommentit</h3>
            <textarea class="svCommentTextArea" rows="9" cols="40">${data?.data?.text ? data.data.text : ''}</textarea>
        </div>
        <div class="flex-col">
            <button class="svCloseButton" data-index="${sd}">X</button>
            <button class="svInjectCommentButton">Lisää</button>
        </div>
        </div>`;
    const injection = document.createElement('div');
    injection.classList.add('svCommentField');
    injection.dataset.index = sd;
    injection.innerHTML = html;
    dc.after(injection);
    dc.parentElement.querySelector('.svCloseButton').addEventListener('click', () => {
        dc.parentElement.querySelector(`.svCommentField[data-index="${sd}"]`).remove();
    });
    dc.parentElement.querySelector('.svInjectCommentButton').addEventListener('click', () => {
        if (!sessionStorage.getItem('user')) {
            showMessage('Kirjaudu sisään kommentoidaksesi.');
            return;
        }
        const cma = {
            creator: sessionStorage.getItem('user'),
            deal: sd,
            bids: null,
            text: dc.parentElement.querySelector('.svCommentTextArea').value
        };
        if (id == 0) {
            cma.bids = editorStorage[sd].bids;
        } else {
            cma.bids = data.data.bids;
        }
        editorStorage[sd].bids = [];
        sendComment(cma, id);
    });
    addBidSlipEventListeners();
    updateBidView(data);
};

const editComment = (element) => {
    const fbc = element.closest('.svFeedbackCard');
    const commId = fbc.dataset.index;
    const commData = commentData.find((com => {
        return com.id == commId;
    }));
    console.log(fbc, commId, commData);
    if (!commData) { 
        showMessage('Jotakin meni vikaan, kommentin dataa ei löydy.', 'red');
        return;
    }
    addComment(commId, commData);
};

const deleteComment = (id) => {
    const deleteComm = async () => {
        if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) return;

        const token = sessionStorage.getItem('token');

        const res = await api('deletecomment', { token, id: Number(id) });
        return res;
    };
    Swal.fire({
        title: "Poistetaanko varmasti?",
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Poista",
        denyButtonText: `Peruuta`
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await deleteComm();
            console.log(res);
            if (res.status == 'deleted') {
                Swal.fire("Kommentti poistettu", "", "success");
                loadComments();
            } else {
                showMessage('Jotakin meni vikaan', 'red');
            }
        }
    });
};

export const saveEvent = async () => {
    if (!eventLoaded) {
        showMessage('Turnausta ei ole ladattu.');
        return;
    }
    const name = document.getElementById('svSaveEventInput').value;
    if(!name) {
        showMessage('Anna tapahtumalle nimi.');
        return;
    }
    if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) {
        showMessage('Kirjaudu sisään tallentaaksesi kommentteja.');
        return;
    }
    const username = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    if (!token) {
        showMessage('Kirjaudu sisään kommentoidaksesi.');
        return;
    }
    svData.saved = true;
    const res = await api('saveevent', { username: username, token, name, data: svData });
    console.log('createComments', res.status);
    if (res.status == 'saved') {
        showMessage('Tallennettu.');
        loadEvents();
    }
    else if (res.status == 'exists') showMessage('Jako on jo olemassa.');
    else showMessage('Virhe!', 'red');
};

const loadEvents = async () => {
    if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) return;

    const token = sessionStorage.getItem('token');

    if (!token) {
        showMessage('Token not set.');
        return;
    }

    const res = await api('loadevents', { token });
    if (!res) return; 
    emptyEvents();
    for (let i = 0; i < res.length; i++) {
        eventStorage.push(res[i]);
    }
    
    console.log(eventStorage);
    const lcc = document.getElementById('loadedEventsContainer');
    for (let i = 0; i < eventStorage.length; i++) {
        const lcb = document.createElement('button');
        lcb.dataset.index = i;
        lcb.dataset.event = eventStorage[i].id;
        lcb.innerText = eventStorage[i].name;
        lcb.addEventListener('click', (e) => {
            svReset();
            svData = eventStorage[Number(lcb.dataset.index)].data;
            svData.eventId = e.target.dataset.event;
            eventLoaded = true;
            loadComments();
        });
        lcc.appendChild(lcb);
    }
    const acb = document.createElement('button');
    acb.id = 'svCommentDealButton';
    acb.innerText = 'Kommentoi jakoa';
    acb.style.display = 'none';
    acb.addEventListener('click', () => {
        addComment();
    });
    lcc.appendChild(acb);
};

const sendComment = async (commentArray, id) => {
    if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) return;

    const username = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');

    const res = await api('sendcomment', { username, token, event: svData.eventId, id, data: commentArray });
    console.log(res);
    if (res) loadComments();
};

const loadComments = async () => {
    if (!sessionStorage.getItem('user') || !sessionStorage.getItem('token')) return;

    const username = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');

    let res = await api('loadcomments', { username, token, event: svData.eventId });
    console.log(res);
    if (!res) return;
    if (res.status == 'no comments') res = null;
    commentData = res;
    renderBoards(res);
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') switchDeal('next');
    if (e.key === 'ArrowLeft') switchDeal('prev');
});

const emptyEvents = () => {
    eventStorage = [];
    document.getElementById('loadedEventsContainer').innerHTML = '';
};

export const viewerCheckLogin = () => {
    if (!sessionStorage.getItem('user')) {
        emptyEvents();
        return;
    }
    if (document.getElementById('commentOuter')) {
        loadEvents();
    }
};

export const initViewer = () => {
    document.getElementById('svSaveEventButton').addEventListener('click', () => {
        saveEvent();
    });
    if (sessionStorage.getItem('user') && Object.keys(eventStorage).length == 0) {
        loadEvents();
    }
};