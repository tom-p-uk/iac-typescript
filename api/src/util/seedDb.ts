import moment from 'moment';
import dbClient from '../store/db';

const today = moment().format('YYYY-MM-DD'); 
const inFourWeeks = moment().add(4, 'weeks').format('YYYY-MM-DD');

const teardownQuery = 'DROP TABLE IF EXISTS slots';
const seedQuery = `
    CREATE TABLE IF NOT EXISTS slots (
        id SERIAL,
        date DATE,
        am BOOLEAN DEFAULT TRUE,
        pm BOOLEAN DEFAULT TRUE,
        eve BOOLEAN DEFAULT TRUE,
        special_delivery BOOLEAN DEFAULT FALSE,
        is_second_friday BOOLEAN DEFAULT FALSE
    );


    INSERT INTO slots
    (date)
    (
        WITH date_series AS
        (
            SELECT date, extract(DOW FROM date) dow
            FROM generate_series(
                TIMESTAMP '${today}',
                TIMESTAMP  '${inFourWeeks}',
                INTERVAL  '1 day'
            ) date
        )

        SELECT date
        FROM date_series
        WHERE dow NOT IN (0)
    );


    UPDATE slots
    SET am = FALSE, is_second_friday = TRUE
    WHERE id in (
        SELECT a.id FROM (
        
            SELECT b.id, b.row_num FROM (
            
                SELECT id, row_number() OVER(ORDER BY date ASC) AS row_num
                FROM  slots
                WHERE extract(dow from date) = 5

            ) b
            WHERE b.row_num % 2 = 0
        ) a
    );
`;

const seedDb = () => dbClient.query(teardownQuery)
    .then(() => dbClient.query(seedQuery))
    .then(() => 'seeded DB succesfully');

export default seedDb;
