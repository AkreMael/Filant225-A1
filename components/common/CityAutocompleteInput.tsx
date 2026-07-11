import React, { useState, useEffect, useRef } from 'react';

// List of cities, communes, sub-prefectures and localities of Côte d'Ivoire
export const IVORY_COAST_CITIES = [
  // District Autonome d'Abidjan & Communes
  "Abidjan", "Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon",
  // Yamoussoukro
  "Yamoussoukro", "Toumodi", "Tiébissou", "Didievi", "Attiégouakro",
  // San-Pédro & Sud-Ouest
  "San-Pédro", "Tabou", "Sassandra", "Fresco", "Grand-Béreby", "Grabo",
  // Bas-Sassandra / Nawa
  "Soubré", "Méagui", "Buyo", "Gueyo",
  // Gôh-Djiboua
  "Gagnoa", "Oumé", "Ouragahio", "Divo", "Lakota", "Guitry",
  // Sud-Comoé / Grand-Bassam
  "Grand-Bassam", "Bonoua", "Aboisso", "Adiaké", "Tiapoum", "Maféré", "Ayame",
  // Agnéby-Tiassa & La Mé
  "Agboville", "Sikensi", "Tiassalé", "N'douci", "Taabo", "Rubino",
  "Adzopé", "Akoupé", "Alépé", "Afféry", "Yakassé-Attobrou", "Azaguié", "Meji",
  // Indénié-Djuablin
  "Abengourou", "Agnibilékrou", "Béttié", "Niablé",
  // Gontougo & Bounkani
  "Bondoukou", "Tanda", "Sandégué", "Koun-Fao", "Transua", "Bouna", "Doropo", "Nassian", "Tehini",
  // Gbêkê & Hambol
  "Bouaké", "Béoumi", "Sakassou", "Botro", "Katiola", "Dabakala", "Niakaramandougou", "Tafiré", "Fronan",
  // N'zi, Iffou, Moronou
  "Dimbokro", "Bocanda", "Kouassi-Kouassikro", "Daoukro", "M'Bahiakro", "Prikro", "Bongouanou", "Arrah", "M'batto", "Anoumaba",
  // Haut-Sassandra & Marahoué
  "Daloa", "Issia", "Zoukougbeu", "Vavoua", "Bouaflé", "Sinfra", "Zuénoula", "Bonon",
  // Tonkpi, Guémon, Cavally
  "Man", "Danané", "Zouan-Hounien", "Biankouma", "Sangouiné", "Sipilou", "Logoualé",
  "Duékoué", "Bangolo", "Guiglo", "Bloléquin", "Toulépleu", "Taï",
  // Poro, Tchologo, Bagoué
  "Korhogo", "Ouangolodougou", "Ferkessédougou", "Kong", "Boundiali", "Kouto", "Tengréla", "Dikodougou", "Sinématiali", "M'bengué", "Kaniasso",
  // Worodougou, Bafing, Kabadougou, Folon
  "Séguéla", "Kani", "Touba", "Koro", "Ouaninou", "Odienné", "Samatiguila", "Minignan", "Madinani", "Gbéléban", "Seguelon"
];

// Helper to sanitize strings for comparison (removes accents/diacritics and converts to lowercase)
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface CityAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  inputClassName?: string;
  suggestionsMaxHeight?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

const CityAutocompleteInput: React.FC<CityAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = "Saisissez la ville...",
  className = "w-full",
  id,
  name,
  required = false,
  disabled = false,
  inputClassName = "w-full bg-transparent outline-none",
  suggestionsMaxHeight = "max-h-52",
  onBlur,
  onFocus
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter cities as query changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const queryCleaned = normalizeString(value);
    
    // Filter of list starting or containing query
    const filtered = IVORY_COAST_CITIES.filter(city => {
      const cityCleaned = normalizeString(city);
      return cityCleaned.includes(queryCleaned);
    });

    // Sort: prioritizes results starting with prefix, then containing.
    const sorted = [...filtered].sort((a, b) => {
      const aNormal = normalizeString(a);
      const bNormal = normalizeString(b);
      const aStarts = aNormal.startsWith(queryCleaned);
      const bStarts = bNormal.startsWith(queryCleaned);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

    // Deduplicate suggestions just in case there are duplicates
    const uniqueSorted = Array.from(new Set(sorted));

    // Limit to 8 suggestions for better UX and performance
    setSuggestions(uniqueSorted.slice(0, 8));
  }, [value]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectSuggestion(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} id={`city-autocomplete-container-${id || name || 'default'}`}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setShowSuggestions(true);
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          // Allow click handlers to process before hiding
          setTimeout(() => {
            if (onBlur) onBlur();
          }, 200);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />

      {/* Suggestion List Overlay */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className={`absolute left-0 right-0 z-[9999] mt-2 translate-y-0.5 overflow-y-auto rounded-2xl bg-white border border-gray-150 p-2 shadow-xl outline-none transition-all scrollbar-thin ${suggestionsMaxHeight}`}
          id={`suggestions-list-${id || name || 'default'}`}
        >
          {suggestions.map((city, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${city}-${idx}`}
                type="button"
                onClick={() => selectSuggestion(city)}
                className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-800 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <span>{city}</span>
                <span className={`text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-orange-600 text-orange-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  Côte d'Ivoire
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteInput;
