// Firebase Imports
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
    orderBy // Added for game history sorting
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCxUwcTWRApLE7F_LHMXHOrmoQVWabfpgA",
    authDomain: "future-4a5bb.firebaseapp.com",
    projectId: "future-4a5bb",
    storageBucket: "future-4a5bb.firebasestorage.app",
    messagingSenderId: "769026893150",
    appId: "1:769026893150:web:7af5f9679ac495f8d09bcf",
    measurementId: "G-XQ00FD9LZ4"
};

// Initialize Firebase
let auth, db, storage;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Failed to initialize Firebase. Check console and verify configuration.');
}

// DOM Elements
const authContainer = document.getElementById('authContainer');
const dashboard = document.getElementById('dashboard');
const profilePage = document.getElementById('profilePage');
const gameHistoryPage = document.getElementById('gameHistoryPage'); // Added for game history
const gamePage = document.getElementById('gamePage');
const gameRoom = document.getElementById('gameRoom');
const waitingArea = document.getElementById('waitingArea');
const formTitle = document.getElementById('formTitle');
const authButton = document.getElementById('authButton');
const toggleAuth = document.getElementById('toggleAuth');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userDisplay = document.getElementById('userDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const profilePicCircle = document.getElementById('profilePicCircle');
const profilePicInput = document.getElementById('profilePicInput');
const gameHistoryBtn = document.getElementById('gameHistoryBtn');
const backToDashboardFromProfile = document.getElementById('backToDashboardFromProfile');
const backToProfileFromHistory = document.getElementById('backToProfileFromHistory'); // Added for game history
const gameHistoryList = document.getElementById('gameHistoryList'); // Added for game history
const playButton = document.getElementById('playButton');
const winButton = document.getElementById('winButton');
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

// State Variables
let isSignUp = true;
let currentRoomId = null;
let currentPlayer = null;
let opponentUsername = null;
let unsubscribeRoom = null;
let lastSaveTime = 0;
let localAvatarUrl = null;

// Utility Functions
function showMessage(message, type) {
    console.log(`Showing message: ${message} (${type})`);
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

function showContainer(container) {
    console.log(`Showing container: ${container?.id || 'unknown'}`);
    const containers = [authContainer, dashboard, profilePage, gameHistoryPage, gamePage, gameRoom, waitingArea]; // Added gameHistoryPage
    containers.forEach(c => c && (c.style.display = 'none'));
    container.style.display = 'block';
}

function initializeContainers() {
    console.log('Initializing containers');
    showContainer(authContainer);
}

// Profile Functions
function updateProfileUI(username, avatarUrl) {
    console.log(`Updating profile UI: username=${username}, avatarUrl=${avatarUrl}`);
    if (!profileBtn || !profilePicCircle) {
        console.error('Profile elements not found');
        return;
    }
    const firstLetter = username.charAt(0).toUpperCase() || 'P';
    if (avatarUrl && avatarUrl !== 'local') {
        console.log('Setting profile picture:', avatarUrl);
        profileBtn.style.backgroundImage = `url(${avatarUrl})`;
        profilePicCircle.style.backgroundImage = `url(${avatarUrl})`;
        profileBtn.style.color = 'transparent';
        profilePicCircle.style.color = 'transparent';
    } else if (avatarUrl === 'local' && localAvatarUrl) {
        console.log('Using local avatar URL:', localAvatarUrl);
        profileBtn.style.backgroundImage = `url(${localAvatarUrl})`;
        profilePicCircle.style.backgroundImage = `url(${localAvatarUrl})`;
        profileBtn.style.color = 'transparent';
        profilePicCircle.style.color = 'transparent';
    } else {
        console.log('No avatar, using letter fallback for:', username);
        const canvas = document.createElement('canvas');
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#c300ff';
        ctx.fill();
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, size / 2, size / 2);
        const canvasUrl = canvas.toDataURL();
        profileBtn.style.backgroundImage = `url(${canvasUrl})`;
        profilePicCircle.style.backgroundImage = `url(${canvasUrl})`;
        profileBtn.style.color = 'transparent';
        profilePicCircle.style.color = 'transparent';
    }
    profileBtn.style.backgroundSize = 'cover';
    profileBtn.style.border = '2px solid #c300ff';
    profilePicCircle.style.backgroundSize = 'cover';
    profilePicCircle.style.border = '2px solid #c300ff';
    userDisplay.textContent = username;
    usernameDisplay.textContent = username;
}

async function saveProfile(username, avatarFile) {
    const now = Date.now();
    if (now - lastSaveTime < 500) {
        console.log('Debouncing save');
        return;
    }
    lastSaveTime = now;
    console.log('Starting profile save: user=', auth.currentUser?.uid, 'username=', username, 'avatarFile=', !!avatarFile);
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        return;
    }
    if (!user.emailVerified) {
        console.error('Email not verified');
        showMessage('Please verify your email first', 'error');
        return;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        let userData = { 
            username: username,
            avatarUrl: null 
        };

        if (avatarFile) {
            const validTypes = ['image/png', 'image/jpeg'];
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (!validTypes.includes(avatarFile.type)) {
                console.error('Invalid file type:', avatarFile.type);
                showMessage('Please upload a PNG or JPEG image', 'error');
                return;
            }
            if (avatarFile.size > maxSize) {
                console.error('File too large:', avatarFile.size);
                showMessage('Image must be under 2MB', 'error');
                return;
            }

            console.log('Uploading avatar: name=', avatarFile.name, 'size=', avatarFile.size, 'type=', avatarFile.type);
            const storageRef = ref(storage, `users/${user.uid}/avatar`);
            try {
                const uploadResult = await uploadBytes(storageRef, avatarFile);
                console.log('Upload successful:', uploadResult.metadata);
                const avatarUrl = await getDownloadURL(storageRef);
                console.log('Generated avatarUrl:', avatarUrl);
                userData.avatarUrl = avatarUrl;
                localAvatarUrl = null;
            } catch (uploadError) {
                console.error('Avatar upload failed:', uploadError.code, uploadError.message);
                showMessage('Failed to upload avatar. Using local image.', 'error');
                localAvatarUrl = URL.createObjectURL(avatarFile);
                userData.avatarUrl = 'local';
            }
        }

        console.log('Saving to Firestore:', userData);
        await setDoc(userDocRef, {
            ...userData,
            stats: { wins: 0, losses: 0, ties: 0 }
        }, { merge: true });
        console.log('Firestore save successful: user=', user.uid, 'avatarUrl=', userData.avatarUrl);

        console.log('Updating UI: username=', username, 'avatarUrl=', userData.avatarUrl);
        updateProfileUI(username, userData.avatarUrl);
        showMessage('Profile updated!', 'success');
    } catch (error) {
        console.error('Save profile error:', error.code, error.message);
        showMessage(`Error saving profile: ${error.message}`, 'error');
    }
}

