import React from 'react';
import cottonShirtImg from '../assets/products/cotton-shirt.png';
import linenTrousersImg from '../assets/products/linen-trousers.png';
import woolCardiganImg from '../assets/products/wool-cardigan.png';
import sneakersImg from '../assets/products/sneakers.png';
import handbagImg from '../assets/products/handbag.png';
import tshirtImg from '../assets/products/tshirt.png';

/**
 * Realistic Studio E-Commerce Product Photography Assets
 * 100% local, high-resolution, neutral studio background, professional lighting.
 */
export const productImages = {
  cottonShirt: cottonShirtImg,
  linenTrousers: linenTrousersImg,
  woolCardigan: woolCardiganImg,
  sneakers: sneakersImg,
  handbag: handbagImg,
  tshirt: tshirtImg,
};

/**
 * Intelligent helper to resolve realistic product photography
 * based on item title, category, or order ID.
 */
export const getProductImage = (itemName = '', category = '') => {
  const lowerName = (itemName || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();

  if (lowerName.includes('shirt') || lowerName.includes('poplin') || lowerName.includes('button')) {
    return cottonShirtImg;
  }
  if (lowerName.includes('trouser') || lowerName.includes('linen') || lowerName.includes('pant')) {
    return linenTrousersImg;
  }
  if (lowerName.includes('cardigan') || lowerName.includes('wool') || lowerName.includes('knit') || lowerName.includes('sweater')) {
    return woolCardiganImg;
  }
  if (lowerName.includes('sneaker') || lowerName.includes('shoe') || lowerName.includes('footwear')) {
    return sneakersImg;
  }
  if (lowerName.includes('bag') || lowerName.includes('handbag') || lowerName.includes('crossbody')) {
    return handbagImg;
  }
  if (lowerName.includes('t-shirt') || lowerName.includes('tee') || lowerName.includes('crewneck')) {
    return tshirtImg;
  }

  // Fallbacks by category
  if (lowerCat.includes('shoe') || lowerCat.includes('footwear')) {
    return sneakersImg;
  }
  if (lowerCat.includes('accessory') || lowerCat.includes('bag')) {
    return handbagImg;
  }
  if (lowerCat.includes('trouser') || lowerCat.includes('bottom')) {
    return linenTrousersImg;
  }

  // Default clean studio shirt
  return cottonShirtImg;
};

/**
 * Universal Realistic Product Thumbnail Component.
 * Displays studio e-commerce photography with subtle rounded corners and clean borders.
 */
export const ProductThumbnail = ({
  itemName = '',
  category = '',
  size = 'md',
  className = '',
  src = null,
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8 rounded-lg',
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-20 h-20 rounded-2xl',
    '2xl': 'w-24 h-24 rounded-2xl',
    full: 'w-full h-full rounded-2xl',
  };

  const imageSrc = src || getProductImage(itemName, category);

  return (
    <div
      className={`relative overflow-hidden shrink-0 shadow-2xs border border-slate-200/90 dark:border-slate-800 bg-[#F1F3F5] dark:bg-slate-800 ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      <img
        src={imageSrc}
        alt={itemName || 'Product'}
        className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
        loading="lazy"
        onError={(e) => {
          // Fallback if load error occurs
          e.currentTarget.src = cottonShirtImg;
        }}
      />
    </div>
  );
};

export default ProductThumbnail;
