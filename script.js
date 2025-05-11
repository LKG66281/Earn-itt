import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, deleteDoc, getDocs, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-WvLzhg5sE5dH-KS8S-ykLpk5WnC3Yh8",
    authDomain: "final-78170.firebaseapp.com",
    projectId: "final-78170",
    storageBucket: "final-78170.appspot.com",
    messagingSenderId: "761058135374",
    appId: "1:761058135374:web:cdab1a1b1f6c06c7a3f0f5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global variables
let currentUser = null;
let unsubscribe = null;

// Messages to auto-dismiss after 3 seconds
const autoDismissMessages = [
    "Opponent’s turn",
    "Your turn!",
    "Room joined!",
    "X wins",
    "O wins",
    "tie",
    "Opponent left. Game ended."
];

// Navigation function
function navigateTo(page) {
    const pages = {
        'authContainer': 'signup.html',
        'dashboard': 'dashboard.html',
        'profilePage': 'profile.html',
        'gameHistoryPage': 'gamehistory.html',
        'friendsPage': 'friends.html',
        'gamePage': 'game.html',
        'waitingArea': 'waiting.html',
        'gameRoom': 'gameroom.html'
    };
    if (pages[page]) {
        window.location.href = pages[page];
    }
}

// Show message with success/error styling
function showMessage(message, isSuccess, autoDismiss = false) {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    if (!messageBox || !messageText) return;

    messageText.textContent = message;
    messageBox.classList.remove('success', 'error');
    messageBox.classList.add(isSuccess ? 'success' : 'error');
    messageBox.style.display = 'block';

    if (autoDismiss && autoDismissMessages.includes(message)) {
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.style.opacity = '1';
            }, 500);
        }, 3000);
    } else {
        const messageClose = document.getElementById('messageClose');
        if (messageClose) {
            messageClose.onclick = () => {
                messageBox.style.display = 'none';
            };
        }
    }
}

// Auth setup for signup.html
function setupAuth() {
    const authForm = document.getElementById('authForm');
    const authButton = document.getElementById('authButton');
    const formTitle = document.getElementById('formTitle');
    const toggleAuth = document.getElementById('toggleAuth');
    const usernameInput = document.getElementById('username');
    const verifyEmailPrompt = document.getElementById('verifyEmailPrompt');
    const resendVerification = document.getElementById('resendVerification');
    if (!authForm || !authButton || !formTitle || !toggleAuth) return;

    let isSignUp = true;

    toggleAuth.addEventListener('click', () => {
        isSignUp = !isSignUp;
        formTitle.textContent = isSignUp ? 'Sign Up' : 'Login';
        authButton.textContent = isSignUp ? 'Sign Up' : 'Login';
        toggleAuth.textContent = isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up";
        usernameInput.style.display = isSignUp ? 'block' : 'none';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = usernameInput.value;

        try {
            let userCredential;
            if (isSignUp) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: username });
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    username,
                    email,
                    balance: 0,
                    profilePic: ''
                });
                await sendEmailVerification(userCredential.user);
                showMessage('Please verify your email to continue.', false);
                verifyEmailPrompt.style.display = 'block';
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (userCredential.user.emailVerified) {
                    showMessage('Login successful!', true);
                    navigateTo('dashboard');
                } else {
                    showMessage('Please verify your email to continue.', false);
                    verifyEmailPrompt.style.display = 'block';
                }
            }
        } catch (error) {
            showMessage(error.message, false);
        }
    });

    if (resendVerification) {
        resendVerification.addEventListener('click', async () => {
            try {
                await sendEmailVerification(auth.currentUser);
                showMessage('Verification email resent!', true);
            } catch (error) {
                showMessage(error.message, false);
            }
        });
    }
}

// Dashboard setup for dashboard.html
function setupDashboard() {
    const profileBtn = document.getElementById('profileBtn');
    const walletBtn = document.getElementById('walletBtn');
    const playButton = document.getElementById('playButton');
    const friendsBtn = document.getElementById('friendsBtn');
    const userDisplay = document.getElementById('userDisplay');
    const balanceBox = document.querySelector('.balance-box');
    if (!profileBtn || !walletBtn || !playButton || !friendsBtn || !userDisplay || !balanceBox) return;

    profileBtn.addEventListener('click', () => navigateTo('profilePage'));
    friendsBtn.addEventListener('click', () => navigateTo('friendsPage'));
    playButton.addEventListener('click', () => navigateTo('gamePage'));

    walletBtn.addEventListener('click', async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const balance = userDoc.data().balance || 0;
            showMessage(`Your balance: ₹${balance}`, true);
        } catch (error) {
            showMessage(error.message, false);
        }
    });

    // Update user display
    if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid)).then((doc) => {
            if (doc.exists()) {
                userDisplay.textContent = doc.data().username || 'Player';
                balanceBox.textContent = `₹${doc.data().balance || 0}`;
            }
        });
    }
}

