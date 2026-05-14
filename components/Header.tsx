import React from 'react';
import { User, Tab } from '../types';

const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.288 1.902 5.941l-1.442 5.253 5.354-1.405z" /></svg>;

interface HeaderProps {
    user: User;
    onToggleProfile: () => void;
    setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleProfile, setActiveTab }) => {
    return (
        <header className="bg-white dark:bg-slate-800 p-4 shadow-md z-10 text-gray-800 dark:text-gray-200">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-black text-white text-[5px] leading-tight flex items-center justify-center p-1 font-mono transform -rotate-6">
                        <p>Tairepcos quejrpldesldeol bxolhpemde agus.</p>
                    </div>
                    <div className="text-left">
                         <p className="text-sm font-semibold">ID: 0010CI</p>
                         <p className="text-xs text-gray-600 dark:text-gray-400">Bienvenue</p>
                         <p className="text-sm font-medium">{user.name}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><HeartIcon /></button>
                    <button onClick={onToggleProfile} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><UserCircleIcon /></button>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="font-semibold text-sm">{user.city}</span>
                    <span className="text-green-600 font-semibold text-sm">• en ligne</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                        <a href={`https://wa.me/2250705052632`} target="_blank" rel="noopener noreferrer" className="bg-green-500 p-2 rounded-full shadow-lg">
                            <WhatsAppIcon />
                        </a>
                        <span className="text-xs mt-1 font-semibold">WhatsApp</span>
                    </div>
                    <button onClick={() => setActiveTab(Tab.Map)} className="flex flex-col items-center">
                        <div className="w-16 h-10 bg-black rounded-lg flex items-center justify-center text-white text-xs font-mono shadow-lg overflow-hidden relative p-1">
                           <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                               <span className="text-white font-black text-[10px]">F</span>
                           </div>
                           <div className="absolute right-1 bottom-1">
                               <svg className="w-5 h-5 fill-current text-gray-400" viewBox="0 0 100 100"><path d="M0 0h20v20H0z m20 0h20v20H20z m20 0h20v20H40z m20 0h20v20H60z m20 0h20v20H80z M0 20h20v20H0z m80 0h20v20H80z M0 40h20v20H0z m80 0h20v20H80z M0 60h20v20H0z m80 0h20v20H80z M0 80h20v20H0z m20 0h20v20H20z m20 0h20v20H40z m20 0h20v20H60z m20 0h20v20H80z"/></svg>
                           </div>
                        </div>
                        <span className="text-xs mt-1 font-semibold">Carte Pro</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
