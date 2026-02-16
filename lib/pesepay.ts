import { Pesepay, Transaction, PesepayResponse } from "pesepay";

// Mock Pesepay for development
class MockPesepay {
  resultUrl: string = "";
  returnUrl: string = "";

  constructor(public integrationKey: string, public encryptionKey: string) {}

  createTransaction(amount: number, currencyCode: string, paymentReason: string, merchantReference?: string): Transaction {
    return {
      amountDetails: {
        amount,
        currencyCode,
      },
      transactionType: 'payment',
      reasonForPayment: paymentReason,
      merchantReference: merchantReference || "mock_ref_" + Date.now(),
    };
  }

  async initiateTransaction(transaction: Transaction): Promise<PesepayResponse> {
    console.log("Mock Pesepay: Initiating transaction", transaction);
    const success = true;
    const message = "Mock transaction initiated";
    const referenceNumber = "mock_pesepay_ref_" + Date.now();
    const pollUrl = `${this.resultUrl}?reference=${transaction.merchantReference}&pollurl=mock_poll_url`;
    const redirectUrl = `${this.returnUrl}?payment=success&reference=${transaction.merchantReference}`;
    const paid = false;

    return new PesepayResponse(success, message, referenceNumber, pollUrl, redirectUrl, paid);
  }

  async pollTransaction(pollUrl: string): Promise<PesepayResponse> {
    console.log("Mock Pesepay: Polling transaction", pollUrl);
    // Simulate paid
    return new PesepayResponse(true, "Paid", "mock_ref", pollUrl, "", true);
  }

  async checkPayment(referenceNumber: string): Promise<PesepayResponse> {
      console.log("Mock Pesepay: Check Payment", referenceNumber);
      return new PesepayResponse(true, "Paid", referenceNumber, "", "", true);
  }
}

export const getPesepay = () => {
  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY;
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY;

  // Check for placeholder or missing credentials
  const isDev = process.env.NODE_ENV !== "production";
  // Relaxed check for dev
  const isPlaceholder = integrationKey === "12345" || !integrationKey; 

  if (isDev && (!integrationKey || !encryptionKey || isPlaceholder)) {
    console.warn("Using Mock Pesepay for development (invalid/missing credentials detected).");
    const mock = new MockPesepay("mock_key", "mock_enc_key");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    mock.resultUrl = `${appUrl}/api/webhooks/pesepay`;
    mock.returnUrl = `${appUrl}/settings?payment=return`;
    return mock as unknown as Pesepay;
  }

  if (!integrationKey || !encryptionKey) {
    throw new Error("Missing Pesepay environment variables: PESEPAY_INTEGRATION_KEY or PESEPAY_ENCRYPTION_KEY");
  }

  const pesepay = new Pesepay(
    integrationKey,
    encryptionKey
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`;
  pesepay.returnUrl = `${appUrl}/settings?payment=return`; 

  return pesepay;
};
