import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    serverTimestamp,
    runTransaction 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAol2UzQWdFPyTeWhlfK7HTXxMpsuXnSFk",
    authDomain: "final-78170.firebaseapp.com",
    projectId: "final-78170",
    storageBucket: "final-78170.firebasestorage.app",
    messagingSenderId: "374288155367",
    appId: "1:374288155367:web:94a49f3b204dfa2efc5842",
    measurementId: "G-9GM80JWP3C"
};

let auth, db, storage;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    showMessage('Firebase initialized successfully', 'success');
} catch (error) {
    showMessage('Failed to initialize Firebase: ' + error.message, 'error');
}

// DOM Elements
const authContainer = document.getElementById('authContainer');
const dashboard = document.getElementById('dashboard');
const profilePage = document.getElementById('profilePage');
const gameHistoryPage = document.getElementById('gameHistoryPage');
const friendsPage = document.getElementById('friendsPage');
const gamePage = document.getElementById('gamePage');
const gameRoom = document.getElementById('gameRoom');
const waitingArea = document.getElementById('waitingArea');
const formTitle = document.getElementById('formTitle');
const authButton = document.getElementById('authButton');
const toggleAuth = document.getElementById('toggleAuth');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usernameInput = document.getElementById('username');
const userDisplay = document.getElementById('userDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const profilePicCircle = document.getElementById('profilePicCircle');
const profilePicInput = document.getElementById('profilePicInput');
const gameHistoryBtn = document.getElementById('gameHistoryBtn');
const backToDashboardFromProfile = document.getElementById('backToDashboardFromProfile');
const historyContainer = document.getElementById('historyContainer');
const statsSummary = document.getElementById('statsSummary');
const backToProfile = document.getElementById('backToProfile');
const playButton = document.getElementById('playButton');
const winButton = document.getElementById('winButton');
const friendsBtn = document.getElementById('friendsBtn');
const logoutButton = document.getElementById('logoutButton');
const playRandom = document.getElementById('playRandom');
const backToDashboard = document.getElementById('backToDashboard');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const gameStatus = document.getElementById('gameStatus');
const gameBoard = document.getElementById('gameBoard');
const leaveRoom = document.getElementById('leaveRoom');
const playersDisplay = document.getElementById('playersDisplay');
const verifyEmailPrompt = document.getElementById('verifyEmailPrompt');
const resendVerification = document.getElementById('resendVerification');
const profileBtn = document.getElementById('profileBtn');
const friendsTab = document.getElementById('friendsTab');
const addFriendTab = document.getElementById('addFriendTab');
const requestsTab = document.getElementById('requestsTab');
const friendsList = document.getElementById('friendsList');
const friendSearch = document.getElementById('friendSearch');
const searchFriend = document.getElementById('searchFriend');
const searchResults = document.getElementById('searchResults');
const friendRequests = document.getElementById('friendRequests');
const backToDashboardFromFriends = document.getElementById('backToDashboardFromFriends');

// Initialize Containers
function initializeContainers() {
    const containers = [authContainer, dashboard, profilePage, gameHistoryPage, friendsPage, gamePage, gameRoom, waitingArea];
    containers.forEach(c => c && (c.style.display = 'none'));
    authContainer.style.display = 'block';
    showMessage('Application loaded', 'success');
}
initializeContainers();

let isSignUp = true;
let currentRoomId = null;
let currentPlayer = null;
let opponentUsername = null;
let unsubscribeRoom = null;
let lastSaveTime = 0;

// Show Message
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    msgDiv.style.opacity = '1';
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// Show/Hide Containers
function showContainer(container) {
    const containers = [authContainer, dashboard, profilePage, gameHistoryPage, friendsPage, gamePage, gameRoom, waitingArea];
    containers.forEach(c => c && (c.style.display = 'none'));
    container.style.display = 'block';
    if (container === gamePage) {
        playRandom.disabled = false;
    }
    showMessage(`Navigated to ${container.id}`, 'success');
}

// Update Profile UI
function updateProfileUI(username, avatarUrl) {
    if (!profileBtn || !profilePicCircle) {
        showMessage('Profile elements not found', 'error');
        return;
    }
    if (avatarUrl) {
        profileBtn.style.backgroundImage = `url(${avatarUrl})`;
        profilePicCircle.style.backgroundImage = `url(${avatarUrl})`;
    } else {
        const firstLetter = username.charAt(0).toUpperCase() || 'P';
        const canvas = document.createElement('canvas');
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff004d';
        ctx.fill();
        ctx.font = 'bold 60px Impact';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, size / 2, size / 2);
        const canvasUrl = canvas.toDataURL();
        profileBtn.style.backgroundImage = `url(${canvasUrl})`;
        profilePicCircle.style.backgroundImage = `url(${canvasUrl})`;
    }
    profileBtn.style.color = 'transparent';
    profilePicCircle.style.color = 'transparent';
    profileBtn.style.backgroundSize = 'cover';
    profileBtn.style.border = '3px solid #ff004d';
    profilePicCircle.style.backgroundSize = 'cover';
    profilePicCircle.style.border = '3px solid #ff004d';
    userDisplay.textContent = username;
    usernameDisplay.textContent = username;
    showMessage('Profile UI updated', 'success');
}

