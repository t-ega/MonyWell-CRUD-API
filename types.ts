
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

  interface Tables {
    users: User
    }
}
