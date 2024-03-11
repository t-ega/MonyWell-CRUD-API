import { Knex } from "knex";
import { User } from "knex/types/tables";

export default interface UserRepositoryInterface {
    getUser(userId: number): Promise<Partial<User> | undefined>;
    getUserByEmailOrPhoneNumber(email?: string, phoneNumber?: string): Promise<Pick<User, "id"> | undefined>;
    createUser(trx: Knex.Transaction, userDto: object) : Promise<User | undefined>;
}