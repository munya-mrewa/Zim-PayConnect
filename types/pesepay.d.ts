declare module "pesepay" {
    export interface Transaction {
        amountDetails: {
            amount: number;
            currencyCode: string;
        };
        transactionType: string;
        reasonForPayment: string;
        merchantReference: string;
    }

    export class PesepayResponse {
        success: boolean;
        message: string;
        referenceNumber: string;
        pollUrl: string;
        redirectUrl: string;
        paid: boolean;

        constructor(
            success: boolean, 
            message: string, 
            referenceNumber: string, 
            pollUrl: string, 
            redirectUrl: string, 
            paid: boolean
        );
    }

    export class Pesepay {
        resultUrl: string;
        returnUrl: string;

        constructor(integrationKey: string, encryptionKey: string);

        createTransaction(
            amount: number, 
            currencyCode: string, 
            paymentReason: string, 
            merchantReference?: string
        ): Transaction;

        initiateTransaction(transaction: Transaction): Promise<PesepayResponse>;

        pollTransaction(pollUrl: string): Promise<PesepayResponse>;
        
        checkPayment(referenceNumber: string): Promise<PesepayResponse>;
    }
}
