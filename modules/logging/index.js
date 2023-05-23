const fs = require('node:fs');

const core = require('../corelib/index.js');

class KatiaLogging {
    constructor(data) {
        if (typeof data !== 'object') core.throwErr(1, `First data argument is type ${typeof data}, when it's supposed to be Object.`);
        const o = data;
        if (typeof o.filePath !== 'string') core.throwErr(1, `filePath argument in data object has an invalid type of ${typeof o.filePath}, when it's supposed to be string.`);
        this.filePath = o.filePath
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, '');
        };
        this.lockFile = `${this.filePath}.lck`
        if (fs.existsSync(this.lockFile)) core.throwErr(0, `${this.filePath} is locked by ${this.lockFile}`);
        fs.writeFileSync(this.lockFile, `${process.ppid}:${process.pid}`);
        this.stream = fs.createWriteStream(this.filePath);
        this.toWrite = [];
        this.lock = false;
    };
    raw(a) {
        if (this.lock) core.throwErr(0, 'Logger locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: -1, log: a });
    };
    debug(a) {
        if (this.lock) core.throwErr(0, 'Logger locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: 0, log: a });
    };
    log(a) {
        if (this.lock) core.throwErr(0, 'Logger locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: 1, log: a });
    };
    warn(a) {
        if (this.lock) core.throwErr(0, 'Logger locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: 2, log: a });
    };
    error(a) {
        if (this.lock) core.throwErr(0, 'Logger locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: 3, log: a });
    };
    fatal(a) {
        if (typeof a !== 'string') core.throwErr(1, 'Invalid string');
        this.toWrite.push({ type: 2, log: 'Let a FATAL error slip.' })
        this.toWrite.push({ type: 4, log: a });
    };
    setLock(a) {
        if (typeof a !== 'boolean') core.throwErr(1, 'Invalid boolean');
        this.lock = a;
    }
    loopOp() {
        if (typeof this.toWrite[0] !== 'undefined') {
            const operation = this.toWrite[0];
            if (typeof operation !== 'object') {
                return this.toWrite.splice(0, 1);
            };
            const z = new Date();
            const aab = `${z.getFullYear()}-${z.getMonth()}-${z.getDay()}-${z.getHours()}-${z.getMinutes()}-${z.getSeconds()}:${z.getMilliseconds()}`
            switch (operation.type) {
                case -1:
                    this.stream.write(`${aab} | KATIA | RAW | ${operation.log}\n`);
                    // process.stdout.write(`${aab} | RAW | ${operation.log}\n`);
                    break;
                case 0:
                    this.stream.write(`${aab} | KATIA | DBG | ${operation.log}\n`);
                    process.stdout.write(`${aab} | KATIA | DBG | ${operation.log}\n`);
                    break;
                case 1:
                    this.stream.write(`${aab} | KATIA | LOG | ${operation.log}\n`);
                    process.stdout.write(`${aab} | KATIA | LOG | ${operation.log}\n`);
                    break;
                case 2:
                    this.stream.write(`${aab} | KATIA | WRN | ${operation.log}\n`);
                    process.stderr.write(`${aab} | KATIA | WRN | ${operation.log}\n`);
                    break;
                case 3:
                    this.stream.write(`${aab} | KATIA | ERR | ${operation.log}\n`);
                    process.stderr.write(`${aab} | KATIA | ERR | ${operation.log}\n`);
                    break;
                case 4:
                    this.stream.write(`${aab} | KATIA | FAT | ${operation.log}\n`);
                    process.stderr.write(`${aab} | KATIA | FAT | ${operation.log}\n`);
                    break;
            };
            this.toWrite.splice(0, 1);
        };
    };
    close() {
        this.setLock(true);
        while (this.toWrite.length !== 0) {
            this.loopOp();
        };
        this.stream.close();
        fs.unlinkSync(this.lockFile);
        return true;
    };
};

module.exports = { KatiaLogging };