// Update Balance UI
async function updateBalanceUI() {
    const user = auth.currentUser;
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const coins = userDoc.exists() ? userDoc.data().coins || 0 : 0;
        document.querySelector('.balance-box').textContent = `₹${coins}`;
        showMessage('Balance updated', 'success');
    }
}

// Check Username Availability
async function checkUsernameAvailability(username) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
        return { available: false, message: 'Username cannot be empty' };
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
        return { available: false, message: 'Username must be 3-20 characters, letters, numbers, or underscores only' };
    }
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase().trim()));
    if (usernameDoc.exists()) {
        return { available: false, message: 'Username is already taken' };
    }
    return { available: true };
}

// Save Username
async function saveUsername(userId, username) {
    const normalizedUsername = username.toLowerCase().trim();
    const check = await checkUsernameAvailability(username);
    if (!check.available) {
        throw new Error(check.message);
    }
    const usernameRef = doc(db, 'usernames', normalizedUsername);
    await setDoc(usernameRef, {
        userId,
        createdAt: serverTimestamp()
    });
    showMessage('Username saved', 'success');
}

// Delete Username
async function deleteUsername(userId, username) {
    const normalizedUsername = username.toLowerCase().trim();
    const usernameRef = doc(db, 'usernames', normalizedUsername);
    const usernameDoc = await getDoc(usernameRef);
    if (usernameDoc.exists() && usernameDoc.data().userId === userId) {
        await deleteDoc(usernameRef);
        showMessage('Username deleted', 'success');
    }
}

// Save Profile
async function saveProfile(username, oldUsername = null, isSignUp = false) {
    const now = Date.now();
    if (now - lastSaveTime < 500) {
        showMessage('Please wait before saving again', 'error');
        return;
    }
    lastSaveTime = now;
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        return;
    }
    if (!isSignUp && !user.emailVerified) {
        showMessage('Please verify your email first', 'error');
        return;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
            username,
            avatarUrl: null
        };
        await saveUsername(user.uid, username);
        if (oldUsername && oldUsername !== username) {
            await deleteUsername(user.uid, oldUsername);
        }
        await setDoc(userDocRef, {
            ...userData,
            stats: { wins: 0, losses: 0, ties: 0 },
            coins: 100
        }, { merge: true });
        updateProfileUI(username, null);
        await updateBalanceUI();
        showMessage('Profile updated!', 'success');
    } catch (error) {
        showMessage(`Error saving profile: ${error.message}`, 'error');
        throw error;
    }
}

// Profile Picture Click
profilePicCircle?.addEventListener('click', () => {
    profilePicInput?.click();
    showMessage('Opening gallery for profile picture', 'success');
});

// Profile Picture Change
profilePicInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        return;
    }
    try {
        const storageRef = ref(storage, `profile_pics/${user.uid}`);
        await uploadBytes(storageRef, file);
        const avatarUrl = await getDownloadURL(storageRef);
        await setDoc(doc(db, 'users', user.uid), { avatarUrl }, { merge: true });
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        updateProfileUI(userDoc.data().username || 'Player', avatarUrl);
        showMessage('Profile picture updated!', 'success');
    } catch (error) {
        showMessage(`Error uploading profile picture: ${error.message}`, 'error');
    }
    profilePicInput.value = '';
});

// Username Editing
usernameDisplay?.addEventListener('click', () => {
    usernameDisplay.contentEditable = 'true';
    usernameDisplay.focus();
    showMessage('Editing username', 'success');
});

