import React, { useState, useEffect } from 'react';
import { X, Mail, Link as LinkIcon, Check, Copy, UserPlus, AlertCircle, Wifi, Smartphone } from 'lucide-react';
import { groupsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function InviteMemberModal({ isOpen, onClose, onSuccess, group }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [networkIp, setNetworkIp] = useState('');

  useEffect(() => {
    if (isOpen) {
      groupsApi.getNetworkInfo()
        .then((res) => {
          if (res?.networkIp && res.networkIp !== 'localhost') {
            setNetworkIp(res.networkIp);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !group) return null;

  // If we have a network IP and current hostname is localhost/127.0.0.1, prioritize the network link
  const currentPort = window.location.port ? `:${window.location.port}` : '';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const effectiveHost = (isLocalHost && networkIp) 
    ? `http://${networkIp}${currentPort}` 
    : window.location.origin;

  const friendInviteLink = `${effectiveHost}/join/${group.invite_code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    toast.success('Group code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(friendInviteLink);
    setCopiedLink(true);
    toast.success('Friend invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await groupsApi.addMember(group.id, email.trim());
      toast.success(`Member added to ${group.name}!`);
      setEmail('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Invite Friends to Group</span>
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Add members to &quot;{group.name}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Option 1: Share Invite Link for Friends */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Friend Invite Link (Wi-Fi / Hotspot)</span>
              </label>
              {networkIp && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Wifi className="w-2.5 h-2.5 animate-pulse" />
                  <span>Online on {networkIp}</span>
                </span>
              )}
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg p-2 text-xs">
                <LinkIcon className="w-4 h-4 text-purple-600 shrink-0 ml-1" />
                <input
                  type="text"
                  readOnly
                  value={friendInviteLink}
                  className="bg-transparent text-purple-950 font-mono text-[11px] w-full focus:outline-none select-all"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-purple-600/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Invite Link Copied! Ready to Share</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Friend Invite Link</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-purple-800/80 leading-relaxed pt-1">
                💡 <strong>Tip for Friends:</strong> Share this link via WhatsApp or chat. Any friend on your college Wi-Fi or phone hotspot can tap it to immediately join, preview the group, and add their expenses!
              </p>
            </div>

            {/* Invite Code Badge */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Manual Group Code</span>
                <span className="font-mono text-base font-extrabold text-slate-800 tracking-wider">
                  {group.invite_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">
              Or add directly by email
            </span>
          </div>

          {/* Option 2: Add by Email */}
          <form onSubmit={handleAddByEmail} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Member College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. friend@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? <span>Adding...</span> : <span>Add to Group</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
