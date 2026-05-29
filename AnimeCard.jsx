import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A card component to display an anime.
 * Includes a "Hindi Dub" badge if available.
 * @param {object} props
 * @param {object} props.anime - The anime data object from Firestore.
 */
const AnimeCard = ({ anime }) => {
  return (
    <Link to={`/anime/${anime.slug}`} className="relative group">
      <img src={anime.posterImageUrl} alt={anime.title} className="w-full h-auto rounded-lg shadow-lg" />
      {anime.isHindiDubAvailable && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
          HINDI DUB
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
        <h3 className="text-white font-bold truncate">{anime.title}</h3>
      </div>
    </Link>
  );
};

export default AnimeCard;