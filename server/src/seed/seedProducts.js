import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { productModel } from '../models/product.model.js';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Navy', 'Olive', 'Maroon', 'Grey', 'Beige', 'Sky Blue', 'Mustard'];
const FABRICS = ['Cotton', 'Linen', 'Denim', 'Fleece', 'Polyester Blend', 'Wool Blend'];
const FITS = ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized'];

const CATALOG = {
  'T-Shirts': {
    types: ['Crew Neck T-Shirt', 'Polo T-Shirt', 'Graphic T-Shirt'],
    price: [299, 999],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/premium_photo-1675186049406-3fabe5f387eb.avif', 'https://ik.imagekit.io/xfioa3cdy/Snitch/61e0G4Elr+L.webp'],
  },
  Shirts: {
    types: ['Casual Shirt', 'Formal Shirt', 'Checked Shirt'],
    price: [499, 1799],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/611HhLHmaBL.webp', 'https://ik.imagekit.io/xfioa3cdy/Snitch/61QP+11VArL.webp'],
  },
  Jeans: {
    types: ['Straight Jeans', 'Skinny Jeans', 'Cargo Jeans'],
    price: [799, 2499],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/handsome-man-summer-clothes-smiling-20659973.webp', 'https://ik.imagekit.io/xfioa3cdy/Snitch/61-5l58BudL.webp'],
  },
  Hoodies: {
    types: ['Pullover Hoodie', 'Zip-Up Hoodie', 'Sweatshirt'],
    price: [899, 2499],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/51SAOvh7vIL.webp', 'https://ik.imagekit.io/xfioa3cdy/Snitch/photo-1445205170230-053b83016050.avif'],
  },
  Jackets: {
    types: ['Bomber Jacket', 'Denim Jacket', 'Windcheater'],
    price: [1299, 3999],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/l_6a6a96279b215886079be282.webp', 'https://ik.imagekit.io/xfioa3cdy/Snitch/stylish-pink-sleep-set-comfortable-nights-photo.webp'],
  },
  Dresses: {
    types: ['Maxi Dress', 'Midi Dress', 'A-Line Dress'],
    price: [699, 2999],
    images: ['https://ik.imagekit.io/xfioa3cdy/Snitch/premium_photo-1675186049409-f9f8f60ebb5e.avif', 'https://ik.imagekit.io/xfioa3cdy/Snitch/premium_photo-1673125287084-e90996bad505.avif'],
  },
};

const pick = (arr) => faker.helpers.arrayElement(arr);

const buildProducts = (count, sellerId) => {
  const categories = Object.keys(CATALOG);
  return Array.from({ length: count }, (_, i) => {
    const { types, price, images } = CATALOG[categories[i % categories.length]];
    const type = pick(types);
    const color = pick(COLORS);
    const fit = pick(FITS);
    const fabric = pick(FABRICS);

    return {
      title: `${color} ${fit} ${type}`,
      description: `${fabric} ${type.toLowerCase()} in ${color.toLowerCase()} with a ${fit.toLowerCase()} cut. Comfortable for everyday wear.`,
      images: faker.helpers.arrayElements(images, { min: 1, max: Math.min(images.length, 5) }),
      price: {
        amount: faker.number.int({ min: price[0], max: price[1] }),
        currency: 'INR',
      },
      sizes: SIZES.map((size) => ({
        size,
        stock: faker.number.int({ min: 0, max: 50 }),
      })),
      seller: sellerId,
      published: true,
    };
  });
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const seller = await mongoose.connection.db.collection('users').findOne({});
    if (!seller) throw new Error('users collection me koi user nahi hai, pehle ek user register karo');

    await productModel.insertMany(buildProducts(100, seller._id));
    console.log('100 products added');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();