export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class InsufficientBalanceError extends TransactionError {
  constructor(message: string = 'Insufficient balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidAmountError extends TransactionError {
  constructor(message: string = 'Invalid amount') {
    super(message);
    this.name = 'InvalidAmountError';
  }
}

export class UserNotFoundError extends TransactionError {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
} 