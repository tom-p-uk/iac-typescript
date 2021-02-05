import generateMockData from './generateMockData';

describe(('generateMockData'), () => {
    it('generates same number of rows as the first arg passed', () => {
        const numToGenerate = 20;

        expect(generateMockData(numToGenerate, true).length).toBe(numToGenerate);
    });

    it('generates objects with `am`, `pm` and `eve` properties that match the second arg passed', () => {
        const makeSlotsAvailable = true;
        const [result] = generateMockData(1, makeSlotsAvailable)

        expect(result.am).toBe(makeSlotsAvailable);
        expect(result.pm).toBe(makeSlotsAvailable);
        expect(result.eve).toBe(makeSlotsAvailable);
    });

    it('generates an array of objects with the correct properties', () => {
        const result = generateMockData(10);

        result.forEach((slotData) => {
            expect(slotData).toHaveProperty('id');
            expect(slotData).toHaveProperty('date');
            expect(slotData).toHaveProperty('am');
            expect(slotData).toHaveProperty('pm');
            expect(slotData).toHaveProperty('eve');
            expect(slotData).toHaveProperty('special_delivery');
            expect(slotData).toHaveProperty('is_second_friday');
            expect(slotData).toHaveProperty('full_count');
        });
    });
});
