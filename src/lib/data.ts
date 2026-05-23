export type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  gender: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  rating: number;
  reviews: number;
  fabric: string;
  care: string;
  description: string;
  tags: string[];
  inStock: boolean;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {id:1,name:'Jordan Jumpman Knockout',brand:'Nike',category:'Shoes',gender:'Men',price:138,originalPrice:170,images:['https://i.pinimg.com/736x/c2/c7/40/c2c740d467e07e78307e2163ca421c01.jpg'],colors:['Black','White'],sizes:['7','8','9','10','11','12'],rating:4.2,reviews:128,fabric:'Premium leather upper, mesh lining, rubber outsole.',care:'Wipe with damp cloth. Air dry only.',description:'Court-ready performance meets street-style in the Jordan Jumpman Knockout. Built for versatile wear with iconic Jumpman branding.',tags:['trending'],inStock:true},
  {id:2,name:'Jonathan D Loafers',brand:'Jonathan D',category:'Shoes',gender:'Men',price:80,originalPrice:110,images:['https://i.pinimg.com/736x/c5/8d/99/c58d99ec20d03e5fa1a284770e19731f.jpg'],colors:['Brown','Black'],sizes:['7','8','9','10','11'],rating:4.5,reviews:64,fabric:'Genuine suede upper, leather insole.',care:'Treat with suede protector. Keep dry.',description:'Sleek penny loafers with modern proportions. Versatile enough for business casual or smart-casual evenings.',tags:['trending'],inStock:true},
  {id:3,name:'Baggy Cargo Pants',brand:'Retro Supply',category:'Bottoms',gender:'Unisex',price:87,originalPrice:110,images:['https://i.pinimg.com/736x/58/3c/12/583c12cddb3518aa467ce9ab872c52a8.jpg'],colors:['Olive','Black','Khaki'],sizes:['XS','S','M','L','XL','XXL'],rating:4.3,reviews:210,fabric:'98% Cotton, 2% Elastane. Brushed twill.',care:'Machine wash cold. Tumble dry low.',description:'Relaxed-fit cargo pants with multiple utility pockets. The go-to for effortless streetwear looks.',tags:['trending'],inStock:true},
  {id:4,name:'Boxy Cropped Shirt',brand:'Zara',category:'Tops',gender:'Women',price:15,originalPrice:22,images:['https://i.pinimg.com/1200x/de/44/c2/de44c253ba7cf1c73794d70200940f98.jpg'],colors:['White','Black','Beige'],sizes:['XS','S','M','L','XL'],rating:4.1,reviews:340,fabric:'100% Organic Cotton. Pre-washed.',care:'Machine wash 30°. Do not bleach.',description:'A modern boxy crop with dropped shoulders. Layer over high-waisted bottoms for an effortless editorial look.',tags:['trending'],inStock:true},
  {id:5,name:'Jordan 4 Brick By Brick',brand:'Nike',category:'Shoes',gender:'Unisex',price:195,originalPrice:240,images:['https://i.pinimg.com/1200x/17/46/be/1746be13a6f93d74f1200069412f996d.jpg'],colors:['Multi'],sizes:['6','7','8','9','10','11','12'],rating:4.8,reviews:512,fabric:'Nubuck leather, mesh panels, Air unit.',care:'Wipe clean. Avoid submerging.',description:'The iconic Jordan 4 silhouette recoloured in the Brick By Brick colourway. A grail-worthy release for sneaker collectors.',tags:['trending','new'],inStock:true},
  {id:6,name:'Strappy Block Heels',brand:'Zara',category:'Shoes',gender:'Women',price:78,originalPrice:95,images:['https://i.pinimg.com/736x/2c/5f/29/2c5f290fbd921f4e3d5befd55ad54ad6.jpg'],colors:['Nude','Black'],sizes:['5','6','7','7.5','8','9'],rating:4.0,reviews:88,fabric:'Faux leather upper, rubber sole.',care:'Wipe with dry cloth. Store in dust bag.',description:'Elevated block heels with a feminine strappy design. Perfect for events, dinners, and nights out.',tags:['trending'],inStock:true},
  {id:7,name:'Baby Romper Set',brand:'Little Drape',category:'Kids',gender:'Kids',price:22,originalPrice:32,images:['https://i.pinimg.com/736x/ce/ad/ba/ceadba0b630320ce54c9fa59d2fc9095.jpg'],colors:['White','Pink','Blue'],sizes:['0-3M','3-6M','6-12M','12-18M'],rating:4.7,reviews:155,fabric:'100% Organic Cotton. Hypoallergenic.',care:'Machine wash 40°. Tumble dry low.',description:'Soft organic cotton romper with snap closure. Gentle on delicate skin, designed for comfort and cuteness.',tags:['trending'],inStock:true},
  {id:8,name:'Merino Wool Beanie',brand:'Retro Supply',category:'Accessories',gender:'Unisex',price:35,originalPrice:50,images:['https://i.pinimg.com/1200x/26/8c/fe/268cfe2121b50c94c839ad17868ae51e.jpg'],colors:['Charcoal','Cream','Rust'],sizes:['One Size'],rating:4.6,reviews:73,fabric:'100% Fine Merino Wool. Rib-knit.',care:'Hand wash cold. Lay flat to dry.',description:'Ultra-soft merino beanie with a classic ribbed finish. Your essential cold-weather companion.',tags:['trending'],inStock:true},
  {id:9,name:'Adidas Ultraboost 22',brand:'Adidas',category:'Shoes',gender:'Unisex',price:160,originalPrice:200,images:['https://i.pinimg.com/736x/cb/49/a2/cb49a2d48b1e26c4cc9c5322c9a61218.jpg'],colors:['White','Black','Blue'],sizes:['6','7','8','9','10','11','12'],rating:4.7,reviews:620,fabric:'Primeknit+ upper, BOOST midsole, Continental rubber.',care:'Machine wash 30°. Air dry.',description:'The benchmark running shoe. Responsive BOOST cushioning, a sock-like Primeknit+ fit, and a clean minimalist look.',tags:['trending','new'],inStock:true},
  {id:10,name:'Linen Summer Dress',brand:'Zara',category:'Tops',gender:'Women',price:55,originalPrice:72,images:['https://i.pinimg.com/1200x/de/44/c2/de44c253ba7cf1c73794d70200940f98.jpg'],colors:['White','Terracotta','Sage'],sizes:['XS','S','M','L','XL'],rating:4.4,reviews:188,fabric:'55% Linen, 45% Viscose.',care:'Hand wash or gentle cycle. Iron on low.',description:'Flowy midi dress in a breathable linen blend. Ideal for warm-weather days from brunch to beach.',tags:['new'],inStock:true},
  {id:11,name:'Slim Tapered Chinos',brand:'Jonathan D',category:'Bottoms',gender:'Men',price:65,originalPrice:85,images:['https://i.pinimg.com/736x/58/3c/12/583c12cddb3518aa467ce9ab872c52a8.jpg'],colors:['Navy','Stone','Olive'],sizes:['28','30','32','34','36','38'],rating:4.3,reviews:141,fabric:'97% Cotton, 3% Elastane. Peached finish.',care:'Machine wash 30°. Iron inside out.',description:'Clean-cut chinos with a slim-tapered fit. The foundation of any versatile wardrobe.',tags:['new'],inStock:true},
  {id:12,name:'Vans Old Skool Pro',brand:'Vans',category:'Shoes',gender:'Unisex',price:85,originalPrice:100,images:['https://i.pinimg.com/1200x/11/9a/6e/119a6e747ab66f605509269058cb97e7.jpg'],colors:['Black/White','Navy/White','Red'],sizes:['6','7','8','9','10','11','12'],rating:4.5,reviews:430,fabric:'Suede and canvas upper, waffle outsole.',care:'Spot clean canvas. Brush suede.',description:'A skateboarding icon since 1977. The Old Skool Pro reinforces a classic silhouette with pro-grade rubber.',tags:['trending'],inStock:true},
];

