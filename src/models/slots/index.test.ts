import moment from 'moment';

import slotsModel from './index';
import dbClient from '../../store/db';
import seedDb from '../../util/seedDb';

describe('slotsModel', () => {
    beforeAll(async () => {
        await dbClient.connect();
    });

    beforeEach(async () => {
        await seedDb();
    });

    afterAll(async () => {
        await dbClient.end();
    });

    describe('getSlots', () => {
        it('Returns an object with a `rows` property', async () => {
            const result = await slotsModel.getSlots();

            expect(result).toHaveProperty('rows');
        });

        it('Limits num of results according to the `limit` arg passed to it', async () => {
            const offset = 0;
            const limit = 1;

            const result = await slotsModel.getSlots(offset, limit);

            expect(result.rows.length).toBe(limit);
        });

        it('Offsets results according to the `offset` arg passed to it', async () => {
            const offsetA = 0;
            const offsetB = 1;
            const limit = 3;

            const base = await slotsModel.getSlots(offsetA, limit);
            const same = await slotsModel.getSlots(offsetA, limit);
            const different = await slotsModel.getSlots(offsetB, limit);

            expect(base.rows).toEqual(same.rows);
            expect(base.rows).not.toEqual(different.rows);
        });
    });

    describe('getFinalSlots', () => {
        it('Returns an object with a `rows` property', async () => {
            const result = await slotsModel.getFinalSlots();

            expect(result).toHaveProperty('rows');
        });

        it('Limits num of results according to the `limit` arg passed to it', async () => {
            const limit = 1;
            const result = await slotsModel.getFinalSlots(limit);

            expect(result.rows.length).toBe(limit);
        });
    });

    describe('selectSlot', () => {
        it('Toggles a slot\'s availability when given an ID and time arg and returns the updated row', async () => {
            const id = '1';
            const time = 'eve';

            const resultA = await slotsModel.selectSlot(id, time);
            const resultB = await slotsModel.selectSlot(id, time);

            expect(resultA.rows[0].eve).toBe(false);
            expect(resultB.rows[0].eve).toBe(true);
        });
    });

    describe('selectSpecialDelivery', () => {
        it('Sets the `special_delivery` flag of rows whose dates are on a Wed to true and returns updated rows', async () => {
            const result = await slotsModel.selectSpecialDelivery();
            const verified = result.rows.every(row => {
                const dow = moment(row.date).day();
                const isWednesday = (dow === 3);

                return (isWednesday && row.special_delivery);
            });

            expect(verified).toBe(true);
        });
    });
});
