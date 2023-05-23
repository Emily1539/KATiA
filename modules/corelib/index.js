let deprecatedSent = false;

module.exports = {
    throwErr(type, m) {
        switch (type) {
            case 0:
                const a = new Error(m);
                a.m = m;
                throw a;
                break;
            case 1:
                const b = TypeError(m);
                b.m = m;
                throw b;
                break;
            default:
                process.emitWarning('Please note that providing an invalid value is deprecated and will be removed in the next major release.', 'DeprecationWarning');
                throw new Error(m);
                break;
        }
    },
    async waitUntil(a) {
        while (!(a())) {
            await new Promise((a) => setTimeout(a, 25));
        };
        return true;
    }
}