// Authentication Handlers
toggleAuth.addEventListener('click', () => {
    console.log('Toggle auth clicked');
    isSignUp = !isSignUp;
    formTitle.textContent = isSignUp ? 'Sign Up' : 'Login';
    authButton.textContent = isSignUp ? 'Sign Up' : 'Login';
    toggleAuth.textContent = isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up';
});

authButton.addEventListener('click', async () => {
    console.log('Auth button clicked');
    const email = emailInput?.value;
    const password = passwordInput?.value;
    if (!email || !password) {
        console.error('Email or password missing');
        showMessage('Please enter email and password', 'error');
        return;
    }
    try {
        if (isSignUp) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            showMessage('Sign Up Successful! Please verify your email.', 'success');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Login Successful!', 'success');
        }
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        console.error('Auth error:', error.code, error.message);
        showMessage(`Error: ${error.message}`, 'error');
    }
});

resendVerification?.addEventListener('click', async () => {
    console.log('Resend verification clicked');
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
        try {
            await sendEmailVerification(user);
            showMessage('Verification email resent! Check your inbox.', 'success');
        } catch (error) {
            console.error('Resend verification error:', error.code, error.message);
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
});

logoutButton?.addEventListener('click', async () => {
    console.log('Logout button clicked');
    try {
        await signOut(auth);
        showMessage('Logged out successfully!', 'success');
        showContainer(authContainer);
        cleanupGame();
    } catch (error) {
        console.error('Logout error:', error.code, error.message);
        showMessage(`Logout failed: ${error.message}`, 'error');
    }
});

// Profile Event Listeners
profilePicCircle?.addEventListener('click', () => {
    console.log('Profile picture clicked, opening gallery');
    profilePicInput?.click();
});

profilePicInput?.addEventListener('change', async (e) => {
    console.log('Profile picture input changed');
    const file = e.target.files[0];
    if (file) {
        console.log('Selected file: name=', file.name, 'size=', file.size, 'type=', file.type);
        const username = usernameDisplay.textContent.trim() || 'Player';
        await saveProfile(username, file);
        profilePicInput.value = '';
    } else {
        console.log('No file selected');
    }
});

usernameDisplay?.addEventListener('click', () => {
    console.log('Username clicked, enabling edit');
    usernameDisplay.contentEditable = 'true';
    usernameDisplay.focus();
});

usernameDisplay?.addEventListener('blur', async () => {
    console.log('Username blur, saving');
    usernameDisplay.contentEditable = 'false';
    const newUsername = usernameDisplay.textContent.trim();
    if (!newUsername) {
        console.error('Username is empty');
        showMessage('Please enter a username', 'error');
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        usernameDisplay.textContent = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
        return;
    }
    await saveProfile(newUsername, null);
});

usernameDisplay?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        usernameDisplay.blur();
    }
});

