import { QueryResult } from "pg";
import dbClient from '../../store/db';

export interface ISlotData {
    id: number,
    date: string,
    am: boolean,
    pm: boolean,
    eve: boolean,
    special_delivery: boolean,
    is_second_friday: boolean,
    full_count: number
}

const getSlots = (offset: number = 0, limit: number = 3): Promise<QueryResult<ISlotData>> => {
    const query = `
        SELECT *, count(*) OVER() AS full_count
        FROM slots
        WHERE EXTRACT(dow FROM date) NOT IN (0)
        ORDER BY date ASC
        OFFSET $1
        LIMIT $2
    `;

    return dbClient.query(query, [offset * limit, limit]);
};

const getFinalSlots = (limit: number = 3): Promise<QueryResult<ISlotData>> => {
    const query = `
        SELECT *, count(*) OVER() AS full_count
        FROM slots
        WHERE EXTRACT(dow FROM date) NOT IN (0)
        ORDER BY date DESC
        LIMIT $1
    `;

    return dbClient.query(query, [limit]);
};

const selectSlot = (id: string, time: string): Promise<QueryResult<ISlotData>> => {
    const query = `
        UPDATE slots
        SET ${time} = NOT ${time}
        WHERE slots.id = $1
        RETURNING *;
    `;

    return dbClient.query(query, [id]);
};

const selectSpecialDelivery = (): Promise<QueryResult<ISlotData>> => {
    const query = `
        UPDATE slots
        SET special_delivery = NOT special_delivery
        WHERE EXTRACT(dow FROM date) IN (3)
        RETURNING *;
    `;

    return dbClient.query(query);
};

export default {
    getSlots,
    getFinalSlots,
    selectSlot,
    selectSpecialDelivery
}