usernameDisplay?.addEventListener('blur', async () => {
    usernameDisplay.contentEditable = 'false';
    const newUsername = usernameDisplay.textContent.trim();
    if (!newUsername) {
        showMessage('Please enter a username', 'error');
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        usernameDisplay.textContent = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
        return;
    }
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const oldUsername = userDoc.exists() ? userDoc.data().username : null;
    await saveProfile(newUsername, oldUsername);
});

usernameDisplay?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        usernameDisplay.blur();
    }
});

// Profile Button
profileBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
        const avatarUrl = userDoc.exists() ? userDoc.data().avatarUrl : null;
        usernameDisplay.textContent = username;
        updateProfileUI(username, avatarUrl);
        showContainer(profilePage);
    } catch (error) {
        showMessage(`Error loading profile: ${error.message}`, 'error');
    }
});

// Back to Dashboard from Profile
backToDashboardFromProfile?.addEventListener('click', () => {
    showContainer(dashboard);
});

// Game History Button
gameHistoryBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const stats = userDoc.exists() && userDoc.data().stats ? userDoc.data().stats : { wins: 0, losses: 0, ties: 0 };
        const historyQuery = query(collection(db, `users/${user.uid}/gameHistory`));
        const historyDocs = await getDocs(historyQuery);
        historyContainer.innerHTML = '';
        historyDocs.forEach(doc => {
            const game = doc.data();
            const date = game.timestamp?.toDate ? game.timestamp.toDate() : new Date();
            const formattedDate = date.toLocaleString('en-US', {
                month: 'long',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const box = document.createElement('div');
            box.className = `history-box ${game.result === 'win' ? 'win' : 'loss-tie'}`;
            box.innerHTML = `
                <p>Opponent: ${game.opponentUsername || 'Unknown'}</p>
                <p>Result: ${game.result.charAt(0).toUpperCase() + game.result.slice(1)}</p>
                <p>Time: ${formattedDate}</p>
            `;
            historyContainer.appendChild(box);
        });
        statsSummary.textContent = `Total Matches: Wins ${stats.wins}, Losses ${stats.losses}, Ties ${stats.ties}`;
        showContainer(gameHistoryPage);
    } catch (error) {
        showMessage(`Error loading game history: ${error.message}`, 'error');
    }
});

// Back to Profile
backToProfile?.addEventListener('click', () => {
    showContainer(profilePage);
});

// Friends Button
friendsBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        showContainer(friendsPage);
        loadFriendsTab();
    } catch (error) {
        showMessage(`Error loading friends: ${error.message}`, 'error');
    }
});

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
        if (btn.dataset.tab === 'friends') loadFriendsTab();
        else if (btn.dataset.tab === 'add-friend') loadAddFriendTab();
        else if (btn.dataset.tab === 'requests') loadRequestsTab();
        showMessage(`Switched to ${btn.dataset.tab} tab`, 'success');
    });
});

// Load Friends Tab
async function loadFriendsTab() {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        return;
    }
    let unsubscribe = null;
    try {
        friendsList.innerHTML = '';
        const friendsQuery = query(collection(db, `users/${user.uid}/friends`));
        unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
            friendsList.innerHTML = '';
            if (snapshot.empty) {
                friendsList.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">No friends yet.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const friend = doc.data();
                const friendBox = document.createElement('div');
                friendBox.className = 'friend-box';
                friendBox.innerHTML = `
                    <p>Username: ${friend.username}</p>
                    <button class="action-btn" data-friend-id="${doc.id}" data-username="${friend.username}">Remove Friend</button>
                `;
                friendsList.appendChild(friendBox);
            });

            friendsList.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        const friendId = btn.dataset.friendId;
                        const friendUsername = btn.dataset.username;
                        const friendDoc = await getDoc(doc(db, 'usernames', friendUsername.toLowerCase()));
                        if (friendDoc.exists()) {
                            const friendUserId = friendDoc.data().userId;
                            await deleteDoc(doc(db, `users/${user.uid}/friends`, friendId));
                            await deleteDoc(doc(db, `users/${friendUserId}/friends`, user.uid));
                            showMessage(`Removed ${friendUsername} from friends`, 'success');
                        }
                    } catch (error) {
                        showMessage(`Error removing friend: ${error.message}`, 'error');
                    }
                });
            });
        });
    } catch (error) {
        showMessage(`Error loading friends: ${error.message}`, 'error');
    }
    friendsPage.addEventListener('unload', () => unsubscribe && unsubscribe(), { once: true });
}

