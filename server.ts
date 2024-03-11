import express from 'express';
import { config } from "dotenv";
import "express-async-errors";

config();

const app = express();
const { PORT } = process.env;


app.use(express.json());




app.listen(PORT || 3000, () => {
    console.log(`Server is running on ${PORT || 3000}`);
});

export default app;
