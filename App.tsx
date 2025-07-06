import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { WebhookForm } from './components/WebhookForm';
import { MessageLog } from './components/MessageLog';
import { sendMessage as sendWebhookMessage } from './services/webhookService';
import { LogEntry, LogStatus, User, UserRole, AppNotification, UserRequest, RequestStatus, Webhook } from './types';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { Modal } from './components/Modal';
import { UserDashboard } from './components/UserDashboard';
import { WebhookManagement } from './components/WebhookManagement';
import { SplashScreen } from './components/SplashScreen';

// Initial User Database. In a real app, this would come from a database.
const INITIAL_USERS: Record<string, User> = {
  'AOS-ADMIN-007': {
    id: 'AOS-ADMIN-007',
    role: 'admin',
    isSuspended: false,
    dailyLimit: 1000,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
    aocBalance: 999999,
    webhooks: [
        { id: 'wh-admin-default', name: 'Default Google Chat', url: 'https://chat.googleapis.com/v1/spaces/AAQAZG7QKVM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=bmR_utsCYWVrdI6x0jP9WngfmhGBoDvogPLUFzp7f_g' }
    ],
    selectedWebhookId: 'wh-admin-default',
  },
  'AOS-USER-12345': {
    id: 'AOS-USER-12345',
    role: 'user',
    isSuspended: false,
    dailyLimit: 20,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
    aocBalance: 100,
    webhooks: [],
    selectedWebhookId: null,
  },
    'AOS-DEV-99999': {
    id: 'AOS-DEV-99999',
    role: 'user',
    isSuspended: true,
    dailyLimit: 50,
    messageCount: 0,
    lastCountReset: new Date().toISOString().split('T')[0],
    aocBalance: 0,
    webhooks: [],
    selectedWebhookId: null,
  },
};

const USERS_STORAGE_KEY = 'aos-bot-portal-users';
const NOTIFICATIONS_STORAGE_KEY = 'aos-bot-portal-notifications';
const REQUESTS_STORAGE_KEY = 'aos-bot-portal-requests';


