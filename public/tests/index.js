// Code under test
function add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError('Both arguments must be numbers'); }
    return a + b;
}

// Tests
mocha.describe('Add Function', function () {
    it('should return 5 when adding 2 and 3', function () {
        expect(add(2, 3)).to.equal(5);
    });

    it('should throw error for invalid inputs', function () {
        expect(() => add(2, 'x')).to.throw(TypeError);
    });
});

mocha.run();
