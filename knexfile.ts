import type { Knex } from "knex";
import { configDotenv } from "dotenv";

configDotenv();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql", 
    connection: process.env.DATABASE_URL, 

    acquireConnectionTimeout: 10000,
    
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/db/migrations",
    },

    seeds: {
      directory: __dirname + "db/seeds",
    },
  },

  production: {
    client: "mysql",

    connection: process.env.DATABASE_URL,

    migrations: {
      directory: __dirname + "/db/migrations",
    },

    acquireConnectionTimeout: 20000,

    seeds: {
      directory: __dirname + "db/seeds",
    }

  }

};

export default config;