profileBtn?.addEventListener('click', async () => {
    console.log('Profile button clicked');
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        console.log('Loading profile: user=', user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
        const avatarUrl = userDoc.exists() && userDoc.data().avatarUrl ? userDoc.data().avatarUrl : null;
        console.log('Profile loaded: username=', username, 'avatarUrl=', avatarUrl);
        usernameDisplay.textContent = username;
        updateProfileUI(username, avatarUrl);
        showContainer(profilePage);
    } catch (error) {
        console.error('Profile page error:', error.code, error.message);
        showMessage(`Error loading profile: ${error.message}`, 'error');
    }
});

// Game History Functions
async function loadGameHistory() {
    console.log('Loading game history');
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        const historyQuery = query(
            collection(db, `users/${user.uid}/gameHistory`),
            orderBy('timestamp', 'desc')
        );
        const historySnapshot = await getDocs(historyQuery);
        gameHistoryList.innerHTML = '';
        if (historySnapshot.empty) {
            console.log('No game history found');
            gameHistoryList.innerHTML = '<p>No games played yet.</p>';
            return;
        }
        console.log(`Found ${historySnapshot.size} game history entries`);
        historySnapshot.forEach(doc => {
            const data = doc.data();
            const gameItem = document.createElement('div');
            gameItem.className = `game-history-item ${data.result.toLowerCase()}`;
            const date = new Date(data.timestamp).toLocaleString();
            gameItem.innerHTML = `
                <p>Opponent: ${data.opponentUsername}</p>
                <p>Result: ${data.result.charAt(0).toUpperCase() + data.result.slice(1)}</p>
                <p>Date: ${date}</p>
            `;
            gameHistoryList.appendChild(gameItem);
        });
    } catch (error) {
        console.error('Load game history error:', error.code, error.message);
        showMessage(`Error loading game history: ${error.message}`, 'error');
        gameHistoryList.innerHTML = '<p>Failed to load game history.</p>';
    }
}

gameHistoryBtn?.addEventListener('click', async () => {
    console.log('Game history button clicked');
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    try {
        await loadGameHistory();
        showContainer(gameHistoryPage);
    } catch (error) {
        console.error('Game history page error:', error.code, error.message);
        showMessage(`Error loading game history: ${error.message}`, 'error');
    }
});

backToProfileFromHistory?.addEventListener('click', () => {
    console.log('Back to profile from history clicked');
    showContainer(profilePage);
});

backToDashboardFromProfile?.addEventListener('click', () => {
    console.log('Back to dashboard from profile clicked');
    showContainer(dashboard);
});

