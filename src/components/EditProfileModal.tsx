import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // updated import to match standard framer-motion
import { X, Pencil, Clock, ChevronDown, User } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileData {
    fullName: string;
    email: string;
    title: string;
    targetCompany: string;
    experienceLevel: string;
    avatarUrl?: string;
    lastUpdated?: string;
}

interface EditProfileProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ProfileData;
    onSave: (data: ProfileData) => void;
}

export const EditProfileModal: React.FC<EditProfileProps> = ({
    isOpen,
    onClose,
    initialData,
    onSave
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<ProfileData>(initialData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Detect if logged in via Google/GitHub
    const isSocialLogin = user?.app_metadata?.provider !== 'email';

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setFormData(initialData));
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle real image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        onSave({ ...formData, lastUpdated: now });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 backdrop-blur-[2px] bg-black/40 dark:bg-black/60"
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-4xl z-[101] my-auto pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.8 }}
                            className="pointer-events-auto w-full rounded-[24px] shadow-[0_8px_10px_rgb(0,0,0,0.04)] border overflow-hidden 
                                     bg-[#F5F5F7] border-[#f0f0f0] 
                                     dark:bg-[#1C1C1E] dark:border-[#2C2C2E]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 md:px-8">
                                <h2 className="text-[18px] font-semibold text-[#010101] dark:text-white">Edit your profile</h2>
                                <button title='close' onClick={onClose} className="text-[#a0a0a0] hover:text-gray-600 transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col md:flex-row border-t-[1.6px] border-b-[1.6px] rounded-[18px] 
                                          border-[#EAE9F2] bg-white 
                                          dark:border-[#3A3A3C] dark:bg-[#2C2C2E]">

                                {/* Form Section */}
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Full name</label>
                                        <input title='fullname'
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold
                                                     bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Email</label>
                                        <input title='email'
                                            name="email"
                                            disabled={isSocialLogin}
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none font-semibold transition-all text-[15px]
                                                     ${isSocialLogin ? 'opacity-60 bg-gray-50 cursor-not-allowed' : 'bg-white'} border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500`}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Experience Level</label>
                                            <div className="relative">
                                                <select title='experience'
                                                    name="experienceLevel"
                                                    value={formData.experienceLevel}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-[14px] border appearance-none outline-none text-[15px] font-semibold
                                                             bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                             dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                                >
                                                    <option value="Entry">Entry</option>
                                                    <option value="Mid-Level">Mid-Level</option>
                                                    <option value="Senior">Senior</option>
                                                </select>
                                                <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#131313]/40 dark:text-gray-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Target Company</label>
                                            <div className="relative">
                                                <input title='company'
                                                    name="targetCompany"
                                                    value={formData.targetCompany}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-[14px] border outline-none text-[14px] font-semibold
                                                             bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                             dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#706f6f] dark:text-[#A1A1A6]">Target Role (Title)</label>
                                        <input title='title'
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border outline-none transition-all text-[14px] font-semibold
                                                     bg-white border-[#DFDDE6] text-[#131313] focus:border-black
                                                     dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white dark:focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-[1.6px] md:h-auto md:w-[1.6px] border-t md:border-t-0 md:border-l border-dashed border-[#E9E8EB] dark:border-[#48484A]" />

                                {/* Preview Section */}
                                <div className="flex-1 p-8 px-6 flex flex-col items-center justify-center relative">
                                    <span className="text-[14px] font-medium mb-4 text-[#706f6f] dark:text-[#A1A1A6]">Preview</span>
                                    <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="w-32 h-32 rounded-3xl overflow-hidden bg-[#e8f4f8] dark:bg-[#2C2C2E] flex items-center justify-center ring-1 ring-[#f0f0f0] dark:ring-[#48484A]">
                                            {formData.avatarUrl ? (
                                                <img
                                                    src={formData.avatarUrl}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover object-top"
                                                />
                                            ) : (
                                                <User className="w-12 h-12 text-[#00B4D8] opacity-50" />
                                            )}
                                        </div>
                                        <button title='edit' className="absolute -bottom-2 -right-2 p-2.5 rounded-full shadow-lg border hover:scale-105 transition-transform
                                                              bg-white border-[#f0f0f0] text-[#707070]
                                                              dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-gray-300">
                                            <Pencil size={18} />
                                        </button>
                                        {/* Hidden File Input */}
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                    </div>
                                    <h3 className="text-[20px] font-bold text-[#101010] dark:text-white text-center mt-2">{formData.fullName || "Your Name"}</h3>
                                    <p className="text-[15px] mb-4 text-[#777678] dark:text-[#A1A1A6] text-center">{formData.title || "Your Role"}</p>
                                    
                                    <div className="flex items-center gap-2 px-4 py-1.5 shadow-sm rounded-full text-[13px] font-medium 
                                                 bg-[#F7F7F9] text-[#101010]/80 
                                                 dark:bg-[#3A3A3C] dark:text-[#A1A1A6]">
                                        <Clock size={14} className="text-[#00B4D8]" />
                                        <span>{formData.experienceLevel} • {formData.targetCompany || "Any Company"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#F5F5F7] dark:bg-[#1C1C1E]">
                                <span className="text-[13px] text-[#767578]">
                                    Last updated: <span className="font-medium">{formData.lastUpdated || "Never"}</span>
                                </span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full text-[14px] border-[1.6px] font-bold transition-colors
                                                 bg-white border-[#E2E2E6] text-[#0F0F0F] hover:bg-gray-50
                                                 dark:bg-[#3A3A3C] dark:border-[#48484A] dark:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full text-[14px] font-bold transition-all shadow-md
                                                 bg-[#00B4D8] text-white hover:bg-[#0096B4]
                                                 dark:bg-[#00B4D8] dark:text-white"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;