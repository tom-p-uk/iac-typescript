export const DBSeedException = new Error('DB could not be seeded at this time.');
export const DBReadException = new Error('There was a problem retrieving results from the DB.');
export const DBUpdateException = new Error('There was a problem updating the DB.');
export const DBWriteException = new Error('There was a problem writing to the DB.');

export type DBErrorType =
    typeof DBSeedException |
    typeof DBReadException |
    typeof DBUpdateException |
    typeof DBWriteException;
