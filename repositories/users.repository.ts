import { Knex } from "knex";

import { User } from "knex/types/tables";
import db from "../db/knex";
import { CreateUserDto } from "../dto/create-user.dto";
import UserRepositoryInterface from "./user-repository-interface";

/**
 * UserRepository class encapsulates database operations related to users.
 * This is going to be injected into classess that needs it.
 */
class UserRepository implements UserRepositoryInterface {

    /**
     * Retrieves user details based on the user ID.
     * @param userId The ID of the user to retrieve.
     * @returns A Promise resolving to the user details if found, otherwise undefined.
     */
    async getUser(userId: number): Promise<Partial<User> | undefined>{
        return await db("users").select("id", "first_name", "last_name", "email", "phone_number")
            .where({ id: userId }).first();
    }

    /**
     * Checks if a user with the given email or phone number exists.
     * @param email The email address to check.
     * @param phoneNumber The phone number to check.
     * @returns A Promise resolving to the user ID if found, otherwise undefined.
     */
    getUserByEmailOrPhoneNumber = async (email?: string, phoneNumber?: string): Promise<Pick<User, "id"> | undefined> => {
        let query = db("users").select("id");

        if (email && phoneNumber) {
            query = query.where(function() {
                this.where("email", email).orWhere("phone_number", phoneNumber);
            });
        } else if (email) {
            const r = await query.where("email", email);
            console.log(r);
            console.log("d");
        } else if (phoneNumber) {
            query = query.where("phone_number", phoneNumber);
        } else {
            // Handle case when both email and phoneNumber are undefined
            return undefined;
        }
    
        return await query.first();
    }
    

    /**
     * Creates a new user in the database.
     * @param trx The Knex transaction object.
     * @param userDto The user data to insert.
     * @returns A Promise resolving to the created user object if successful, otherwise undefined.
     */
    async createUser(trx: Knex.Transaction, userDto: CreateUserDto) : Promise<User | undefined> {
        await trx("users").insert(userDto);
        const user = await trx("users").select().where({ email: userDto.email }).first();
        return user;
    }
}

export default UserRepository;
