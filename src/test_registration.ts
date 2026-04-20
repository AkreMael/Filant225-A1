import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, terminate } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  console.log("Starting test registration...");
  
  const timeout = setTimeout(() => {
    console.error("Test timed out after 30 seconds");
    process.exit(1);
  }, 30000);

  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Signed in anonymously as:", userCredential.user.uid);

    const testData = {
      name: "Test User " + Date.now(),
      phone: "00000000",
      city: "Abidjan",
      job: "Testeur",
      experience: "5 ans",
      description: "Ceci est une inscription de test pour vérifier la synchronisation.",
      typeInscription: "Travailleur",
      status: "pending",
      createdAt: new Date(), // Use JS Date instead of serverTimestamp for simplicity in test script
      userId: userCredential.user.uid
    };

    const docRef = await addDoc(collection(db, 'travailleurs'), testData);
    console.log("Registration successful! ID:", docRef.id);
    
    // Check if it's there
    const q = query(collection(db, 'travailleurs'), where('name', '==', testData.name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      console.log("Verification successful: Document found in Firestore.");
    } else {
      console.log("Verification failed: Document not found.");
    }
    
    clearTimeout(timeout);
    await terminate(db);
    process.exit(0);
  } catch (error) {
    console.error("Error during test registration:", error);
    process.exit(1);
  }
}

runTest();
