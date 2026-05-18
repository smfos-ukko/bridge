import { showMessage } from "../bridge.js";

const svData = {
    pairs: {},
    deals: {}
};
const svSettings = {
    selectedDeal: 1
};

const proxy = 'https://corsproxy.io/?url=';

const trimLine = (trln) => {
    if (!trln) return null;
    return trln.split(' ').filter(Boolean);
};

const switchDeal = (ind) => {
    const dls = document.querySelectorAll('.svDealCard');
    for (let crd of dls) {
        if (crd.getAttribute('data-index') != ind) {
            crd.style.display = 'none';
        } else {
            crd.style.display = 'block';
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
                <div class="svGrid">
                    <div class="svDealInfoCard svCard">
                        <span>Jakaja:</span><br/>
                        <span class="indent">${svData.deals[i].dealer}</span><br/>
                        <span>Vaarassa:</span><br/>
                        <span class="indent">${svData.deals[i].vul == 'Ei' ? 'Ei kukaan' : svData.deals[i].vul}</span>
                    </div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.n)}</div>
                    <div class="svDealOptimumCard svCard">${svData.deals[i].optimum}</div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.w)}</div>
                    <div class="svDealCenter"></div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.e)}</div>
                    <div class="svDealPoints">${renderPoints(i)}</div>
                    <div class="svDealHand">${renderDeal(svData.deals[i].hands.s)}</div>
                    <div class="svDealTricks"></div>
                </div>
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
    svMain.querySelector('.svDealCard').style.display = 'block';
};

export async function sheetViewer() {
    document.getElementById('svFetchButton').addEventListener('click', async () => {
        try {
            const res = await fetch(proxy + 'https://www.bridgefinland.fi/bilbo/res/22713.htm#scoretables');
            //const url = document.getElementById('svInput').value;
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
                    const ln = line.split(' ').filter(Boolean);
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
                    if (chLine.length < 9) continue;
                    svData.deals[dealNo].results.push(chLine);
                }
            }
        } catch (err) {
            showMessage('Virhe! ' + err, 'red');
        }
        renderBoards();
    });
}