import {QueryResult} from 'pg';

import slotsModel, {ISlotData}  from '../../models/slots';
import {DBReadException, DBUpdateException} from '../../errors';

const getSlots = (offset: string, limit: string): Promise<ISlotData[]> => {
    const offsetParsed = offset ? parseInt(offset) : 0;
    const limitParsed = limit ? parseInt(limit) : 3;

    return slotsModel.getSlots(offsetParsed, limitParsed)
        .then((result: QueryResult<ISlotData>) => {
            if (result.rows.length === limitParsed) {
                return removeFirstDayIfNoSlots(result.rows);
            }

            return slotsModel.getFinalSlots(limitParsed)
                .then((result: QueryResult<ISlotData>) => removeFirstDayIfNoSlots(result.rows.reverse()));
        })
        .catch((err: Error) => {
            console.log('ERROR:', err);
            throw DBReadException;
        });
};

const removeFirstDayIfNoSlots = (data: ISlotData[]): ISlotData[] => {
    const first = data[0];

    if (!first.am && !first.pm && !first.eve) {
        return data.slice(1);
    }

    return data;
};

const selectSlot = (id: string, time: string): Promise<ISlotData[]> => {
    return slotsModel.selectSlot(id, time)
        .then((result: QueryResult<ISlotData>) => result.rows)
        .catch((err: Error) => {
            console.log('ERROR:', err);
            throw DBUpdateException;
        });
};

const selectSpecialDelivery = (): Promise<ISlotData[]> => {
    return slotsModel.selectSpecialDelivery()
        .then((result: QueryResult<ISlotData>) => result.rows)
        .catch((err: Error) => {
            console.log('ERROR:', err);
            throw DBUpdateException;
        });
};

export default {
    getSlots,
    removeFirstDayIfNoSlots,
    selectSlot,
    selectSpecialDelivery
}