// Load Add Friend Tab
async function loadAddFriendTab() {
    searchResults.innerHTML = '';
    friendSearch.value = '';
    showMessage('Add friend tab loaded', 'success');
}

// Search Friend
searchFriend?.addEventListener('click', async () => {
    const searchTerm = friendSearch.value.trim();
    if (!searchTerm) {
        showMessage('Please enter a username', 'error');
        return;
    }
    try {
        const usernameDoc = await getDoc(doc(db, 'usernames', searchTerm.toLowerCase()));
        if (!usernameDoc.exists()) {
            searchResults.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">User not found.</p>';
            return;
        }
        const user = auth.currentUser;
        const foundUserId = usernameDoc.data().userId;
        if (foundUserId === user.uid) {
            searchResults.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">You cannot add yourself.</p>';
            return;
        }
        const friendDoc = await getDoc(doc(db, `users/${user.uid}/friends`, foundUserId));
        if (friendDoc.exists()) {
            searchResults.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">Already friends.</p>';
            return;
        }
        const outgoingRequestQuery = query(
            collection(db, `users/${user.uid}/friendRequests`),
            where('toUserId', '==', foundUserId),
            where('status', '==', 'pending')
        );
        const incomingRequestQuery = query(
            collection(db, `users/${user.uid}/friendRequests`),
            where('fromUserId', '==', foundUserId),
            where('status', '==', 'pending')
        );
        const [outgoingDocs, incomingDocs] = await Promise.all([
            getDocs(outgoingRequestQuery),
            getDocs(incomingRequestQuery)
        ]);
        if (!outgoingDocs.empty) {
            searchResults.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">Request already sent.</p>';
            return;
        }
        if (!incomingDocs.empty) {
            searchResults.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">Check pending requests.</p>';
            return;
        }
        searchResults.innerHTML = '';
        const resultBox = document.createElement('div');
        resultBox.className = 'result-box';
        resultBox.innerHTML = `
            <p>Username: ${searchTerm}</p>
            <button class="action-btn" data-user-id="${foundUserId}" data-username="${searchTerm}">Send Friend Request</button>
        `;
        searchResults.appendChild(resultBox);

        resultBox.querySelector('.action-btn').addEventListener('click', async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const fromUsername = userDoc.data().username;
                const requestData = {
                    fromUserId: user.uid,
                    fromUsername,
                    toUserId: foundUserId,
                    toUsername: searchTerm,
                    status: 'pending',
                    createdAt: serverTimestamp()
                };
                const requestRef = await addDoc(collection(db, `users/${foundUserId}/friendRequests`), requestData);
                await setDoc(doc(db, `users/${user.uid}/friendRequests`, requestRef.id), requestData);
                showMessage(`Friend request sent to ${searchTerm}!`, 'success');
                searchResults.innerHTML = '';
                friendSearch.value = '';
            } catch (error) {
                showMessage(`Error sending request: ${error.message}`, 'error');
            }
        });
    } catch (error) {
        showMessage(`Error searching user: ${error.message}`, 'error');
    }
});