// Profile setup for profile.html
function setupProfile() {
    const profilePicCircle = document.getElementById('profilePicCircle');
    const profilePicInput = document.getElementById('profilePicInput');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const gameHistoryBtn = document.getElementById('gameHistoryBtn');
    const logoutButton = document.getElementById('logoutButton');
    const backToDashboardFromProfile = document.getElementById('backToDashboardFromProfile');
    if (!profilePicCircle || !profilePicInput || !usernameDisplay || !gameHistoryBtn || !logoutButton || !backToDashboardFromProfile) return;

    // Load profile data
    if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid)).then((doc) => {
            if (doc.exists()) {
                usernameDisplay.textContent = doc.data().username || 'Player';
                if (doc.data().profilePic) {
                    profilePicCircle.style.backgroundImage = `url(${doc.data().profilePic})`;
                }
            }
        });
    }

    profilePicCircle.addEventListener('click', () => profilePicInput.click());
    profilePicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `profilePics/${currentUser.uid}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                await setDoc(doc(db, 'users', currentUser.uid), { profilePic: url }, { merge: true });
                profilePicCircle.style.backgroundImage = `url(${url})`;
                showMessage('Profile picture updated!', true);
            } catch (error) {
                showMessage(error.message, false);
            }
        }
    });

    gameHistoryBtn.addEventListener('click', () => navigateTo('gameHistoryPage'));
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showMessage('Logged out successfully!', true);
            navigateTo('authContainer');
        } catch (error) {
            showMessage(error.message, false);
        }
    });
    backToDashboardFromProfile.addEventListener('click', () => navigateTo('dashboard'));
}

// Game History setup for gamehistory.html
function setupGameHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const statsSummary = document.getElementById('statsSummary');
    const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
    const backToProfile = document.getElementById('backToProfile');
    if (!historyContainer || !statsSummary || !deleteHistoryBtn || !backToProfile) return;

    function getHistoryOutline(result) {
        switch (result) {
            case 'win': return '#00ff00';
            case 'loss': return '#ff0000';
            case 'tie': return '#ffff00';
            case 'abandoned': return '#0000ff';
            default: return '#00f0ff';
        }
    }

    function getHistoryGlow(result) {
        switch (result) {
            case 'win': return '0 0 8px #00ff00';
            case 'loss': return '0 0 8px #ff0000';
            case 'tie': return '0 0 8px #ffff00';
            case 'abandoned': return '0 0 8px #0000ff';
            default: return '0 0 8px #00f0ff';
        }
    }

    async function loadGameHistory() {
        if (!currentUser) return;
        historyContainer.innerHTML = '';
        try {
            const q = query(collection(db, `users/${currentUser.uid}/gameHistory`), orderBy('timestamp', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);
            let wins = 0, losses = 0, ties = 0, abandoned = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const historyBox = document.createElement('div');
                historyBox.classList.add('history-box', data.result);
                historyBox.style.outline = `2px solid ${getHistoryOutline(data.result)}`;
                historyBox.style.boxShadow = getHistoryGlow(data.result);
                historyBox.innerHTML = `
                    <p>Opponent: ${data.opponent || 'Unknown'}</p>
                    <p>Result: ${data.result.charAt(0).toUpperCase() + data.result.slice(1)}</p>
                    <p>Date: ${new Date(data.timestamp.toDate()).toLocaleString()}</p>
                `;
                historyContainer.appendChild(historyBox);

                if (data.result === 'win') wins++;
                else if (data.result === 'loss') losses++;
                else if (data.result === 'tie') ties++;
                else if (data.result === 'abandoned') abandoned++;
            });

            statsSummary.textContent = `Wins: ${wins}, Losses: ${losses}, Ties: ${ties}, Abandoned: ${abandoned}`;
            if (querySnapshot.empty) {
                historyContainer.innerHTML = '<p>No game history.</p>';
            }
        } catch (error) {
            console.error('Error loading game history:', error);
            showMessage('Failed to load game history.', false);
        }
    }

    deleteHistoryBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        try {
            const historyRef = collection(db, `users/${currentUser.uid}/gameHistory`);
            const querySnapshot = await getDocs(historyRef);
            const batch = [];
            querySnapshot.forEach((doc) => {
                batch.push(deleteDoc(doc.ref));
            });
            await Promise.all(batch);
            historyContainer.innerHTML = '<p>No game history.</p>';
            statsSummary.textContent = 'Wins: 0, Losses: 0, Ties: 0, Abandoned: 0';
            showMessage('Game history deleted!', true);
        } catch (error) {
            showMessage('Failed to delete game history.', false);
        }
    });

    backToProfile.addEventListener('click', () => navigateTo('profilePage'));
    loadGameHistory();
}

// Friends setup for friends.html
function setupFriends() {
    const addFriendTab = document.getElementById('addFriendTab');
    const friendsTab = document.getElementById('friendsTab');
    const requestsTab = document.getElementById('requestsTab');
    const friendSearch = document.getElementById('friendSearch');
    const searchFriend = document.getElementById('searchFriend');
    const searchResults = document.getElementById('searchResults');
    const friendsList = document.getElementById('friendsList');
    const friendRequests = document.getElementById('friendRequests');
    const backToDashboardFromFriends = document.querySelector('#backToDashboardFromFriends');
    if (!addFriendTab || !friendsTab || !requestsTab || !friendSearch || !searchFriend || !searchResults || !friendsList || !friendRequests || !backToDashboardFromFriends) return;

    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    addFriendTab.addEventListener('click', () => showTab('addFriendTab'));
    friendsTab.addEventListener('click', () => showTab('friendsTab'));
    requestsTab.addEventListener('click', () => showTab('requestsTab'));

    async function loadFriends() {
        if (!currentUser) return;
        friendsList.innerHTML = '';
        try {
            const friendsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/friends`));
            friendsSnapshot.forEach((doc) => {
                const friendBox = document.createElement('div');
                friendBox.classList.add('friend-box');
                friendBox.innerHTML = `<p>${doc.data().username}</p>`;
                friendsList.appendChild(friendBox);
            });
            if (friendsSnapshot.empty) {
                friendsList.innerHTML = '<p>No friends yet.</p>';
            }
        } catch (error) {
            showMessage('Failed to load friends.', false);
        }
    }

    async function loadFriendRequests() {
        if (!currentUser) return;
        friendRequests.innerHTML = '';
        try {
            const requestsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/friendRequests`));
            requestsSnapshot.forEach((doc) => {
                const request = doc.data();
                const requestBox = document.createElement('div');
                requestBox.classList.add('request-box');
                requestBox.innerHTML = `
                    <p>${request.username}</p>
                    <button class="action-btn accept-btn" data-uid="${doc.id}">Accept</button>
                    <button class="action-btn reject-btn" data-uid="${doc.id}">Reject</button>
                `;
                friendRequests.appendChild(requestBox);
            });
            if (requestsSnapshot.empty) {
                friendRequests.innerHTML = '<p>No friend requests.</p>';
            }

            document.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const senderUid = btn.dataset.uid;
                    try {
                        await setDoc(doc(db, `users/${currentUser.uid}/friends`, senderUid), { username: btn.parentElement.querySelector('p').textContent });
                        await setDoc(doc(db, `users/${senderUid}/friends`, currentUser.uid), { username: currentUser.displayName });
                        await deleteDoc(doc(db, `users/${currentUser.uid}/friendRequests`, senderUid));
                        showMessage('Friend request accepted!', true);
                        loadFriendRequests();
                        loadFriends();
                    } catch (error) {
                        showMessage(error.message, false);
                    }
                });
            });

            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const senderUid = btn.dataset.uid;
                    try {
                        await deleteDoc(doc(db, `users/${currentUser.uid}/friendRequests`, senderUid));
                        showMessage('Friend request rejected.', true);
                        loadFriendRequests();
                    } catch (error) {
                        showMessage(error.message, false);
                    }
                });
            });
        } catch (error) {
            showMessage('Failed to load friend requests.', false);
        }
    }

    searchFriend.addEventListener('click', async () => {
        const username = friendSearch.value.trim();
        if (!username) return;
        searchResults.innerHTML = '';
        try {
            const q = query(collection(db, 'users'), where('username', '==', username));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentUser.uid) {
                    const resultBox = document.createElement('div');
                    resultBox.classList.add('result-box');
                    resultBox.innerHTML = `
                        <p>${doc.data().username}</p>
                        <button class="action-btn" data-uid="${doc.id}">Send Friend Request</button>
                    `;
                    searchResults.appendChild(resultBox);
                }
            });
            if (querySnapshot.empty) {
                searchResults.innerHTML = '<p>No users found.</p>';
            }

            document.querySelectorAll('.result-box .action-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const recipientUid = btn.dataset.uid;
                    try {
                        await setDoc(doc(db, `users/${recipientUid}/friendRequests`, currentUser.uid), {
                            username: currentUser.displayName
                        });
                        showMessage('Friend request sent!', true);
                        searchResults.innerHTML = '';
                        friendSearch.value = '';
                    } catch (error) {
                        showMessage(error.message, false);
                    }
                });
            });
        } catch (error) {
            showMessage('Failed to search users.', false);
        }
    });

    backToDashboardFromFriends.addEventListener('click', () => navigateTo('dashboard'));
    loadFriends();
    loadFriendRequests();
    friendSearch.focus();
}

// Game setup for game.html
function setupGame() {
    const playRandom = document.getElementById('playRandom');
    const backToDashboard = document.getElementById('backToDashboard');
    if (!playRandom || !backToDashboard) return;

    playRandom.addEventListener('click', () => joinMatchmaking());
    backToDashboard.addEventListener('click', () => navigateTo('dashboard'));
}

// Waiting setup for waiting.html
function setupWaiting() {
    const backToDashboard = document.getElementById('backToDashboard');
    if (!backToDashboard) return;

    backToDashboard.addEventListener('click', async () => {
        if (unsubscribe) unsubscribe();
        try {
            await deleteDoc(doc(db, 'matchmaking', currentUser.uid));
        } catch (error) {
            console.error('Error cancelling matchmaking:', error);
        }
        navigateTo('dashboard');
    });
}

// Game Room setup for gameroom.html
function setupGameRoom() {
    const gameBoard = document.getElementById('gameBoard');
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const playersDisplay = document.getElementById('playersDisplay');
    const gameStatus = document.getElementById('gameStatus');
    const leaveRoom = document.getElementById('leaveRoom');
    if (!gameBoard || !roomIdDisplay || !playersDisplay || !gameStatus || !leaveRoom) return;

    let roomId = null;

    function renderBoard(board) {
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.textContent = board[index] || '';
            cell.classList.remove('x', 'o');
            if (board[index]) {
                cell.classList.add(board[index].toLowerCase());
            }
        });
    }

    async function joinRoom(newRoomId) {
        roomId = newRoomId;
        roomIdDisplay.textContent = `Room ID: ${roomId}`;
        showMessage('Room joined!', true, true);

        if (unsubscribe) unsubscribe();
        unsubscribe = onSnapshot(doc(db, 'rooms', roomId), async (doc) => {
            if (!doc.exists()) {
                showMessage('Opponent left. Game ended.', false, true);
                await addDoc(collection(db, `users/${currentUser.uid}/gameHistory`), {
                    opponent: 'Unknown',
                    result: 'abandoned',
                    timestamp: serverTimestamp()
                });
                navigateTo('gamePage');
                return;
            }

            const data = doc.data();
            playersDisplay.textContent = `Players: ${data.playerX} vs ${data.playerO}`;
            renderBoard(data.board);
            gameStatus.textContent = data.status;

            if (data.currentPlayer === currentUser.uid) {
                showMessage('Your turn!', true, true);
            } else {
                showMessage('Opponent’s turn', false, true);
            }

            if (data.winner) {
                if (data.winner === 'tie') {
                    showMessage('tie', false, true);
                    await addDoc(collection(db, `users/${currentUser.uid}/gameHistory`), {
                        opponent: data.playerX === currentUser.uid ? data.playerO : data.playerX,
                        result: 'tie',
                        timestamp: serverTimestamp()
                    });
                } else if (data.winner === currentUser.uid) {
                    showMessage('X wins', true, true);
                    await addDoc(collection(db, `users/${currentUser.uid}/gameHistory`), {
                        opponent: data.playerX === currentUser.uid ? data.playerO : data.playerX,
                        result: 'win',
                        timestamp: serverTimestamp()
                    });
                } else {
                    showMessage('O wins', false, true);
                    await addDoc(collection(db, `users/${currentUser.uid}/gameHistory`), {
                        opponent: data.playerX === currentUser.uid ? data.playerO : data.playerX,
                        result: 'loss',
                        timestamp: serverTimestamp()
                    });
                }
                navigateTo('gamePage');
            }
        });

        gameBoard.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', async () => {
                const index = cell.dataset.index;
                try {
                    const roomRef = doc(db, 'rooms', roomId);
                    const roomSnap = await getDoc(roomRef);
                    if (!roomSnap.exists()) return;

                    const data = roomSnap.data();
                    if (data.currentPlayer !== currentUser.uid || data.board[index] || data.winner) return;

                    data.board[index] = data.playerX === currentUser.uid ? 'X' : 'O';
                    data.currentPlayer = data.playerX === currentUser.uid ? data.playerO : data.playerX;

                    // Check for winner
                    const winningCombinations = [
                        [0, 1, 2], [3, 4, 5], [6, 7, 8],
                        [0, 3, 6], [1, 4, 7], [2, 5, 8],
                        [0, 4, 8], [2, 4, 6]
                    ];
                    let winner = null;
                    for (const combo of winningCombinations) {
                        if (data.board[combo[0]] && data.board[combo[0]] === data.board[combo[1]] && data.board[combo[1]] === data.board[combo[2]]) {
                            winner = data.board[combo[0]] === 'X' ? data.playerX : data.playerO;
                            break;
                        }
                    }
                    if (!winner && data.board.every(cell => cell)) {
                        winner = 'tie';
                    }

                    if (winner) {
                        data.winner = winner;
                        data.status = winner === 'tie' ? 'Tie!' : `${winner === data.playerX ? data.playerX : data.playerO} wins!`;
                    } else {
                        data.status = `${data.currentPlayer === data.playerX ? data.playerX : data.playerO}'s turn`;
                    }

                    await setDoc(roomRef, data);
                } catch (error) {
                    showMessage(error.message, false);
                }
            });
        });
    }

    leaveRoom.addEventListener('click', async () => {
        try {
            if (roomId) {
                await deleteDoc(doc(db, 'rooms', roomId));
            }
            if (unsubscribe) unsubscribe();
            navigateTo('gamePage');
        } catch (error) {
            showMessage(error.message, false);
        }
    });

    // Auto-join room (assumes roomId passed via sessionStorage or URL)
    const storedRoomId = sessionStorage.getItem('roomId');
    if (storedRoomId) {
        joinRoom(storedRoomId);
        sessionStorage.removeItem('roomId');
    }
}

