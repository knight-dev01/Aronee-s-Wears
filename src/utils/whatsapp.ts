import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function logWhatsAppRedirect(source: string, details?: string) {
  try {
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email || 'guest_user';
    const userName = currentUser?.displayName || 'Guest Client';
    const userId = currentUser?.uid || 'guest_id';

    await addDoc(collection(db, 'adminNotifications'), {
      to: 'greatifet12@gmail.com',
      subject: `📢 WhatsApp Redirection: ${source}`,
      body: `Hello Admin, a client has clicked to redirect to WhatsApp.\n\nContext Source: ${source}\nClient Name: ${userName}\nClient Email: ${userEmail}\nClient UID: ${userId}\nDetails: ${details || 'General support chat inquiry'}\nLogged At: ${new Date().toLocaleString()}`,
      status: 'pending',
      createdAt: serverTimestamp(),
      userId,
      userEmail
    });
    console.log(`WhatsApp redirection from ${source} logged for admin notification.`);
  } catch (error) {
    console.error('Failed to log admin notification for WhatsApp redirect:', error);
  }
}
