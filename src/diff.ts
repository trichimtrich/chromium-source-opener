
interface Chunk {
    startOld: number;
    startNew: number;
    lengthOld: number;
    lengthNew: number;
}

function parseDiff2(diffContent: string): [Chunk[], Record<number, number>] {
    const chunkPattern = /@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/g;
    const chunks: Chunk[] = [];
    const linesMap: Record<number, number> = {};

    let lengthOld = 0;
    let lengthNew = 0;
    let countRm = 0;
    let countAdd = 0;
    let startOld = 0;
    let startNew = 0;

    diffContent.split("\n").forEach(line => {
        const match = chunkPattern.exec(line);
        if (match) {
            if (lengthOld > 0 || lengthNew > 0) {
                throw new Error("Invalid diff format");
            }

            [startOld, lengthOld, startNew, lengthNew] = match.slice(1).map(x => x ? parseInt(x, 10) : 1);
            chunks.push({ startOld, startNew, lengthOld, lengthNew });
            countRm = countAdd = 0;
            return;
        }

        if (lengthOld > 0 || lengthNew > 0) {
            if (line.startsWith(" ")) {
                if (countRm > 0) {
                    startOld += countRm;
                }
                linesMap[startNew] = startOld;
                startOld++;
                startNew++;
                lengthOld--;
                lengthNew--;
                countRm = countAdd = 0;
            } else if (line.startsWith("-")) {
                lengthOld--;
                countRm++;
            } else if (line.startsWith("+")) {
                linesMap[startNew] = startOld + countAdd;
                startNew++;
                lengthNew--;
                if (countAdd < countRm) {
                    countAdd++;
                }
            }
        }
    });

    return [chunks, linesMap];
}

function findClosestLine(selectedLineNumber: number, diffContent: string): number {
    const [chunks, linesMap] = parseDiff2(diffContent);
    let lineOffset = 0;

    if (selectedLineNumber in linesMap) {
        return linesMap[selectedLineNumber];
    }

    for (const { startOld, startNew, lengthOld, lengthNew } of chunks) {
        if (selectedLineNumber > startNew + lengthNew - 1) {
            lineOffset += lengthOld - lengthNew;
            continue;
        }

        if (startNew <= selectedLineNumber && selectedLineNumber <= startNew + lengthNew - 1) {
            const chunkOffset = selectedLineNumber - startNew;
            return startOld + chunkOffset + lineOffset;
        }

        break;
    }

    return selectedLineNumber + lineOffset;
}

export {findClosestLine};
