"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuItems = exports.extras = exports.BREAD_IDS = void 0;
// Qedra menu. Prices in EGP, before VAT.
// ---------- paid add-ons (from the restaurant's الإضافات list) ----------
// Tomato is free for now: set a price here if the restaurant charges for it.
const TOMATO_PRICE = 1;
const ADDONS = [
    { id: 'x-tomato', name: 'Tomato', nameAr: 'طماطم', price: TOMATO_PRICE, kind: 'add' }, // every sandwich
    { id: 'x-tamia', name: 'Tamia', nameAr: 'طعمية', price: 12, kind: 'add' },
    { id: 'x-tamia-bites', name: 'Tamia bites', nameAr: 'طعمية بايتس', price: 12, kind: 'add' },
    { id: 'x-tamia-alex', name: 'Alexandrian tamia', nameAr: 'طعمية اسكندراني', price: 14, kind: 'add' },
    { id: 'x-pastrami', name: 'Pastrami', nameAr: 'بسطرمة', price: 21, kind: 'add' },
    { id: 'x-hotdog', name: 'Hot dog', nameAr: 'سوسيس', price: 15, kind: 'add' },
    { id: 'x-sausage', name: 'Sausage', nameAr: 'سجق', price: 32, kind: 'add' },
    { id: 'x-eggs', name: 'Eggs', nameAr: 'بيض', price: 14, kind: 'add' },
    { id: 'x-omelette', name: 'Omelette', nameAr: 'بيض اومليت', price: 18, kind: 'add' },
    { id: 'x-labna', name: 'Labna', nameAr: 'لبنة', price: 21, kind: 'add' },
    { id: 'x-roomi', name: 'Roomi cheese', nameAr: 'جبنة رومي', price: 12, kind: 'add' },
    // Cheddar: price not readable on the menu photo. Add it here once known:
    // { id: 'x-cheddar', name: 'Cheddar', nameAr: 'شيدر', price: ??, kind: 'add' },
    { id: 'x-mozzarella', name: 'Mozzarella', nameAr: 'موتزاريلا', price: 14, kind: 'add' },
    { id: 'x-kiri', name: 'Kiri cheese', nameAr: 'كيري', price: 21, kind: 'add' },
    { id: 'x-ketchup', name: 'Ketchup', nameAr: 'كاتشب', price: 5, kind: 'add' },
    { id: 'x-mayo', name: 'Mayonnaise', nameAr: 'مايونيز', price: 8, kind: 'add' },
    { id: 'x-tabasco', name: 'Tabasco', nameAr: 'تاباسكو', price: 15, kind: 'add' },
    { id: 'x-pickled-eggplant', name: 'Pickled eggplant', nameAr: 'بتنجان مخلل', price: 12, kind: 'add' },
    { id: 'x-baba', name: 'Baba ghanouj', nameAr: 'بابا غنوج', price: 12, kind: 'add' },
    { id: 'x-pickled-lemon', name: 'Pickled lemon', nameAr: 'ليمون معصفر', price: 14, kind: 'add' },
];
// ---------- choices about the dish itself ----------
// Names must start with "No " / "Extra " or end with " bread" (the site shows them without a "+").
// Extra tahini / salad are free for now: set a price here if the restaurant charges.
const EXTRA_TAHINI_PRICE = 0;
const EXTRA_SALAD_PRICE = 0;
const MODS = [
    { id: 'm-tahini-no', name: 'No tahini', nameAr: 'بدون طحينة', price: 0, kind: 'mod', group: 'tahini' },
    { id: 'm-tahini-extra', name: 'Extra tahini', nameAr: 'طحينة زيادة', price: EXTRA_TAHINI_PRICE, kind: 'mod', group: 'tahini' },
    { id: 'm-salad-no', name: 'No salad', nameAr: 'بدون سلطة', price: 0, kind: 'mod', group: 'salad' },
    { id: 'm-salad-extra', name: 'Extra salad', nameAr: 'سلطة زيادة', price: EXTRA_SALAD_PRICE, kind: 'mod', group: 'salad' },
    { id: 'm-arugula-no', name: 'No arugula', nameAr: 'بدون جرجير', price: 0, kind: 'mod', group: 'arugula' },
    // Bread for sandwiches (not Fino items, they're always Fino bread). Baladi is the default.
    { id: 'm-bread-baladi', name: 'Baladi bread', nameAr: 'عيش بلدي', price: 0, kind: 'mod', group: 'bread' },
    { id: 'm-bread-shami', name: 'Shami bread', nameAr: 'عيش شامي', price: 0, kind: 'mod', group: 'bread' },
];
exports.BREAD_IDS = ['m-bread-baladi', 'm-bread-shami'];
exports.extras = [...MODS, ...ADDONS];
/** Which add-ons fit each kind of dish */
const ids = (...list) => list.map((x) => `x-${x}`);
const TAMIA = ids('tamia', 'tamia-bites', 'tamia-alex');
const MEAT = ids('pastrami', 'hotdog', 'sausage');
const EGG = ids('eggs', 'omelette');
const CHEESE = ids('labna', 'roomi', 'mozzarella', 'kiri');
const SAUCE = ids('ketchup', 'mayo', 'tabasco');
const PICKLES = ids('pickled-eggplant', 'baba', 'pickled-lemon');
const P = {
    everything: [...TAMIA, ...MEAT, ...EGG, ...CHEESE, ...SAUCE, ...PICKLES],
    cheese: [...ids('pastrami'), ...EGG, ...CHEESE, ...ids('tabasco'), ...PICKLES],
    fries: ids('ketchup', 'mayo'), // fries come with spices; only ketchup or mayo can be added
    eggplant: [...TAMIA, ...EGG, ...ids('roomi', 'kiri', 'tabasco'), ...PICKLES],
    heavy: [...SAUCE, ...ids('roomi', 'mozzarella', 'kiri'), ...PICKLES],
    none: [],
};
/** An add-on is left out when the dish already has it (matched on the dish id). */
const ALREADY_IN = {
    'x-tamia': /^taamia|^fino-bites/,
    'x-tamia-bites': /^taamia|^fino-bites/,
    'x-tamia-alex': /^taamia|^fino-bites/,
    'x-pastrami': /pastrami|^egg-qedra/,
    'x-hotdog': /hotdog/,
    'x-sausage': /sausage|^hawawshi-mix/,
    'x-omelette': /^egg-|^shakshouka|^foul-omelette|^fino-egg/, // an egg can still be added
    'x-labna': /labna/,
    'x-roomi': /roomi/,
    'x-mozzarella': /mozzarella|^hawawshi-cheese/,
    'x-kiri': /kiri|^egg-qedra/,
    'x-ketchup': /^cheese-fried/,
    'x-mayo': /^cheese-fried/,
    'x-tabasco': /tabasco/,
    'x-pickled-eggplant': /^eggplant-pickled/,
    'x-baba': /baba/,
    'x-pickled-lemon': /lemon/,
};
/** Add-ons that would just turn a dish into ANOTHER dish already on the menu,
 *  so people order that dish instead (e.g. Regular foul + Eggs = "Foul with eggs"). */
