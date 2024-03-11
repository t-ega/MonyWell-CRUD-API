
import { Knex } from "knex";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

declare module 'knex/types/tables' {
    interface User {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        created_at: Date;
        updated_at: Date;
    }

    interface Account {
      owner: number
      account_number: number
      balance: number
      transaction_pin: string // so we can hash it
    }

  interface Tables {
    users: User,
    accounts: Account,
    }
}
