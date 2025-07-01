
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { WebhookForm } from './components/WebhookForm.tsx';
import { MessageLog } from './components/MessageLog.tsx';
import { sendMessage as sendWebhookMessage } from './services/webhookService.ts';
import { LogEntry, LogStatus, User, UserRole } from './types.ts';
import { LoginPage } from './components/LoginPage.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Modal } from './components/Modal.tsx';

// Initial User Database. In a real app, this would come from a database.
const INITIAL_USERS: Record<string, User> = {
  'AOS-ADMIN-007': {
    id: 'AOS-ADMIN-007',
    role: 'admin',
    isSuspended: false,
    dailyLimit: 1000,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
  },
  'AOS-USER-12345': {
    id: 'AOS-USER-12345',
    role: 'user',
    isSuspended: false,
    dailyLimit: 20,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
  },
    'AOS-DEV-99999': {
    id: 'AOS-DEV-99999',
    role: 'user',
    isSuspended: true,
    dailyLimit: 50,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
  },
};

const USERS_STORAGE_KEY = 'aos-bot-portal-users';

function App() {
  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }
    } catch (error) {
        console.error("Failed to parse users from localStorage, using default.", error);
    }
    return INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [logOrder, setLogOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<'main' | 'admin'>('main');
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ isOpen: false, title: '', content: '' });

  // Effect to persist users to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error("Failed to save users to localStorage.", error);
    }
  }, [users]);

  const openModal = (title: string, content: React.ReactNode, onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
    setModal({ isOpen: true, title, content, onConfirm, confirmText, cancelText });
  };
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const updateUser = useCallback((uid: string, updates: Partial<Omit<User, 'id'>>) => {
    setUsers(prev => {
        if (!prev[uid]) return prev;
        const originalUser = prev[uid];
        const updatedUser = { ...originalUser, ...updates };

        // If role is being changed, automatically adjust the daily limit.
        if (updates.role && updates.role !== originalUser.role) {
            updatedUser.dailyLimit = updates.role === 'admin' ? 1000 : 20;
        }

        return { ...prev, [uid]: updatedUser };
    });
  }, []);

  const updateLog = (id: string, newStatus: LogStatus, error?: string) => {
      setLogData(prevData => {
        const logToUpdate = prevData[id];
        if (!logToUpdate) return prevData;
        const updatedLog = { ...logToUpdate, status: newStatus, error: error };
        return { ...prevData, [id]: updatedLog };
      });
  };

  const handleSendMessage = useCallback(async (webhookUrl: string, message: string, options?: { bypassLimit?: boolean }): Promise<boolean> => {
    if (!currentUser) return false;

    const today = new Date().toISOString().split('T')[0];
    let user = users[currentUser.id];

    // Suspension check is universal and happens first.
    if (user.isSuspended) {
      openModal('Account Suspended', 'Your account is currently suspended. You cannot send messages. Please contact an administrator.');
      return false;
    }
    
    // Conditionally check and enforce the daily limit.
    if (!options?.bypassLimit) {
        // Check for daily count reset
        if (user.lastCountReset !== today) {
            user = { ...user, messageCount: 0, lastCountReset: today };
            updateUser(user.id, { messageCount: 0, lastCountReset: today });
        }

        if (user.messageCount >= user.dailyLimit) {
          openModal('Daily Limit Reached', `You have reached your daily message limit of ${user.dailyLimit}. Please try again tomorrow.`);
          return false;
        }
    }

    setIsLoading(true);
    const tempId = crypto.randomUUID();
    const newLogEntry: LogEntry = {
        id: tempId,
        userId: currentUser.id,
        message: `Sending: "${message.substring(0, 50)}..."`,
        status: 'sending',
        timestamp: new Date().toISOString(),
    };
    setLogData(prev => ({...prev, [tempId]: newLogEntry}));
    setLogOrder(prev => [tempId, ...prev]);
    
    try {
      await sendWebhookMessage(webhookUrl, message);
      updateLog(tempId, 'success');
      
      // Conditionally increment the message count.
      if (!options?.bypassLimit) {
        updateUser(user.id, { messageCount: user.messageCount + 1 });
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      updateLog(tempId, 'error', errorMessage);
      setIsLoading(false);
      return false;
    }
  }, [currentUser, users, updateUser, openModal]);
  
  const handleLogin = useCallback(async (uid: string) => {
    setIsLoading(true);
    setAuthError(null);
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users[uid];
    if (user) {
        const today = new Date().toISOString().split('T')[0];
        // Reset daily count if logging in on a new day
        if (user.lastCountReset !== today) {
            const updatedUser = { ...user, messageCount: 0, lastCountReset: today };
            updateUser(uid, { messageCount: 0, lastCountReset: today });
            setCurrentUser(updatedUser);
        } else {
            setCurrentUser(user);
        }
        setView('main');
    } else {
      setAuthError('Invalid UID. Please try again.');
    }
    setIsLoading(false);
  }, [users, updateUser]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    // Do not clear all logs on logout, they are now global
    setAuthError(null);
    setView('main');
  }, []);

  const handleAddUser = (uid: string) => {
    if (!uid) {
        openModal('Error', 'User ID cannot be empty.');
        return;
    }
    if (users[uid]) {
        openModal('Error', `User with ID "${uid}" already exists.`);
        return;
    }
    setUsers(prev => ({
        ...prev,
        [uid]: {
            id: uid, role: 'user', isSuspended: false, dailyLimit: 20, messageCount: 0, lastCountReset: new Date().toISOString().split('T')[0]
        }
    }));
  };

  const handleRemoveUser = (uid: string) => {
    openModal(
        'Confirm Deletion',
        `Are you sure you want to permanently remove user "${uid}"? This action cannot be undone.`,
        () => {
            const logsOwnedByUser = Object.keys(logData).filter(id => logData[id].userId === uid);
            
            // Remove the user
            setUsers(prev => {
                const nextState = { ...prev };
                delete nextState[uid];
                return nextState;
            });
            
            // Remove their logs from logData
            setLogData(prev => {
                const nextData = { ...prev };
                logsOwnedByUser.forEach(id => {
                    delete nextData[id];
                });
                return nextData;
            });

            // Remove their logs from logOrder
            setLogOrder(prev => prev.filter(id => !logsOwnedByUser.includes(id)));
            
            closeModal();
        },
        'Delete',
        'Cancel'
    );
  };
    
  const handleViewUserLogs = (userToView: User) => {
    if (userToView.role === 'admin') {
        openModal('Privacy Notice', 'Logs for admin accounts are private and cannot be viewed.');
        return;
    }
    
    const userLogOrder = logOrder.filter(id => logData[id]?.userId === userToView.id);
    const userLogData = userLogOrder.reduce((acc, id) => {
        if(logData[id]) acc[id] = logData[id];
        return acc;
    }, {} as Record<string, LogEntry>);

    openModal(
        `Message Logs for ${userToView.id}`,
        <MessageLog logData={userLogData} logOrder={userLogOrder} />,
        undefined, // no confirm button
        undefined,
        'Close'
    );
  };

  // Effect to update currentUser state if their own data changes (e.g., by another admin)
  useEffect(() => {
      if (currentUser) {
          const latestUserData = users[currentUser.id];
          if (latestUserData && JSON.stringify(latestUserData) !== JSON.stringify(currentUser)) {
              setCurrentUser(latestUserData);
          }
           // If user was deleted, log them out
          if (!latestUserData) {
            handleLogout();
          }
      }
  }, [users, currentUser, handleLogout]);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={authError} />;
  }
  
  // Filter logs to show only the current user's logs in the main view
  const currentUserLogsOrder = logOrder.filter(id => logData[id]?.userId === currentUser.id);

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
        <Header onLogout={handleLogout} user={currentUser} onToggleView={setView} currentView={view} />
        <main className="max-w-4xl mx-auto p-4 md:p-8">
            {view === 'admin' && currentUser.role === 'admin' ? (
                <AdminPanel 
                    users={Object.values(users)} 
                    onAddUser={handleAddUser} 
                    onRemoveUser={handleRemoveUser}
                    onUpdateUser={updateUser}
                    onViewLogs={handleViewUserLogs}
                    currentUser={currentUser}
                />
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700">
                    <WebhookForm onSubmit={handleSendMessage} isLoading={isLoading} />
                    <MessageLog logData={logData} logOrder={currentUserLogsOrder} />
                </div>
            )}
        </main>
        <footer className="text-center p-4 text-xs text-slate-500">
          AOS Bot Portal | Send messages with ease.
        </footer>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </>
  );
}

export default App;