const MAKES_ANOTHER_DISH = [
    // Foul with eggs / Foul omelette / Foul with pastrami / Foul with sausage / Foul tabasco / Foul with pickled lemon
    [/^foul-regular$/, ids('eggs', 'omelette', 'pastrami', 'sausage', 'tabasco', 'pickled-lemon')],
    // Foul with pastrami / sausage are beans in (red) sauce, like Foul with salsa
    [/^foul-salsa$/, ids('pastrami', 'sausage')],
    // Taamia with pastrami / Taamia with labna / Taamia kiri
    [/^taamia(-bites)?$/, ids('pastrami', 'labna', 'kiri')],
    // Omelette with roomi / pastrami / sausage / hot dog / kiri / mozzarella
    [/^egg-plain$/, ids('roomi', 'pastrami', 'sausage', 'hotdog', 'kiri', 'mozzarella')],
    // Fino: Roomi kiri / Roomi pastrami
    [/^fino-roomi$/, ids('kiri', 'pastrami')],
    // Fino: Kiri pastrami / Roomi pastrami
    [/^fino-beef-pastrami$/, ids('kiri', 'roomi')],
    // Hawawshi cheese / Hawawshi mix
    [/^hawawshi-beef$/, ids('mozzarella', 'sausage')],
];
const makesAnotherDish = (dishId, addon) => MAKES_ANOTHER_DISH.some(([re, list]) => re.test(dishId) && list.includes(addon));
/** Tahini / salad / arugula options, only for dishes that come with them (read from the description). */
function modsFor(description = '') {
    const out = [];
    if (/tahini/i.test(description))
        out.push('m-tahini-no', 'm-tahini-extra');
    if (/salad/i.test(description))
        out.push('m-salad-no', 'm-salad-extra');
    if (/arugula/i.test(description))
        out.push('m-arugula-no');
    return out;
}
/** Sandwich / carry-out pack prices. Pass null when the menu shows "—". */
const SP = (sandwich, pack) => [
    sandwich !== null && { id: 'sandwich', name: 'Sandwich', price: sandwich },
    pack !== null && { id: 'pack', name: 'Carry-out pack', price: pack },
].filter(Boolean);
/** Fino bread / baladi bread prices (the "heavy" section). */
const FB = (fino, baladi) => [
    { id: 'fino', name: 'Fino bread', price: fino },
    { id: 'baladi', name: 'Baladi bread', price: baladi },
];
/** Baladi / shami choice: any dish sold as a sandwich, except Fino items (always Fino bread)
 *  and the Heavy section (it already has its own Fino / baladi choice). */
