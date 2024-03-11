/**
 * This is an internal interface that is used in the accounts repository
 * after a deposit, withdrawal, transfer has occured.
 */
export interface UpdateAccountDto {
    balance: number
    owner: number

}