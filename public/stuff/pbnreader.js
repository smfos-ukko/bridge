let pbnData = {
    pairs: {},
    deals: {}
};

const pbnReset = () => {
    pbnData = {
        pairs: {},
        deals: {}
    };
};

const handleBuffer = (dl, bf) => {
    console.log('BUFFER', dl, bf);
    if (!bf.length) return;
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

    const tokenize = (row) => {
        return row.match(/"[^"]*"|\S+/g).map(x => x.replace(/^"|"$/g, ''));
    };
    
    const dat = [];
    for (let i = 2; i < bf.length; i++) {
        dat.push(tokenize(bf[i]));
    }
    
    switch (type) {
        case 'TotalScoreTable':
            let i1 = headerData.indexOf('PairId');
            let i2 = headerData.indexOf('Names');
            for (let i = 0; i < dat.length; i++) {
                pbnData.pairs[dat[i][i1]] = dat[i][i2];
            }
            break;
        case 'ScoreTable':
            const getValue = (row, field, fallback = '--') => {
                const idx = headerData.indexOf(field);
                if (idx === -1) return fallback;
                const value = row[idx];
                return (value === undefined || value === null || value === '') ? fallback : value;
            };
            pbnData.deals[dl].results = [];
            pbnData.saved = false;
            for (let r = 0; r < dat.length; r++) {
                const row = dat[r];
                const scoreNS = getValue(row, 'Score_NS', '-');
                const scoreEW = getValue(row, 'Score_EW', '-');
                pbnData.deals[dl].results[r] = [
                    getValue(row, 'PairId_NS'),
                    getValue(row, 'PairId_EW'),
                    getValue(row, 'Contract'),
                    getValue(row, 'Declarer'),
                    getValue(row, 'Result'),
                    getValue(row, 'Lead'),
                    scoreNS !== '-' ? scoreNS : '-' + scoreEW,
                    getValue(row, 'MP_NS'),
                    getValue(row, 'MP_EW')
                ];
            }
            break;
        case 'OptimumResultTable':
            const suits = ['C', 'D', 'H', 'S', 'NT'];
            const directions = ['N', 'S', 'E', 'W'];
            const map = {};
            for (const dir of directions) {
                map[dir] = {
                    C: null,
                    D: null,
                    H: null,
                    S: null,
                    NT: null
                };
            }
            for (const [dir, suit, tricks] of dat) {
                map[dir][suit] = Number(tricks);
            }
            const result = directions.map(dir => [
                dir,
                ...suits.map(suit => map[dir][suit])
            ]);
            pbnData.deals[dl].tricks = result;
            break;
        default:
            break;
    }
    
    //console.log('checkpoint: ', svData);
    
    bf.splice(0, bf.length);
};

const readBracket = (ln) => {
    const match = ln.match(/^\[(\w+)\s+"(.*)"\]$/);
    return match ? [match[1], match[2]] : null;
};

const parsePbnDeal = (dl, ln) => {
    pbnData.deals[dl].hands = {};
    const direction = ln.split(':')[0];
    ln = ln.split(':')[1];
    let hands;
    switch (direction) {
        case 'N':
            hands = ['n', 'e', 's', 'w'];
            break;
        case 'E':
            hands = ['e', 's', 'w', 'n'];
            break;
        case 'S':
            hands = ['s', 'w', 'n', 'e'];
            break;
        case 'W':
            hands = ['w', 'n', 'e', 's'];
            break;
        default:
            break;
    }
    let suitCounter = 0;
    let handCounter = 0;
    for (let c = 0; c < ln.length; c++) {
        if (!pbnData.deals[dl].hands[hands[handCounter]]) pbnData.deals[dl].hands[hands[handCounter]] = [];
        if (!pbnData.deals[dl].hands[hands[handCounter]][suitCounter]) pbnData.deals[dl].hands[hands[handCounter]][suitCounter] = '';
        if (ln[c] == ' ') {
            handCounter++;
            suitCounter = 0;
            continue;
        }
        if (ln[c] == '.') {
            suitCounter++;
            continue;
        }
        pbnData.deals[dl].hands[hands[handCounter]][suitCounter] += ln[c];
    }
};

export const pbnReader = () => {
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                pbnReset();
                const lines = reader.result.split('\n').map(line => line.trim()).filter(Boolean);
                if (!lines[0].includes('PBN')) {
                    showMessage('Väärä tiedostomuoto.');
                    return;
                }
                let readerMode = 'bracket';
                let board = 0;
                let optimums = {};
                let buffer = [];
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i] == '') continue;
                    if (lines[i][0] == '%') continue;
                    console.log(lines[i]);
                    if (readerMode == 'bracket') { 
                        const ln = readBracket(lines[i]);
                        if (!ln) {
                            console.log('Line omitted: ', lines[i]);
                        }
                        switch (ln[0]) {
                            case 'Event':
                                pbnData.event = ln[1];
                                break;
                            case 'Date':
                                pbnData.date = ln[1];
                                break;
                            case 'Board':
                                board = parseInt(ln[1]);
                                pbnData.deals[board] = {};
                                break;
                            case 'Dealer':
                                if (ln[1] == 'N') pbnData.deals[board].dealer = "North";
                                if (ln[1] == 'E') pbnData.deals[board].dealer = "East";
                                if (ln[1] == 'S') pbnData.deals[board].dealer = "South";
                                if (ln[1] == 'W') pbnData.deals[board].dealer = "West";
                                break;
                            case 'Vulnerable':
                                if (ln[1] == 'NS') {
                                    pbnData.deals[board].vul = 'N-S';
                                    break;
                                }
                                if (ln[1] == 'EW') {
                                    pbnData.deals[board].vul = 'E-W';
                                    break;
                                }
                                pbnData.deals[board].vul = ln[1];
                                break;
                            case 'Deal':
                                parsePbnDeal(board, ln[1]);
                                break;
                            case 'Scoring':
                                pbnData.scoring = ln[1].split(';')[0];
                                break;
                            case 'Competition':
                                pbnData.competition = ln[1];
                                break;
                            case 'OptimumContract':
                                if (!optimums[board]) optimums[board] = ['', ''];
                                optimums[board][0] = ln[1];
                                break;
                            case 'OptimumScore':
                                if (!optimums[board]) optimums[board] = ['', ''];    
                                optimums[board][1] = ln[1];
                                break;
                            case 'ScoreTable':
                            case 'TotalScoreTable':
                            case 'OptimumResultTable':
                                readerMode = 'buffer';
                                buffer.push(ln[0]);
                                buffer.push(ln[1]);
                                continue;
                            case 'Play':
                                readerMode = 'skip';
                                continue;
                            default:
                                break;
                        }
                    }

                    if (readerMode == 'buffer' || readerMode == 'skip') {
                        if (readerMode == 'buffer') buffer.push(lines[i]);
                        if (!lines[i+1]) {
                            handleBuffer(board, buffer);
                            continue;
                        }
                        if (lines[i+1] == '') {
                            readerMode = 'bracket';
                            handleBuffer(board, buffer);
                        } else if (lines[i+1][0] == '[') {
                            readerMode = 'bracket';
                            handleBuffer(board, buffer);
                        }
                    }

                }
                for (const [key, value] of Object.entries(optimums)) {
                    pbnData.deals[key].optimum = value[0] + ' ' + value[1];
                }
                console.log(pbnData);
                resolve(pbnData);
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsText(file, 'ISO-8859-1');
        };
        fileInput.click();
    });
};