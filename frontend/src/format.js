export const money = (n) =>
    `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} EGP`;

export const extrasText = (extras) => extras.map((e) => e.name).join(', ');

// "No tahini" / "Extra salad" / "Shami bread" are choices about the dish; everything else is a paid add-on
const isChange = (name) => /^(No|Extra) | bread$/.test(name);

/** ["Shami bread", "No tahini", "Kiri cheese"] -> "Shami bread, No tahini / + Kiri cheese" */
export const describeExtras = (names, sep = ' / ') => {
    const changes = names.filter(isChange);
    const adds = names.filter((n) => !isChange(n));
    return [changes.join(', '), adds.length ? `+ ${adds.join(', ')}` : ''].filter(Boolean).join(sep);
};