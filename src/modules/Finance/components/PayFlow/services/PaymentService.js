/**
 * Service to handle payment detection and deep linking
 */

export const PAYMENT_METHODS = [
    {
        id: 'upi-chooser',
        name: 'All UPI Apps',
        description: 'Choose from installed apps',
        icon: '📱',
        platform: 'mobile',
        color: '#22c55e',
        textColor: '#ffffff',
        // Generic intent that forces OS picker
        scheme: 'upi://pay?pa=dummy@vpa&pn=Merchant&am=&cu=INR'
    },
    {
        id: 'gpay',
        name: 'Google Pay',
        icon: 'G',
        platform: 'all',
        color: '#ffffff',
        textColor: '#1f2937',
        scheme: 'tez://upi/pay?pa=&pn=&am=&cu=INR', // or googlepay://
        androidPackage: 'com.google.android.apps.nbu.paisa.user'
    },
    {
        id: 'phonepe',
        name: 'PhonePe',
        icon: 'P',
        platform: 'all',
        color: '#5f259f',
        textColor: '#ffffff',
        scheme: 'phonepe://'
    },
    {
        id: 'paytm',
        name: 'Paytm',
        icon: 'PY',
        platform: 'all',
        color: '#00baf2',
        textColor: '#ffffff',
        scheme: 'paytmmp://'
    },
    {
        id: 'cred',
        name: 'Zomato/Others',
        icon: '⚡',
        platform: 'mobile',
        color: '#000000',
        textColor: '#ffffff',
        scheme: 'upi://pay'
    }
];

class PaymentService {
    constructor() {
        this.canMakePayment = false;
        this.init();
    }

    async init() {
        if (window.PaymentRequest) {
            this.canMakePayment = true;
        }
    }

    /**
     * Get relevant apps for the device
     */
    getAvailableMethods() {
        // In a real PWA context, simply return all likely candidates.
        // We cannot detect installation status in web.
        // We relies on user knowing what they have.
        return PAYMENT_METHODS;
    }

    /**
     * Attempt to launch an app via Deep Link
     */
    async launchNativeApp(method, amount) {
        return new Promise((resolve, reject) => {
            if (!method.scheme) {
                reject({ message: 'No scheme found' });
                return;
            }

            // Construct the final URI
            // Note: For just "opening" the app to scan/pay manually, simple scheme works for some.
            // For creating a transaction, we need 'pa' (payee). 
            // Since user didn't specify payee, we'll try to just Open the App Home if possible,
            // or use a generic UPI intent that might open the app but show "Invalid VPA" or just the scanner.

            let url = method.scheme;

            // If it's a generic UPI link and we have an amount, try to prefill
            if (url.includes('upi://') || url.includes('tez://')) {
                // Without a valid PA (Payee Address), this might just fail or open the app in 'error' state.
                // However, 'phonepe://' just opens the app. 
                // We will prioritize just OPENING the app if the user just wants to "pay" (scan qr manually).

                // If scheme is specifically simple, use it.
                if (method.id === 'phonepe' || method.id === 'paytm') {
                    url = method.scheme;
                } else {
                    // For GPay/UPI, we might need dummy params to trigger the intent
                    // But user specifically asked "open that app".
                    // 'tez://' opens GPay India.
                }
            }

            // Attempt to open
            const start = Date.now();
            window.location.href = url;

            // Simple heuristic to detect "failure" (user is still here after 2s)
            // This is not perfect in a browser but works okay for "did it open?" feedback
            setTimeout(() => {
                if (document.hidden || Date.now() - start > 2200) {
                    resolve({ success: true });
                } else {
                    // User likely didn't leave the page (app didn't open)
                    resolve({ success: false, message: 'App did not open. Is it installed?' });
                }
            }, 2000);
        });
    }

    /**
     * Simulate processing (Fallback if app open isn't needed or for web flow)
     */
    async processPayment(methodId, amount) {
        // ... previous implementation ...
        return new Promise((resolve) => {
            const duration = 2000;
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toISOString()
                });
            }, duration);
        });
    }
}

export const paymentService = new PaymentService();