export function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) return JSON.parse(storedUsers);
    } catch (error) { console.error("Failed to parse users from localStorage.", error); }
    return INITIAL_USERS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (error) { console.error("Failed to parse notifications from localStorage.", error); }
    return [];
  });
   const [userRequests, setUserRequests] = useState<UserRequest[]>(() => {
    try {
        const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (error) { console.error("Failed to parse requests from localStorage.", error); }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [logOrder, setLogOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<'main' | 'admin' | 'dashboard' | 'webhooks'>('main');
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ isOpen: false, title: '', content: '' });

  // Effect for splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Effects to persist state to localStorage
  useEffect(() => { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(userRequests)); }, [userRequests]);


  const openModal = (title: string, content: React.ReactNode, onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
    setModal({ isOpen: true, title, content, onConfirm, confirmText, cancelText });
  };
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const updateUser = useCallback((uid: string, updates: Partial<Omit<User, 'id'>>) => {
    setUsers(prev => {
        if (!prev[uid]) return prev;
        const originalUser = prev[uid];
        const updatedUser = { ...originalUser, ...updates };

        if (updates.role && updates.role !== originalUser.role) {
            updatedUser.dailyLimit = updates.role === 'admin' ? 1000 : 20;
            if (updates.role === 'admin') {
                updatedUser.aocBalance = 999999; // Set "infinite" money for new admins
            } else { // Demoted from admin
                updatedUser.aocBalance = 100; // Reset to default for demoted admins
            }
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
    const isAdmin = user.role === 'admin';

    if (user.isSuspended) {
      openModal('Account Suspended', 'Your account is currently suspended. You cannot send messages.');
      return false;
    }
    
    if (!options?.bypassLimit && !isAdmin) {
        if (user.lastCountReset !== today) {
            user = { ...user, messageCount: 0, lastCountReset: today };
            updateUser(user.id, { messageCount: 0, lastCountReset: today });
        }

        if (user.messageCount >= user.dailyLimit) {
          openModal('Daily Limit Reached', `You have reached your daily message limit of ${user.dailyLimit}. Visit your dashboard to purchase more.`);
          return false;
        }
    }

    setIsLoading(true);
    const tempId = crypto.randomUUID();
    const newLogEntry: LogEntry = { id: tempId, userId: currentUser.id, message: `Sending: "${message.substring(0, 50)}..."`, status: 'sending', timestamp: new Date().toISOString() };
    setLogData(prev => ({...prev, [tempId]: newLogEntry}));
    setLogOrder(prev => [tempId, ...prev]);
    
    try {
      await sendWebhookMessage(webhookUrl, message);
      updateLog(tempId, 'success');
      if (!options?.bypassLimit && !isAdmin) {
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
    setAuthError(null);
    setView('main');
  }, []);

  const handleAddUser = (uid: string) => {
    if (!uid) { openModal('Error', 'User ID cannot be empty.'); return; }
    if (users[uid]) { openModal('Error', `User with ID "${uid}" already exists.`); return; }
    setUsers(prev => ({ ...prev, [uid]: { id: uid, role: 'user', isSuspended: false, dailyLimit: 20, messageCount: 0, lastCountReset: new Date().toISOString().split('T')[0], aocBalance: 100, webhooks: [], selectedWebhookId: null } }));
  };

  const handleRemoveUser = (uid: string) => {
    openModal('Confirm Deletion', `Are you sure you want to permanently remove user "${uid}"?`, () => {
        const logsOwnedByUser = Object.keys(logData).filter(id => logData[id].userId === uid);
        setUsers(prev => { const nextState = { ...prev }; delete nextState[uid]; return nextState; });
        setLogData(prev => { const nextData = { ...prev }; logsOwnedByUser.forEach(id => { delete nextData[id]; }); return nextData; });
        setLogOrder(prev => prev.filter(id => !logsOwnedByUser.includes(id)));
        setUserRequests(prev => prev.filter(req => req.fromUserId !== uid));
        setNotifications(prev => prev.filter(n => n.targetUserId !== uid));
        closeModal();
    }, 'Delete', 'Cancel');
  };
    
  const handleViewUserLogs = (userToView: User) => {
    if (userToView.role === 'admin') { openModal('Privacy Notice', 'Logs for admin accounts are private.'); return; }
    const userLogOrder = logOrder.filter(id => logData[id]?.userId === userToView.id);
    const userLogData = userLogOrder.reduce((acc, id) => { if(logData[id]) acc[id] = logData[id]; return acc; }, {} as Record<string, LogEntry>);
    openModal(`Message Logs for ${userToView.id}`, <MessageLog logData={userLogData} logOrder={userLogOrder} />, undefined, undefined, 'Close');
  };

  const handlePurchaseLimit = (cost: number, amount: number) => {
    if (!currentUser) return;
    if (currentUser.aocBalance < cost) {
      openModal('Insufficient Funds', `You need ${cost} AOC to make this purchase.`);
      return;
    }
    updateUser(currentUser.id, {
      aocBalance: currentUser.aocBalance - cost,
      dailyLimit: currentUser.dailyLimit + amount,
    });
    openModal('Purchase Successful', `You have successfully purchased +${amount} to your daily message limit.`);
  };

  const handleSendRequest = (message: string) => {
    if (!currentUser) return;
    const newRequest: UserRequest = {
      id: crypto.randomUUID(),
      fromUserId: currentUser.id,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    setUserRequests(prev => [newRequest, ...prev]);
    openModal('Request Sent', 'Your request has been sent to the administrators.');
  };

  const handleResolveRequest = (requestId: string, status: RequestStatus) => {
    setUserRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
    const request = userRequests.find(r => r.id === requestId);
    if(request){
      handleSendNotification(`Your request "${request.message.substring(0,30)}..." has been ${status}.`, request.fromUserId)
    }
  };

  const handleSendNotification = (message: string, targetUserId?: string) => {
    const newNotification: AppNotification = {
      id: crypto.randomUUID(),
      message,
      targetUserId,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
    
  const handleMarkNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => (n.targetUserId === currentUser.id || !n.targetUserId) ? { ...n, isRead: true } : n));
  }

  const handleAddWebhook = (name: string, url: string) => {
    if (!currentUser) return;
    const newWebhook: Webhook = { id: crypto.randomUUID(), name, url };
    updateUser(currentUser.id, {
      webhooks: [...(currentUser.webhooks || []), newWebhook]
    });
  };

  const handleRemoveWebhook = (webhookId: string) => {
    if (!currentUser) return;
     openModal('Confirm Deletion', `Are you sure you want to permanently remove this webhook?`, () => {
        updateUser(currentUser.id, {
            webhooks: (currentUser.webhooks || []).filter(wh => wh.id !== webhookId)
        });
        closeModal();
    }, 'Delete', 'Cancel');
  };

  const handleSetSelectedWebhook = useCallback((webhookId: string | null) => {
      if (!currentUser) return;
      updateUser(currentUser.id, { selectedWebhookId: webhookId });
  }, [currentUser, updateUser]);

  useEffect(() => {
      if (currentUser) {
          const latestUserData = users[currentUser.id];
          if (latestUserData && JSON.stringify(latestUserData) !== JSON.stringify(currentUser)) { setCurrentUser(latestUserData); }
          if (!latestUserData) { handleLogout(); }
      }
  }, [users, currentUser, handleLogout]);

  if (isAppLoading) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={authError} />;
  }
  
  const currentUserLogsOrder = logOrder.filter(id => logData[id]?.userId === currentUser.id);
  const unreadCount = notifications.filter(n => !n.isRead && (!n.targetUserId || n.targetUserId === currentUser.id)).length;

  const renderView = () => {
    if (view === 'admin' && currentUser.role === 'admin') {
      return <AdminPanel 
                users={Object.values(users)} 
                onAddUser={handleAddUser} 
                onRemoveUser={handleRemoveUser}
                onUpdateUser={updateUser}
                onViewLogs={handleViewUserLogs}
                currentUser={currentUser}
                requests={userRequests}
                onResolveRequest={handleResolveRequest}
                onSendNotification={handleSendNotification}
             />;
    }
    if (view === 'dashboard') {
      return <UserDashboard
                user={currentUser}
                notifications={notifications.filter(n => !n.targetUserId || n.targetUserId === currentUser.id)}
                requests={userRequests.filter(r => r.fromUserId === currentUser.id)}
                logData={logData}
                logOrder={currentUserLogsOrder}
                onPurchaseLimit={handlePurchaseLimit}
                onSendRequest={handleSendRequest}
                onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
             />;
    }
    if (view === 'webhooks') {
      return <WebhookManagement
                user={currentUser}
                onAddWebhook={handleAddWebhook}
                onRemoveWebhook={handleRemoveWebhook}
              />;
    }
    // Default to 'main' view
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-slate-950/50 border border-slate-700">
            <WebhookForm
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                webhooks={currentUser.webhooks || []}
                user={currentUser}
                onSetSelectedWebhook={handleSetSelectedWebhook}
            />
            <MessageLog logData={logData} logOrder={currentUserLogsOrder} />
        </div>
    );
  }

  return (
    <>
      <div className="app-container-fade-in min-h-screen bg-slate-900 text-slate-200 font-sans">
        <Header onLogout={handleLogout} user={currentUser} onSetView={setView} currentView={view} unreadNotificationCount={unreadCount} />
        <main className="max-w-4xl mx-auto p-4 md:p-8">
            <div key={view} className="view-fade-slide-in">
              {renderView()}
            </div>
        </main>
        <footer className="text-center p-4 text-xs text-slate-500">
          AOS User Portal | Manage your account and messages.
        </footer>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </>
  );
}