const fs = require('node:fs');

const encoder = require('gpt-3-encoder');
const core = require('../corelib/index.js');

class KatiaDatabase {
    constructor(data) {
        if (typeof data !== 'object') core.throwErr(1, `First data argument is type ${typeof data}, when it's supposed to be Object.`);
        const o = data;
        if (typeof o.filePath !== 'string') core.throwErr(1, `filePath argument in data object has an invalid type of ${typeof o.filePath}, when it's supposed to be string.`);
        this.filePath = o.filePath
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, encoder.encode('{}').join('-'));
            this.data = {};
        } else {
            const a = fs.readFileSync(this.filePath);
            const b = a.toString();
            const c = b.split('-');
            const d = encoder.decode(c);
            const e = JSON.parse(d);
            this.data = e;
        };
        this.lockFile = `${this.filePath}.lck`
        if (fs.existsSync(this.lockFile)) core.throwErr(0, `${this.filePath} is locked by ${this.lockFile}`);
        fs.writeFileSync(this.lockFile, `${process.ppid}:${process.pid}`);
        this.toWrite = [];
    };
    sync() {
        fs.writeFileSync(this.filePath, encoder.encode(JSON.stringify(this.data)).join('-'));
    };
    loopOp() {
        if (typeof this.toWrite[0] !== 'undefined') {
            const operation = this.toWrite[0];
            if (typeof operation !== 'object') {
                return this.toWrite.splice(0, 1);
            };
            switch (operation.type) {
                case 'set':
                    this.data[operation.i] = operation.value;
                    break;
            };
            this.toWrite.splice(0, 1);
        };
    };
    get(a) {
        if (this.lock) core.throwErr(0, 'Database locked');
        return this.data[a];
    };
    set(a, b) {
        if (this.lock) core.throwErr(0, 'Database locked');
        if (typeof a !== 'string') core.throwErr(1, 'Invalid first argument');
        if (typeof b !== 'string')
        if (typeof b !== 'number')
        if (typeof b !== 'symbol')
        if (typeof b !== 'boolean') core.throwErr(1, 'Invalid second argument');
        this.toWrite.push({ type: 'set', i: a, value: b });
    };
    add(a, b) {
        if (this.lock) core.throwErr(0, 'Database locked');
        const c = a;
        let _d = b;
        if (typeof b !== 'number') _d = 1;
        const e = this.data[a];
        if (typeof e === 'number') {
            this.toWrite.push({ type: 'set', i: a, value: e+_d });
        }
    };
    setLock(a) {
        if (typeof a !== 'boolean') core.throwErr(1, 'Invalid boolean');
        this.lock = a;
    };
    close() {
        this.setLock(true);
        while (this.toWrite.length !== 0) {
            this.loopOp();
        };
        fs.unlinkSync(this.lockFile);
        return true;
    };
};

module.exports = { KatiaDatabase }
