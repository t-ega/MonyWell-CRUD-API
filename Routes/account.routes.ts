// routes/accounts.routes.js

// This file defines the routes for handling account-related operations such as deposit, transfer, and withdrawal.

import express from 'express';

import AccountController from '../controllers/account.controller';
import AccountRepository from '../repositories/account.repository';
import customCache from '../utils/custom-cache';

const Router = express.Router();

const accountsRepository = new AccountRepository();
const accountsController = new AccountController(accountsRepository, customCache);

Router.post("/deposit",  accountsController.deposit);
Router.post("/transfer", accountsController.transfer);
Router.post("/withdraw",  accountsController.withdraw);

export default Router;