import moment from 'moment';
import {ISlotData} from "../models/slots";

const generateMockData = (numToGenerate: number, makeSlotsAvailable: boolean = true): ISlotData[] => {
    const rows = [];

    for (let i = 1; i <= numToGenerate; i++) {
        const row: ISlotData = {
            id: i,
            date: moment().add(i, 'days').format('YYYY-MM-DD'),
            am: makeSlotsAvailable,
            pm: makeSlotsAvailable,
            eve: makeSlotsAvailable,
            special_delivery: false,
            is_second_friday: false,
            full_count: numToGenerate
        };

        rows.push(row);
    };

    return rows;
};

export default generateMockData;
