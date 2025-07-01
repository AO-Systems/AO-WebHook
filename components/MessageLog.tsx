import React from 'react';
import { LogEntry, LogStatus } from '../types.ts';
import { CheckCircleIcon } from './icons/CheckCircleIcon.tsx';
import { XCircleIcon } from './icons/XCircleIcon.tsx';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';

interface MessageLogProps {
  logData: Record<string, LogEntry>;
  logOrder: string[];
}

const statusConfig: Record<LogStatus, { icon: React.ReactNode; color: string; title: string }> = {
  sending: {
    icon: <SpinnerIcon className="h-5 w-5 text-blue-400 animate-spin" />,
    color: 'text-blue-400',
    title: 'Sending',
  },
  success: {
    icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    color: 'text-green-400',
    title: 'Success',
  },
  error: {
    icon: <XCircleIcon className="h-5 w-5 text-red-400" />,
    color: 'text-red-400',
    title: 'Error',
  },
};

export const MessageLog: React.FC<MessageLogProps> = ({ logData, logOrder }) => {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Message Log</h2>
      {logOrder.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No messages sent yet.</p>
      ) : (
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {logOrder.map((id, logIdx) => {
              const log = logData[id];
              if (!log) return null; // Safeguard, should not happen

              return (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== logOrder.length - 1 ? (
                    <span className="absolute left-2.5 top-4 -ml-px h-full w-0.5 bg-slate-700" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-slate-800">
                        {statusConfig[log.status].icon}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-0">
                      <div>
                        <p className="text-sm text-slate-400">
                          {log.status !== 'sending' && <span className={`font-medium ${statusConfig[log.status].color}`}>{statusConfig[log.status].title}: </span>}
                           {log.message}
                        </p>
                        {log.status === 'error' && log.error && (
                            <p className="text-xs text-red-400/80 mt-1 font-mono">{log.error}</p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-slate-500">
                        <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</time>
                        <p className="mt-1 font-mono text-slate-600" title={log.id}>
                            ID: {log.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )})}
          </ul>
        </div>
      )}
    </div>
  );
};