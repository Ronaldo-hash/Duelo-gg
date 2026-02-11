import React, { useState } from 'react';

interface ScannerModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onConfirm, onCancel }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-[3rem] overflow-hidden border-2 border-[#C9A050] flex flex-col">
                {selectedImage ? (
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <div className="w-16 h-16 rounded-full bg-[#C9A050]/20 flex items-center justify-center mb-4 text-[#C9A050]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-8">Clique para enviar o Print da Vitória</p>
                    </label>
                )}

                {/* Overlay do Scanner (só aparece se tiver imagem) */}
                {selectedImage && (
                    <>
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-[#C9A050] rounded-xl flex items-center justify-center pointer-events-none">
                            <div className="w-full h-1 bg-[#C9A050] animate-scan-line"></div>
                        </div>
                        <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                            <p className="text-[10px] font-black text-[#C9A050] uppercase tracking-widest">Validando Print...</p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-4 mt-10 w-full max-w-sm">
                <button onClick={onCancel} className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl text-[10px] font-black uppercase">Cancelar</button>
                <button
                    onClick={onConfirm}
                    disabled={!selectedImage}
                    className={`flex-1 font-black py-5 rounded-2xl text-[10px] uppercase transition-all ${selectedImage ? 'bg-[#C9A050] text-black' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                    Enviar Print
                </button>
            </div>
        </div>
    );
};
