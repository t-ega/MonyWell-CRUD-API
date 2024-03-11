import { Request, Response } from "express";
import argon2 from "argon2";
import NodeCache from "node-cache";

import db from "../db/knex";
import { DepositFundsDto } from "../dto/deposit.dto";
import { CreateTransferDto } from "../dto/transfer.dto";
import { WithdrawalDto } from "../dto/withdrawal.dto";
import { UpdateAccountDto } from "../dto/update-account.dto";
import ErrorFactory from "../utils/error-factory.factory";
import AccountRepository from "../repositories/account.repository";
import { validateTransfer } from "../validators/transfer.validator";
import { validateWithdrawal } from "../validators/withdrawal.validator";

class AccountsController {

    constructor(
        private accountsRepository : AccountRepository,
        private customCache : NodeCache
    ) {}
   
    /**
     * Handles transaction errors and sends an appropriate response
     * @param res The response object
     * @param error The error object
     * @returns JSON response containing error details
     */
    private async handleTransactionError(res: Response, error: any) {
        return res.status(400).json(ErrorFactory.getError(error));
    }

    /**
     * Caches the response if the idempotency key exists and a cached response is not found.
     * If a cached response exists for the idempotency key, it sends the cached response as the HTTP response.
     * Otherwise, it sets the response in the cache with the specified TTL (Time To Live) in seconds.
     * @param req Express Response object.
     * @param cacheKey Idempotency key extracted from the request headers.
     * @param response Response object to cache.
    */
    private cacheResponseIfKeyExists(req: Request, idempotencyKey: string, response: any): void {
        const userId = req.userId;
        
        if (idempotencyKey) {
            // there should be a uniform way to handle caching to differentiate different idempotency keys
            const cacheKey = `Bearer ${userId}-${idempotencyKey}`
            this.customCache.set(cacheKey, response, 21600);
        }
    }

    /**
     * Deposits funds into a user's account
     * @param req The request object
     * @param res The response object
     * @returns JSON response indicating success or failure of the deposit
     */
    deposit = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.userId as number;
        const { amount } = req.body as DepositFundsDto;
        const idempotencyKey = req.headers['idempotency-key'] as string;

        if (amount <= 0) return res.status(400).json(ErrorFactory.getError("Invalid amount"));

        // Find the account to deposit into
        const account = await this.accountsRepository.findByOwnerId(userId);
        if (!account) return res.status(404).json(ErrorFactory.getError("Bank account doesn't exist"));

        const updatedBalance = account.balance + amount;
        
        const updateDto = {
            balance: updatedBalance,
            owner: userId
        } as UpdateAccountDto;
        
        try {
            // Perform the deposit
            await db.transaction(async (trx) => {
                
                const depositResult = await this.accountsRepository.update(trx, updateDto);

                // Returns the number of affected rows, the deposit should affect only one row
                if(depositResult != 1) {
                    throw new Error("Deposit failed");                
                }
            })
        }
        catch(error) {
            return this.handleTransactionError(res, error);
        }

        const response = { success: true, details: { ...updateDto } }

