/**
 * An error of a create run with a name the page turns into a plain sentence
 * (see TxStatus). Nothing was sent when one of these is thrown.
 */
export class CreateRunError extends Error {
  readonly errorName: string;
  constructor(errorName: string, message: string) {
    super(message);
    this.name = "CreateRunError";
    this.errorName = errorName;
  }
}

/**
 * A create run belongs to the wallet that started it: an acceptance or approval
 * signed by another account would be paid for and useless.
 */
export function assertRunWallet(runWallet: string, account: string): void {
  if (runWallet.toLowerCase() !== account.toLowerCase()) {
    throw new CreateRunError("wrongAccount", `this run belongs to ${runWallet}`);
  }
}