// Game Functions
playButton.addEventListener('click', async () => {
    console.log('Play button clicked');
    const user = auth.currentUser;
    if (!user) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    if (!user.emailVerified) {
        console.error('Email not verified');
        showMessage('Please verify your email first', 'error');
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().username) {
            showContainer(gamePage);
        } else {
            console.log('No username set, redirecting to profile');
            showMessage('Please set a username first', 'error');
            showContainer(profilePage);
        }
    } catch (error) {
        console.error('Play button error:', error.code, error.message);
        showMessage(`Error: ${error.message}`, 'error');
    }
});

backToDashboard.addEventListener('click', () => {
    console.log('Back to dashboard clicked');
    if (!auth.currentUser) {
        console.error('No user logged in');
        showMessage('Please log in first', 'error');
        showContainer(authContainer);
        return;
    }
    showContainer(dashboard);
});

playRandom.addEventListener('click', async () => {
    console.log('Play random clicked');
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
        console.error('User not logged in or email not verified');
        showMessage('Please verify your email first', 'error');
        showContainer(authContainer);
        return;
    }
    console.log('Starting matchmaking for user:', user.uid);
    let matchmakingId = null;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.data()?.username || 'Player';
        showContainer(waitingArea);

        const userEntries = await getDocs(query(collection(db, 'matchmaking'), where('userId', '==', user.uid)));
        for (const entry of userEntries.docs) {
            console.log('Deleting stale entry:', entry.id);
            await deleteDoc(doc(db, 'matchmaking', entry.id));
        }

        const matchmakingData = {
            userId: user.uid,
            username,
            status: 'waiting',
            timestamp: Date.now()
        };
        const matchmakingRef = await addDoc(collection(db, 'matchmaking'), matchmakingData);
        matchmakingId = matchmakingRef.id;
        console.log('Added to matchmaking pool:', matchmakingId);

        let isPaired = false;
        const unsubscribeMatch = onSnapshot(doc(db, 'matchmaking', matchmakingId), async snapshot => {
            if (!snapshot.exists()) {
                if (!isPaired) {
                    console.log('Matchmaking entry deleted unexpectedly');
                    showContainer(gamePage);
                    showMessage('Matchmaking canceled.', 'error');
                }
                return;
            }
            const data = snapshot.data();
            console.log('Matchmaking entry updated:', data);
            if (data.status === 'paired' && data.roomId) {
                isPaired = true;
                currentRoomId = data.roomId;
                currentPlayer = data.playerSymbol || 'O';
                opponentUsername = data.opponentUsername;
                await deleteDoc(doc(db, 'matchmaking', matchmakingId));
                unsubscribeMatch();
                showContainer(gameRoom);
                roomIdDisplay.textContent = `Room ID: ${currentRoomId}`;
                listenToRoom(currentRoomId, username);
                showMessage('Opponent found! Game started.', 'success');
            }
        }, error => {
            console.error('Matchmaking listener error:', error);
            showMessage('Matchmaking failed. Please try again.', 'error');
            if (matchmakingId) {
                deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => console.error('Cleanup error:', err));
            }
            unsubscribeMatch();
            showContainer(gamePage);
        });

        const now = Date.now();
        const q = query(collection(db, 'matchmaking'), where('status', '==', 'waiting'));
        const existingEntries = await getDocs(q);
        console.log('Existing matchmaking entries:', existingEntries.size);

        const opponentDocs = existingEntries.docs.filter(doc => {
            const data = doc.data();
            return data.userId !== user.uid && (now - data.timestamp) < 20000;
        });
        console.log('Filtered opponent entries:', opponentDocs.length);

        if (opponentDocs.length > 0 && !isPaired) {
            const opponentDoc = opponentDocs[0];
            const opponent = opponentDoc.data();
            console.log('Found opponent:', opponent.username);
            isPaired = true;
            const roomData = {
                player1: user.uid,
                player1Username: username,
                player2: opponent.userId,
                player2Username: opponent.username,
                board: ['', '', '', '', '', '', '', '', ''],
                turn: 'X',
                status: 'active',
                createdAt: Date.now()
            };
            const roomRef = await addDoc(collection(db, 'rooms'), roomData);
            currentRoomId = roomRef.id;
            currentPlayer = 'X';
            opponentUsername = opponent.username;

            await updateDoc(doc(db, 'matchmaking', opponentDoc.id), {
                status: 'paired',
                roomId: roomRef.id,
                playerSymbol: 'O',
                opponentUsername: username
            });

            await deleteDoc(doc(db, 'matchmaking', matchmakingId));
            unsubscribeMatch();
            showContainer(gameRoom);
            roomIdDisplay.textContent = `Room ID: ${roomRef.id}`;
            listenToRoom(roomRef.id, username);
            showMessage('Opponent found! Game started.', 'success');
        } else {
            for (const doc of existingEntries.docs) {
                if ((now - doc.data().timestamp) >= 20000) {
                    console.log('Deleting stale entry:', doc.id);
                    await deleteDoc(doc(db, 'matchmaking', doc.id));
                }
            }
            setTimeout(() => {
                if (!isPaired) {
                    console.log('Matchmaking timeout, isPaired:', isPaired);
                    unsubscribeMatch();
                    if (matchmakingId) {
                        deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => console.error('Cleanup error:', err));
                    }
                    showContainer(gamePage);
                    showMessage('No opponent found. Try again later.', 'error');
                }
            }, 20000);
        }
    } catch (error) {
        console.error('Play random error:', error.code, error.message);
        showMessage('Matchmaking failed. Please try again.', 'error');
        if (matchmakingId) {
            deleteDoc(doc(db, 'matchmaking', matchmakingId)).catch(err => console.error('Cleanup error:', err));
        }
        showContainer(gamePage);
    }
});

