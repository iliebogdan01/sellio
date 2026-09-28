const fs = require("fs");

const categories = {
  "Cars & Vehicles": [
    "BMW 3 Series",
    "Audi A4",
    "Mercedes C-Class",
    "Volkswagen Golf",
    "Ford Focus",
    "Vauxhall Corsa",
    "Nissan Qashqai",
    "Toyota Yaris",
    "Ford Fiesta",
    "Tesla Model 3",
  ],

  "Property": [
    "Modern Flat",
    "Two Bedroom Apartment",
    "Family House",
    "Studio Apartment",
    "Detached House",
    "Terraced House",
    "Semi Detached House",
    "City Centre Flat",
    "Garden Apartment",
    "Luxury Apartment",
  ],

  "Electronics": [
    "iPhone 15 Pro",
    "Samsung Galaxy S24",
    "MacBook Air",
    "iPad Pro",
    "PlayStation 5",
    "Xbox Series X",
    "Apple Watch",
    "AirPods Pro",
    "Gaming Laptop",
    "Smart TV",
  ],

  "Fashion": [
    "Nike Trainers",
    "Adidas Jacket",
    "Designer Handbag",
    "Men's Coat",
    "Women's Dress",
    "Leather Jacket",
    "Running Shoes",
    "Winter Boots",
    "Denim Jacket",
    "Designer Sunglasses",
  ],

  "Home & Garden": [
    "Dining Table",
    "Sofa",
    "Garden Furniture",
    "Office Desk",
    "Double Bed",
    "Wardrobe",
    "Coffee Table",
    "Garden Shed",
    "Lawn Mower",
    "Bookcase",
  ],

  "Gaming": [
    "PlayStation 5",
    "Xbox Series X",
    "Nintendo Switch",
    "Gaming PC",
    "Gaming Monitor",
    "Xbox Controller",
    "PS5 Controller",
    "Gaming Chair",
    "Nintendo Games",
    "Gaming Headset",
  ],

  "Baby & Kids": [
    "Baby Stroller",
    "Baby Cot",
    "Children's Bike",
    "Baby Clothes",
    "Kids Toys",
    "Car Seat",
    "Baby High Chair",
    "Kids Bed",
    "Toy Kitchen",
    "Baby Monitor",
  ],

  "Services": [
    "House Cleaning",
    "Garden Maintenance",
    "Car Valeting",
    "Photography Service",
    "Web Design",
    "Moving Service",
    "Painting Service",
    "Computer Repair",
    "Tutoring Service",
    "Handyman Service",
  ],
};

const locations = [
  "Nottingham",
  "London",
  "Manchester",
  "Birmingham",
  "Leicester",
  "Derby",
  "Sheffield",
  "Leeds",
  "Liverpool",
  "Bristol",
  "Coventry",
  "Leicester",
  "Cambridge",
  "Oxford",
  "Newcastle",
];

const listings = [];

let id = 100000;

for (const [category, products] of Object.entries(categories)) {
  for (let i = 1; i <= 100; i++) {
    const product =
      products[(i - 1) % products.length];

    const location =
      locations[(i - 1) % locations.length];

    let price;

    if (category === "Cars & Vehicles") {
      price = 2500 + ((i * 137) % 22000);
    } else if (category === "Property") {
      price = 45000 + ((i * 1731) % 350000);
    } else if (category === "Electronics") {
      price = 50 + ((i * 37) % 1800);
    } else if (category === "Fashion") {
      price = 15 + ((i * 11) % 450);
    } else if (category === "Home & Garden") {
      price = 25 + ((i * 29) % 2500);
    } else if (category === "Gaming") {
      price = 30 + ((i * 43) % 1200);
    } else if (category === "Baby & Kids") {
      price = 10 + ((i * 17) % 600);
    } else {
      price = 20 + ((i * 23) % 1000);
    }

    listings.push({
      id: id++,
      title: `${product} - ${i}`,
      price,
      location,
      category,
      description:
        `Great ${product.toLowerCase()} available in ${location}. ` +
        `Good condition and ready for a new owner. ` +
        `Message the seller for more information.`,
      image:
        `https://picsum.photos/seed/sellio-${category.replace(/[^a-zA-Z0-9]/g, "")}-${i}/600/450`,
    });
  }
}

fs.writeFileSync(
  "./public/seed-listings.json",
  JSON.stringify(listings, null, 2)
);

console.log("");
console.log("=================================");
console.log("Sellio demo listings generated!");
console.log("=================================");
console.log("");
console.log(`Total listings: ${listings.length}`);
console.log("");

for (const category of Object.keys(categories)) {
  console.log(`${category}: 100`);
}

console.log("");