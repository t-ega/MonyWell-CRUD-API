import { config } from "dotenv";
import knex from "knex";

import knexConfig from "../knexfile";

// initialize the environment variables
config();

const { NODE_ENV} = process.env;
const environment = NODE_ENV || "development";

const db = knex(knexConfig[environment]);

export default db;