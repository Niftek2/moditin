import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Play, Pause, Trash2, Pencil, Check, X, Music, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AudioManagement() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setAuthLoading(false));
  }, []);

  const { data: environments = [], isLoading } = useQuery({
    queryKey: ["audioEnvironments"],
    queryFn: () => base44.entities.AudioEnvironment.list("order"),
    enabled: user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AudioEnvironment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audioEnvironments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AudioEnvironment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audioEnvironments"] });
      setEditingId(null);
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setUploadError("Please select an audio file (MP3, WAV, etc.)");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.AudioEnvironment.create({
        name: newName || file.name.replace(/\.[^/.]+$/, ""),
        description: newDescription || "",
        fileUrl: file_url,
        order: environments.length,
        gain: 0.3,
        lowShelfGain: 6,
        highShelfGain: -12,
      });
      setNewName("");
      setNewDescription("");
      queryClient.invalidateQueries({ queryKey: ["audioEnvironments"] });
      fileInputRef.current.value = "";
    } catch (err) {
      setUploadError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePlay = (env) => {
    if (playingId === env.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(env.fileUrl);
    audioRef.current.play();
    audioRef.current.onended = () => setPlayingId(null);
    setPlayingId(env.id);
  };

  const startEdit = (env) => {
    setEditingId(env.id);
    setEditValues({
      name: env.name,
      description: env.description || "",
      gain: env.gain ?? 0.3,
      lowShelfGain: env.lowShelfGain ?? 6,
      highShelfGain: env.highShelfGain ?? -12,
    });
  };

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: editValues });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#400070]" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h1 className="text-2xl font-bold text-[#1A1028]">Access Denied</h1>
        <p className="text-[#4A4A4A]">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EADDF5] flex items-center justify-center">
          <Music className="w-5 h-5 text-[#400070]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1028]">Audio Environment Manager</h1>
          <p className="text-sm text-[#4A4A4A]">Upload and manage background noise files for the simulator.</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1A1028]">Upload New Audio File</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Display name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload">
            <Button
              asChild
              disabled={uploading}
              className="bg-[#400070] hover:bg-[#6B2FB9] text-white cursor-pointer"
            >
              <span>
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Choose Audio File</>
                )}
              </span>
            </Button>
          </label>
        </div>
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </div>

      {/* Files List */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-[#1A1028]">Uploaded Environments ({environments.length})</h2>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}

        {!isLoading && environments.length === 0 && (
          <p className="text-sm text-[#4A4A4A]">No audio files uploaded yet.</p>
        )}

        <div className="space-y-3">
          {environments.map((env) => (
            <div key={env.id} className="border border-[var(--modal-border)] rounded-xl p-4 space-y-3">
              {editingId === env.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      placeholder="Name"
                    />
                    <Input
                      value={editValues.description}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A4A]">Gain</label>
                      <Input
                        type="number" step="0.05" min="0" max="1"
                        value={editValues.gain}
                        onChange={(e) => setEditValues({ ...editValues, gain: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A4A]">Low Shelf dB</label>
                      <Input
                        type="number" step="1"
                        value={editValues.lowShelfGain}
                        onChange={(e) => setEditValues({ ...editValues, lowShelfGain: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#4A4A4A]">High Shelf dB</label>
                      <Input
                        type="number" step="1"
                        value={editValues.highShelfGain}
                        onChange={(e) => setEditValues({ ...editValues, highShelfGain: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(env.id)} className="bg-[#400070] text-white">
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1028] truncate">{env.name}</p>
                    {env.description && <p className="text-xs text-[#4A4A4A] mt-0.5">{env.description}</p>}
                    <p className="text-xs text-[#A0A0A0] mt-1">
                      Gain: {env.gain} · Low: {env.lowShelfGain}dB · High: {env.highShelfGain}dB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlay(env)}
                      className={playingId === env.id ? "border-[#400070] text-[#400070]" : ""}
                    >
                      {playingId === env.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(env)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Delete "${env.name}"?`)) deleteMutation.mutate(env.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}