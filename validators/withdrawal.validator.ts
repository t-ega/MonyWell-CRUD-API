import Joi from 'joi';
import { WithdrawalDto } from '../dto/withdrawal.dto';

export const Schema = Joi.object({
  source: Joi.number().required(),
  amount: Joi.number().required(),
  destination: Joi.number().required(),
  transaction_pin: Joi.string().required().messages({"any.only": "You must have a pin"}).min(4),
  destinationBankName: Joi.string().required(),
});

export const validateWithdrawal = (withdrawal: WithdrawalDto): Joi.ValidationResult => {
  return Schema.validate(withdrawal);
};
