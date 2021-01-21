import moment from 'moment';

import dbClient from '../store/db';
import seedDb from './seedDb';

describe('seedDb', () => {
    const selectQuery = 'SELECT * FROM slots ORDER BY id';

    beforeAll(async () => {
        await dbClient.connect();
    });

    beforeEach(async () => {
        await seedDb();
    });

    afterAll(async () => {
        await dbClient.end();
    });

    it('Generates data', async () => {
        const result = await dbClient.query(selectQuery);
        
        expect(result.rows.length).toBeGreaterThan(0);
    });

    it('Ensures no dates that fall on a Sunday are generated', async () => {
        const result = await dbClient.query(selectQuery);
        const noSundays = result.rows.every(row => {
            const dow = moment(row.date).day();
            const isNotSunday = (dow !== 0);

            return isNotSunday;
        });
        
        expect(noSundays).toBe(true);
    });

    it('Ensures that the AM slot for every second Friday is unavailable', async () => {
        const result = await dbClient.query(selectQuery);
        const fridaysOnly = result.rows.filter(row => {
            const dow = moment(row.date).day();
            const isFriday = (dow === 5);

            return isFriday;
        });

        const verifyEverySecondFriday = fridaysOnly.every((row, index) => {
            if (index % 2 == 0) {
                return (!row.is_second_friday && row.am);
            }

            return (row.is_second_friday && !row.am);
        });
        
        expect(verifyEverySecondFriday).toBe(true);
    });
});