        // cache the data in the cache store if an idempotency key is present
        this.cacheResponseIfKeyExists(req, idempotencyKey, response);
        return res.json(response);
    }

    /**
     * Transfers funds from one account to another
     * @param req The request object
     * @param res The response object
     * @returns JSON response indicating success or failure of the transfer
     */
    transfer = async (req: Request, res: Response): Promise<Response> => {
        const req_user_id = req.userId;

        const idempotencyKey = req.headers['idempotency-key'] as string;
        
        const { error, value }  = validateTransfer(req.body);

        if (error) {
            return res.status(400).json(ErrorFactory.getError(error.details[0].message))
        }

        const { source, amount, transaction_pin, destination } = value as CreateTransferDto;

        if (source === destination) {
            return res.status(400).json(ErrorFactory.getError("Sender and recipient account cannot be the same"));
        }

        const senderAccount = await this.accountsRepository.find(source);

        const recipientAccount = await this.accountsRepository.find(destination);


        // Check for various transfer conditions
        if (amount <= 0) {
            return res.status(400).json(ErrorFactory.getError("Invalid amount"));
        }
        
        if (!senderAccount || !recipientAccount) {
            return res.status(404).json(ErrorFactory.getError("One or both bank accounts do not exist."));
        }
        
        if (senderAccount.owner != req_user_id) {
            return res.status(400).json(ErrorFactory.getError("You are not allowed to transfer from this account" ));
        }
        
        if (senderAccount.balance < amount) {
            return res.status(400).json(ErrorFactory.getError("Insufficient funds in the sender account." ));
        }

        const isValid = await argon2.verify(transaction_pin, senderAccount.transaction_pin);

        if (!isValid) {
             return res.status(400).json(ErrorFactory.getError("Invalid transaction pin"));
        }

        // Ensure atomicity of the transfer
        try {
            // Perform the transfer
            await db.transaction(async (trx) => {

                const senderUpdatedBalance = senderAccount.balance - amount;
                const recipientUpdatedBalance = recipientAccount.balance + amount;

                const senderUpdateDto = {
                    balance: senderUpdatedBalance,
                    owner: senderAccount.owner
                } as UpdateAccountDto;

                const recipientUpdateDto = {
                    balance: recipientUpdatedBalance,
                    owner: recipientAccount.owner
                } as UpdateAccountDto;

                const senderUpdateResult = await this.accountsRepository.update(trx, senderUpdateDto);
                const recipientUpdateResult = await this.accountsRepository.update(trx, recipientUpdateDto);

                if (senderUpdateResult !== 1 || recipientUpdateResult !== 1) {
                    throw new Error("Deposit failed");                
                }

            })

            const response = { success: true, destination, source, amount }

            // cache the data in the cache store if an idempotency key is present
            this.cacheResponseIfKeyExists(req, idempotencyKey, response);
            return res.json(response);

        }
        catch(error) {
            return this.handleTransactionError(res, error);
        }
    }

    /**
     * Withdraws funds from an account
     * @param req The request object
     * @param res The response object
     * @returns JSON response indicating success or failure of the withdrawal
     */
    withdraw = async (req: Request, res: Response): Promise<Response> => {

        const idempotencyKey = req.headers['idempotency-key'] as string;

        // validate data
        const { error, value } = validateWithdrawal(req.body);

        if (error) {
            return res.status(400).json(ErrorFactory.getError(error.details[0].message));
        }

        const { source, amount, transaction_pin: pin,  destination, destinationBankName } = value as WithdrawalDto;
     
        // Fetch the source account
        const sourceAccount = await this.accountsRepository.find(source);
     
        // Check if source account exists and has sufficient balance and pin is valid
        if (!sourceAccount) {
            return res.status(404).json(ErrorFactory.getError("Source Bank account do not exist."));
        }

        if (sourceAccount.balance < amount) {
            return res.status(400).json(ErrorFactory.getError("Insufficient funds in the sender account." ));
        }

        const isValid = await argon2.verify(pin, sourceAccount.transaction_pin);

        if (!isValid) {
             return res.status(400).json(ErrorFactory.getError("Invalid transaction pin"));
        }

        try {
            // Perform the withdrawal
            await db.transaction(async (trx) => {
                const updatedBalance = sourceAccount.balance - amount;
               
                const updateDto = {
                    balance: updatedBalance,
                    owner: sourceAccount.owner
                } as UpdateAccountDto;

                const withdrawalResult = await this.accountsRepository.update(trx, updateDto);

                // Returns the number of affected rows, the withdrawal should affect only one row
                if(withdrawalResult !== 1){
                    throw new Error("Withdrawal failed");
                }

            });
            
            const response = { success: true, destination, source, amount, destinationBankName }

            // cache the data in the cache store if an idempotency key is present
            this.cacheResponseIfKeyExists(req, idempotencyKey, response);

            return res.json(response);
        }
        catch(error) {
            return this.handleTransactionError(res, error);
        }

    }
}

export default AccountsController;
