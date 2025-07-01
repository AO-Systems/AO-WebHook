
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { WebhookForm } from './components/WebhookForm';
import { MessageLog } from './components/MessageLog';
import { sendMessage as sendWebhookMessage } from './services/webhookService';
import { LogEntry, LogStatus, User, UserRole } from './types';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { Modal } from './components/Modal';
import { SpinnerIcon } from './components/icons/SpinnerIcon';


function App() {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [logOrder, setLogOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<'main' | 'admin'>('main');
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ isOpen: false, title: '', content: '' });

  const fetchUsers = useCallback(async () => {
    setIsAppLoading(true);
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Could not connect to the server.');
        }
        const usersArray: User[] = await response.json();
        const usersRecord = usersArray.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, User>);
        setUsers(usersRecord);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setAuthError(`Failed to load user data: ${errorMessage}`);
    } finally {
        setIsAppLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const openModal = useCallback((title: string, content: React.ReactNode, onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
    setModal({ isOpen: true, title, content, onConfirm, confirmText, cancelText });
  }, []);
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const updateUser = useCallback(async (uid: string, updates: Partial<Omit<User, 'id'>>) => {
    // Optimistically update role to immediately change daily limit input disable status
    if (updates.role) {
        setUsers(prev => ({...prev, [uid]: {...prev[uid], ...updates} as User}));
    }

    try {
        const response = await fetch(`/api/users/${uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update user');
        }
        const updatedUserFromServer = await response.json();
        setUsers(prev => ({...prev, [uid]: updatedUserFromServer}));
    } catch (error) {
        openModal('Error', `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Revert optimistic update on error
        fetchUsers();
    }
  }, [openModal, fetchUsers]);

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

    if (user.isSuspended) {
      openModal('Account Suspended', 'Your account is currently suspended. You cannot send messages. Please contact an administrator.');
      return false;
    }
    
    if (!options?.bypassLimit) {
        if (user.lastCountReset !== today) {
            user = { ...user, messageCount: 0, lastCountReset: today };
            await updateUser(user.id, { messageCount: 0, lastCountReset: today });
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
      
      if (!options?.bypassLimit) {
        await updateUser(user.id, { messageCount: user.messageCount + 1 });
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
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate auth delay

    let user = users[uid];
    if (user) {
        const today = new Date().toISOString().split('T')[0];
        if (user.lastCountReset !== today) {
            await updateUser(uid, { messageCount: 0, lastCountReset: today });
            // refetch user to get the updated state from server
            const res = await fetch('/api/users');
            const latestUsers: User[] = await res.json();
            const record = latestUsers.reduce((acc, u) => ({...acc, [u.id]: u}), {});
            setUsers(record);
            setCurrentUser(record[uid]);

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
    setAuthError(null);
    setView('main');
  }, []);

  const handleAddUser = async (uid: string) => {
    if (!uid) {
        openModal('Error', 'User ID cannot be empty.');
        return;
    }
    if (users[uid]) {
        openModal('Error', `User with ID "${uid}" already exists.`);
        return;
    }
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: uid }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create user');
        }
        const newUser = await response.json();
        setUsers(prev => ({ ...prev, [newUser.id]: newUser }));
    } catch (error) {
        openModal('Error', `Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveUser = (uid: string) => {
    openModal(
        'Confirm Deletion',
        `Are you sure you want to permanently remove user "${uid}"? This action cannot be undone.`,
        async () => {
            try {
                const response = await fetch(`/api/users/${uid}`, { method: 'DELETE' });
                if (!response.ok && response.status !== 204) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to delete user');
                }
                
                setUsers(prev => {
                    const nextState = { ...prev };
                    delete nextState[uid];
                    return nextState;
                });
                
                // You may want a different strategy for logs, like keeping them or archiving.
                // For now, we'll just remove them from the view.
                const logsOwnedByUser = Object.keys(logData).filter(id => logData[id].userId === uid);
                setLogData(prev => {
                    const nextData = { ...prev };
                    logsOwnedByUser.forEach(id => { delete nextData[id] });
                    return nextData;
                });
                setLogOrder(prev => prev.filter(id => !logsOwnedByUser.includes(id)));
                
                closeModal();
            } catch (error) {
                openModal('Error', `Failed to remove user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
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

  if (isAppLoading) {
      return (
          <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center">
            <SpinnerIcon className="h-10 w-10 animate-spin text-blue-500" />
            <p className="mt-4 text-lg">Connecting to server...</p>
          </div>
      );
  }


  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={authError} />;
  }
  
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