function checkWinner(board) {
    console.log('Checking winner for board:', board);
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    if (board.every(cell => cell !== '')) {
        return 'tie';
    }
    return null;
}

function listenToRoom(roomId, username) {
    console.log(`Listening to room: ${roomId}`);
    if (unsubscribeRoom) unsubscribeRoom();
    unsubscribeRoom = onSnapshot(doc(db, 'rooms', roomId), async snapshot => {
        console.log('Room snapshot received');
        if (!snapshot.exists()) {
            showMessage('Room closed', 'error');
            cleanupGame();
            return;
        }
        const data = snapshot.data();
        console.log('Room data:', data, 'Current player:', currentPlayer);
        if (data.status === 'active' && data.player1 && data.player2) {
            let winner = data.winner || checkWinner(data.board);
            if (winner && !data.winner) {
                await updateDoc(doc(db, 'rooms', roomId), { winner, status: 'finished' });
            }
            if (gameStatus) {
                if (data.turn === currentPlayer) {
                    gameStatus.textContent = 'Your turn';
                } else {
                    gameStatus.textContent = `Opponent's turn (${data.turn})`;
                }
            }
            if (playersDisplay) playersDisplay.textContent = `${data.player1Username} (X) vs ${data.player2Username} (O)`;
            opponentUsername = currentPlayer === 'X' ? data.player2Username : data.player1Username;
            renderBoard(data.board);
            if (winner) {
                await handleGameEnd(winner, username);
            }
        }
    }, error => {
        console.error('Room listener error:', error);
        showMessage(`Room error: ${error.message}`, 'error');
    });
}

function renderBoard(board) {
    console.log('Rendering board:', board);
    const cells = gameBoard?.querySelectorAll('.cell') || [];
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell';
        if (board[index] === 'X') cell.classList.add('x');
        if (board[index] === 'O') cell.classList.add('o');
    });
}

