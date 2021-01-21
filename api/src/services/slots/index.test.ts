import _ from 'lodash';

import slotsService from '../../services/slots';
import slotsModel from '../../models/slots';
import generateMockData from '../../util/generateMockData';

jest.mock('../../models/slots', () => ({
    getSlots: jest.fn(),
    getFinalSlots: jest.fn()
}));

describe('slotsService', () => {
    beforeAll(() => {
        (slotsModel.getSlots as jest.Mock).mockResolvedValue({rows: generateMockData(3, true)});
        (slotsModel.getFinalSlots as jest.Mock).mockResolvedValue({rows: generateMockData(3, true)});
    });
    describe('.getSlots', () => {
        it('Calls slotsModel.getSlots ', async () => {
            await slotsService.getSlots('0', '2');

            expect(slotsModel.getSlots).toBeCalled();
        });

        it('Calls slotsModel.getFinalSlots if num of rows returned by slotsModel.getSlots !== limit', async () => {
            const offset = '0';
            const limit = '2';
            await slotsService.getSlots(offset, limit);

            expect(slotsModel.getFinalSlots).toBeCalled();
        });
    });

    describe('.removeFirstDayIfNoSlots', () => {
        it('Removes the first day if there are no slots available', async () => {
            const data = generateMockData(3, false);
            const result = slotsService.removeFirstDayIfNoSlots(data);
            const index = _.findIndex(result, { id: data[0].id });

            expect(data.length - 1).toEqual(result.length);
            expect(index).toBe(-1);
        });
    });
});
