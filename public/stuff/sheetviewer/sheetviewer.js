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

const renderBoards = () => {
    const svMain = document.getElementById('svMain');

    //menyy
    let buttonsHtml = '';
    for (let i = 1; i <= svContent.length; i++) {
        buttonsHtml += `<button class="svDealButton" data-index="${i}">${i}</button>`
    }

    //deal
    let dealHtml = '';

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
                    console.log('o ', ch[o], ' ch ', ch);
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
        console.log('svData: ', svData);
    });
}