import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("Users", function (table){
        table.increments("id").primary();
        table.string("first_name").notNullable();
        table.string("last_name").notNullable();
        table.string("email").notNullable();
        table.string("password").notNullable();
        table.string("phone_number").notNullable();
        table.timestamps(true, true);
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("Users");
}

