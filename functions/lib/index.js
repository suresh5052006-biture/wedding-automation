"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPaymentReminders = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Scheduled function to check payment reminders daily at 8 AM IST (2:30 AM UTC)
exports.checkPaymentReminders = functions.pubsub
    .schedule('30 2 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysTimestamp = admin.firestore.Timestamp.fromDate(threeDaysFromNow);
    try {
        // Query all weddings
        const weddingsSnapshot = await db.collection('weddings').get();
        const remindersToSend = [];
        for (const weddingDoc of weddingsSnapshot.docs) {
            const weddingData = weddingDoc.data();
            const weddingId = weddingDoc.id;
            // Get all vendors for this wedding
            const vendorsSnapshot = await db
                .collection('weddings')
                .doc(weddingId)
                .collection('vendors')
                .get();
            for (const vendorDoc of vendorsSnapshot.docs) {
                const vendorData = vendorDoc.data();
                const payments = vendorData.payments || [];
                for (let i = 0; i < payments.length; i++) {
                    const payment = payments[i];
                    // Check if payment is pending, due within 3 days, and not yet reminded
                    if (payment.status === 'pending' &&
                        payment.dueDate &&
                        payment.dueDate.toMillis() <= threeDaysTimestamp.toMillis() &&
                        payment.dueDate.toMillis() >= now.toMillis() &&
                        !payment.remindedAt) {
                        remindersToSend.push({
                            plannerId: weddingData.plannerId,
                            weddingId,
                            weddingName: weddingData.coupleName,
                            vendorName: vendorData.name,
                            vendorPhone: vendorData.phone,
                            amount: payment.amount,
                            dueDate: payment.dueDate,
                            milestone: payment.milestone,
                        });
                        // Update remindedAt to prevent duplicate reminders
                        const paymentPath = `payments.${i}.remindedAt`;
                        await vendorDoc.ref.update({
                            [paymentPath]: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                }
            }
        }
        // Log reminders (to be wired with WhatsApp Business API via n8n)
        if (remindersToSend.length > 0) {
            const batch = db.batch();
            for (const reminder of remindersToSend) {
                const reminderRef = db.collection('reminders_sent').doc();
                batch.set(reminderRef, Object.assign(Object.assign({}, reminder), { sentAt: admin.firestore.FieldValue.serverTimestamp(), status: 'logged' }));
            }
            await batch.commit();
            console.log(`Logged ${remindersToSend.length} payment reminders`);
        }
        else {
            console.log('No payment reminders due');
        }
        return null;
    }
    catch (error) {
        console.error('Error checking payment reminders:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map