gameBoard.addEventListener('click', async e => {
    console.log('Game board clicked');
    const cell = e.target;
    if (!cell.classList.contains('cell') || !currentRoomId) return;
    const index = cell.dataset.index;
    try {
        const roomDoc = await getDoc(doc(db, 'rooms', currentRoomId));
        const data = roomDoc.data();
        if (!data) {
            showMessage('Room not found', 'error');
            return;
        }
        if (data.board[index] !== '' || data.winner || data.status !== 'active') return;
        if ((currentPlayer === 'X' && data.turn !== 'X') || (currentPlayer === 'O' && data.turn !== 'O')) {
            showMessage('Not your turn!', 'error');
            return;
        }
        const newBoard = [...data.board];
        newBoard[index] = currentPlayer;
        const newTurn = currentPlayer === 'X' ? 'O' : 'X';
        await updateDoc(doc(db, 'rooms', currentRoomId), {
            board: newBoard,
            turn: newTurn
        });
    } catch (error) {
        console.error('Cell click error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
});

async function handleGameEnd(result, username) {
    console.log(`Game ended: ${result}, Current player: ${currentPlayer}, Username: ${username}`);
    const user = auth.currentUser;
    if (!user || !currentRoomId) {
        console.log('No user or roomId, skipping stats update');
        return;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        let stats = userDoc.data()?.stats || { wins: 0, losses: 0, ties: 0 };
        console.log('Current stats:', stats);

        let gameResult;
        if (result === currentPlayer) {
            showMessage('You won!', 'success');
            stats.wins += 1;
            gameResult = 'win';
        } else if (result === 'tie') {
            showMessage('Game tied!', 'success');
            stats.ties += 1;
            gameResult = 'tie';
        } else {
            showMessage(`${opponentUsername} won!`, 'error');
            stats.losses += 1;
            gameResult = 'loss';
        }
        console.log('Updating stats to:', stats);
        await updateDoc(userDocRef, { stats });

        // Save to game history
        const gameHistoryRef = collection(db, `users/${user.uid}/gameHistory`);
        await addDoc(gameHistoryRef, {
            opponentUsername: opponentUsername || 'Unknown',
            result: gameResult,
            timestamp: Date.now(),
            roomId: currentRoomId
        });
        console.log('Game history saved: result=', gameResult, 'opponent=', opponentUsername);

        await updateDoc(doc(db, 'rooms', currentRoomId), { status: 'finished', winner: result });
        setTimeout(() => {
            cleanupGame();
            showContainer(dashboard);
        }, 2000);
    } catch (error) {
        console.error('Game end error:', error.code, error.message);
        showMessage(`Error updating stats: ${error.message}`, 'error');
    }
}

function cleanupGame() {
    console.log('Cleaning up game');
    if (currentRoomId) {
        updateDoc(doc(db, 'rooms', currentRoomId), { status: 'closed' }).catch(error => {
            console.error('Cleanup error:', error);
        });
        currentRoomId = null;
    }
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }
    currentPlayer = null;
    opponentUsername = null;
    if (gameBoard) {
        gameBoard.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    }
    if (gameStatus) gameStatus.textContent = 'Waiting for opponent...';
    if (roomIdDisplay) roomIdDisplay.textContent = '';
    if (playersDisplay) playersDisplay.textContent = '';
    if (auth.currentUser) {
        showContainer(dashboard);
    } else {
        showContainer(authContainer);
    }
}

leaveRoom.addEventListener('click', () => {
    console.log('Leave room clicked');
    showMessage('Left room', 'success');
    cleanupGame();
});

// Auth State Listener
onAuthStateChanged(auth, async user => {
    console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
    if (user) {
        showContainer(dashboard);
        verifyEmailPrompt.style.display = user.emailVerified ? 'none' : 'block';
        playButton.style.display = user.emailVerified ? 'block' : 'none';
        try {
            console.log('Fetching user data: user=', user.uid);
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const username = userDoc.exists() && userDoc.data().username ? userDoc.data().username : 'Player';
            const avatarUrl = userDoc.exists() && userDoc.data().avatarUrl ? userDoc.data().avatarUrl : null;
            console.log('Fetched user data: username=', username, 'avatarUrl=', avatarUrl);
            localAvatarUrl = null;
            updateProfileUI(username, avatarUrl);
        } catch (error) {
            console.error('Fetch user data error:', error.code, error.message);
            showMessage(`Error fetching user data: ${error.message}`, 'error');
            updateProfileUI('Player', null);
        }
    } else {
        showContainer(authContainer);
        userDisplay.textContent = '';
        usernameDisplay.textContent = 'Set Username';
        updateProfileUI('Player', null);
        localAvatarUrl = null;
        cleanupGame();
    }
});

// Initialize
initializeContainers();