// Load Friend Requests Tab
async function loadRequestsTab() {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        return;
    }
    try {
        friendRequests.innerHTML = '';
        const requestsQuery = query(
            collection(db, `users/${user.uid}/friendRequests`),
            where('toUserId', '==', user.uid),
            where('status', '==', 'pending')
        );
        const requestsDocs = await getDocs(requestsQuery);
        if (requestsDocs.empty) {
            friendRequests.innerHTML = '<p style="color: #ff004d; text-shadow: 0 0 10px #ff004d;">No pending requests.</p>';
            return;
        }
        requestsDocs.forEach(doc => {
            const request = doc.data();
            const requestBox = document.createElement('div');
            requestBox.className = 'request-box';
            requestBox.innerHTML = `
                <p>From: ${request.fromUsername}</p>
                <button class="action-btn accept-btn" data-request-id="${doc.id}" data-from-id="${request.fromUserId}" data-from-username="${request.fromUsername}">Accept</button>
                <button class="action-btn reject-btn" data-request-id="${doc.id}" data-from-id="${request.fromUserId}" data-from-username="${request.fromUsername}">Reject</button>
            `;
            friendRequests.appendChild(requestBox);
        });

        friendRequests.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const requestId = btn.dataset.requestId;
                    const fromId = btn.dataset.fromId;
                    const fromUsername = btn.dataset.fromUsername;
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const toUsername = userDoc.data().username;
                    await setDoc(doc(db, `users/${user.uid}/friends`, fromId), {
                        username: fromUsername,
                        addedAt: serverTimestamp()
                    });
                    await setDoc(doc(db, `users/${fromId}/friends`, user.uid), {
                        username: toUsername,
                        addedAt: serverTimestamp()
                    });
                    await updateDoc(doc(db, `users/${user.uid}/friendRequests`, requestId), { status: 'accepted' });
                    await updateDoc(doc(db, `users/${fromId}/friendRequests`, requestId), { status: 'accepted' });
                    showMessage(`You are now friends with ${fromUsername}!`, 'success');
                    loadRequestsTab();
                } catch (error) {
                    showMessage(`Error accepting request: ${error.message}`, 'error');
                }
            });
        });

        friendRequests.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const requestId = btn.dataset.requestId;
                    const fromId = btn.dataset.fromId;
                    const fromUsername = btn.dataset.fromUsername;
                    await updateDoc(doc(db, `users/${user.uid}/friendRequests`, requestId), { status: 'rejected' });
                    await updateDoc(doc(db, `users/${fromId}/friendRequests`, requestId), { status: 'rejected' });
                    showMessage(`Rejected request from ${fromUsername}`, 'success');
                    loadRequestsTab();
                } catch (error) {
                    showMessage(`Error rejecting request: ${error.message}`, 'error');
                }
            });
        });
    } catch (error) {
        showMessage(`Error loading requests: ${error.message}`, 'error');
    }
}

// Back to Dashboard from Friends
backToDashboardFromFriends?.addEventListener('click', () => {
    showContainer(dashboard);
});

// Toggle Auth Mode
toggleAuth.addEventListener('click', () => {
    isSignUp = !isSignUp;
    formTitle.textContent = isSignUp ? 'Sign Up' : 'Login';
    authButton.textContent = isSignUp ? 'Sign Up' : 'Login';
    toggleAuth.textContent = isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up';
    usernameInput.style.display = isSignUp ? 'block' : 'none';
    usernameInput.parentElement.style.display = isSignUp ? 'block' : 'none';
    showMessage(`Switched to ${isSignUp ? 'sign-up' : 'login'} mode`, 'success');
});

// Authentication Handler
authButton.addEventListener('click', async () => {
    const email = emailInput?.value;
    const password = passwordInput?.value;
    const username = isSignUp ? usernameInput?.value : null;
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }
    if (isSignUp && !username) {
        showMessage('Please enter a username', 'error');
        return;
    }
    try {
        if (isSignUp) {
            const check = await checkUsernameAvailability(username);
            if (!check.available) {
                showMessage(check.message, 'error');
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            try {
                await saveProfile(username, null, true);
                await sendEmailVerification(userCredential.user);
                showMessage('Sign Up Successful! Please verify your email.', 'success');
            } catch (error) {
                await userCredential.user.delete();
                showMessage(`Sign-up failed: ${error.message}`, 'error');
            }
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Login Successful!', 'success');
        }
        emailInput.value = '';
        passwordInput.value = '';
        usernameInput.value = '';
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
});

// Resend Verification Email
resendVerification?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
        try {
            await sendEmailVerification(user);
            showMessage('Verification email resent! Check your inbox.', 'success');
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
});

// Play Button
playButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    if (!user.emailVerified) {
        showMessage('Please verify your email first', 'error');
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().username) {
            showContainer(gamePage);
        } else {
            showMessage('Please set a username first', 'error');
            showContainer(profilePage);
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
});

