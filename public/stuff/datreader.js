let datData = {
    pairs: {},
    deals: {}
};

const datReset = () => {
    datData = {
        pairs: {},
        deals: {}
    };
};

export const datReader = () => {
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                datReset();
                const lines = reader.result.split('\n').map(line => line.trim()).filter(Boolean);
                console.log('DR', lines);
                let readerMode = 'quotes';
                let dealNumber = 0;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i][0] == '"') {
                        readerMode = 'quotes';
                        if (lines[i].match(/Score Lines Count/g)) {
                            readerMode = 'pairs';
                        } else if (lines[i].match(/Score Lines then/g)) {
                            readerMode = 'results';
                        }
                    } else {
                        if (readerMode == 'pairs') {
                            if (lines[i][0] == '0') continue;
                            const line = lines[i].split(',');
                            datData.pairs[line[0]] = `${line[11].replace(/["]+/g, '')} - ${line[12].replace(/["]+/g, '')}`;
                        } else if (readerMode == 'results') {
                            if (lines[i][0] != '0') {
                                dealNumber++;
                                continue;
                            }
                            if (!datData.deals[dealNumber]) {
                                datData.deals[dealNumber] = { results: [] };
                            }
                            const line = lines[i].split(',');
                            datData.deals[dealNumber].results.push([
                                line[1],
                                line[2],
                                line[12].replace(/["]+/g, ''),
                                line[13].replace(/["]+/g, ''),
                                line[14],
                                line[15].replace(/["]+/g, ''),
                                line[3],
                                '',
                                ''
                            ]);

                        }
                    }
                }

                console.log(datData);
                resolve(datData);
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsText(file);
        };
        fileInput.click();
    });
};