export interface CreateTransferDto {
    source: number
    destination: number
    amount: number
    transaction_pin: string
}