// Back to Dashboard
backToDashboard.addEventListener('click', () => {
    if (!auth.currentUser) {
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    showContainer(dashboard);
});

// Play with Random Player
playRandom.addEventListener('click', async () => {
    playRandom.disabled = true;
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
        showMessage('Please verify your email first', 'error');
        showContainer(authContainer);
        playRandom.disabled = false;
        return;
    }
    showContainer(waitingArea); // Show waiting area immediately
    let matchmakingId = null;
    const timeout = setTimeout(async () => {
        if (matchmakingId) {
            await deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => showMessage(`Cleanup error: ${err.message}`, 'error'));
            showMessage('No opponent found. Try again.', 'error');
            showContainer(gamePage);
            playRandom.disabled = false;
        }
    }, 30000);
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.data()?.username || 'Player';

        // Clean up any existing matchmaking entries for this user
        const userEntries = await getDocs(query(collection(db, 'matchmaking'), where('userId', '==', user.uid)));
        for (const entry of userEntries.docs) {
            await deleteDoc(doc(db, 'matchmaking', entry.id)).catch(err => showMessage(`Cleanup error: ${err.message}`, 'error'));
        }

        // Start matchmaking transaction
        await runTransaction(db, async (transaction) => {
            const q = query(collection(db, 'matchmaking'), where('status', '==', 'waiting'), orderBy('timestamp'));
            const existingEntries = await getDocs(q);
            const opponentDocs = existingEntries.docs.filter(doc => doc.data().userId !== user.uid);

            if (opponentDocs.length > 0) {
                const opponentDoc = opponentDocs[0];
                const opponentData = opponentDoc.data();
                const roomData = {
                    player1: user.uid,
                    player1Username: username,
                    player2: opponentData.userId,
                    player2Username: opponentData.username,
                    board: ['', '', '', '', '', '', '', '', ''],
                    currentTurn: 'X',
                    status: 'active',
                    createdAt: serverTimestamp()
                };
                const roomRef = doc(collection(db, 'rooms'));
                transaction.set(roomRef, roomData);
                transaction.update(doc(db, 'matchmaking', opponentDoc.id), {
                    status: 'paired',
                    roomId: roomRef.id,
                    playerSymbol: 'X',
                    opponentUsername: username
                });
                const matchmakingRef = doc(collection(db, 'matchmaking'));
                matchmakingId = matchmakingRef.id;
                transaction.set(matchmakingRef, {
                    userId: user.uid,
                    username,
                    status: 'paired',
                    roomId: roomRef.id,
                    playerSymbol: 'O',
                    opponentUsername: opponentData.username,
                    timestamp: Date.now()
                });
                currentRoomId = roomRef.id;
                currentPlayer = 'O';
                opponentUsername = opponentData.username;
            } else {
                const matchmakingRef = doc(collection(db, 'matchmaking'));
                matchmakingId = matchmakingRef.id;
                transaction.set(matchmakingRef, {
                    userId: user.uid,
                    username,
                    status: 'waiting',
                    timestamp: Date.now()
                });
            }
        });

        // Listen for matchmaking updates
        const matchmakingDocRef = doc(db, 'matchmaking', matchmakingId);
        const unsubscribeMatch = onSnapshot(matchmakingDocRef, async (snapshot) => {
            if (!snapshot.exists()) {
                showMessage('Matchmaking canceled.', 'error');
                showContainer(gamePage);
                playRandom.disabled = false;
                unsubscribeMatch();
                clearTimeout(timeout);
                return;
            }
            const data = snapshot.data();
            if (data.status === 'paired' && data.roomId) {
                currentRoomId = data.roomId;
                currentPlayer = data.playerSymbol;
                opponentUsername = data.opponentUsername;
                await deleteDoc(matchmakingDocRef).catch(err => showMessage(`Cleanup error: ${err.message}`, 'error'));
                unsubscribeMatch();
                clearTimeout(timeout);
                showContainer(gameRoom);
                roomIdDisplay.textContent = `Room ID: ${currentRoomId}`;
                listenToRoom(currentRoomId, username);
                showMessage('Opponent found! Game started.', 'success');
            }
        }, (error) => {
            showMessage(`Matchmaking listener error: ${error.message}`, 'error');
            if (matchmakingId) {
                deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => showMessage(`Cleanup error: ${err.message}`, 'error'));
            }
            unsubscribeMatch();
            clearTimeout(timeout);
            showContainer(gamePage);
            playRandom.disabled = false;
        });
    } catch (error) {
        showMessage(`Matchmaking error: ${error.message}`, 'error');
        if (matchmakingId) {
            await deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => showMessage(`Cleanup error: ${err.message}`, 'error'));
        }
        clearTimeout(timeout);
        showContainer(gamePage);
        playRandom.disabled = false;
    }
});

// Listen to Game Room
function listenToRoom(roomId, username) {
    const roomRef = doc(db, 'rooms', roomId);
    unsubscribeRoom = onSnapshot(roomRef, async snapshot => {
        if (!snapshot.exists()) {
            showMessage('Game room closed.', 'error');
            cleanupRoom();
            showContainer(gamePage);
            return;
        }
        const data = snapshot.data();
        updateGameBoard(data.board);
        playersDisplay.textContent = `You (${username}) vs ${opponentUsername}`;
        gameStatus.textContent = data.status === 'active' ? 
            (data.currentTurn === currentPlayer ? 'Your turn!' : `Waiting for ${opponentUsername}'s move...`) : 
            data.status;
        if (data.status !== 'active') {
            await handleGameEnd(data.status, username);
        }
    }, error => {
        showMessage(`Game room error: ${error.message}`, 'error');
        cleanupRoom();
        showContainer(gamePage);
    });
}

