"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Trash2, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { updateUserProfile, uploadProfileImageThunk } from '../../store/slices/authSlice';
import { removeProfileImageApi, getAccessibleImageUrl } from '../../api/authApi';
import { UserProfile } from '../../types';

interface ProfileImageModalProps {
  onProfileUpdated?: () => Promise<any> | void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSuccessToast?: (msg: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessToast,
}) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setSuccess(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Format validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image file size must be less than 5 MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile && !previewUrl) return;
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await dispatch(uploadProfileImageThunk(selectedFile)).unwrap();

      setSuccess('Profile photo updated successfully!');
      if (onSuccessToast) {
        onSuccessToast('Profile photo updated successfully!');
      }

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsUploading(false);
      setError(typeof err === 'string' ? err : err?.message || 'Unable to update profile photo. Please try again.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await removeProfileImageApi();
    } catch (e) {
      console.warn('Backend profile image delete error:', e);
    }
    dispatch(updateUserProfile({ avatarUrl: undefined }));
    setSuccess('Profile photo removed.');
    if (onSuccessToast) {
      onSuccessToast('Profile photo removed.');
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-100 text-lime-800 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 id="change-photo-modal-title" className="text-base font-bold text-gray-900">
                Change Profile Photo
              </h3>
              <p className="text-xs text-gray-500">Upload a new photo for your LMS profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Status Banners */}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs New Image Preview */}
          <div className="flex items-center justify-center gap-6 py-2">
            {/* Current Image */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 mb-2">Current Photo</p>
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mx-auto flex items-center justify-center">
                {currentUser?.avatarUrl ? (
                  <img
                    src={getAccessibleImageUrl(currentUser.avatarUrl)}
                    alt="Current profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-500">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
            </div>

            {previewUrl && (
              <>
                <div className="text-gray-300">→</div>
                {/* New Image Preview */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-lime-700 mb-2">New Preview</p>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[#8DB600] shadow-md mx-auto">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {/* Upload trigger button */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-lime-400 rounded-2xl p-6 transition-colors cursor-pointer bg-gray-50/50 hover:bg-lime-50/20"
            >
              <Upload className="w-8 h-8 text-lime-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">
                Click to choose image
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: JPG, PNG, WEBP (Max 5 MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-lime-700 hover:text-lime-800 hover:underline cursor-pointer"
              >
                Choose a different photo
              </button>
            </div>
          )}

          {/* Remove current photo option if an avatar is set */}
          {currentUser?.avatarUrl && !previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer pt-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              id="upload-photo-submit-btn"
              onClick={handleUpload}
              disabled={!previewUrl || isUploading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload Photo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