export const DEALS = [
  {brand:'NIKE',copy:'Air Max — 30% Off',discount:'30% OFF',img:'https://i.pinimg.com/736x/80/33/a4/8033a49a1af88a4e4b3e22abd2795173.jpg',filter:'Nike'},
  {brand:'ADIDAS',copy:'Ultraboost 22 — 20% Off',discount:'20% OFF',img:'https://i.pinimg.com/736x/cb/49/a2/cb49a2d48b1e26c4cc9c5322c9a61218.jpg',filter:'Adidas'},
  {brand:'RETRO',copy:'Streetwear Bundles',discount:'15% OFF',img:'https://i.pinimg.com/1200x/90/41/ad/9041adb5b2b5b4c92a314068f420be00.jpg',filter:'Retro Supply'},
  {brand:'VANS',copy:'Off the Wall — Old Skool',discount:'OFF WALL',img:'https://i.pinimg.com/1200x/11/9a/6e/119a6e747ab66f605509269058cb97e7.jpg',filter:'Vans'},
];

export const VS_PRESETS = [
  {label:'Street Minimal',img:'https://i.pinimg.com/736x/c2/c7/40/c2c740d467e07e78307e2163ca421c01.jpg',query:'Shoes'},
  {label:'Boho Dress',img:'https://i.pinimg.com/1200x/de/44/c2/de44c253ba7cf1c73794d70200940f98.jpg',query:'Tops'},
  {label:'Athleisure',img:'https://i.pinimg.com/736x/cb/49/a2/cb49a2d48b1e26c4cc9c5322c9a61218.jpg',query:'Shoes'},
  {label:'Cargo Fit',img:'https://i.pinimg.com/736x/58/3c/12/583c12cddb3518aa467ce9ab872c52a8.jpg',query:'Bottoms'},
  {label:'Kids Cute',img:'https://i.pinimg.com/736x/ce/ad/ba/ceadba0b630320ce54c9fa59d2fc9095.jpg',query:'Kids'},
];
