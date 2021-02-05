import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes';
import dbClient from './store/db';
import seedDb from './util/seedDb';

const PORT = process.env.APP_PORT || 8000;

const app = express();

dbClient.connect()
    .then(() => seedDb())
    .then((seedSuccessMsg: string) => console.log(`Connected to DB and ${seedSuccessMsg}`))
    .catch((err: Error) => console.log(err));

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());
app.use(routes);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