// Update Game Board
function updateGameBoard(board) {
    const cells = gameBoard.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell';
        if (board[index] === 'X') {
            cell.classList.add('x');
        } else if (board[index] === 'O') {
            cell.classList.add('o');
        }
    });
    showMessage('Game board updated', 'success');
}

// Handle Game Move
gameBoard.addEventListener('click', async (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const index = cell.dataset.index;
    const user = auth.currentUser;
    if (!user || !currentRoomId || !currentPlayer) {
        showMessage('Game state error.', 'error');
        return;
    }
    try {
        const roomRef = doc(db, 'rooms', currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) {
            showMessage('Game room closed.', 'error');
            cleanupRoom();
            showContainer(gamePage);
            return;
        }
        const data = roomDoc.data();
        if (data.status !== 'active' || data.currentTurn !== currentPlayer || data.board[index] !== '') {
            showMessage('Invalid move', 'error');
            return;
        }
        const newBoard = [...data.board];
        newBoard[index] = currentPlayer;
        const newTurn = currentPlayer === 'X' ? 'O' : 'X';
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        let status = 'active';
        for (const pattern of winPatterns) {
            if (pattern.every(i => newBoard[i] === currentPlayer)) {
                status = `${currentPlayer} wins`;
                break;
            }
        }
        if (status === 'active' && !newBoard.includes('')) {
            status = 'tie';
        }
        await updateDoc(roomRef, {
            board: newBoard,
            currentTurn: newTurn,
            status
        });
        showMessage('Move submitted', 'success');
    } catch (error) {
        showMessage(`Error making move: ${error.message}`, 'error');
    }
});

// Handle Game End
async function handleGameEnd(status, username) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const stats = userDoc.exists() && userDoc.data().stats ? userDoc.data().stats : { wins: 0, losses: 0, ties: 0 };
        let result = 'tie';
        if (status === `${currentPlayer} wins`) {
            result = 'win';
            stats.wins += 1;
        } else if (status.includes('wins') && status !== `${currentPlayer} wins`) {
            result = 'loss';
            stats.losses += 1;
        } else if (status === 'tie') {
            stats.ties += 1;
        } else if (status === 'abandoned') {
            result = 'abandoned';
        }
        await setDoc(userDocRef, { stats }, { merge: true });
        await addDoc(collection(db, `users/${user.uid}/gameHistory`), {
            opponentUsername,
            result,
            timestamp: serverTimestamp()
        });
        showMessage(`Game ended: ${status}`, 'success');
        cleanupRoom();
        showContainer(gamePage);
    } catch (error) {
        showMessage(`Error handling game end: ${error.message}`, 'error');
    }
}

// Cleanup Room
function cleanupRoom() {
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }
    if (currentRoomId) {
        const roomRef = doc(db, 'rooms', currentRoomId);
        updateDoc(roomRef, { status: 'abandoned' }).catch(err => showMessage(`Error abandoning room: ${err.message}`, 'error'));
    }
    currentRoomId = null;
    currentPlayer = null;
    opponentUsername = null;
    showMessage('Game room cleaned up', 'success');
}

// Leave Room
leaveRoom.addEventListener('click', () => {
    cleanupRoom();
    showContainer(gamePage);
    showMessage('Left game room', 'success');
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessage('Logged out successfully', 'success');
        showContainer(authContainer);
    } catch (error) {
        showMessage(`Error logging out: ${error.message}`, 'error');
    }
});

// Auth State Listener
onAuthStateChanged(auth, async user => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const username = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
            const avatarUrl = userDoc.exists() ? userDoc.data().avatarUrl : null;
            updateProfileUI(username, avatarUrl);
            await updateBalanceUI();
            verifyEmailPrompt.style.display = user.emailVerified ? 'none' : 'block';
            showContainer(dashboard);
        } catch (error) {
            showMessage(`Error loading user data: ${error.message}`, 'error');
            showContainer(authContainer);
        }
    } else {
        showContainer(authContainer);
    }
});
