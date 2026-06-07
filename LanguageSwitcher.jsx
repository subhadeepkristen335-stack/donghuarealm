import clsx from 'clsx';
import { LANGUAGE_OPTIONS, languageHasVideo } from './src/utils/languages.js';

/**
 * Language switcher component with glowing purple buttons.
 * @param {object} props
 * @param {string} props.selectedLanguage - The currently selected language key.
 * @param {function} props.onLanguageChange - Callback when a language is selected.
 * @param {object} props.availableLanguages - Object from Firestore episode data indicating available languages.
 */
const LanguageSwitcher = ({ selectedLanguage, onLanguageChange, availableLanguages }) => {
  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 my-4">
      {LANGUAGE_OPTIONS.map((lang) => {
        const isAvailable = languageHasVideo(availableLanguages?.[lang.key]);
        if (!isAvailable) return null;

        const isSelected = selectedLanguage === lang.key;

        return (
          <button
            key={lang.key}
            onClick={() => onLanguageChange(lang.key)}
            className={clsx(
              'px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold text-white rounded-md transition-all duration-300 focus:outline-none',
              'bg-purple-700/50 hover:bg-purple-600/80',
              isSelected && 'bg-purple-600 ring-2 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)]'
            )}
          >
            {lang.name}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