function hasBreadChoice(category, name, p) {
    if (/fino/i.test(name) || category === 'Fino sandwiches' || category === 'Heavy')
        return false;
    return Array.isArray(p) && p.some((v) => v.id === 'sandwich');
}
/** Any dish that can come as a sandwich: has a "Sandwich" option, or is in the Fino / Heavy sections
 *  (those are always sandwiches). Every sandwich can add tomato. */
function isSandwich(category, p) {
    if (category === 'Fino sandwiches' || category === 'Heavy')
        return true;
    return Array.isArray(p) && p.some((v) => v.id === 'sandwich');
}
function section(category, defs, addons = P.none) {
    return defs.map(([id, name, nameAr, p, description]) => {
        const variants = Array.isArray(p) ? p : undefined;
        return {
            id, name, nameAr, description, category,
            // one variant only (e.g. sandwich only): no need to choose
            price: variants ? Math.min(...variants.map((v) => v.price)) : p,
            variants: variants && variants.length > 1 ? variants : undefined,
            available: true,
            extraIds: [
                ...(hasBreadChoice(category, name, p) ? exports.BREAD_IDS : []),
                ...modsFor(description),
                ...(isSandwich(category, p) ? ['x-tomato'] : []),
                ...addons.filter((x) => !ALREADY_IN[x]?.test(id) && !makesAnotherDish(id, x)),
            ],
        };
    });
}
exports.menuItems = [
    ...section('Foul', [
        ['foul-regular', 'Regular foul', 'فول عادي', SP(17, 46), 'Oil and tahini'],
        ['foul-regular-fino', 'Regular foul Fino', 'فول عادي فينو', SP(22, null), 'Oil and tahini'],
        ['foul-dammes', 'Foul dammes', 'فول دميس', SP(23, 49), 'Tomatoes, peppers, onion, olive rings, tahini'],
        ['foul-salsa', 'Foul with salsa', 'فول صلصه', SP(20, 45), 'Red sauce and garlic'],
        ['foul-olive', 'Foul with olive oil', 'فول زيت زيتون', SP(22, 54)],
        ['foul-butter', 'Foul with butter', 'فول زبده', SP(22, 53), 'Mashed beans with local butter'],
        ['foul-pastrami', 'Foul with pastrami', 'فول بسطرمه', SP(34, 78), 'Beans in sauce with pastrami pieces'],
        ['foul-sausage', 'Foul with sausage', 'فول سجق', SP(53, 81), 'Beans in sauce with sausage pieces'],
        ['foul-garlic', 'Foul with garlic', 'فول بالثوم', SP(20, 49), 'Special garlic mixture'],
        ['foul-tabasco', 'Foul tabasco', 'فول تاباسكو', SP(34, 55), 'Oil, tahini, chilli sauce'],
        ['foul-eggs', 'Foul with eggs', 'فول بالبيض', SP(30, 48), 'Oil, tahini, boiled eggs'],
        ['foul-omelette', 'Foul omelette', 'فول اومليت', SP(30, null), 'Oil, tahini, grilled omelette'],
        ['foul-lemon', 'Foul with pickled lemon', 'فول ليمون معصفر', SP(21, 48), 'Oil, tahini, pickled lemon'],
        ['foul-qedra', 'Foul Qedra', 'فول قدرة', SP(null, 46), 'Carry-out pack only'],
    ], P.everything),
    ...section('Taamia', [
        ['taamia', 'Taamia', 'طعميه', SP(18, 39), 'Salad and tahini'],
        ['taamia-bites', 'Taamia bites', 'طعميه بايتس', SP(18, 39), 'Salad and tahini'],
        ['taamia-bites-Fino', 'Taamia bites fino', 'طعميه بايتس فينو', SP(32, null), 'Salad and tahini'],
        ['taamia-alex', 'Alexandrian taamia', 'طعميه اسكندراني', SP(21, 45), 'Hot sauce, salad, tahini'],
        ['taamia-pastrami', 'Taamia with pastrami', 'طعميه بسطرمه', SP(39, null), 'Taamia stuffed with pastrami'],
        ['taamia-labna', 'Taamia with labna', 'طعمية لبنة', SP(42, null), 'Labna and arugula'],
        ['taamia-kiri', 'Taamia kiri', 'طعمية كيري', SP(42, null), 'Sesame taamia, kiri, arugula'],
    ], P.everything),
    ...section('Eggs', [
        ['egg-plain', 'Plain omelette', 'اومليت سادة', SP(32, 56), 'Butter'],
        ['egg-plain-fino', 'Plain omelette Fino', 'اومليت سادة فينو', SP(36, null), 'Butter'],
        ['egg-boiled', 'Boiled eggs', 'بيض مسلوق', SP(32, 41), 'Salt and pepper'],
        ['egg-roomi', 'Omelette with roomi', 'اومليت جبنة رومي', SP(41, 79), 'Butter and roomi cheese'],
        ['egg-pastrami', 'Omelette with pastrami', 'اومليت بسطرمة', SP(49, 75)],
        ['egg-sausage', 'Omelette with sausage', 'اومليت سجق', SP(55, 97)],
        ['egg-hotdog', 'Omelette with hot dog', 'اومليت سوسيس', SP(49, 72)],
        ['egg-cheddar', 'Omelette with cheddar', 'اومليت شيدر', SP(47, 79)],
        ['egg-kiri', 'Omelette with kiri', 'اومليت بالجبنة الكيري', SP(62, 94)],
        ['egg-veg', 'Omelette with vegetables', 'اومليت بالخضار', SP(39, 69), 'Tomatoes, peppers, onion'],
        ['shakshouka', 'Shakshouka', 'شكشوكة', SP(31, 51), 'Vegetables and sauce'],
        ['egg-mozzarella', 'Omelette with mozzarella', 'اومليت موتزاريلا', SP(46, 71)],
        ['egg-qedra', 'Qedra omelette', 'اومليت قدرة', SP(75, 81), 'Pastrami, buffalo butter, kiri'],
    ], P.everything),
    ...section('Cheese', [
        ['cheese-mint', 'Mix cheese with mint', 'جبنة ميكس نعناع', SP(54, 87), 'Cheese mix, tomato pieces, mint'],
        ['cheese-thyme', 'Mix cheese with thyme', 'جبنة ميكس زعتر', SP(54, 87), 'Cheese mix, tomato, thyme, olive oil'],
        ['cheese-qarish', 'Qarish cheese', 'جبنة قريش', SP(30, 45), 'Green pepper and olive oil'],
        ['cheese-menanaa', 'Al-Menanaa', 'المنعنعة', SP(37, 59), 'Cream cheese, tomatoes, fresh mint'],
        ['cheese-zaytona', 'Zaytona', 'زيتونة', SP(39, 69), 'Cream cheese, tomatoes, olive slices'],
        ['cheese-adimo', 'Ala Adimo', 'على قديمو', SP(39, 69), 'Cream cheese, tomatoes, Qedra mixture'],
        ['cheese-fried', 'Fried cheese Fino', 'المقلية فينو', SP(76, 102), 'Tomato slices, ketchup, mayonnaise'],
    ], P.cheese),
    ...section('Fries & eggplant', [
        ['fries', 'French fries', 'بطاطس محمرة', SP(34, 42), 'Spice mix'],
        ['fries-fino', 'French fries Fino', 'بطاطس محمرة فينو', SP(34, null), 'Spice mix'],
    ], P.fries),
    ...section('Fries & eggplant', [
        ['mousakaa', "Mousaka'a", 'مسقعة', SP(28, 45)],
        ['eggplant-baba', 'Baba ghanouj', 'بتنجان بيتي (بابا غنوج)', SP(28, null)],
        ['eggplant-pickled', 'Pickled eggplant', 'بتنجان مخلل', SP(19, null)],
    ], P.eggplant),
    ...section('Fino sandwiches', [
        ['fino-bites', 'Taamia bites Fino', 'طعمية بايتس فينو', 32, '3 taamia bites, tomato, arugula, tahini'],
        ['fino-foul', 'Foul Fino', 'فول محوج', 22, 'Foul with tahini'],
        ['fino-egg', 'Boiled egg Fino', 'بيض مسلوق فينو', 23],
    ], P.everything),
    ...section('Fino sandwiches', [
        ['fino-kiri-pastrami', 'Kiri pastrami', 'كيري بسطرمة', 47],
        ['fino-roomi-pastrami', 'Roomi pastrami', 'رومي بسطرمة', 57],
        ['fino-roomi-kiri', 'Roomi kiri', 'رومي كيري', 35],
        ['fino-roomi', 'Roomi', 'رومي', [
                { id: 'normal', name: 'Normal', price: 45 },
                { id: 'molten', name: 'Molten', price: 45 },
            ]],
        ['fino-roomi-cream', 'Roomi with fresh cream', 'رومي قشطة', 57],
        ['fino-beef-pastrami', 'Beef pastrami', 'بسطرمة لحم بقري', 40],
        ['fino-white-mix', 'White mix cheese', 'ميكس جبن بيضا', 44],
        ['fino-cheese-tomato', 'Cheese with tomato & cucumber', 'جبنة بالطماطم والخيار', 28],
    ], P.cheese),
    ...section('Heavy', [
        ['heavy-sausage-alex', 'Alexandrian sausage', 'سجق اسكندراني', FB(60, 60), 'Beef sausage, fresh vegetables, Qedra sauce'],
        ['heavy-sausage-grill', 'Grilled sausage', 'سجق جريل', FB(60, 60), 'Beef sausage, arugula, tahini'],
        ['heavy-kebda-alex', 'Alexandrian liver', 'كبدة اسكندراني', FB(40, 43), 'Liver, garlic, lemon, peppers, arugula, tahini'],
        ['heavy-kebda-grill', 'Grilled liver slices', 'كبدة جريل', FB(65, 65), 'Beef liver slices, arugula, tahini'],
        ['hawawshi-beef', 'Hawawshi beef', 'حواوشي لحمة', 70, 'Minced beef in Qedra bread'],
        ['hawawshi-mix', 'Hawawshi mix', 'حواوشي لحم مع سجق', 78, 'Minced beef and sausage in Qedra bread'],
        ['hawawshi-cheese', 'Hawawshi cheese', 'حواوشي جبن', 81, 'Minced beef and mozzarella in Qedra bread'],
    ], P.heavy),
    ...section('Salads', [
        ['salad-baba', 'Baba ghanouj', 'بابا غنوج', 45],
        ['salad-tahini', 'Tahini salad', 'سلطة طحينة', 27],
        ['salad-pickled-eggplant', 'Pickled eggplant', 'بتنجان مخلل', 30],
        ['salad-pickled-tomato', 'Pickled tomatoes', 'طماطم مخللة', 21],
        ['salad-torshi', 'Baladi pickles', 'طرشي', 16],
        ['salad-arugula', 'Arugula salad', 'سلطة جرجير بلدي', 15],
        ['salad-green', 'Green salad', 'سلطة خضرا', 18],
        ['salad-lemon', 'Pickled lemon', 'ليمون معصفر', 12],
    ]),
    ...section('Bread', [
        ['bread-baladi', 'Baladi bread basket', 'سبت عيش بلدي', 16],
        ['bread-shamy', 'Shamy bread basket', 'سبت عيش شامي', 15],
        ['bread-mix', 'Mixed bread basket', 'سبت عيش ميكس', 15],
    ]),
    // Not on the new board: kept from the previous menu until confirmed
    ...section('Desserts', [
        ['halawa-cream-honey', 'Halawa with cream & honey', 'حلاوة قشطة عسل', 34],
        ['halawa-cream', 'Halawa with cream', 'حلاوة قشطة', 30],
        ['halawa', 'Halawa', 'حلاوة', 26],
    ]),
    ...section('Drinks', [
        ['pepsi', 'V Cola', 'في كولا', 22],
        ['pepsi-diet', 'V Cola Diet', 'في كولا دايت', 22],
        ['water', 'Water (small)', 'مياه صغيرة', 11],
    ]),
];
//# sourceMappingURL=seed.js.map