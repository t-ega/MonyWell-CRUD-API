
import { Knex } from "knex";
import { Account } from "knex/types/tables";

export default interface AccountRepositoryInterface {

  generateAccountNumber(): number;
  find(account_number: number): Promise<Account | undefined>;
  create(trx: Knex.Transaction, data: object): Promise<Account | undefined>;
  update(trx: Knex.Transaction, data: object): Promise<number>;
}