// Matchmaking logic
async function joinMatchmaking() {
    if (!currentUser) return;
    try {
        // Clean up stale matchmaking entries
        const staleEntries = await getDocs(query(collection(db, 'matchmaking'), where('timestamp', '<', new Date(Date.now() - 5 * 60 * 1000))));
        const batch = [];
        staleEntries.forEach(doc => batch.push(deleteDoc(doc.ref)));
        await Promise.all(batch);

        // Check for existing match
        const matchmakingRef = collection(db, 'matchmaking');
        const q = query(matchmakingRef, orderBy('timestamp'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty && querySnapshot.docs[0].id !== currentUser.uid) {
            const opponent = querySnapshot.docs[0];
            const roomId = `${opponent.id}_${currentUser.uid}`;
            const opponentData = opponent.data();

            await setDoc(doc(db, 'rooms', roomId), {
                playerX: opponent.id,
                playerO: currentUser.uid,
                board: Array(9).fill(null),
                currentPlayer: opponent.id,
                status: `${opponentData.username}'s turn`,
                winner: null
            });

            await deleteDoc(doc(db, 'matchmaking', opponent.id));
            await deleteDoc(doc(db, 'matchmaking', currentUser.uid));
            sessionStorage.setItem('roomId', roomId);
            navigateTo('gameRoom');
        } else {
            await setDoc(doc(db, 'matchmaking', currentUser.uid), {
                userId: currentUser.uid,
                username: currentUser.displayName,
                timestamp: serverTimestamp()
            });
            navigateTo('waitingArea');

            if (unsubscribe) unsubscribe();
            unsubscribe = onSnapshot(doc(db, 'matchmaking', currentUser.uid), (doc) => {
                if (!doc.exists()) {
                    const storedRoomId = sessionStorage.getItem('roomId');
                    if (storedRoomId) {
                        navigateTo('gameRoom');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error in matchmaking:', error);
        showMessage('Failed to join matchmaking.', false);
        navigateTo('gamePage');
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    // Auth state listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (!user && currentPage !== 'signup.html') {
            navigateTo('authContainer');
        } else if (user && currentPage === 'signup.html' && user.emailVerified) {
            navigateTo('dashboard');
        }
    });

    // Page-specific setup
    if (currentPage === 'signup.html') {
        setupAuth();
    } else if (currentPage === 'dashboard.html') {
        setupDashboard();
    } else if (currentPage === 'profile.html') {
        setupProfile();
    } else if (currentPage === 'gamehistory.html') {
        setupGameHistory();
    } else if (currentPage === 'friends.html') {
        setupFriends();
    } else if (currentPage === 'game.html') {
        setupGame();
    } else if (currentPage === 'waiting.html') {
        setupWaiting();
    } else if (currentPage === 'gameroom.html') {
        setupGameRoom();
    }
});
