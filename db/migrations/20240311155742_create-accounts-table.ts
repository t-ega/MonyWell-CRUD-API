import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("account_types", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("description").notNullable();
        table.timestamps(true, true);
    }).createTable("accounts", (table) => {
        table.foreign("account_type").references("id").inTable("account_types");
        table.integer("owner").unsigned().notNullable();
        table.string("account_number").notNullable().unique();
        table.string("transaction_pin").notNullable();
        table.timestamps(true, true);
        table.foreign("owner").references("id").inTable("users");
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("accounts").dropTable("account_types");
}

