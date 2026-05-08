import { showMessage } from "../bridge.js";

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

export function movementEditor() {
    
    const openMovementFile = () => {
        const fileInput = document.createElement('input');

        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) return;
            const fileObject = {};

            if (file.type == '' || file.type == 'text/plain') {
                const reader = new FileReader();
                fileObject.name = file.name;

                reader.onload = () => {
                    const lines = reader.result.split('\n').map(line => line.trim()).filter(Boolean);

                    fileObject.dealsPerRound = parseInt(lines[1].split(',')[1]);
                    const firstDataLine = lines[2].split(' ');
                    fileObject.numberOfTables = firstDataLine.length - 1;

                    const regex = /^\d{2}(?:\s+\d{2}[A-Z]\d{2})+$/;
                    let lastIndex = -1;
                    lines.forEach((line, index) => {
                        if (regex.test(line.trim())) {
                            lastIndex = index;
                        }
                    });
                    fileObject.rounds = parseInt(lines[lastIndex].split(' ')[0]);

                    fileObject.tables = {};
                    for (let tbl = 1; tbl <= fileObject.numberOfTables; tbl++) {
                        fileObject.tables[tbl] = {};
                    }

                    for (let i = 2; i < lines.length; i++) {
                        if (!regex.test(lines[i].trim())) continue;
                        const blocks = lines[i].split(' ');
                        for (let y = 1; y < blocks.length; y++) {

                        }
                    }

                    console.log(file, fileObject, lines);
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