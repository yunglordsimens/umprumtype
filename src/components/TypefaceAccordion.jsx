import { useState } from 'react';
import TypefaceCard from './TypefaceCard.jsx';

export default function TypefaceAccordion({ typefaces }) {
  const [openSlug, setOpenSlug] = useState(null);

  function toggle(slug) {
    setOpenSlug(prev => (prev === slug ? null : slug));
  }

  return (
    <ul className="tfa-list">
      {typefaces.map(tf => (
        <TypefaceCard
          key={tf.slug}
          tf={tf}
          isOpen={openSlug === tf.slug}
          onOpen={() => toggle(tf.slug)}
        />
      ))}
    </ul>
  );
}
