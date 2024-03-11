export interface WithdrawalDto {

    source: number,  
    amount:  number,
    destination: number,
    transaction_pin: string,
    destinationBankName: string

}